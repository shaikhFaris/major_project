# Architecture Decisions

Short-form log — one entry per non-obvious choice, 2-3 sentences each. Not a full ADR
template; just enough so future-you (or the agent, in a fresh context) knows *why*
something is the way it is instead of re-litigating it.

## Separate Python ML service instead of doing ML in Node
Python's ecosystem (scikit-learn, XGBoost, Pandas) is far more mature for forecasting
work than anything available in Node. The backend stays Node/Express for CRUD and
orchestration; the ML service is a separate FastAPI app called internally over REST,
introduced in Phase 2.

## PostgreSQL over a document store
The data is fundamentally relational — users own businesses, businesses have market
configs and simulations, simulations have an ordered sequence of period results.
Joins and referential integrity matter more here than schema flexibility.

## Phased build, MVP-first
15 modules spanning simulation, ML, and analytics is too much to build in one pass
without something breaking silently. Phase 1 gets a real end-to-end loop working
(create business → configure market → run → view dashboard) with a deterministic
simulation engine before agents, ML, or advanced analytics are introduced. See
`ROADMAP.md`.

## Frontend design language (applied from design-taste skill)
The frontend was re-skinned per the `design-taste-frontend` skill (`.agents/skills/`),
keeping the Tailwind v4 stack: Geist Variable for UI, Geist Mono Variable for all
numerals, a zinc neutral palette with a single emerald accent, Phosphor icons (no
emoji/Lucide), self-hosted fonts via `@fontsource-variable`, and a shared UI kit in
`frontend/src/components/ui.tsx`. Dark-first was a deliberate read (cockpit-style
B2B tool, not a consumer site); the three chart series colors (emerald/amber/sky)
are the one documented exception to the single-accent rule, reserved for data viz.

## Car prediction module built in parallel, not as a replacement
The car-prediction feature (upload a company's car dataset, predict price/demand/
revenue/profit) was added as a sibling module — `/api/cars/*`, `car_datasets` +
`car_predictions` tables, and a `Car Prediction` page — rather than by rewriting the
existing business/market simulation. The two share only `users`, so the working
Phase 1 loop keeps running while the ML work matures. See `ROADMAP.md`.

## Minimal car dataset schema (7 required inputs)
The car schema was trimmed from ~19 columns to `make, year, price,
marketing_spend, discount_pct, competitor_price, region` (+ the targets). Spec
fields (engine, power, mileage, seats, odometer, body/fuel/transmission/segment/
condition) were dropped because no public dataset supplies them consistently and
no company realistically has them per sale — the seven that remain are the demand
levers a simulation actually varies, and anything missing is median-imputed.

## Pre-trained model artifacts instead of training on request
`ml-service/train.py` runs offline against a large vehicle-sales dataset and writes
joblib artifacts plus a metadata JSON; the FastAPI service only loads and serves them.
This keeps inference fast and stateless, and means a missing model is a clear 503
rather than a slow first request. The company's uploaded CSV is used as *input rows*
to predict on, or optionally to fine-tune via `POST /train`.

---

## Template for new entries
```
## Short decision title
What was decided, and the one or two sentence reason. Link to the relevant module
in ROADMAP.md if useful.
```
