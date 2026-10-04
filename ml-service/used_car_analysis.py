"""
Used-Car Market Analysis Engine.

Provides all analytical computations served via the FastAPI endpoints.
All functions operate on a pre-cleaned pandas DataFrame produced by
`used_car_features.clean_dataset` + `used_car_features.engineer_features`.

Data source: ml-service/dataset/all_car_details.csv
  8,137 rows — Indian used-car listings (Jan–Aug 2025)
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from used_car_features import (
    REFERENCE_YEAR,
    clean_dataset,
    compute_demand_scores,
    compute_opportunity_scores,
    engineer_features,
    get_recommendation,
    load_dataset,
)

DATASET_PATH = Path(__file__).parent / "dataset" / "all_car_details.csv"

# ── Module-level cached frame ─────────────────────────────────────────────
_df_cache: pd.DataFrame | None = None


def get_dataframe() -> pd.DataFrame:
    """Load, clean, and cache the full analytical dataset."""
    global _df_cache
    if _df_cache is None:
        raw = load_dataset(str(DATASET_PATH))
        clean = clean_dataset(raw)
        feat  = engineer_features(clean)
        feat  = compute_demand_scores(feat)
        feat  = compute_opportunity_scores(feat)
        _df_cache = feat.reset_index(drop=True)
        print(f"[analysis] dataset ready: {len(_df_cache):,} rows")
    return _df_cache


# ─────────────────────────────────────────────────────────────────────────
#  1. Dataset Audit
# ─────────────────────────────────────────────────────────────────────────

def audit_dataset() -> dict[str, Any]:
    """Full statistical audit of the dataset (Requirement #1)."""
    df = get_dataframe()
    raw = load_dataset(str(DATASET_PATH))

    price_q = df["price"].quantile([0.25, 0.5, 0.75])
    mileage_q = df["mileage"].quantile([0.25, 0.5, 0.75])

    return {
        "total_records":       int(len(raw)),
        "records_after_clean": int(len(df)),
        "duplicates_removed":  int(len(raw) - df.drop_duplicates(subset=raw.columns.tolist(), keep='first').shape[0]),
        "total_columns":       int(len(raw.columns)),
        "columns":             raw.columns.tolist(),
        "null_counts":         raw.isnull().sum().to_dict(),
        "dtypes":              {c: str(t) for c, t in raw.dtypes.items()},
        "unique_makes":        int(df["make"].nunique()),
        "unique_models":       int(df["model"].nunique()),
        "unique_variants":     int(df["variant"].nunique()),
        "unique_cities":       int(df["city"].nunique()),
        "cities":              sorted(df["city"].unique().tolist()),
        "makes":               sorted(df["make"].unique().tolist()),
        "fuel_types":          df["fuel_type"].unique().tolist(),
        "body_types":          df["body_type"].unique().tolist(),
        "transmissions":       df["transmission"].unique().tolist(),
        "make_year_range":     {"min": int(df["make_year"].min()), "max": int(df["make_year"].max())},
        "vehicle_age_range":   {"min": int(df["vehicle_age"].min()), "max": int(df["vehicle_age"].max())},
        "price_range": {
            "min":    float(df["price"].min()),
            "max":    float(df["price"].max()),
            "mean":   float(df["price"].mean()),
            "median": float(df["price"].median()),
            "q25":    float(price_q[0.25]),
            "q75":    float(price_q[0.75]),
        },
        "mileage_range": {
            "min":    float(df["mileage"].min()),
            "max":    float(df["mileage"].max()),
            "mean":   float(df["mileage"].mean()),
            "median": float(df["mileage"].median()),
            "q25":    float(mileage_q[0.25]),
            "q75":    float(mileage_q[0.75]),
        },
        "owners_distribution": df["no_of_owners"].value_counts().to_dict(),
        "date_range": {
            "earliest": str(pd.to_datetime(df["latest_publish_date"]).min()),
            "latest":   str(pd.to_datetime(df["latest_publish_date"]).max()),
        },
        "answerable_questions": [
            "Which cars are most frequently listed (demand proxy)?",
            "What is the current market listing price by make/model/city?",
            "How does price vary by fuel type, transmission, body type?",
            "Which cities have the highest/lowest average prices (arbitrage)?",
            "What is the risk profile by vehicle age, mileage, ownership?",
            "How should capital be allocated across segments?",
        ],
        "limitations": [
            "No actual days-to-sale data — inventory velocity is a listing-frequency proxy",
            "No transaction volume — demand score is based on listing count, not sales",
            "Reconditioning/transport/platform costs are user-defined assumptions",
            "Price predictions are estimates, not guaranteed market values",
        ],
    }


# ─────────────────────────────────────────────────────────────────────────
#  2. Market Overview & EDA
# ─────────────────────────────────────────────────────────────────────────

def market_overview() -> dict[str, Any]:
    """Aggregated EDA for the Market Overview dashboard (Requirement #3, #17)."""
    df = get_dataframe()

    # Brand distribution
    brand_counts = (
        df["make"].value_counts()
        .head(15)
        .reset_index()
        .rename(columns={"make": "brand", "count": "listings"})
        .to_dict(orient="records")
    )

    # Model distribution
    model_counts = (
        df["model"].value_counts()
        .head(20)
        .reset_index()
        .rename(columns={"model": "model", "count": "listings"})
        .to_dict(orient="records")
    )

    # Price by fuel type
    fuel_stats = (
        df.groupby("fuel_type")["price"]
        .agg(mean="mean", median="median", count="count")
        .reset_index()
        .to_dict(orient="records")
    )

    # Price by body type
    body_stats = (
        df.groupby("body_type")["price"]
        .agg(mean="mean", median="median", count="count")
        .reset_index()
        .to_dict(orient="records")
    )

    # Price by transmission
    trans_stats = (
        df.groupby("transmission")["price"]
        .agg(mean="mean", median="median", count="count")
        .reset_index()
        .to_dict(orient="records")
    )

    # Age distribution
    age_dist = (
        df["vehicle_age"]
        .value_counts()
        .sort_index()
        .reset_index()
        .rename(columns={"vehicle_age": "age_years", "count": "count"})
        .to_dict(orient="records")
    )

    # Price segment distribution
    seg_dist = (
        df["price_segment"]
        .value_counts()
        .reset_index()
        .rename(columns={"price_segment": "segment", "count": "count"})
        .to_dict(orient="records")
    )

    # Price vs mileage correlation (sampled for performance)
    sample = df.sample(min(500, len(df)), random_state=42)
    price_vs_mileage = sample[["mileage", "price", "make", "body_type"]].dropna().to_dict(orient="records")

    # Price vs age correlation
    price_vs_age = (
        df.groupby("vehicle_age")["price"]
        .agg(mean="mean", median="median", count="count")
        .reset_index()
        .to_dict(orient="records")
    )

    return {
        "total_listings":   int(len(df)),
        "avg_price":        round(float(df["price"].mean()), 2),
        "median_price":     round(float(df["price"].median()), 2),
        "avg_mileage":      round(float(df["mileage"].mean()), 0),
        "median_mileage":   round(float(df["mileage"].median()), 0),
        "avg_vehicle_age":  round(float(df["vehicle_age"].mean()), 1),
        "brands_available": int(df["make"].nunique()),
        "models_available": int(df["model"].nunique()),
        "cities_covered":   int(df["city"].nunique()),
        "brand_distribution":  _serialize(brand_counts),
        "model_distribution":  _serialize(model_counts),
        "fuel_type_stats":     _serialize(fuel_stats),
        "body_type_stats":     _serialize(body_stats),
        "transmission_stats":  _serialize(trans_stats),
        "age_distribution":    _serialize(age_dist),
        "segment_distribution": _serialize(seg_dist),
        "price_vs_mileage":    _serialize(price_vs_mileage),
        "price_vs_age":        _serialize(price_vs_age),
    }


# ─────────────────────────────────────────────────────────────────────────
#  3. Demand Analysis
# ─────────────────────────────────────────────────────────────────────────

def demand_analysis(
    city_filter: str | None = None,
    fuel_filter: str | None = None,
    body_filter: str | None = None,
) -> dict[str, Any]:
    """Demand score analysis (Requirement #4)."""
    df = get_dataframe()

    if city_filter:
        df = df[df["city"].str.lower() == city_filter.lower()]
    if fuel_filter:
        df = df[df["fuel_type"].str.lower() == fuel_filter.lower()]
    if body_filter:
        df = df[df["body_type"].str.lower() == body_filter.lower()]

    # Recompute demand within filtered scope
    df = compute_demand_scores(df)

    # Top demand vehicles
    top_demand = (
        df.groupby(["make", "model"])
        .agg(
            listings=("price", "count"),
            avg_price=("price", "mean"),
            median_price=("price", "median"),
            demand_score=("demand_score", "mean"),
            avg_mileage=("mileage", "mean"),
            avg_age=("vehicle_age", "mean"),
        )
        .reset_index()
        .sort_values("demand_score", ascending=False)
        .head(30)
        .to_dict(orient="records")
    )

    # Demand by city
    demand_by_city = (
        df.groupby("city")
        .agg(listings=("price", "count"), avg_demand_score=("demand_score", "mean"))
        .reset_index()
        .sort_values("listings", ascending=False)
        .to_dict(orient="records")
    )

    # Demand by fuel
    demand_by_fuel = (
        df.groupby("fuel_type")
        .agg(listings=("price", "count"), avg_demand_score=("demand_score", "mean"))
        .reset_index()
        .sort_values("listings", ascending=False)
        .to_dict(orient="records")
    )

    # Demand by body type
    demand_by_body = (
        df.groupby("body_type")
        .agg(listings=("price", "count"), avg_demand_score=("demand_score", "mean"))
        .reset_index()
        .sort_values("listings", ascending=False)
        .to_dict(orient="records")
    )

    # Demand classification breakdown
    df["demand_class"] = df["demand_score"].apply(
        lambda s: "High" if s >= 70 else ("Medium" if s >= 40 else "Low")
    )
    demand_class_counts = df["demand_class"].value_counts().to_dict()

    return {
        "note": "Demand score is a listing-frequency proxy (0–100), not actual consumer sales data.",
        "total_analyzed": int(len(df)),
        "high_demand_count":   int(demand_class_counts.get("High", 0)),
        "medium_demand_count": int(demand_class_counts.get("Medium", 0)),
        "low_demand_count":    int(demand_class_counts.get("Low", 0)),
        "top_demand_vehicles": _serialize(top_demand),
        "demand_by_city":      _serialize(demand_by_city),
        "demand_by_fuel":      _serialize(demand_by_fuel),
        "demand_by_body_type": _serialize(demand_by_body),
    }


# ─────────────────────────────────────────────────────────────────────────
#  4. Geographic Analysis
# ─────────────────────────────────────────────────────────────────────────

def geographic_analysis(
    transport_cost: float = 5_000,
    reconditioning_cost: float = 20_000,
    platform_fee_pct: float = 2.0,
) -> dict[str, Any]:
    """Geographic market analysis and arbitrage opportunities (Requirement #11)."""
    df = get_dataframe()

    city_stats = (
        df.groupby("city")["price"]
        .agg(
            listings="count",
            avg_price="mean",
            median_price="median",
            min_price="min",
            max_price="max",
            std_price="std",
        )
        .reset_index()
        .sort_values("avg_price", ascending=False)
    )

    cities_list = city_stats.to_dict(orient="records")

    # Arbitrage: cheapest buying city → most expensive selling city per model
    model_city = (
        df.groupby(["make", "model", "city"])["price"]
        .agg(avg_price="mean", count="count")
        .reset_index()
    )

    arbitrage = []
    for (make, model), grp in model_city.groupby(["make", "model"]):
        if len(grp) < 2 or grp["count"].sum() < 5:
            continue
        buy_row  = grp.loc[grp["avg_price"].idxmin()]
        sell_row = grp.loc[grp["avg_price"].idxmax()]

        buy_price   = float(buy_row["avg_price"])
        sell_price  = float(sell_row["avg_price"])
        platform_fee = sell_price * platform_fee_pct / 100
        net_profit  = sell_price - buy_price - transport_cost - reconditioning_cost - platform_fee
        roi_pct     = net_profit / max(buy_price + transport_cost + reconditioning_cost, 1) * 100

        if net_profit > 0:
            arbitrage.append({
                "make":             make,
                "model":            model,
                "buy_city":         str(buy_row["city"]),
                "sell_city":        str(sell_row["city"]),
                "buy_avg_price":    round(buy_price, 0),
                "sell_avg_price":   round(sell_price, 0),
                "price_gap":        round(sell_price - buy_price, 0),
                "transport_cost":   round(transport_cost, 0),
                "reconditioning_cost": round(reconditioning_cost, 0),
                "platform_fee":     round(platform_fee, 0),
                "estimated_profit": round(net_profit, 0),
                "estimated_roi_pct": round(roi_pct, 1),
            })

    arbitrage.sort(key=lambda x: x["estimated_profit"], reverse=True)

    # Popular models by city (top 5 per city)
    popular_by_city: dict[str, list] = {}
    for city, grp in df.groupby("city"):
        top = grp["model"].value_counts().head(5).reset_index()
        popular_by_city[city] = top.rename(columns={"model": "model", "count": "count"}).to_dict(orient="records")

    return {
        "city_statistics":   _serialize(cities_list),
        "arbitrage_opportunities": _serialize(arbitrage[:30]),
        "popular_models_by_city":  popular_by_city,
        "assumptions": {
            "transport_cost":       transport_cost,
            "reconditioning_cost":  reconditioning_cost,
            "platform_fee_pct":     platform_fee_pct,
            "note": "Arbitrage profit = sell_price − buy_price − transport − reconditioning − platform_fee. These are estimates, not guarantees.",
        },
    }


# ─────────────────────────────────────────────────────────────────────────
#  5. Vehicle Segmentation
# ─────────────────────────────────────────────────────────────────────────

def segment_vehicles() -> dict[str, Any]:
    """Classify vehicles into market segments (Requirement #12)."""
    df = get_dataframe()
    df = df.copy()

    conditions = [
        # Economy: price < 4L
        (df["price"] < 400_000),
        # Mid-market: 4L–9L
        (df["price"].between(400_000, 900_000)),
        # Premium: > 9L
        (df["price"] > 900_000),
    ]
    labels = ["Economy", "Mid-Market", "Premium"]
    df["market_segment"] = np.select(conditions, labels, default="Mid-Market")

    # High-demand: demand_score >= 70
    df.loc[df["demand_score"] >= 70, "market_segment"] = "High-Demand"

    # High-margin: opportunity_score >= 70
    df.loc[df["opportunity_score"] >= 70, "market_segment"] = "High-Margin"

    # High-risk: risk_score >= 65
    df.loc[df["risk_score"] >= 65, "market_segment"] = "High-Risk"

    seg_summary = (
        df.groupby("market_segment")
        .agg(
            count=("price", "count"),
            avg_price=("price", "mean"),
            median_price=("price", "median"),
            avg_mileage=("mileage", "mean"),
            avg_age=("vehicle_age", "mean"),
            avg_demand_score=("demand_score", "mean"),
            avg_opportunity_score=("opportunity_score", "mean"),
            avg_risk_score=("risk_score", "mean"),
        )
        .reset_index()
        .to_dict(orient="records")
    )

    # Top 5 vehicles per segment
    top_per_segment: dict[str, list] = {}
    for seg, grp in df.groupby("market_segment"):
        top = (
            grp.sort_values("opportunity_score", ascending=False)
            .head(5)[["make", "model", "variant", "city", "price", "mileage",
                       "vehicle_age", "demand_score", "opportunity_score", "risk_score"]]
            .to_dict(orient="records")
        )
        top_per_segment[seg] = _serialize(top)

    return {
        "segment_summary":    _serialize(seg_summary),
        "top_per_segment":    top_per_segment,
    }


# ─────────────────────────────────────────────────────────────────────────
#  6. Opportunity Scoring
# ─────────────────────────────────────────────────────────────────────────

def get_opportunity_vehicles(
    min_opportunity: float = 0,
    min_demand: float = 0,
    max_risk: float = 100,
    city: str | None = None,
    make: str | None = None,
    fuel_type: str | None = None,
    body_type: str | None = None,
    max_price: float | None = None,
    min_price: float | None = None,
    max_age: int | None = None,
    max_mileage: int | None = None,
    transmission: str | None = None,
    limit: int = 50,
) -> dict[str, Any]:
    """Return vehicles ranked by opportunity score with filters (Requirement #6)."""
    df = get_dataframe().copy()

    if city:        df = df[df["city"].str.lower() == city.lower()]
    if make:        df = df[df["make"].str.lower() == make.lower()]
    if fuel_type:   df = df[df["fuel_type"].str.lower() == fuel_type.lower()]
    if body_type:   df = df[df["body_type"].str.lower() == body_type.lower()]
    if transmission: df = df[df["transmission"].str.lower() == transmission.lower()]
    if max_price is not None:  df = df[df["price"] <= max_price]
    if min_price is not None:  df = df[df["price"] >= min_price]
    if max_age is not None:    df = df[df["vehicle_age"] <= max_age]
    if max_mileage is not None: df = df[df["mileage"] <= max_mileage]

    df = df[
        (df["opportunity_score"] >= min_opportunity) &
        (df["demand_score"]      >= min_demand) &
        (df["risk_score"]        <= max_risk)
    ]

    df = df.sort_values("opportunity_score", ascending=False)

    cols = [
        "make", "model", "variant", "city", "make_year", "vehicle_age",
        "mileage", "fuel_type", "body_type", "transmission", "no_of_owners",
        "price", "price_segment", "demand_score", "opportunity_score",
        "risk_score", "margin_score",
    ]
    existing_cols = [c for c in cols if c in df.columns]
    result = df[existing_cols].head(limit).to_dict(orient="records")

    return {
        "total_matching": int(len(df)),
        "vehicles": _serialize(result),
    }


# ─────────────────────────────────────────────────────────────────────────
#  7. Acquisition Strategy Engine
# ─────────────────────────────────────────────────────────────────────────

def acquisition_strategy(
    available_capital: float,
    max_vehicles: int = 10,
    target_roi_pct: float = 15.0,
    target_margin_pct: float = 10.0,
    city: str | None = None,
    max_age: int = 10,
    max_mileage: int = 100_000,
    fuel_type: str | None = None,
    transmission: str | None = None,
    risk_tolerance: str = "medium",  # low / medium / high
    negotiation_buffer_pct: float = 8.0,
    reconditioning_cost: float = 20_000,
    transport_cost: float = 5_000,
    platform_fee_pct: float = 2.0,
) -> dict[str, Any]:
    """'What Should I Buy?' engine (Requirement #7)."""
    df = get_dataframe().copy()

    # Apply hard filters
    df = df[df["vehicle_age"] <= max_age]
    df = df[df["mileage"] <= max_mileage]
    if city:        df = df[df["city"].str.lower() == city.lower()]
    if fuel_type:   df = df[df["fuel_type"].str.lower() == fuel_type.lower()]
    if transmission: df = df[df["transmission"].str.lower() == transmission.lower()]

    # Risk tolerance filter
    risk_limits = {"low": 35, "medium": 60, "high": 85}
    max_risk = risk_limits.get(risk_tolerance.lower(), 60)
    df = df[df["risk_score"] <= max_risk]

    if df.empty:
        return {"recommendations": [], "summary": {"error": "No vehicles match constraints"}}

    # Estimate acquisition price (listing price × (1 − negotiation_buffer))
    df["acquisition_price"] = (df["price"] * (1 - negotiation_buffer_pct / 100)).round(0)

    # Only consider vehicles we can afford
    df = df[df["acquisition_price"] <= available_capital]

    # Estimate resale price (model_median × 1.05 for fresher stock)
    model_median = df.groupby(["make", "model"])["price"].transform("median")
    df["estimated_resale_price"] = (model_median * 1.05).round(0)

    # Financial metrics
    platform_fee = df["estimated_resale_price"] * platform_fee_pct / 100
    df["total_cost"] = df["acquisition_price"] + reconditioning_cost + transport_cost
    df["estimated_gross_profit"] = df["estimated_resale_price"] - df["total_cost"] - platform_fee
    df["estimated_roi_pct"] = (df["estimated_gross_profit"] / df["total_cost"] * 100).round(1)
    df["estimated_margin_pct"] = (
        df["estimated_gross_profit"] / df["estimated_resale_price"] * 100
    ).round(1)

    # Filter by ROI and margin targets
    df = df[df["estimated_roi_pct"] >= target_roi_pct]
    df = df[df["estimated_margin_pct"] >= target_margin_pct]

    if df.empty:
        return {"recommendations": [], "summary": {"error": "No vehicles meet ROI/margin targets"}}

    # Add recommendation label
    df["recommendation"] = df.apply(
        lambda r: get_recommendation(r["opportunity_score"], r["demand_score"], r["risk_score"]),
        axis=1,
    )
    df = df[df["recommendation"] == "BUY"]

    if df.empty:
        return {"recommendations": [], "summary": {"error": "No BUY-rated vehicles meet all criteria"}}

    df = df.sort_values("opportunity_score", ascending=False)

    # Greedy capital allocation (highest opportunity first)
    selected = []
    remaining_capital = available_capital
    for _, row in df.iterrows():
        if len(selected) >= max_vehicles:
            break
        if row["acquisition_price"] <= remaining_capital:
            selected.append(row)
            remaining_capital -= row["acquisition_price"]

    if not selected:
        return {"recommendations": [], "summary": {"error": "Insufficient capital for any qualifying vehicle"}}

    selected_df = pd.DataFrame(selected)
    cols = [
        "make", "model", "variant", "city", "make_year", "fuel_type",
        "body_type", "transmission", "no_of_owners", "mileage", "vehicle_age",
        "acquisition_price", "estimated_resale_price", "estimated_gross_profit",
        "estimated_roi_pct", "estimated_margin_pct", "demand_score",
        "opportunity_score", "risk_score", "recommendation",
    ]
    existing = [c for c in cols if c in selected_df.columns]

    total_invested    = float(selected_df["acquisition_price"].sum())
    total_expected_revenue = float(selected_df["estimated_resale_price"].sum())
    total_profit      = float(selected_df["estimated_gross_profit"].sum())
    portfolio_roi     = total_profit / max(total_invested, 1) * 100

    return {
        "recommendations": _serialize(selected_df[existing].to_dict(orient="records")),
        "summary": {
            "vehicles_selected":         len(selected),
            "capital_available":         available_capital,
            "capital_deployed":          round(total_invested, 0),
            "capital_remaining":         round(available_capital - total_invested, 0),
            "estimated_total_revenue":   round(total_expected_revenue, 0),
            "estimated_total_profit":    round(total_profit, 0),
            "estimated_portfolio_roi_pct": round(portfolio_roi, 1),
            "capital_utilization_pct":   round(total_invested / available_capital * 100, 1),
        },
        "assumptions": {
            "negotiation_buffer_pct": negotiation_buffer_pct,
            "reconditioning_cost":    reconditioning_cost,
            "transport_cost":         transport_cost,
            "platform_fee_pct":       platform_fee_pct,
            "note": "Acquisition price = listing_price × (1 − negotiation_buffer). Resale price = model median × 1.05. All figures are simulated estimates.",
        },
    }


# ─────────────────────────────────────────────────────────────────────────
#  8. Inventory Allocation Simulator
# ─────────────────────────────────────────────────────────────────────────

def inventory_allocation(
    available_capital: float,
    high_demand_pct: float  = 40.0,
    mid_market_pct: float   = 30.0,
    high_margin_pct: float  = 20.0,
    high_risk_pct: float    = 10.0,
    reconditioning_cost: float = 20_000,
) -> dict[str, Any]:
    """Portfolio allocation simulator (Requirement #8)."""
    df = get_dataframe().copy()
    df["acquisition_price"] = (df["price"] * 0.92).round(0)  # 8% negotiation assumed

    buckets = {
        "High-Demand":  df[df["demand_score"]      >= 70].sort_values("demand_score", ascending=False),
        "Mid-Market":   df[df["price_segment"]      == "Mid"].sort_values("opportunity_score", ascending=False),
        "High-Margin":  df[df["opportunity_score"]  >= 70].sort_values("opportunity_score", ascending=False),
        "High-Risk":    df[df["risk_score"]          >= 65].sort_values("opportunity_score", ascending=False),
    }
    alloc_pcts = {
        "High-Demand":  high_demand_pct / 100,
        "Mid-Market":   mid_market_pct  / 100,
        "High-Margin":  high_margin_pct / 100,
        "High-Risk":    high_risk_pct   / 100,
    }

    portfolio: list[dict] = []
    totals = {"capital_deployed": 0.0, "expected_revenue": 0.0, "expected_profit": 0.0, "vehicles": 0}

    allocation_detail: list[dict] = []
    for bucket_name, bucket_df in buckets.items():
        alloc_capital = available_capital * alloc_pcts[bucket_name]
        remaining     = alloc_capital
        bucket_selected = []
        for _, row in bucket_df.iterrows():
            acq = row["acquisition_price"] + reconditioning_cost
            if acq <= remaining:
                bucket_selected.append(row)
                remaining -= acq
        if not bucket_selected:
            continue
        bdf = pd.DataFrame(bucket_selected)
        total_acq = float(bdf["acquisition_price"].sum()) + len(bucket_selected) * reconditioning_cost
        total_rev = float(bdf["price"].sum() * 1.05)
        total_profit = total_rev - total_acq

        allocation_detail.append({
            "bucket":            bucket_name,
            "allocation_pct":    alloc_pcts[bucket_name] * 100,
            "capital_allocated": round(alloc_capital, 0),
            "vehicles_selected": len(bucket_selected),
            "capital_deployed":  round(total_acq, 0),
            "expected_revenue":  round(total_rev, 0),
            "expected_profit":   round(total_profit, 0),
            "roi_pct":           round(total_profit / max(total_acq, 1) * 100, 1),
        })
        totals["capital_deployed"] += total_acq
        totals["expected_revenue"] += total_rev
        totals["expected_profit"]  += total_profit
        totals["vehicles"]         += len(bucket_selected)

    portfolio_roi = totals["expected_profit"] / max(totals["capital_deployed"], 1) * 100

    return {
        "allocation_detail": _serialize(allocation_detail),
        "portfolio_summary": {
            "total_vehicles":         totals["vehicles"],
            "capital_available":      available_capital,
            "capital_deployed":       round(totals["capital_deployed"], 0),
            "capital_remaining":      round(available_capital - totals["capital_deployed"], 0),
            "expected_total_revenue": round(totals["expected_revenue"], 0),
            "expected_total_profit":  round(totals["expected_profit"], 0),
            "portfolio_roi_pct":      round(portfolio_roi, 1),
            "capital_utilization_pct": round(totals["capital_deployed"] / available_capital * 100, 1),
        },
    }


# ─────────────────────────────────────────────────────────────────────────
#  9. Pricing Strategy
# ─────────────────────────────────────────────────────────────────────────

def pricing_strategy(
    make: str,
    model: str,
    make_year: int,
    mileage: int,
    city: str,
    no_of_owners: int,
    fuel_type: str,
    transmission: str,
    body_type: str,
    acquisition_price: float,
) -> dict[str, Any]:
    """'How Should I Price This Car?' (Requirement #10)."""
    df = get_dataframe()

    # Filter similar vehicles
    similar = df[
        (df["make"].str.lower()  == make.lower()) &
        (df["model"].str.lower() == model.lower()) &
        (df["make_year"].between(make_year - 1, make_year + 1)) &
        (df["fuel_type"].str.lower() == fuel_type.lower())
    ]

    if similar.empty:
        similar = df[
            (df["make"].str.lower()  == make.lower()) &
            (df["model"].str.lower() == model.lower())
        ]

    if similar.empty:
        return {"error": f"No comparable vehicles found for {make} {model}"}

    market_median = float(similar["price"].median())
    market_mean   = float(similar["price"].mean())
    market_min    = float(similar["price"].min())
    market_max    = float(similar["price"].max())
    similar_count = int(len(similar))

    # Mileage adjustment
    avg_mileage = float(similar["mileage"].median())
    mileage_factor = 1.0 - (mileage - avg_mileage) / max(avg_mileage, 1) * 0.15
    mileage_factor = max(0.75, min(1.15, mileage_factor))

    # Ownership adjustment
    owner_factor = {1: 1.0, 2: 0.93, 3: 0.85}.get(no_of_owners, 0.85)

    estimated_market_price = round(market_median * mileage_factor * owner_factor, 0)
    recommended_listing    = round(estimated_market_price * 1.05, 0)  # 5% buffer for negotiation
    minimum_target         = round(acquisition_price * 1.10, 0)       # 10% min margin

    # Ensure listing >= minimum target
    recommended_listing = max(recommended_listing, minimum_target)

    gross_margin   = recommended_listing - acquisition_price
    gross_margin_pct = gross_margin / max(recommended_listing, 1) * 100
    roi_pct        = gross_margin / max(acquisition_price, 1) * 100

    # Price position vs market
    if recommended_listing < market_median * 0.95:
        price_position = "Below Market"
    elif recommended_listing > market_median * 1.05:
        price_position = "Above Market"
    else:
        price_position = "At Market"

    # City adjustment
    city_df = similar[similar["city"].str.lower() == city.lower()]
    city_median = float(city_df["price"].median()) if not city_df.empty else market_median

    return {
        "make":           make,
        "model":          model,
        "make_year":      make_year,
        "city":           city,
        "similar_listings": similar_count,
        "market_median_price":  round(market_median, 0),
        "city_median_price":    round(city_median, 0),
        "estimated_market_price": estimated_market_price,
        "recommended_listing_price": recommended_listing,
        "minimum_target_price": minimum_target,
        "acquisition_price":    acquisition_price,
        "estimated_gross_profit": round(gross_margin, 0),
        "estimated_gross_margin_pct": round(gross_margin_pct, 1),
        "estimated_roi_pct":    round(roi_pct, 1),
        "price_position_vs_market": price_position,
        "market_range": {"min": market_min, "max": market_max, "mean": round(market_mean, 0)},
        "adjustments": {
            "mileage_factor": round(mileage_factor, 3),
            "ownership_factor": owner_factor,
        },
        "flow": {
            "acquisition_price":     acquisition_price,
            "recommended_listing":   recommended_listing,
            "estimated_resale_value": estimated_market_price,
            "estimated_profit":      round(gross_margin, 0),
        },
        "note": "Recommended listing price = market median × mileage_factor × owner_factor × 1.05. This is an estimate based on comparable listings.",
    }


# ─────────────────────────────────────────────────────────────────────────
#  10. Strategy Backtesting
# ─────────────────────────────────────────────────────────────────────────

def backtest_strategy(
    max_price: float,
    max_age: int,
    max_mileage: int,
    min_demand_score: float,
    min_opportunity_score: float,
    min_roi_pct: float,
    city: str | None = None,
    fuel_type: str | None = None,
    transmission: str | None = None,
    body_type: str | None = None,
    negotiation_buffer_pct: float = 8.0,
    reconditioning_cost: float = 20_000,
    transport_cost: float = 5_000,
    platform_fee_pct: float = 2.0,
) -> dict[str, Any]:
    """Strategy backtesting against historical data (Requirement #13)."""
    df = get_dataframe().copy()

    df["acquisition_price"]       = (df["price"] * (1 - negotiation_buffer_pct / 100)).round(0)
    model_median                  = df.groupby(["make", "model"])["price"].transform("median")
    df["estimated_resale_price"]  = (model_median * 1.05).round(0)
    platform_fee                  = df["estimated_resale_price"] * platform_fee_pct / 100
    df["total_cost"]              = df["acquisition_price"] + reconditioning_cost + transport_cost
    df["estimated_profit"]        = df["estimated_resale_price"] - df["total_cost"] - platform_fee
    df["estimated_roi_pct"]       = (df["estimated_profit"] / df["total_cost"].replace(0, 1) * 100).round(1)

    # Apply strategy filters
    original_count = len(df)
    df = df[df["price"]            <= max_price]
    df = df[df["vehicle_age"]      <= max_age]
    df = df[df["mileage"]          <= max_mileage]
    df = df[df["demand_score"]     >= min_demand_score]
    df = df[df["opportunity_score"] >= min_opportunity_score]
    df = df[df["estimated_roi_pct"] >= min_roi_pct]

    if city:        df = df[df["city"].str.lower()      == city.lower()]
    if fuel_type:   df = df[df["fuel_type"].str.lower() == fuel_type.lower()]
    if transmission: df = df[df["transmission"].str.lower() == transmission.lower()]
    if body_type:   df = df[df["body_type"].str.lower() == body_type.lower()]

    qualifying_count = len(df)

    if df.empty:
        return {
            "strategy_applied": True,
            "vehicles_qualifying": 0,
            "original_dataset_size": original_count,
            "results": None,
            "error": "No vehicles match this strategy in the historical data.",
        }

    # Summary metrics
    results = {
        "strategy_applied":       True,
        "vehicles_qualifying":    qualifying_count,
        "original_dataset_size":  original_count,
        "selection_rate_pct":     round(qualifying_count / original_count * 100, 1),
        "avg_acquisition_price":  round(float(df["acquisition_price"].mean()), 0),
        "avg_estimated_resale":   round(float(df["estimated_resale_price"].mean()), 0),
        "avg_estimated_profit":   round(float(df["estimated_profit"].mean()), 0),
        "avg_roi_pct":            round(float(df["estimated_roi_pct"].mean()), 1),
        "total_capital_required": round(float(df["acquisition_price"].sum()) + qualifying_count * reconditioning_cost, 0),
        "total_estimated_revenue": round(float(df["estimated_resale_price"].sum()), 0),
        "total_estimated_profit": round(float(df["estimated_profit"].sum()), 0),
        "avg_demand_score":       round(float(df["demand_score"].mean()), 1),
        "avg_opportunity_score":  round(float(df["opportunity_score"].mean()), 1),
        "avg_risk_score":         round(float(df["risk_score"].mean()), 1),
        "concentration": {
            "top_makes":      df["make"].value_counts().head(5).to_dict(),
            "top_cities":     df["city"].value_counts().head(5).to_dict(),
            "top_body_types": df["body_type"].value_counts().head(5).to_dict(),
            "fuel_split":     df["fuel_type"].value_counts().to_dict(),
        },
        "sample_vehicles": _serialize(
            df.sort_values("opportunity_score", ascending=False)
            .head(10)[["make", "model", "city", "make_year", "mileage",
                       "acquisition_price", "estimated_resale_price",
                       "estimated_profit", "estimated_roi_pct",
                       "demand_score", "opportunity_score", "risk_score"]]
            .to_dict(orient="records")
        ),
        "assumptions": {
            "negotiation_buffer_pct": negotiation_buffer_pct,
            "reconditioning_cost":    reconditioning_cost,
            "transport_cost":         transport_cost,
            "platform_fee_pct":       platform_fee_pct,
        },
    }
    return results


# ─────────────────────────────────────────────────────────────────────────
#  11. What-If Simulator
# ─────────────────────────────────────────────────────────────────────────

def whatif_simulation(
    scenario: str,
    base_capital: float,
    perturbation_pct: float,
    fuel_shift_from: str | None = None,
    fuel_shift_to: str | None   = None,
    max_age: int | None = None,
    target_margin_pct: float = 10.0,
) -> dict[str, Any]:
    """
    What-If scenario simulation (Requirement #14).

    Scenarios:
      demand_increase   — boost demand scores of a segment by pct
      price_increase    — acquisition prices rise by pct
      capital_reduction — available capital reduced by pct
      fuel_shift        — demand shifts between fuel types
      age_restriction   — only vehicles newer than max_age
      margin_target     — raise minimum margin requirement
    """
    df = get_dataframe().copy()
    df["acquisition_price"]      = (df["price"] * 0.92).round(0)
    model_median                 = df.groupby(["make", "model"])["price"].transform("median")
    df["estimated_resale_price"] = (model_median * 1.05).round(0)
    df["estimated_profit"]       = df["estimated_resale_price"] - df["acquisition_price"] - 25_000
    df["estimated_roi_pct"]      = (df["estimated_profit"] / df["acquisition_price"].replace(0, 1) * 100).round(1)

    def _portfolio_stats(d: pd.DataFrame, capital: float) -> dict:
        affordable = d[d["acquisition_price"] <= capital / max(len(d), 1) * 5]
        if affordable.empty:
            affordable = d.head(20)
        total_inv = float(affordable["acquisition_price"].sum())
        total_rev = float(affordable["estimated_resale_price"].sum())
        total_pft = float(affordable["estimated_profit"].sum())
        return {
            "vehicle_count":        int(len(affordable)),
            "capital_deployed":     round(total_inv, 0),
            "expected_revenue":     round(total_rev, 0),
            "expected_profit":      round(total_pft, 0),
            "roi_pct":              round(total_pft / max(total_inv, 1) * 100, 1),
            "avg_demand_score":     round(float(d["demand_score"].mean()), 1),
            "avg_risk_score":       round(float(d["risk_score"].mean()), 1),
            "capital_utilization":  round(min(total_inv / capital * 100, 100), 1),
        }

    baseline = _portfolio_stats(df, base_capital)

    # Apply scenario
    df_mod = df.copy()
    modified_capital = base_capital
    scenario_description = ""

    if scenario == "demand_increase":
        df_mod["demand_score"] = (df_mod["demand_score"] * (1 + perturbation_pct / 100)).clip(0, 100)
        scenario_description = f"Demand scores increased by {perturbation_pct}%"

    elif scenario == "price_increase":
        df_mod["acquisition_price"] = (df_mod["acquisition_price"] * (1 + perturbation_pct / 100)).round(0)
        df_mod["estimated_profit"]  = df_mod["estimated_resale_price"] - df_mod["acquisition_price"] - 25_000
        df_mod["estimated_roi_pct"] = (df_mod["estimated_profit"] / df_mod["acquisition_price"].replace(0, 1) * 100).round(1)
        scenario_description = f"Acquisition prices increased by {perturbation_pct}%"

    elif scenario == "capital_reduction":
        modified_capital = base_capital * (1 - perturbation_pct / 100)
        scenario_description = f"Available capital reduced by {perturbation_pct}% to ₹{modified_capital:,.0f}"

    elif scenario == "fuel_shift" and fuel_shift_from and fuel_shift_to:
        mask = df_mod["fuel_type"].str.lower() == fuel_shift_from.lower()
        df_mod.loc[mask, "demand_score"] = (df_mod.loc[mask, "demand_score"] * (1 - perturbation_pct / 100)).clip(0, 100)
        mask2 = df_mod["fuel_type"].str.lower() == fuel_shift_to.lower()
        df_mod.loc[mask2, "demand_score"] = (df_mod.loc[mask2, "demand_score"] * (1 + perturbation_pct / 100)).clip(0, 100)
        scenario_description = f"Demand shifts {perturbation_pct}% from {fuel_shift_from} to {fuel_shift_to}"

    elif scenario == "age_restriction" and max_age is not None:
        df_mod = df_mod[df_mod["vehicle_age"] <= max_age]
        scenario_description = f"Only vehicles newer than {max_age} years considered"

    elif scenario == "margin_target":
        min_margin = target_margin_pct
        df_mod["margin_ok"] = df_mod["estimated_profit"] / df_mod["estimated_resale_price"].replace(0, 1) * 100 >= min_margin
        df_mod = df_mod[df_mod["margin_ok"]]
        scenario_description = f"Minimum margin target raised to {target_margin_pct}%"

    modified = _portfolio_stats(df_mod, modified_capital)

    def _delta(base_val, mod_val):
        if base_val == 0:
            return 0.0
        return round((mod_val - base_val) / abs(base_val) * 100, 1)

    return {
        "scenario":             scenario,
        "description":          scenario_description,
        "perturbation_pct":     perturbation_pct,
        "baseline":             baseline,
        "modified":             modified,
        "impact": {
            "vehicle_count_change_pct":    _delta(baseline["vehicle_count"],    modified["vehicle_count"]),
            "revenue_change_pct":          _delta(baseline["expected_revenue"],  modified["expected_revenue"]),
            "profit_change_pct":           _delta(baseline["expected_profit"],   modified["expected_profit"]),
            "roi_change_pct":              _delta(baseline["roi_pct"],           modified["roi_pct"]),
            "capital_utilization_change":  _delta(baseline["capital_utilization"], modified["capital_utilization"]),
            "demand_exposure_change_pct":  _delta(baseline["avg_demand_score"],  modified["avg_demand_score"]),
        },
    }


# ─────────────────────────────────────────────────────────────────────────
#  Helper
# ─────────────────────────────────────────────────────────────────────────

def _serialize(obj: Any) -> Any:
    """Recursively convert numpy/pandas types to Python native."""
    if isinstance(obj, list):
        return [_serialize(i) for i in obj]
    if isinstance(obj, dict):
        return {k: _serialize(v) for k, v in obj.items()}
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return None if np.isnan(obj) else float(obj)
    if isinstance(obj, float):
        return None if np.isnan(obj) else obj
    if isinstance(obj, pd.Timestamp):
        return str(obj)
    return obj
