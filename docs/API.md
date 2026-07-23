# API Contract

Base URL: `/api` (add versioning like `/api/v1` later if this goes to production —
not needed for Phase 1).

## Response shape
Every endpoint returns this envelope:
```json
{ "success": true, "data": { }, "error": null }
```
On failure:
```json
{ "success": false, "data": null, "error": "human-readable message" }
```

## Auth
Protected endpoints expect `Authorization: Bearer <token>`.

---

## Phase 1 endpoints

### Auth
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/auth/register` | `{ email, password, name }` | returns user + token |
| POST | `/auth/login` | `{ email, password }` | returns token |
| GET | `/auth/me` | — | requires auth, returns current user profile |

### Businesses
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/businesses` | business fields (see `DATABASE.md`) | requires auth |
| GET | `/businesses` | — | list current user's businesses |
| GET | `/businesses/:id` | — | |
| PUT | `/businesses/:id` | partial business fields | |
| DELETE | `/businesses/:id` | — | cascades to market configs/simulations |

### Market Configs
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/businesses/:id/market-config` | market config fields | one active config per business is fine for Phase 1 |
| GET | `/businesses/:id/market-config` | — | |
| PUT | `/market-configs/:id` | partial fields | |

### Simulations
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/simulations` | `{ business_id, market_config_id, strategy_label? }` | creates a `pending` simulation |
| POST | `/simulations/:id/run` | — | executes the simulation engine synchronously in Phase 1 |
| GET | `/simulations/:id/results` | — | period-by-period results, for charts |
| GET | `/simulations` | — | current user's simulation history |

---

## Phase 2 additions (stubs — do not implement until Phase 2)
| Method | Path | Notes |
|---|---|---|
| GET | `/simulations/:id/competitors` | |
| GET | `/simulations/:id/customers` | likely aggregated cohorts, not per-agent |
| POST | `/ml/predict/demand` | internal call from backend → ML service, never exposed to the frontend directly |
| POST | `/ml/predict/sales` | same as above |
| POST | `/simulations/compare` | `{ simulation_ids: [...] }` → side-by-side strategy comparison |

## Phase 3 additions (stubs)
| Method | Path | Notes |
|---|---|---|
| POST | `/simulations/:id/what-if` | `{ scenario_type, params }` |
| GET | `/simulations/:id/risk` | |
| GET | `/simulations/:id/recommendations` | |

## Phase 4 additions (stubs)
| Method | Path | Notes |
|---|---|---|
| GET | `/simulations/:id/report?format=pdf\|excel` | |
| * | `/admin/*` | admin-only, gated by a role check on `users` |
