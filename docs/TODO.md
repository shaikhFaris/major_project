# TODO — Active Tasks

> Update this file constantly. Check items off as you finish them, and mirror
> phase-defining items back to `ROADMAP.md`. When a section is fully done, delete it
> rather than letting completed clutter build up — `DECISIONS.md` is where the
> historical "why" lives, not this file.

## Current phase: Phase 0 → Phase 1 (see `ROADMAP.md`)

## Right now
- [ ] Initialize repo structure: `/frontend`, `/backend`, `/ml-service`, `/docs`
- [ ] `backend`: `npm init -y`, install `express`, `dotenv`, `pg` (or an ORM —
      see "Blocked" below), `jsonwebtoken`, `bcrypt`, `cors`
- [ ] `frontend`: scaffold with Vite + React, install Tailwind CSS and Chart.js
      (or `react-chartjs-2`)
- [ ] Set up PostgreSQL locally (or via Docker) and create the Phase 1 tables from
      `docs/DATABASE.md`
- [ ] Backend: `GET /health` endpoint returning `{ success: true, data: { status: "ok" } }`
- [ ] Backend: `.env.example` with `DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME,
      JWT_SECRET, PORT`

## Next
- [ ] Auth: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, JWT middleware
- [ ] Business creation: CRUD endpoints (`docs/API.md`) + form on the frontend
- [ ] Market configuration: CRUD endpoints + form on the frontend
- [ ] Simulation engine v1 — deterministic period-by-period updates (see
      `ARCHITECTURE.md` → "Request lifecycle example")
- [ ] `POST /simulations`, `POST /simulations/:id/run`, `GET /simulations/:id/results`,
      `GET /simulations` (history)
- [ ] Dashboard v1: revenue / profit / demand / inventory KPI cards + revenue trend
      and profit trend charts

## Blocked / needs a decision
- [ ] Which ORM/migration tool for PostgreSQL? (Prisma vs. Knex vs. raw `pg` + hand-
      written migrations) — log the choice in `DECISIONS.md` once picked
- [ ] Hosting/deployment target — deferred to Phase 4, no action needed yet

## Do not start yet (Phase 2+, out of scope for now)
- Individual customer/competitor agents
- ML service, forecasting models
- Strategy comparison, what-if analysis, risk scoring, recommendations
- Reports export, admin module
