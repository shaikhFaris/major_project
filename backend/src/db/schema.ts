import { pgTable, serial, varchar, decimal, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";

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
