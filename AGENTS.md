# AGENTS.md — Instructions for AI Coding Agents

> This file is tool-agnostic. It works as-is with Claude Code, Cursor, Windsurf, and
> most other AI coding agents that read a repo-level instructions file.
>
> - **Claude Code**: symlink or copy this file to `CLAUDE.md` (`cp AGENTS.md CLAUDE.md`), or just keep this filename — Claude Code will pick it up.
> - **Cursor**: point `.cursorrules` at this file, or copy the "Rules for the agent" section into it.
> - **Windsurf / other**: copy relevant sections into whatever config file that tool expects.
>   Keep this file as the single source of truth and copy _from_ it, not the other way around.

## Project in one paragraph

An AI-powered web platform for simulating virtual business environments and testing
strategies (pricing, marketing, production, inventory, competitor response) before
acting on them in the real world. Combines a rule-based/agent-based market simulation
with a machine learning layer for forecasting, layered in over multiple build phases.

## Current phase — check this first

The full 15-module scope in the synopsis is **not** built all at once. We are building
in phases. Before adding any feature, open `docs/ROADMAP.md` and confirm which phase
is active, then check `docs/TODO.md` for the concrete next tasks.

**As of repo creation: Phase 0 → Phase 1 (MVP Core).** Do not build Phase 2+ features
(individual customer/competitor agents, ML forecasting, strategy comparison, what-if
analysis, risk scoring, recommendations, reports, admin panel) until Phase 1 is
checked off in `docs/ROADMAP.md`.

## Tech stack

| Layer      | Tech                                                                 |
| ---------- | -------------------------------------------------------------------- |
| Frontend   | React, Tailwind CSS, Chart.js                                        |
| Backend    | Node.js, Express (REST API)                                          |
| ML Service | Python, FastAPI, scikit-learn, XGBoost, Pandas, NumPy (from Phase 2) |
| Database   | PostgreSQL                                                           |

## Repository structure

```
/frontend        React app (dashboard, forms, charts)
/backend         Node/Express API — auth, CRUD, simulation engine, orchestration
/ml-service      Python FastAPI microservice — forecasting models (Phase 2+)
/docs            Architecture, roadmap, DB schema, API contract, decisions
README.md
AGENTS.md
```

## Commands

- Frontend dev server: `cd frontend && npm run dev`
- Backend dev server: `cd backend && npm run dev`
- Backend tests: `cd backend && npm test`
- ML service dev server (Phase 2+): `cd ml-service && uvicorn main:app --reload`
- ML service tests (Phase 2+): `cd ml-service && pytest`

If any of these commands don't exist yet in a fresh checkout, that's expected early on —
wire them up as part of Phase 0 scaffolding and keep this section accurate as commands change.

## Conventions

- **JS/TS**: camelCase for variables/functions, PascalCase for React components,
  kebab-case for non-component filenames.
- **Python**: snake_case, PEP8, type hints on function signatures.
- **Commits**: short, imperative (`add auth middleware`, not `Added Auth Middleware`).
- **Env vars**: never hardcode secrets or credentials. Use `.env`, and keep a matching
  `.env.example` up to date in each service whenever a new required var is added.
- **API responses**: consistent shape across the backend — see `docs/API.md`.

## Rules for the agent

1. Follow `instructions.md` at all times — never run scripts, database clients (`psql`, `mysql`, etc.), or Docker commands without asking first. Propose the exact command and have the user run it instead.
2. Read `docs/ROADMAP.md` and `docs/TODO.md` before starting new work — confirm you're building something in the current phase, not getting ahead of it.
3. Don't persist new kinds of simulated data (customers, competitors, risk scores, etc.) until `docs/DATABASE.md` has been updated with that table — schema first, code second.
4. Keep the ML service stateless and behind a REST boundary. The Node backend orchestrates simulation runs and calls the ML service for predictions; it does not run ML/training code itself.
5. Keep the Phase 1 simulation engine deterministic (a seeded RNG at most, no live ML) so the rest of the stack — auth, CRUD, dashboard, persistence — can be validated end-to-end before machine learning is introduced in Phase 2.
6. Don't scaffold Phase 3/4 modules (risk analysis, recommendation engine, reports, admin) "just in case." Extra surface area before the core loop works end-to-end (login → create business → configure market → run simulation → view dashboard) slows everything down.
7. After finishing a task: check it off in `docs/TODO.md`, and if it's a phase-defining item, check the corresponding box in `docs/ROADMAP.md` too.
8. If you make a non-obvious architectural choice (a library, a schema shape, a service boundary), add a one-entry note to `docs/DECISIONS.md`. Keep it to 2–3 sentences.
9. When in doubt about scope, prefer the smaller, testable slice over the complete module — the synopsis describes the destination, `docs/ROADMAP.md` describes the path.
