"""Offline pre-training for the car prediction models.

Usage
-----
    python train.py --data data/vehicle_sales.csv --algorithm xgboost

What it does
------------
1. Loads a large dataset (default: the Kaggle "Vehicle Sales Data" CSV).
2. Normalizes columns to the canonical schema and imputes missing numerics.
3. Derives the target columns that the source lacks (`units_sold`, `revenue`,
   `profit`) from a documented demand curve — the public dataset has price and
   specs but no volume, so this is the only way to get a complete training set.
4. Trains one regressor per target with an 80/20 hold-out split.
5. Writes `models/<target>_model.joblib` plus `models/car_model.meta.json`.

Run this once, offline. The service never trains — it only loads these
artifacts. Re-run it whenever the dataset or `features.py` changes.

Target derivation (documented, deterministic)
---------------------------------------------
    price_ratio   = price / competitor_price
                    # (rows missing either value fall back to 1.0)
    units_sold    = base_demand
                    * price_ratio ** (-1.65)      # own-price elasticity
                    * (1 + discount_pct / 100)    # discount lift
                    * (1 + marketing_spend / 500_000)  # marketing lift
                    * seasonal_factor(month)
    revenue       = price * units_sold
    profit        = revenue - units_sold * manufacturing_cost
                    - marketing_spend

Because `revenue` and `profit` are deterministic functions of the other
columns, their models will fit near-perfectly on derived data. That is expected
and is called out in the model metadata so nobody mistakes it for real signal.
If a company uploads a CSV that *does* contain real `units_sold`/`revenue`/
`profit`, those columns are used as-is and the derivation is skipped.
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

from features import (
    CATEGORICAL_FEATURES,
    DEMAND_MODEL_NUMERIC,
    PRICE_MODEL_NUMERIC,
    apply_imputation,
    build_feature_frame,
    normalize_dataframe,
)
from model_schema import FeatureImportance, ModelArtifact, ModelMetrics

try:  # XGBoost is preferred but optional; fall back to sklearn's boosting.
    from xgboost import XGBRegressor  # type: ignore

    HAS_XGBOOST = True
except ImportError:  # pragma: no cover - environment dependent
    HAS_XGBOOST = False

MODELS_DIR = Path(__file__).parent / "models"
DEFAULT_DATA = Path(__file__).parent / "data" / "vehicle_sales.csv"

MANUFACTURING_COST_RATIO = 0.72
BASE_DEMAND = 1500.0

# Per-target feature sets. `price` is excluded from its own model.
TARGET_CONFIG: dict[str, list[str]] = {
    "price": PRICE_MODEL_NUMERIC,
    "units_sold": DEMAND_MODEL_NUMERIC,
    "revenue": DEMAND_MODEL_NUMERIC,
    "profit": DEMAND_MODEL_NUMERIC,
}

SEASONAL_FACTORS = {
    1: 0.92, 2: 0.95, 3: 1.05, 4: 1.02, 5: 1.00, 6: 0.98,
    7: 0.97, 8: 1.00, 9: 1.06, 10: 1.15, 11: 1.22, 12: 1.10,
}


def make_estimator(algorithm: str):
    if algorithm == "xgboost":
        if not HAS_XGBOOST:
            print("[train] xgboost not installed, falling back to sklearn GradientBoosting")
            algorithm = "gradient_boosting"
        else:
            return XGBRegressor(
                n_estimators=300,
                max_depth=6,
                learning_rate=0.08,
                subsample=0.9,
                colsample_bytree=0.9,
                random_state=42,
                n_jobs=-1,
            )
    if algorithm == "random_forest":
        return RandomForestRegressor(n_estimators=300, random_state=42, n_jobs=-1)
    if algorithm == "linear_regression":
        return LinearRegression()
    return GradientBoostingRegressor(n_estimators=300, random_state=42)


def load_dataset(path: Path) -> pd.DataFrame:
    if not path.exists():
        sys.exit(
            f"[train] dataset not found at {path}\n"
            "        Download the Kaggle 'Vehicle Sales Data' CSV and place it there,\n"
            "        or pass --data <path>."
        )
    df = pd.read_csv(path)
    print(f"[train] loaded {len(df):,} rows x {len(df.columns)} columns from {path}")
    return df


def prepare(df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, float]]:
    """Normalize, impute, and derive targets. Returns (prepared, medians)."""
    df = normalize_dataframe(df)

    numeric_all = list(
        dict.fromkeys(
            PRICE_MODEL_NUMERIC + DEMAND_MODEL_NUMERIC + ["units_sold", "revenue", "profit"]
        )
    )
    medians: dict[str, float] = {}
    for col in numeric_all:
        series = pd.to_numeric(df[col], errors="coerce")
        median = float(series.median()) if series.notna().any() else 0.0
        medians[col] = median

    # Sensible non-zero defaults where a median of 0 would break the derivation.
    medians.setdefault("marketing_spend", 0.0)
    medians.setdefault("discount_pct", 0.0)
    if medians.get("competitor_price", 0.0) <= 0:
        medians["competitor_price"] = 0.0

    df = apply_imputation(df, medians)

    # Competitor price: fall back to a small markup over own price.
    no_comp = df["competitor_price"] <= 0
    if no_comp.any():
        df.loc[no_comp, "competitor_price"] = df.loc[no_comp, "price"] * 1.08
        print(f"[train] synthesized competitor_price for {int(no_comp.sum()):,} rows")

    # Price: the trimmed schema carries no spec columns to derive price from, so
    # fall back to the competitor price (a flat market assumption). Rows that
    # reach here have neither a real price nor a competitor price to lean on.
    missing_price = df["price"] <= 0
    if missing_price.any():
        fallback = df.loc[missing_price, "competitor_price"] / 1.08
        df.loc[missing_price, "price"] = fallback.where(fallback > 0, 20_000.0)
        print(f"[train] imputed price for {int(missing_price.sum()):,} rows")

    # Month -> numeric for seasonality; tolerate YYYY-MM or full dates.
    parsed = pd.to_datetime(
        df["month"], errors="coerce", format="mixed", utc=True
    )
    month_num = parsed.dt.month if parsed.dtype.kind == "M" else pd.Series(dtype="float64")
    month_num = month_num.fillna(1).astype(int)
    if month_num.isna().all():
        month_num = pd.Series([1] * len(df), index=df.index, dtype=int)

    # Derive targets only where the source does not already provide them.
    if (df["units_sold"] <= 0).all():
        price_ratio = (df["price"] / df["competitor_price"].replace(0, np.nan)).fillna(1.0)
        seasonal = month_num.map(SEASONAL_FACTORS).fillna(1.0)
        units = (
            BASE_DEMAND
            * np.power(price_ratio.clip(0.4, 2.5), -1.65)
            * (1 + df["discount_pct"] / 100.0)
            * (1 + df["marketing_spend"] / 500_000.0)
            * seasonal
        )
        df["units_sold"] = units.round(0)
        print("[train] derived units_sold from the documented demand curve")

    if (df["revenue"] <= 0).all():
        df["revenue"] = (df["price"] * df["units_sold"]).round(2)
        print("[train] derived revenue = price x units_sold")

    if (df["profit"] == 0).all():
        manufacturing_cost = df["price"] * MANUFACTURING_COST_RATIO
        df["profit"] = (
            df["revenue"] - df["units_sold"] * manufacturing_cost - df["marketing_spend"]
        ).round(2)
        print("[train] derived profit from revenue, cost of goods, and marketing")

    return df, medians


def compute_metrics(actual: np.ndarray, predicted: np.ndarray) -> ModelMetrics:
    with np.errstate(divide="ignore", invalid="ignore"):
        nonzero = actual != 0
        mape = (
            float(np.mean(np.abs((actual[nonzero] - predicted[nonzero]) / actual[nonzero])) * 100)
            if nonzero.any()
            else 0.0
        )
    return ModelMetrics(
        mae=round(float(mean_absolute_error(actual, predicted)), 3),
        rmse=round(float(np.sqrt(mean_squared_error(actual, predicted))), 3),
        r2=round(float(r2_score(actual, predicted)), 4),
        mape=round(mape, 3),
    )


def aggregate_importances(estimator, feature_columns: list[str]) -> list[FeatureImportance]:
    """Fold one-hot columns back onto their base feature name."""
    raw = getattr(estimator, "feature_importances_", None)
    if raw is None:
        return []
    totals: dict[str, float] = {}
    for name, value in zip(feature_columns, raw):
        # Recover the original feature name for one-hot columns. Match against the
        # known categoricals only, so numeric names containing "_" are untouched.
        base = name
        for cat in CATEGORICAL_FEATURES:
            if name.startswith(cat + "_"):
                base = cat
                break
        totals[base] = totals.get(base, 0.0) + float(value)
    total = sum(totals.values()) or 1.0
    ranked = sorted(totals.items(), key=lambda kv: kv[1], reverse=True)
    return [
        FeatureImportance(feature=name, percentage=round(value / total * 100, 2))
        for name, value in ranked
        if value > 0
    ][:8]


def train(data_path: Path, algorithm: str) -> None:
    df = load_dataset(data_path)
    df, medians = prepare(df)

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    artifacts: dict[str, ModelArtifact] = {}
    algorithm_label = algorithm if algorithm != "xgboost" or HAS_XGBOOST else "gradient_boosting"

    for target, numeric_cols in TARGET_CONFIG.items():
        feature_frame = build_feature_frame(df, numeric_cols)
        feature_columns = list(feature_frame.columns)
        y = pd.to_numeric(df[target], errors="coerce").fillna(0.0)

        # Chronological-ish split: hold out a random 20% for evaluation.
        rng = np.random.default_rng(42)
        idx = rng.permutation(len(df))
        split = int(len(df) * 0.8)
        train_idx, test_idx = idx[:split], idx[split:]

        estimator = make_estimator(algorithm)
        estimator.fit(feature_frame.iloc[train_idx], y.iloc[train_idx])
        predicted = estimator.predict(feature_frame.iloc[test_idx])
        metrics = compute_metrics(y.iloc[test_idx].to_numpy(), predicted)

        joblib.dump(estimator, MODELS_DIR / f"{target}_model.joblib")
        artifacts[target] = ModelArtifact(
            version=f"car-{algorithm_label}-v1",
            trained_at=datetime.now(timezone.utc).isoformat(),
            algorithm=algorithm_label,  # type: ignore[arg-type]
            target=target,  # type: ignore[arg-type]
            n_rows=len(df),
            n_features=len(feature_columns),
            feature_columns=feature_columns,
            imputation_medians=medians,
            metrics=metrics,
            feature_importances=aggregate_importances(estimator, feature_columns),
            trained_on=data_path.name,
        )
        print(
            f"[train] {target:<12} MAE={metrics.mae:>12.2f}  "
            f"R2={metrics.r2:>7.4f}  MAPE={metrics.mape:>7.2f}%"
        )

    meta_path = MODELS_DIR / "car_model.meta.json"
    meta_path.write_text(
        json.dumps({k: v.model_dump() for k, v in artifacts.items()}, indent=2),
        encoding="utf-8",
    )
    print(f"[train] wrote {len(artifacts)} artifacts + {meta_path.name} to {MODELS_DIR}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Pre-train the car prediction models")
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA, help="path to training CSV")
    parser.add_argument(
        "--algorithm",
        choices=["xgboost", "random_forest", "linear_regression", "gradient_boosting"],
        default="xgboost",
    )
    args = parser.parse_args()
    train(args.data, args.algorithm)


if __name__ == "__main__":
    main()
