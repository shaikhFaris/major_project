"""
Canonical feature schema for the Used-Car Market Simulation Platform.

Source dataset: ml-service/dataset/all_car_details.csv
  8,137 rows × 14 columns — Indian used-car listings (Jan–Aug 2025)

Columns present:
  city, make, model, variant, mileage, make_year, price,
  fuel_type, no_of_owners, color, body_type, transmission,
  registration_year, latest_publish_date
"""

from __future__ import annotations

from datetime import datetime
from typing import Iterable

import numpy as np
import pandas as pd

# ── Reference year for all age calculations ─────────────────────────────
REFERENCE_YEAR: int = 2025

# ── Categorical features ────────────────────────────────────────────────
CATEGORICAL_FEATURES: list[str] = [
    "make",
    "fuel_type",
    "body_type",
    "transmission",
    "city",
]

# ── Numeric features for the price model ───────────────────────────────
PRICE_MODEL_NUMERIC: list[str] = [
    "vehicle_age",
    "mileage",
    "mileage_per_year",
    "no_of_owners",
    "registration_age",
]

# ── All engineered numeric features (superset) ──────────────────────────
ALL_NUMERIC: list[str] = PRICE_MODEL_NUMERIC + ["price"]

# ── Price segment boundaries (INR) ──────────────────────────────────────
PRICE_SEGMENTS = {
    "Economy":   (0,       400_000),
    "Mid":       (400_000, 900_000),
    "Premium":   (900_000, float("inf")),
}

# ── City normalization map ───────────────────────────────────────────────
# Collapse "delhi" and "delhi-ncr" into one bucket for analysis
CITY_NORMALIZE: dict[str, str] = {
    "delhi":     "delhi-ncr",
    "noida":     "delhi-ncr",
    "gurgaon":   "delhi-ncr",
    "faridabad": "delhi-ncr",
    "ghaziabad": "delhi-ncr",
}


# ── Fuel-type normalization ──────────────────────────────────────────────
FUEL_NORMALIZE: dict[str, str] = {
    "Petrol": "petrol",          # handle mixed capitalisation
}


def load_dataset(path: str) -> pd.DataFrame:
    """Load and return the raw CSV."""
    df = pd.read_csv(path)
    print(f"[features] loaded {len(df):,} rows × {len(df.columns)} columns from {path}")
    return df


def clean_dataset(df: pd.DataFrame) -> pd.DataFrame:
    """Deduplicate, normalise, and impute the raw dataset."""
    original_len = len(df)

    # --- Deduplication -------------------------------------------------------
    df = df.drop_duplicates().reset_index(drop=True)
    print(f"[features] removed {original_len - len(df)} duplicates -> {len(df):,} rows")

    # --- Column normalisation ------------------------------------------------
    df["city"]      = df["city"].str.strip().str.lower().replace(CITY_NORMALIZE)
    df["fuel_type"] = df["fuel_type"].str.strip().replace(FUEL_NORMALIZE).str.lower()
    df["make"]      = df["make"].str.strip()
    df["model"]     = df["model"].str.strip()
    df["variant"]   = df["variant"].str.strip()
    df["body_type"] = df["body_type"].str.strip().str.lower()
    df["transmission"] = df["transmission"].str.strip().str.lower()

    # --- Type coercion -------------------------------------------------------
    df["mileage"]           = pd.to_numeric(df["mileage"],           errors="coerce")
    df["make_year"]         = pd.to_numeric(df["make_year"],         errors="coerce")
    df["price"]             = pd.to_numeric(df["price"],             errors="coerce")
    df["no_of_owners"]      = pd.to_numeric(df["no_of_owners"],      errors="coerce")
    df["registration_year"] = pd.to_numeric(df["registration_year"], errors="coerce")

    # --- Null imputation -----------------------------------------------------
    df["color"] = df["color"].fillna("unknown")

    # Drop rows with missing price (target column — cannot impute)
    before = len(df)
    df = df.dropna(subset=["price", "mileage", "make_year"]).reset_index(drop=True)
    print(f"[features] dropped {before - len(df)} rows with missing price/mileage/make_year")

    # Impute no_of_owners with 1 (most common)
    df["no_of_owners"] = df["no_of_owners"].fillna(1).astype(int)

    # Impute registration_year with make_year when missing
    df["registration_year"] = df["registration_year"].fillna(df["make_year"]).astype(int)

    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Derive all computed columns used in modelling and scoring."""
    df = df.copy()

    # Vehicle age and registration age
    df["vehicle_age"]      = (REFERENCE_YEAR - df["make_year"]).clip(lower=0)
    df["registration_age"] = (REFERENCE_YEAR - df["registration_year"]).clip(lower=0)

    # Mileage per year (avoid div-by-zero on brand-new cars)
    df["mileage_per_year"] = (df["mileage"] / df["vehicle_age"].replace(0, 1)).round(0)

    # Price segment label
    df["price_segment"] = pd.cut(
        df["price"],
        bins=[0, 400_000, 900_000, float("inf")],
        labels=["Economy", "Mid", "Premium"],
        right=True,
    )

    # Listing recency in days from latest_publish_date
    try:
        pub = pd.to_datetime(df["latest_publish_date"], errors="coerce")
        ref = pd.Timestamp("2025-08-18")          # last date in dataset
        df["listing_recency_days"] = (ref - pub).dt.days.clip(lower=0).fillna(30)
    except Exception:
        df["listing_recency_days"] = 30

    # Price per km (value indicator)
    df["price_per_km"] = (df["price"] / df["mileage"].replace(0, 1)).round(2)

    return df


def build_feature_matrix(
    df: pd.DataFrame,
    numeric_cols: Iterable[str] = PRICE_MODEL_NUMERIC,
    feature_columns: list[str] | None = None,
) -> pd.DataFrame:
    """Build the model-ready numeric matrix with one-hot categoricals."""
    numeric_cols = list(numeric_cols)
    base = pd.DataFrame(index=df.index)

    for col in numeric_cols:
        base[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    for col in CATEGORICAL_FEATURES:
        if col in df.columns:
            base[col] = df[col].astype(str).fillna("unknown")

    encoded = pd.get_dummies(base, columns=CATEGORICAL_FEATURES, dummy_na=False)
    encoded = encoded.astype("float64")

    if feature_columns is not None:
        encoded = encoded.reindex(columns=feature_columns, fill_value=0.0)

    return encoded


def compute_demand_scores(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute a demand proxy score (0–100) per (make, model) combination.

    Demand proxy = normalized listing count within the dataset.
    This is NOT actual consumer demand — it is a listing-frequency proxy.
    More listings → higher market activity → higher demand score.
    """
    df = df.copy()
    df["listing_count"] = df.groupby(["make", "model"])["price"].transform("count")

    max_count = df["listing_count"].max()
    min_count = df["listing_count"].min()
    rng = max(max_count - min_count, 1)

    df["demand_score"] = (
        ((df["listing_count"] - min_count) / rng * 80 + 20)   # scale 20–100
        .round(1)
        .clip(0, 100)
    )
    return df


