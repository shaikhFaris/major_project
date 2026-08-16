# TODO — Active Tasks

> Update this file constantly. Check items off as you finish them, and mirror
> phase-defining items back to `ROADMAP.md`. When a section is fully done, delete it
> rather than letting completed clutter build up — `DECISIONS.md` is where the
> historical "why" lives, not this file.

## ✅ Phase 0 — Scaffolding (complete)

- [x] Initialize repo structure: `/frontend`, `/backend`, `/ml-service`, `/docs`
- [x] `backend`: npm init, installed Express, Drizzle, pg, JWT, bcrypt, cors
- [x] `frontend`: scaffolded with Vite + React + Tailwind + Chart.js
- [x] PostgreSQL connected; Drizzle migrations generated and applied
- [x] Backend: `GET /health` endpoint
- [x] Backend: `.env.example` and `.env`
- [x] Docker Compose for PostgreSQL container
- [x] Root Makefile and .gitignore

## ✅ Phase 1 — MVP Core (complete — needs testing)

- [x] Auth: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, JWT middleware
- [x] Business creation: CRUD endpoints + frontend form
- [x] Market configuration: CRUD endpoints + frontend form
- [x] Simulation engine v1 — deterministic period-by-period formulas
- [x] `POST /simulations`, `POST /simulations/:id/run`, `GET /simulations/:id/results`, `GET /simulations`
- [x] Dashboard: revenue/profit/demand KPI cards + revenue/profit trend charts + results table
- [x] Frontend: Login, Register, Business list/form, Market config form, Simulations list, Simulation results

## Currently blocked
- [ ] Run second Drizzle migration (schema changed — added `units_sold` and `cost` to `simulation_results`)
- [ ] `cd frontend && npm install` (install frontend dependencies)
- [ ] `cd frontend && npx tsc --noEmit` (verify TypeScript compiles)
- [ ] Test full loop end-to-end: register → create business → market config → run simulation → view dashboard

## Do not start yet (Phase 2+, out of scope for now)
- Individual customer/competitor agents
- ML service, forecasting models
- Strategy comparison, what-if analysis, risk scoring, recommendations
- Reports export, admin module
