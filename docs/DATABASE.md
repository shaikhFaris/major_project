# Database Schema (PostgreSQL)

The schema grows phase by phase, matching `ROADMAP.md`. Only the Phase 1 tables need
to exist to start building — don't create Phase 2/3 tables early "just in case."

## Phase 1 tables

### `users`
| Column | Type | Notes |
|---|---|---|
| id | SERIAL, PRIMARY KEY | |
| email | VARCHAR(255), unique | |
| password_hash | VARCHAR(255) | bcrypt hash, never store plaintext |
| name | VARCHAR(255) | |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### `businesses`
| Column | Type | Notes |
|---|---|---|
| id | SERIAL, PRIMARY KEY | |
| user_id | INT, FK → `users.id` | |
| company_name | VARCHAR(255) | |
| industry | VARCHAR(100) | |
| product_name | VARCHAR(255) | |
| business_type | VARCHAR(100) | |
| initial_capital | DECIMAL(14,2) | |
| manufacturing_cost | DECIMAL(14,2) | per unit |
| selling_price | DECIMAL(14,2) | per unit |
| operating_cost | DECIMAL(14,2) | per period |
| initial_inventory | INT | |
| production_capacity | INT | per period |
| warehouse_capacity | INT | |
| marketing_budget | DECIMAL(14,2) | per period |
| advertising_channel | VARCHAR(100) | |
| promotion_frequency | VARCHAR(50) | |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### `market_configs`
| Column | Type | Notes |
|---|---|---|
| id | SERIAL, PRIMARY KEY | |
| business_id | INT, FK → `businesses.id` | |
| market_size | INT | |
| population | INT | |
| num_competitors | INT | |
| demand_level | VARCHAR(50) | e.g. low/medium/high |
| economic_condition | VARCHAR(50) | |
| inflation | DECIMAL(5,2) | percentage |
| season | VARCHAR(50) | |
| customer_income | VARCHAR(50) | e.g. low/medium/high, or a numeric average |
| tax_rate | DECIMAL(5,2) | percentage |
| supply_availability | VARCHAR(50) | |
| government_policies | TEXT | free-text or structured JSON if needed later |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### `simulations`
| Column | Type | Notes |
|---|---|---|
| id | SERIAL, PRIMARY KEY | |
| business_id | INT, FK → `businesses.id` | |
| market_config_id | INT, FK → `market_configs.id` | |
| strategy_label | VARCHAR(100) | e.g. "Baseline" — used for comparisons from Phase 2 |
| status | VARCHAR(50) | checked via application logic (pending/running/complete/failed) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### `simulation_results`
| Column | Type | Notes |
|---|---|---|
| id | SERIAL, PRIMARY KEY | |
| simulation_id | INT, FK → `simulations.id` | |
| period | INT | time step within the simulation |
| revenue | DECIMAL(14,2) | |
| profit | DECIMAL(14,2) | |
| market_share | DECIMAL(5,2) | percentage |
| demand | INT | units |
| inventory_level | INT | |
| consumer_satisfaction | DECIMAL(5,2) | 0–100 or 0–1, pick one and stay consistent |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

**Note:** `simulation_results` is append-only per period — don't overwrite rows.
Trend charts depend on the complete period-by-period history.

---

## Phase 2 additions

### `customers`
Consider aggregated cohorts rather than one row per simulated individual, unless
per-agent granularity is actually needed for the dashboard.
| Column | Notes |
|---|---|
| id, simulation_id (FK) | |
| income, budget | |
| preferred_brand | |
| buying_frequency | |
| brand_loyalty | |
| price_sensitivity | |
| quality_preference | |
| satisfaction_level | |

### `competitors`
| Column | Notes |
|---|---|
| id, simulation_id (FK) | |
| name | |
| selling_price, marketing_budget, inventory | |
| product_quality, brand_popularity | |
| market_share, growth_rate | |
| strategy | premium_pricing / aggressive_discount / heavy_advertising / low_cost / high_quality / innovation |

### `ml_predictions`
| Column | Notes |
|---|---|
| id, simulation_id (FK) | |
| prediction_type | demand / sales / churn / satisfaction / trend |
| period | |
| predicted_value | |
| model_used | e.g. "linear_regression", "random_forest" |
| created_at | |

---

## Phase 3 additions

### `risk_scores`
id, simulation_id (FK), risk_type (business/pricing/inventory/demand/competitive/profit), score, notes

### `recommendations`
id, simulation_id (FK), recommendation_text, rationale, created_at

---

## Phase 4 additions

### `reports`
id, simulation_id (FK), format (pdf/excel), file_path, created_at

---

## Notes
- Foreign keys cascade on delete from `businesses` down through `simulations` and
  `simulation_results`, so deleting a business cleans up its full history.
- Keep enums/strings consistent across the app (e.g. `strategy` values) — define them
  once, likely as constants shared between backend and frontend, rather than
  re-typing string literals in multiple places.
