"""Car prediction ML service (FastAPI).

Stateless per request: it loads pre-trained artifacts from `models/` and serves
predictions. The Node backend is the only caller — the frontend never talks to
this service directly (see `docs/ARCHITECTURE.md`).

Endpoints
---------
    GET  /health        liveness + whether artifacts are loaded
    GET  /model/info    metadata for every loaded model
    POST /predict       rows -> price / units_sold / revenue / profit
    POST /train         (re)train on a caller-supplied dataset and hot-reload

Run
---
    uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException

from features import (
    DEMAND_MODEL_NUMERIC,
    PRICE_MODEL_NUMERIC,
    apply_imputation,
    build_feature_frame,
    normalize_dataframe,
)
from model_schema import (
    HealthResponse,
    ModelArtifact,
    ModelInfoResponse,
    PredictionRow,
    PredictRequest,
    PredictResponse,
    TrainRequest,
)

MODELS_DIR = Path(__file__).parent / "models"
TARGETS = ("price", "units_sold", "revenue", "profit")

app = FastAPI(title="Car Prediction ML Service", version="1.0.0")

_estimators: dict[str, object] = {}
_artifacts: dict[str, ModelArtifact] = {}


def load_artifacts() -> None:
    """Load every `<target>_model.joblib` + `car_model.meta.json` pair."""
    _estimators.clear()
    _artifacts.clear()

    meta_path = MODELS_DIR / "car_model.meta.json"
    if not meta_path.exists():
        return

    raw = json.loads(meta_path.read_text(encoding="utf-8"))
    for target in TARGETS:
        model_path = MODELS_DIR / f"{target}_model.joblib"
        if target not in raw or not model_path.exists():
            continue
        _estimators[target] = joblib.load(model_path)
        _artifacts[target] = ModelArtifact(**raw[target])


@app.on_event("startup")
def on_startup() -> None:
    load_artifacts()


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", model_available=bool(_estimators))


@app.get("/model/info", response_model=ModelInfoResponse)
def model_info() -> ModelInfoResponse:
    return ModelInfoResponse(available=bool(_estimators), artifacts=_artifacts)


def _predict_single(target: str, row_df: pd.DataFrame) -> float:
    artifact = _artifacts[target]
    estimator = _estimators[target]
    numeric_cols = PRICE_MODEL_NUMERIC if target == "price" else DEMAND_MODEL_NUMERIC
    frame = build_feature_frame(row_df, numeric_cols, feature_columns=artifact.feature_columns)
    return float(estimator.predict(frame)[0])


@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest) -> PredictResponse:
    if not _estimators:
        raise HTTPException(
            status_code=503,
            detail="No trained model available. Run `python train.py` first.",
        )

    df = normalize_dataframe(pd.DataFrame(payload.rows))
    # Use the price model's medians to fill gaps before anything else.
    df = apply_imputation(df, _artifacts["price"].imputation_medians)

    missing_price = df["price"] <= 0
    price_was_predicted = bool(missing_price.any())
    if price_was_predicted:
        for idx in df.index[missing_price]:
            df.loc[[idx], "price"] = _predict_single("price", df.loc[[idx]])

    predictions: list[PredictionRow] = []
    for i in range(len(df)):
        single = df.iloc[[i]]
        units = max(0.0, _predict_single("units_sold", single))
        revenue = max(0.0, _predict_single("revenue", single))
        profit = _predict_single("profit", single)
        predictions.append(
            PredictionRow(
                price=round(float(single["price"].iloc[0]), 2),
                units_sold=round(units, 2),
                revenue=round(revenue, 2),
                profit=round(profit, 2),
            )
        )

    return PredictResponse(
        predictions=predictions,
        model_version=_artifacts["units_sold"].version,
        price_was_predicted=price_was_predicted,
    )


@app.post("/train", response_model=ModelInfoResponse)
def train(payload: TrainRequest) -> ModelInfoResponse:
    """Retrain on a caller-supplied dataset, then hot-reload the artifacts.

    Used to fine-tune on a company's uploaded CSV. The Node backend decides
    *when* to call this; the training itself stays in this service.
    """
    from train import prepare, train as run_training  # imported lazily; train.py is CLI-first

    df = pd.DataFrame(payload.dataset)
    prepared, _ = prepare(df)

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    tmp_csv = MODELS_DIR / "_uploaded_training_data.csv"
    prepared.to_csv(tmp_csv, index=False)
    run_training(tmp_csv, "xgboost")
    tmp_csv.unlink(missing_ok=True)

    load_artifacts()
    return ModelInfoResponse(available=bool(_estimators), artifacts=_artifacts)
