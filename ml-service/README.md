# Car Prediction ML Service

FastAPI service that serves the pre-trained car prediction models. Called only by
the Node backend over internal REST — never by the frontend.

## Setup

```bash
cd ml-service
python -m venv .venv && source .venv/Scripts/activate   # Git Bash on Windows
pip install -r requirements.txt
```

## Get training data

Download the Kaggle "Vehicle Sales Data" dataset and save it as
`ml-service/data/vehicle_sales.csv`:

https://www.kaggle.com/datasets/syedanwarafridi/vehicle-sales-data

That dataset provides specs + `sellingprice` but no volume, so `train.py` derives
`units_sold`, `revenue`, and `profit` from a documented demand curve (see the
module docstring in `train.py`).

## Dataset format

Only seven input columns are required; anything missing is filled with the
medians learned at training time.

```csv
# prediction / simulation (targets omitted)
make,year,price,marketing_spend,discount_pct,competitor_price,region

# training / fine-tuning (add the target; revenue and profit are derived)
make,year,price,marketing_spend,discount_pct,competitor_price,region,units_sold
```

`price` may be omitted at prediction time — the price model fills it in and flags
`price_was_predicted`. Common column aliases are accepted (`sellingprice` →
`price`, `state`/`city` → `region`, `mmr` → `competitor_price`, `units` →
`units_sold`, `adspend` → `marketing_spend`). `month` is optional and only used
for seasonality when deriving targets.

## Train (once, offline)

```bash
python train.py --data data/vehicle_sales.csv --algorithm xgboost
```

Writes `models/{price,units_sold,revenue,profit}_model.joblib` and
`models/car_model.meta.json`.

## Run

```bash
python -m uvicorn main:app --reload --port 8000
```

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | liveness + model availability |
| GET | `/model/info` | metrics, feature importances, training metadata |
| POST | `/predict` | `{ "rows": [...] }` → price / units_sold / revenue / profit |
| POST | `/train` | retrain on a caller-supplied dataset and hot-reload |