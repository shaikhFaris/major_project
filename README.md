# Market Simulation & Strategy Testing Platform

An AI-powered web application for creating virtual business environments, simulating
changing market conditions, and evaluating business strategies (pricing, marketing,
production, inventory, competitor response) before implementing them in the real world.

Combines market simulation, agent-based modeling, and machine learning into a
decision-support tool — a business flight simulator instead of trial-and-error.

## Status
🚧 Early development — **Phase 1: MVP Core**. See [`docs/ROADMAP.md`](docs/ROADMAP.md)
for the full phased build plan and [`docs/TODO.md`](docs/TODO.md) for active tasks.

## Tech stack
| Layer | Tech |
|---|---|
| Frontend | React, Tailwind CSS, Chart.js |
| Backend | Node.js, Express |
| ML Service | Python, FastAPI, scikit-learn, XGBoost, Pandas, NumPy (from Phase 2) |
| Database | PostgreSQL |

## Prerequisites
- Node.js 20+
- Python 3.11+ (only needed from Phase 2 onward)
- PostgreSQL 16+ (or Docker, if you'd rather run it in a container)

## Getting started
```bash
git clone <repo-url>
cd <repo>

# backend
cd backend
npm install
cp .env.example .env      # fill in DB credentials + JWT secret
npm run dev

# frontend (new terminal)
cd frontend
npm install
npm run dev

# ml-service (Phase 2 onward, new terminal)
cd ml-service
pip install -r requirements.txt
uvicorn main:app --reload
```

## Project structure
```
/frontend        React app (dashboard, forms, charts)
/backend          Node/Express API
/ml-service       Python FastAPI ML microservice
/docs             Project documentation (see below)
README.md
AGENTS.md
```

## Documentation
- [`AGENTS.md`](AGENTS.md) — instructions for AI coding agents working in this repo
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design and module breakdown
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — phased build plan
- [`docs/TODO.md`](docs/TODO.md) — active task list
- [`docs/DATABASE.md`](docs/DATABASE.md) — PostgreSQL schema, by phase
- [`docs/API.md`](docs/API.md) — REST endpoint contract
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — architecture decision log