def compute_opportunity_scores(
    df: pd.DataFrame,
    demand_w: float = 0.35,
    margin_w: float = 0.35,
    risk_w: float = 0.20,
    velocity_w: float = 0.10,
) -> pd.DataFrame:
    """
    Compute Opportunity Score (0–100) for each vehicle.

    Components (weights configurable):
      demand_score   (0.35) — listing frequency proxy
      margin_score   (0.35) — potential acquisition-to-resale spread
      risk_score_inv (0.20) — lower risk → higher opportunity
      velocity_score (0.10) — recency / freshness of listing
    """
    df = df.copy()

    # Margin score: fair value vs estimated acquisition price
    # We use the median price for (make+model) as the fair value reference
    model_median = df.groupby(["make", "model"])["price"].transform("median")
    raw_margin = ((model_median - df["price"]) / model_median.replace(0, 1) * 100).clip(-50, 50)
    df["margin_score"] = ((raw_margin + 50) / 100 * 100).round(1)   # 0–100

    # Risk score components
    age_risk      = (df["vehicle_age"] / 14 * 100).clip(0, 100)
    mileage_risk  = (df["mileage"] / 150_000 * 100).clip(0, 100)
    owner_risk    = ((df["no_of_owners"] - 1) / 2 * 100).clip(0, 100)
    risk_score    = (age_risk * 0.4 + mileage_risk * 0.4 + owner_risk * 0.2).round(1)
    df["risk_score"] = risk_score.clip(0, 100)

    # Velocity score (freshness — recently listed = higher activity)
    velocity = (1 - df.get("listing_recency_days", pd.Series(30, index=df.index)) / 200).clip(0, 1) * 100
    df["velocity_score"] = velocity.round(1)

    # Composite opportunity score
    demand  = df.get("demand_score", pd.Series(50, index=df.index))
    margin  = df["margin_score"]
    risk_inv = (100 - risk_score)
    vel     = df["velocity_score"]

    df["opportunity_score"] = (
        demand * demand_w
        + margin * margin_w
        + risk_inv * risk_w
        + vel * velocity_w
    ).round(1).clip(0, 100)

    return df


def classify_opportunity(score: float) -> str:
    if score >= 70: return "High"
    if score >= 45: return "Medium"
    return "Low"


def classify_demand(score: float) -> str:
    if score >= 70: return "High"
    if score >= 40: return "Medium"
    return "Low"


def classify_risk(score: float) -> str:
    if score >= 65: return "High"
    if score >= 35: return "Medium"
    return "Low"


def get_recommendation(
    opportunity_score: float,
    demand_score: float,
    risk_score: float,
    min_opportunity: float = 55,
    min_demand: float = 40,
    max_risk: float = 65,
) -> str:
    """
    BUY / HOLD / SELL / AVOID based on user-configurable thresholds.
    Labels are generated from model outputs + thresholds, never hardcoded.
    """
    if opportunity_score >= min_opportunity and demand_score >= min_demand and risk_score <= max_risk:
        return "BUY"
    if opportunity_score >= 40 and risk_score <= 70:
        return "HOLD"
    if opportunity_score < 30 or risk_score > 75:
        return "AVOID"
    return "SELL"
