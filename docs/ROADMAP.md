# Roadmap

The synopsis describes 15 modules. Building all of them at once produces something
broad, shallow, and hard to debug. Instead we build in phases — each phase ends with
a working, demoable slice of the product, and later phases only start once the
current phase's checklist and "definition of done" are met.

**Rule: don't start a phase's modules until the previous phase is checked off.**

---

## Phase 0 — Scaffolding
- [ ] Monorepo structure created: `/frontend`, `/backend`, `/ml-service`, `/docs`
- [ ] Backend: Express server boots, `GET /health` returns `{ status: "ok" }`
- [ ] Frontend: React app boots, blank dashboard shell renders
- [ ] PostgreSQL connected from the backend; migration approach chosen (see `docs/TODO.md`
      "Blocked / Needs a decision")
- [ ] `.env.example` in place for backend (and frontend/ml-service once they need one)
- [ ] Phase 1 tables created (see `docs/DATABASE.md`): `users`, `businesses`,
      `market_configs`, `simulations`, `simulation_results`

**Definition of done:** both servers run locally, hit the DB successfully, and the
health check passes.

---

## Phase 1 — MVP Core *(current phase)*
**Goal:** a user can register, create a business, configure a market, run a basic
deterministic simulation, and see results on a dashboard.

Modules in scope (numbers refer to the synopsis / `ARCHITECTURE.md` mapping):
- [ ] Module 1 — Auth: register, login, JWT, profile
- [ ] Module 2 — Business Creation: company info, financials, inventory, marketing basics
- [ ] Module 3 — Market Configuration: full field set from the synopsis
- [ ] Module 6 (basic slice) — Simulation Engine: deterministic, period-by-period
      revenue/profit/demand/inventory updates. No ML, no agents, no random events yet.
- [ ] Module 12 (basic slice) — Dashboard: revenue, profit, demand, inventory KPIs +
      revenue trend and profit trend charts
- [ ] Simulation runs and results persisted and retrievable (simulation history list)

**Definition of done:** the full loop — login → create business → configure market →
run simulation → view dashboard — works end-to-end against real PostgreSQL data, with no
mocked or hardcoded responses anywhere in the path.

---

## Phase 2 — Intelligence Layer
**Goal:** agents behave individually instead of as aggregate formulas, and machine
learning starts producing at least one real forecast.

- [ ] Module 4 — Customer Simulation: individual agent attributes (income, budget,
      preferred brand, buying frequency, brand loyalty, price sensitivity, quality
      preference, satisfaction level)
- [ ] Module 5 — Competitor Simulation: attributes + strategies (premium pricing,
      aggressive discounts, heavy advertising, low cost, high quality, innovation)
- [ ] Module 6 (full) — random events, competitor decisions feeding back into demand
- [ ] Module 7 (first slice) — ML Service stood up as a FastAPI app; Linear Regression
      and Random Forest models for demand forecasting and sales forecasting
- [ ] Module 8 — Strategy Testing: run 2+ strategies against the same market config
      and compare outcomes side by side

**Definition of done:** two different strategies run against the same market config
produce genuinely different outcomes (not just noise), and the dashboard displays at
least one ML-backed forecast alongside the deterministic results.

---

## Phase 3 — Advanced Analysis
- [ ] Module 9 — What-If Scenario Analysis: competitor price reduction, festival
      season, inflation, raw material cost increase, recession, demand surge, tax
      changes, supply chain disruption
- [ ] Module 10 — Risk Analysis: business, pricing, inventory, demand, competitive,
      and profit risk scores
- [ ] Module 11 — Recommendation Engine: start rule-based (e.g. "profit margin below
      X and price sensitivity high → recommend a price cut"), layer in ML-assisted
      suggestions once there's enough simulation history to learn from
- [ ] Module 7 (extend) — add XGBoost; extend predictions to churn, satisfaction,
      and market trend
- [ ] Module 12 (full) — remaining KPIs and charts: market share, ROI, growth rate,
      competitor comparison, risk visualization

**Definition of done:** a user can run a what-if scenario, see a risk breakdown, and
receive at least one concrete recommendation grounded in that simulation's numbers.

---

## Phase 4 — Polish & Extras
- [ ] Module 13 — Reports export: PDF and Excel
- [ ] Module 15 — Admin module: view users, manage datasets/simulations, monitor
      usage, delete invalid data
- [ ] Hardening: auth edge cases, input validation, loading/error states throughout
      the frontend
- [ ] Deployment: hosting choice for frontend/backend/ML service/DB, CI/CD, env
      configs per environment

**Definition of done:** the app is deployable, an admin can manage the platform, and
a user can export a simulation's results as a report.

---

## Explicitly out of scope (unless this changes later)
- Real payment or live trading integrations — this is a simulator, not a live system
- Multi-tenant / enterprise account structures
- Real-time multiplayer competition between different users' businesses
