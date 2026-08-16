CREATE TABLE "businesses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"industry" varchar(100) NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"business_type" varchar(100) NOT NULL,
	"initial_capital" numeric(14, 2) NOT NULL,
	"manufacturing_cost" numeric(14, 2) NOT NULL,
	"selling_price" numeric(14, 2) NOT NULL,
	"operating_cost" numeric(14, 2) NOT NULL,
	"initial_inventory" integer NOT NULL,
	"production_capacity" integer NOT NULL,
	"warehouse_capacity" integer NOT NULL,
	"marketing_budget" numeric(14, 2) NOT NULL,
	"advertising_channel" varchar(100) NOT NULL,
	"promotion_frequency" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"market_size" integer NOT NULL,
	"population" integer NOT NULL,
	"num_competitors" integer NOT NULL,
	"demand_level" varchar(50) NOT NULL,
	"economic_condition" varchar(50) NOT NULL,
	"inflation" numeric(5, 2) NOT NULL,
	"season" varchar(50) NOT NULL,
	"customer_income" varchar(50) NOT NULL,
	"tax_rate" numeric(5, 2) NOT NULL,
	"supply_availability" varchar(50) NOT NULL,
	"government_policies" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulation_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"simulation_id" integer NOT NULL,
	"period" integer NOT NULL,
	"revenue" numeric(14, 2) NOT NULL,
	"profit" numeric(14, 2) NOT NULL,
	"market_share" numeric(5, 2) NOT NULL,
	"demand" integer NOT NULL,
	"inventory_level" integer NOT NULL,
	"consumer_satisfaction" numeric(5, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulations" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"market_config_id" integer NOT NULL,
	"strategy_label" varchar(100),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_configs" ADD CONSTRAINT "market_configs_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulation_results" ADD CONSTRAINT "simulation_results_simulation_id_simulations_id_fk" FOREIGN KEY ("simulation_id") REFERENCES "public"."simulations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_market_config_id_market_configs_id_fk" FOREIGN KEY ("market_config_id") REFERENCES "public"."market_configs"("id") ON DELETE cascade ON UPDATE no action;