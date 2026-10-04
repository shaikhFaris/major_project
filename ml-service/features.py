"""Canonical car dataset schema and feature engineering.

Both `train.py` (offline pre-training) and `main.py` (serving) import from here so
the feature matrix built at training time is byte-for-byte reproducible at
prediction time. If you change the schema, retrain — otherwise the saved
`feature_columns` in the artifact will not line up with incoming rows.

Canonical schema (deliberately minimal)
---------------------------------------
Required inputs (known at prediction time):
    make, year, price, marketing_spend, discount_pct, competitor_price, region

`make` and `region` are categorical; the rest are numeric. Any of them may be
omitted in an uploaded CSV — the missing value is filled from the medians learned
at training time. `price` is the one exception: when a row has no price, the
price model predicts one (see `main.py`).

Targets (what the model predicts):
    units_sold, revenue, profit
    (plus `price`, predicted by a separate model when the caller omits it)

Why so few fields?
------------------
Every extra field is one a company has to supply, and the public training data
does not carry most of them. These seven are the demand levers a simulation
actually varies (price, marketing, discount, competitor price) plus the two
dimensions that segment a market (make, region) and vehicle age (year).

The public Kaggle "Vehicle Sales Data" dataset supplies `sellingprice` but no
volume, so `train.py` derives `units_sold` / `revenue` / `profit` from a
documented demand curve. See `train.py` for that derivation.
"""

from __future__ import annotations

from typing import Iterable

import numpy as np
import pandas as pd

# ── Canonical columns ────────────────────────────────────────────────────

CATEGORICAL_INPUTS: list[str] = [
    "make",
    "region",
]

NUMERIC_INPUTS: list[str] = [
    "year",
    "price",
    "marketing_spend",
    "discount_pct",
    "competitor_price",
]

TARGETS: list[str] = ["units_sold", "revenue", "profit"]

# Features the price model uses (it must NOT see `price` itself).
# With the trimmed schema the only price signal available is brand + region,
# so the price model is intentionally coarse.
PRICE_MODEL_NUMERIC: list[str] = ["year"]

# Features the demand model uses (price is the key driver, so it IS included).
DEMAND_MODEL_NUMERIC: list[str] = [
    "year",
    "price",
    "marketing_spend",
    "discount_pct",
    "competitor_price",
]

CATEGORICAL_FEATURES: list[str] = CATEGORICAL_INPUTS

# ── Column aliasing ──────────────────────────────────────────────────────
# Maps common source column names (Kaggle vehicle sales, our own exports,
# snake_case variants) onto the canonical name. Matching is done on a
# normalized key: lowercase, non-alphanumerics stripped.
COLUMN_ALIASES: dict[str, str] = {
    # Kaggle "Vehicle Sales Data"
    "sellingprice": "price",
    "sale_price": "price",
    "saleprice": "price",
    "mmr": "competitor_price",
    "marketvalue": "competitor_price",
    "state": "region",
    "saledate": "month",
    "sale_date": "month",
    # generic variants
    "brand": "make",
    "manufacturer": "make",
    "city": "region",
    "units": "units_sold",
    "unitssold": "units_sold",
    "quantity": "units_sold",
    "marketing": "marketing_spend",
    "marketingspend": "marketing_spend",
    "adspend": "marketing_spend",
    "discount": "discount_pct",
    "discountpct": "discount_pct",
    "competitorprice": "competitor_price",
    "revenue": "revenue",
    "profit": "profit",
}

# Columns carried through for context/labels but never fed to the estimator.
# `month` is parsed for seasonality when deriving targets at training time.
PASSTHROUGH_COLUMNS: list[str] = ["month"]


def _normalize_key(name: str) -> str:
    return "".join(ch for ch in str(name).lower() if ch.isalnum())


def normalize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Rename source columns to canonical names and coerce dtypes.

    Unknown columns are dropped; missing canonical columns are created as NaN so
    downstream imputation is uniform.
    """
    rename: dict[str, str] = {}
    for col in df.columns:
        key = _normalize_key(col)
        canonical = COLUMN_ALIASES.get(key, key)
        rename[col] = canonical
    out = df.rename(columns=rename)

    # Collapse duplicate canonical columns (e.g. both `price` and `sellingprice`).
    out = out.loc[:, ~out.columns.duplicated(keep="first")]

    for col in CATEGORICAL_INPUTS:
        if col in out.columns:
            out[col] = out[col].astype("string").str.strip()

    for col in NUMERIC_INPUTS + TARGETS:
        if col in out.columns:
            out[col] = pd.to_numeric(out[col], errors="coerce")

    # Ensure every canonical column exists.
    for col in CATEGORICAL_INPUTS + NUMERIC_INPUTS + TARGETS + PASSTHROUGH_COLUMNS:
        if col not in out.columns:
            out[col] = pd.Series([np.nan] * len(out), index=out.index)

    return out


def build_feature_frame(
    df: pd.DataFrame,
    numeric_cols: Iterable[str],
    feature_columns: list[str] | None = None,
) -> pd.DataFrame:
    """Build the model-ready numeric matrix.

    Categoricals are one-hot encoded. When `feature_columns` is supplied
    (inference time), the result is reindexed to exactly that column set so the
    matrix always matches what the estimator was fitted on.
    """
    numeric_cols = list(numeric_cols)
    base = pd.DataFrame(index=df.index)

    for col in numeric_cols:
        series = pd.to_numeric(df[col], errors="coerce")
        base[col] = series

    for col in CATEGORICAL_FEATURES:
        base[col] = df[col].astype("string").fillna("unknown")

    encoded = pd.get_dummies(base, columns=CATEGORICAL_FEATURES, dummy_na=False)
    encoded = encoded.astype("float64")

    if feature_columns is not None:
        encoded = encoded.reindex(columns=feature_columns, fill_value=0.0)

    return encoded


def apply_imputation(df: pd.DataFrame, medians: dict[str, float]) -> pd.DataFrame:
    """Fill missing numeric values with the medians learned at training time."""
    out = df.copy()
    for col, value in medians.items():
        if col not in out.columns:
            out[col] = value
        out[col] = pd.to_numeric(out[col], errors="coerce").fillna(value)
    return out
