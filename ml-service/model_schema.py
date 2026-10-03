"""Pydantic schemas shared by the training script and the FastAPI service.

These define the artifact contract and the REST request/response shapes. Keeping
them in one module means `train.py` writes an artifact that `main.py` is
guaranteed to be able to load.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

# ── Artifact ─────────────────────────────────────────────────────────────


class ModelMetrics(BaseModel):
    """Regression metrics on the held-out test split, per target."""

    mae: float
    rmse: float
    r2: float
    mape: float


class FeatureImportance(BaseModel):
    feature: str
    percentage: float


class ModelArtifact(BaseModel):
    """Everything `main.py` needs to reproduce training-time inference.

    Persisted alongside the joblib file as `car_model.meta.json`. The
    `feature_columns` / `imputation_medians` fields are the important part —
    they pin the input matrix so serving never silently drifts from training.
    """

    version: str
    trained_at: str
    algorithm: Literal[
        "xgboost", "random_forest", "linear_regression", "gradient_boosting"
    ]
    target: Literal["units_sold", "revenue", "profit", "price"]
    n_rows: int
    n_features: int
    feature_columns: list[str]
    imputation_medians: dict[str, float]
    metrics: ModelMetrics
    feature_importances: list[FeatureImportance] = Field(default_factory=list)
    trained_on: str = "unknown"


# ── REST request / response ──────────────────────────────────────────────


class PredictRequest(BaseModel):
    """One or more car rows to predict on.

    Rows are accepted in the canonical schema (aliases are normalized server
    side). `price` may be omitted, in which case the price model fills it in.
    """

    rows: list[dict[str, Any]] = Field(min_length=1)


class PredictionRow(BaseModel):
    price: float
    units_sold: float
    revenue: float
    profit: float


class PredictResponse(BaseModel):
    predictions: list[PredictionRow]
    model_version: str
    price_was_predicted: bool


class TrainRequest(BaseModel):
    dataset: list[dict[str, Any]] = Field(min_length=1)


class ModelInfoResponse(BaseModel):
    available: bool
    artifacts: dict[str, ModelArtifact]


class HealthResponse(BaseModel):
    status: str
    model_available: bool
