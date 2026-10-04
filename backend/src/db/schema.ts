import { pgTable, serial, varchar, decimal, integer, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";

// ── Users ────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Businesses ──────────────────────────────────────────
export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 100 }).notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  businessType: varchar("business_type", { length: 100 }).notNull(),
  initialCapital: decimal("initial_capital", { precision: 14, scale: 2 }).notNull(),
  manufacturingCost: decimal("manufacturing_cost", { precision: 14, scale: 2 }).notNull(),
  sellingPrice: decimal("selling_price", { precision: 14, scale: 2 }).notNull(),
  operatingCost: decimal("operating_cost", { precision: 14, scale: 2 }).notNull(),
  initialInventory: integer("initial_inventory").notNull(),
  productionCapacity: integer("production_capacity").notNull(),
  warehouseCapacity: integer("warehouse_capacity").notNull(),
  marketingBudget: decimal("marketing_budget", { precision: 14, scale: 2 }).notNull(),
  advertisingChannel: varchar("advertising_channel", { length: 100 }).notNull(),
  promotionFrequency: varchar("promotion_frequency", { length: 50 }).notNull(),
  historicalData: jsonb("historical_data").$type<Record<string, unknown>[] | null>(),
  historicalFileName: varchar("historical_file_name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Market Configs ───────────────────────────────────────
export const marketConfigs = pgTable("market_configs", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  marketSize: integer("market_size").notNull(),
  population: integer("population").notNull(),
  numCompetitors: integer("num_competitors").notNull(),
  demandLevel: varchar("demand_level", { length: 50 }).notNull(),
  economicCondition: varchar("economic_condition", { length: 50 }).notNull(),
  inflation: decimal("inflation", { precision: 5, scale: 2 }).notNull(),
  season: varchar("season", { length: 50 }).notNull(),
  customerIncome: varchar("customer_income", { length: 50 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull(),
  supplyAvailability: varchar("supply_availability", { length: 50 }).notNull(),
  governmentPolicies: text("government_policies"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Simulations ─────────────────────────────────────────
export const simulations = pgTable("simulations", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  marketConfigId: integer("market_config_id").notNull().references(() => marketConfigs.id, { onDelete: "cascade" }),
  strategyLabel: varchar("strategy_label", { length: 100 }),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Car Datasets (parallel module) ──────────────────────
// A company's uploaded car dataset, kept separate from `businesses.historicalData`
// so the car-prediction module can evolve without touching the business schema.
export const carDatasets = pgTable("car_datasets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  fileName: varchar("file_name", { length: 255 }),
  rowCount: integer("row_count").notNull().default(0),
  rows: jsonb("rows").$type<Record<string, unknown>[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Car Predictions (parallel module) ───────────────────
// One row per predicted car. Inputs are stored alongside outputs so a prediction
// stays reproducible even after the model is retrained.
export const carPredictions = pgTable("car_predictions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  datasetId: integer("dataset_id").references(() => carDatasets.id, { onDelete: "set null" }),
  modelVersion: varchar("model_version", { length: 100 }).notNull(),
  inputs: jsonb("inputs").$type<Record<string, unknown>>().notNull(),
  price: decimal("price", { precision: 14, scale: 2 }).notNull(),
  unitsSold: decimal("units_sold", { precision: 14, scale: 2 }).notNull(),
  revenue: decimal("revenue", { precision: 14, scale: 2 }).notNull(),
  profit: decimal("profit", { precision: 14, scale: 2 }).notNull(),
  priceWasPredicted: boolean("price_was_predicted").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Simulation Results ──────────────────────────────────
export const simulationResults = pgTable("simulation_results", {
  id: serial("id").primaryKey(),
  simulationId: integer("simulation_id").notNull().references(() => simulations.id, { onDelete: "cascade" }),
  period: integer("period").notNull(),
  revenue: decimal("revenue", { precision: 14, scale: 2 }).notNull(),
  profit: decimal("profit", { precision: 14, scale: 2 }).notNull(),
  marketShare: decimal("market_share", { precision: 5, scale: 2 }).notNull(),
  demand: integer("demand").notNull(),
  unitsSold: integer("units_sold").notNull().default(0),
  inventoryLevel: integer("inventory_level").notNull(),
  consumerSatisfaction: decimal("consumer_satisfaction", { precision: 5, scale: 2 }).notNull(),
  cost: decimal("cost", { precision: 14, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Car Inventory (used-car reseller module) ──────────────────────────
// Tracks vehicles the reseller has purchased or is watching.
export const carInventory = pgTable("car_inventory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  make: varchar("make", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  variant: varchar("variant", { length: 200 }),
  makeYear: integer("make_year").notNull(),
  mileage: integer("mileage").notNull(),
  fuelType: varchar("fuel_type", { length: 50 }),
  bodyType: varchar("body_type", { length: 50 }),
  transmission: varchar("transmission", { length: 50 }),
  color: varchar("color", { length: 50 }),
  noOfOwners: integer("no_of_owners").default(1),
  city: varchar("city", { length: 100 }),
  acquisitionPrice: decimal("acquisition_price", { precision: 14, scale: 2 }).notNull(),
  targetSellingPrice: decimal("target_selling_price", { precision: 14, scale: 2 }),
  estimatedMarketValue: decimal("estimated_market_value", { precision: 14, scale: 2 }),
  reconditioningCost: decimal("reconditioning_cost", { precision: 14, scale: 2 }).default("20000"),
  status: varchar("status", { length: 50 }).default("in_inventory").notNull(),
  demandScore: decimal("demand_score", { precision: 5, scale: 1 }),
  opportunityScore: decimal("opportunity_score", { precision: 5, scale: 1 }),
  riskScore: decimal("risk_score", { precision: 5, scale: 1 }),
  notes: text("notes"),
  purchasedAt: timestamp("purchased_at").defaultNow(),
  listedAt: timestamp("listed_at"),
  soldAt: timestamp("sold_at"),
  soldPrice: decimal("sold_price", { precision: 14, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Car Strategies (used-car reseller module) ─────────────────────────
// Saved acquisition strategy configurations + backtest results.
export const carStrategies = pgTable("car_strategies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  parameters: jsonb("parameters").$type<Record<string, unknown>>().notNull(),
  backtestResults: jsonb("backtest_results").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
