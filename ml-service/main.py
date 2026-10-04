"""
Car + Used-Car ML Service (FastAPI).

Stateless per request. The Node backend is the only caller.

Original endpoints (generic car prediction):
    GET  /health
    GET  /model/info
    POST /predict
    POST /train

Used-Car Market Platform endpoints:
    GET  /used-cars/audit
    GET  /used-cars/market
    POST /used-cars/demand
    GET  /used-cars/geographic
    GET  /used-cars/segments
    POST /used-cars/opportunity
    POST /used-cars/acquire
    POST /used-cars/allocate
    POST /used-cars/price-strategy
    POST /used-cars/backtest
    POST /used-cars/whatif
    GET  /used-cars/explain
    POST /used-cars/predict-price

Run:
    uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field

from features import (
    DEMAND_MODEL_NUMERIC,
    PRICE_MODEL_NUMERIC as GENERIC_PRICE_MODEL_NUMERIC,
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

app = FastAPI(title="Market Simulation ML Service", version="2.0.0")

_estimators: dict[str, object] = {}
_artifacts: dict[str, ModelArtifact] = {}

# Used-car price model globals
_uc_estimator: Any = None
_uc_meta: dict = {}


def load_artifacts() -> None:
    """Load generic car prediction artifacts."""
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


def load_uc_artifacts() -> None:
    """Load used-car price model artifacts if trained."""
    global _uc_estimator, _uc_meta
    model_path = MODELS_DIR / "used_car_price_model.joblib"
    meta_path  = MODELS_DIR / "used_car_model.meta.json"
    if model_path.exists() and meta_path.exists():
        _uc_estimator = joblib.load(model_path)
        _uc_meta = json.loads(meta_path.read_text(encoding="utf-8"))
        best = _uc_meta.get("best_algorithm", "?")
        r2   = _uc_meta.get("best_r2", 0)
        print(f"[startup] Used-car price model loaded: {best}  R²={r2:.4f}")


@app.on_event("startup")
def on_startup() -> None:
    load_artifacts()
    load_uc_artifacts()
    try:
        from used_car_analysis import get_dataframe
        get_dataframe()
        print("[startup] Used-car dataset cache ready")
    except Exception as e:
        print(f"[startup] Used-car dataset warm-up skipped: {e}")


# ═══════════════════════════════════════════════════════════════
#  Generic car prediction endpoints (unchanged behaviour)
# ═══════════════════════════════════════════════════════════════

@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", model_available=bool(_estimators))


@app.get("/model/info", response_model=ModelInfoResponse)
def model_info() -> ModelInfoResponse:
    return ModelInfoResponse(available=bool(_estimators), artifacts=_artifacts)


def _predict_single(target: str, row_df: pd.DataFrame) -> float:
    artifact  = _artifacts[target]
    estimator = _estimators[target]
    numeric_cols = GENERIC_PRICE_MODEL_NUMERIC if target == "price" else DEMAND_MODEL_NUMERIC
    frame = build_feature_frame(row_df, numeric_cols, feature_columns=artifact.feature_columns)
    return float(estimator.predict(frame)[0])


@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest) -> PredictResponse:
    if not _estimators:
        raise HTTPException(503, "No trained model available. Run `python train.py` first.")
    df = normalize_dataframe(pd.DataFrame(payload.rows))
    df = apply_imputation(df, _artifacts["price"].imputation_medians)
    missing_price = df["price"] <= 0
    price_was_predicted = bool(missing_price.any())
    if price_was_predicted:
        for idx in df.index[missing_price]:
            df.loc[[idx], "price"] = _predict_single("price", df.loc[[idx]])
    predictions: list[PredictionRow] = []
    for i in range(len(df)):
        single  = df.iloc[[i]]
        units   = max(0.0, _predict_single("units_sold", single))
        revenue = max(0.0, _predict_single("revenue",    single))
        profit  = _predict_single("profit", single)
        predictions.append(PredictionRow(
            price=round(float(single["price"].iloc[0]), 2),
            units_sold=round(units, 2),
            revenue=round(revenue, 2),
            profit=round(profit, 2),
        ))
    return PredictResponse(
        predictions=predictions,
        model_version=_artifacts["units_sold"].version,
        price_was_predicted=price_was_predicted,
    )


@app.post("/train", response_model=ModelInfoResponse)
def train(payload: TrainRequest) -> ModelInfoResponse:
    from train import prepare, train as run_training
    df = pd.DataFrame(payload.dataset)
    prepared, _ = prepare(df)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    tmp_csv = MODELS_DIR / "_uploaded_training_data.csv"
    prepared.to_csv(tmp_csv, index=False)
    run_training(tmp_csv, "xgboost")
    tmp_csv.unlink(missing_ok=True)
    load_artifacts()
    return ModelInfoResponse(available=bool(_estimators), artifacts=_artifacts)


# ═══════════════════════════════════════════════════════════════
#  Used-Car Market Platform — Pydantic request models
# ═══════════════════════════════════════════════════════════════

class DemandRequest(BaseModel):
    city: Optional[str] = None
    fuel_type: Optional[str] = None
    body_type: Optional[str] = None

class OpportunityRequest(BaseModel):
    min_opportunity: float = 0
    min_demand: float = 0
    max_risk: float = 100
    city: Optional[str] = None
    make: Optional[str] = None
    fuel_type: Optional[str] = None
    body_type: Optional[str] = None
    max_price: Optional[float] = None
    min_price: Optional[float] = None
    max_age: Optional[int] = None
    max_mileage: Optional[int] = None
    transmission: Optional[str] = None
    limit: int = 50

class AcquisitionRequest(BaseModel):
    available_capital: float
    max_vehicles: int = 10
    target_roi_pct: float = 15.0
    target_margin_pct: float = 10.0
    city: Optional[str] = None
    max_age: int = 10
    max_mileage: int = 100000
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    risk_tolerance: str = "medium"
    negotiation_buffer_pct: float = 8.0
    reconditioning_cost: float = 20000.0
    transport_cost: float = 5000.0
    platform_fee_pct: float = 2.0

class AllocationRequest(BaseModel):
    available_capital: float
    high_demand_pct: float = 40.0
    mid_market_pct: float = 30.0
    high_margin_pct: float = 20.0
    high_risk_pct: float = 10.0
    reconditioning_cost: float = 20000.0

class PricingStrategyRequest(BaseModel):
    make: str
    model: str
    make_year: int
    mileage: int
    city: str
    no_of_owners: int
    fuel_type: str
    transmission: str
    body_type: str
    acquisition_price: float

class BacktestRequest(BaseModel):
    max_price: float
    max_age: int
    max_mileage: int
    min_demand_score: float = 0
    min_opportunity_score: float = 0
    min_roi_pct: float = 0
    city: Optional[str] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    body_type: Optional[str] = None
    negotiation_buffer_pct: float = 8.0
    reconditioning_cost: float = 20000.0
    transport_cost: float = 5000.0
    platform_fee_pct: float = 2.0

class WhatIfRequest(BaseModel):
    scenario: str
    base_capital: float
    perturbation_pct: float = 10.0
    fuel_shift_from: Optional[str] = None
    fuel_shift_to: Optional[str] = None
    max_age: Optional[int] = None
    target_margin_pct: float = 10.0

class PricePredictRequest(BaseModel):
    fuel_type: str
    body_type: str
    transmission: str
    city: str
    vehicle_age: int
    mileage: int
    no_of_owners: int = 1
    registration_age: Optional[int] = None


# ═══════════════════════════════════════════════════════════════
#  Used-Car endpoints
# ═══════════════════════════════════════════════════════════════

@app.get("/used-cars/audit")
def uc_audit():
    from used_car_analysis import audit_dataset
    return audit_dataset()


@app.get("/used-cars/market")
def uc_market():
    from used_car_analysis import market_overview
    return market_overview()


@app.post("/used-cars/demand")
def uc_demand(req: DemandRequest):
    from used_car_analysis import demand_analysis
    return demand_analysis(city_filter=req.city, fuel_filter=req.fuel_type, body_filter=req.body_type)


@app.get("/used-cars/geographic")
def uc_geographic(
    transport_cost: float = Query(5000.0),
    reconditioning_cost: float = Query(20000.0),
    platform_fee_pct: float = Query(2.0),
):
    from used_car_analysis import geographic_analysis
    return geographic_analysis(transport_cost, reconditioning_cost, platform_fee_pct)


@app.get("/used-cars/segments")
def uc_segments():
    from used_car_analysis import segment_vehicles
    return segment_vehicles()


@app.post("/used-cars/opportunity")
def uc_opportunity(req: OpportunityRequest):
    from used_car_analysis import get_opportunity_vehicles
    return get_opportunity_vehicles(**req.model_dump())


@app.post("/used-cars/acquire")
def uc_acquire(req: AcquisitionRequest):
    from used_car_analysis import acquisition_strategy
    return acquisition_strategy(**req.model_dump())


@app.post("/used-cars/allocate")
def uc_allocate(req: AllocationRequest):
    from used_car_analysis import inventory_allocation
    return inventory_allocation(**req.model_dump())


@app.post("/used-cars/price-strategy")
def uc_price_strategy(req: PricingStrategyRequest):
    from used_car_analysis import pricing_strategy
    return pricing_strategy(**req.model_dump())


@app.post("/used-cars/backtest")
def uc_backtest(req: BacktestRequest):
    from used_car_analysis import backtest_strategy
    return backtest_strategy(**req.model_dump())


@app.post("/used-cars/whatif")
def uc_whatif(req: WhatIfRequest):
    from used_car_analysis import whatif_simulation
    return whatif_simulation(**req.model_dump())


@app.get("/used-cars/explain")
def uc_explain():
    if not _uc_meta:
        raise HTTPException(503, "Used-car price model not trained. Run `python used_car_train.py` first.")
    best = _uc_meta.get("best_algorithm", "unknown")
    all_models = _uc_meta.get("all_models", {})
    return {
        "best_algorithm":      best,
        "best_r2":             _uc_meta.get("best_r2"),
        "n_rows":              _uc_meta.get("n_rows"),
        "n_features":          _uc_meta.get("n_features"),
        "trained_at":          _uc_meta.get("trained_at"),
        "all_models":          all_models,
        "feature_importances": all_models.get(best, {}).get("feature_importances", []),
    }


@app.post("/used-cars/predict-price")
def uc_predict_price(req: PricePredictRequest):
    if _uc_estimator is None:
        raise HTTPException(503, "Used-car price model not trained. Run `python used_car_train.py` first.")
    from used_car_features import build_feature_matrix, PRICE_MODEL_NUMERIC
    row = {
        "vehicle_age":      req.vehicle_age,
        "mileage":          req.mileage,
        "mileage_per_year": req.mileage / max(req.vehicle_age, 1),
        "no_of_owners":     req.no_of_owners,
        "registration_age": req.registration_age if req.registration_age is not None else req.vehicle_age,
        "fuel_type":        req.fuel_type,
        "body_type":        req.body_type,
        "transmission":     req.transmission,
        "city":             req.city,
        "make":             "unknown",
    }
    df = pd.DataFrame([row])
    feature_columns = _uc_meta.get("feature_columns", [])
    X = build_feature_matrix(df, PRICE_MODEL_NUMERIC, feature_columns=feature_columns)
    predicted_price = float(_uc_estimator.predict(X)[0])
    return {
        "predicted_price":  round(predicted_price, 0),
        "model_algorithm":  _uc_meta.get("best_algorithm"),
        "model_r2":         _uc_meta.get("best_r2"),
        "note":             "ML-estimated listing price. Actual market price may vary.",
    }
