"""
Used-Car Price Prediction Model Training Script.

Trains 4 regressors on all_car_details.csv and saves:
  models/used_car_model.meta.json
  models/used_car_price_model.joblib  (best model)
  models/used_car_price_<algorithm>.joblib  (all 4 models)

Usage
-----
    python used_car_train.py                    # trains all 4, picks best
    python used_car_train.py --algorithm xgboost

Features (after engineering)
-----------------------------
  Numeric  : vehicle_age, mileage, mileage_per_year, no_of_owners, registration_age
  Categoric: make, fuel_type, body_type, transmission, city

Target: price (INR listing price — observed, NOT derived)
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

from used_car_features import (
    ALL_NUMERIC,
    CATEGORICAL_FEATURES,
    PRICE_MODEL_NUMERIC,
    build_feature_matrix,
    clean_dataset,
    compute_demand_scores,
    compute_opportunity_scores,
    engineer_features,
    load_dataset,
)

try:
    from xgboost import XGBRegressor  # type: ignore
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

MODELS_DIR   = Path(__file__).parent / "models"
DATASET_PATH = Path(__file__).parent / "dataset" / "all_car_details.csv"

ALGORITHMS = ["xgboost", "random_forest", "gradient_boosting", "linear_regression"]


# ── Model factory ────────────────────────────────────────────────────────

def make_estimator(algorithm: str):
    if algorithm == "xgboost":
        if not HAS_XGBOOST:
            print("[train] xgboost not installed — falling back to gradient_boosting")
            return make_estimator("gradient_boosting")
        return XGBRegressor(
            n_estimators=400,
            max_depth=6,
            learning_rate=0.07,
            subsample=0.85,
            colsample_bytree=0.85,
            min_child_weight=3,
            reg_alpha=0.1,
            reg_lambda=1.0,
            random_state=42,
            n_jobs=-1,
        )
    if algorithm == "random_forest":
        return RandomForestRegressor(
            n_estimators=300,
            max_depth=15,
            min_samples_leaf=3,
            random_state=42,
            n_jobs=-1,
        )
    if algorithm == "linear_regression":
        return LinearRegression()
    # gradient_boosting (sklearn)
    return GradientBoostingRegressor(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.08,
        random_state=42,
    )


# ── Metrics ──────────────────────────────────────────────────────────────

def compute_metrics(actual: np.ndarray, predicted: np.ndarray) -> dict:
    with np.errstate(divide="ignore", invalid="ignore"):
        nonzero = actual != 0
        mape = (
            float(np.mean(np.abs((actual[nonzero] - predicted[nonzero]) / actual[nonzero])) * 100)
            if nonzero.any() else 0.0
        )
    return {
        "mae":  round(float(mean_absolute_error(actual, predicted)), 2),
        "rmse": round(float(np.sqrt(mean_squared_error(actual, predicted))), 2),
        "r2":   round(float(r2_score(actual, predicted)), 4),
        "mape": round(mape, 2),
    }


# ── Feature importance ───────────────────────────────────────────────────

def aggregate_importances(estimator, feature_columns: list[str]) -> list[dict]:
    raw = getattr(estimator, "feature_importances_", None)
    if raw is None:
        return []
    totals: dict[str, float] = {}
    for name, value in zip(feature_columns, raw):
        base = name
        for cat in CATEGORICAL_FEATURES:
            if name.startswith(cat + "_"):
                base = cat
                break
        totals[base] = totals.get(base, 0.0) + float(value)
    total = sum(totals.values()) or 1.0
    ranked = sorted(totals.items(), key=lambda kv: kv[1], reverse=True)
    return [
        {"feature": n, "importance": round(v / total * 100, 2)}
        for n, v in ranked if v > 0
    ][:12]


# ── Training ─────────────────────────────────────────────────────────────

def train_all(data_path: Path = DATASET_PATH) -> dict:
    """Train all 4 algorithms; return consolidated metadata."""
    print(f"[train] Loading {data_path} …")
    raw = load_dataset(str(data_path))
    df  = clean_dataset(raw)
    df  = engineer_features(df)
    df  = compute_demand_scores(df)
    df  = compute_opportunity_scores(df)

    X = build_feature_matrix(df, PRICE_MODEL_NUMERIC)
    y = df["price"].values
    feature_columns = list(X.columns)

    print(f"[train] Feature matrix: {X.shape[0]:,} rows × {X.shape[1]} features")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    all_metrics: dict[str, dict] = {}
    best_r2     = -float("inf")
    best_alg    = "xgboost"

    for alg in ALGORITHMS:
        alg_label = alg if (alg != "xgboost" or HAS_XGBOOST) else "gradient_boosting"
        print(f"[train] Training {alg_label} …")

        est = make_estimator(alg)
        est.fit(X_train, y_train)
        y_pred = est.predict(X_test)
        metrics = compute_metrics(y_test, y_pred)

        joblib.dump(est, MODELS_DIR / f"used_car_price_{alg_label}.joblib")
        importances = aggregate_importances(est, feature_columns)

        all_metrics[alg_label] = {
            "algorithm":          alg_label,
            "metrics":            metrics,
            "feature_importances": importances,
        }

        print(
            f"[train]   {alg_label:<20}  MAE={metrics['mae']:>10,.0f}  "
            f"RMSE={metrics['rmse']:>10,.0f}  R²={metrics['r2']:.4f}  MAPE={metrics['mape']:.1f}%"
        )

        if metrics["r2"] > best_r2:
            best_r2  = metrics["r2"]
            best_alg = alg_label
            joblib.dump(est, MODELS_DIR / "used_car_price_model.joblib")

    print(f"[train] Best model: {best_alg}  (R²={best_r2:.4f})")

    # Compute global medians for imputation
    medians: dict[str, float] = {}
    for col in PRICE_MODEL_NUMERIC:
        s = pd.to_numeric(df[col], errors="coerce")
        medians[col] = float(s.median()) if s.notna().any() else 0.0

    # Category value maps (for inference-time encoding alignment)
    cat_values: dict[str, list[str]] = {}
    for col in CATEGORICAL_FEATURES:
        cat_values[col] = sorted(df[col].dropna().unique().tolist())

    meta = {
        "trained_at":       datetime.now(timezone.utc).isoformat(),
        "dataset":          data_path.name,
        "n_rows":           int(len(df)),
        "n_features":       len(feature_columns),
        "feature_columns":  feature_columns,
        "imputation_medians": medians,
        "category_values":  cat_values,
        "best_algorithm":   best_alg,
        "best_r2":          best_r2,
        "all_models":       all_metrics,
    }

    meta_path = MODELS_DIR / "used_car_model.meta.json"
    meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"[train] Metadata written to {meta_path}")

    return meta


def train_single(algorithm: str, data_path: Path = DATASET_PATH) -> dict:
    raw = load_dataset(str(data_path))
    df  = clean_dataset(raw)
    df  = engineer_features(df)
    X   = build_feature_matrix(df, PRICE_MODEL_NUMERIC)
    y   = df["price"].values
    feature_columns = list(X.columns)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    alg_label = algorithm if (algorithm != "xgboost" or HAS_XGBOOST) else "gradient_boosting"

    est = make_estimator(algorithm)
    est.fit(X_train, y_train)
    metrics = compute_metrics(y_test, est.predict(X_test))

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(est, MODELS_DIR / "used_car_price_model.joblib")
    joblib.dump(est, MODELS_DIR / f"used_car_price_{alg_label}.joblib")

    medians = {
        col: float(pd.to_numeric(df[col], errors="coerce").median())
        for col in PRICE_MODEL_NUMERIC
    }
    cat_values = {col: sorted(df[col].dropna().unique().tolist()) for col in CATEGORICAL_FEATURES}

    meta = {
        "trained_at":       datetime.now(timezone.utc).isoformat(),
        "dataset":          data_path.name,
        "n_rows":           int(len(df)),
        "n_features":       len(feature_columns),
        "feature_columns":  feature_columns,
        "imputation_medians": medians,
        "category_values":  cat_values,
        "best_algorithm":   alg_label,
        "best_r2":          metrics["r2"],
        "all_models":       {alg_label: {"algorithm": alg_label, "metrics": metrics, "feature_importances": aggregate_importances(est, feature_columns)}},
    }
    (MODELS_DIR / "used_car_model.meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"[train] {alg_label}: MAE={metrics['mae']:,.0f}  R²={metrics['r2']:.4f}  MAPE={metrics['mape']:.1f}%")
    return meta


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train used-car price prediction models")
    parser.add_argument("--data",      type=Path, default=DATASET_PATH)
    parser.add_argument("--algorithm", choices=ALGORITHMS + ["all"], default="all")
    args = parser.parse_args()

    if not args.data.exists():
        sys.exit(f"[train] Dataset not found: {args.data}")

    if args.algorithm == "all":
        train_all(args.data)
    else:
        train_single(args.algorithm, args.data)
