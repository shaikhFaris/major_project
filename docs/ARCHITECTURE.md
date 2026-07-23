# Architecture

## High-level system
```
                        USER
                          |
                          v
              React Frontend Dashboard
                          |
        (REST, JSON, JWT-authenticated)
                          |
                          v
              Node.js / Express Backend
                 |             |
                 |             +------> PostgreSQL Database
                 |
                 +------> Python / FastAPI ML Service
                              (Phase 2+, internal REST call only)
```

The frontend never talks to the ML service or the database directly — everything
goes through the Node backend, which is the single orchestration point.

## Services

### Frontend (React)
Renders the dashboard, business/market configuration forms, and charts (Chart.js).
Talks only to the Node backend's REST API. No business logic lives here beyond
form validation and display formatting.

### Backend (Node / Express)
Owns:
- Authentication (JWT)
- CRUD for users, businesses, market configs, simulations
- The simulation engine (deterministic in Phase 1; agent-based customer/competitor
  logic added in Phase 2)
- Orchestration of calls to the ML service (Phase 2+) — the backend decides *when*
  to ask for a forecast, the ML service only computes it
- Persistence to PostgreSQL

### ML Service (Python / FastAPI) — introduced in Phase 2
Owns model training and inference: demand forecasting, sales forecasting, customer
churn, satisfaction prediction, market trend prediction. Stateless per request —
receives simulation history as input, returns predictions. Never called directly by
the frontend.

### Database (PostgreSQL)
Single relational store for all persistent state. See `DATABASE.md` for the schema,
which grows phase by phase rather than being fully defined up front.

## Module → service → phase mapping
Based on the 15 modules in the project synopsis:

| # | Module | Owned by | Phase |
|---|---|---|---|
| 1 | User Authentication | Backend | 1 |
| 2 | Business Creation | Backend + Frontend | 1 |
| 3 | Market Configuration | Backend + Frontend | 1 |
| 4 | Customer Simulation | Backend | 2 |
| 5 | Competitor Simulation | Backend | 2 |
| 6 | Market Simulation Engine | Backend (basic slice in 1, full in 2) | 1 & 2 |
| 7 | Machine Learning Module | ML Service | 2 (LR/RF) & 3 (XGBoost, more targets) |
| 8 | Strategy Testing | Backend | 2 |
| 9 | What-If Scenario Analysis | Backend | 3 |
| 10 | Risk Analysis | Backend | 3 |
| 11 | Recommendation Engine | Backend (rules first, ML-assisted later) | 3 |
| 12 | Dashboard | Frontend (basic slice in 1, full in 3) | 1 & 3 |
| 13 | Reports Export | Backend | 4 |
| 14 | Database | Postgres | all |
| 15 | Admin Module | Backend + Frontend | 4 |

## Request lifecycle example: "Run a simulation"
1. Frontend calls `POST /simulations/:id/run`.
2. Backend loads the business record and its market config.
3. The simulation engine steps through time periods, updating demand, sales,
   inventory, revenue, and profit (Phase 1: formula-based; Phase 2+: agent-based,
   with customer and competitor behavior feeding into each period).
4. (Phase 2+) The backend calls the ML service for forecasts and merges them into
   the period-by-period results.
5. Results are persisted to `simulation_results`, one row per period.
6. The frontend fetches `GET /simulations/:id/results` and renders the dashboard.

## Why this split
Node/Express is a good fit for CRUD, auth, and orchestration, and keeps the frontend
and backend in the same language. Python is kept isolated to the ML service because
scikit-learn, XGBoost, and Pandas are the right tools for the forecasting work, and
isolating them behind a REST boundary means the ML service can be developed, tested,
and even swapped out later without touching the rest of the system. See
`DECISIONS.md` for the fuller reasoning.
