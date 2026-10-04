CREATE TABLE "car_inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"make" varchar(100) NOT NULL,
	"model" varchar(100) NOT NULL,
	"variant" varchar(200),
	"make_year" integer NOT NULL,
	"mileage" integer NOT NULL,
	"fuel_type" varchar(50),
	"body_type" varchar(50),
	"transmission" varchar(50),
	"color" varchar(50),
	"no_of_owners" integer DEFAULT 1,
	"city" varchar(100),
	"acquisition_price" numeric(14, 2) NOT NULL,
	"target_selling_price" numeric(14, 2),
	"estimated_market_value" numeric(14, 2),
	"reconditioning_cost" numeric(14, 2) DEFAULT '20000',
	"status" varchar(50) DEFAULT 'in_inventory' NOT NULL,
	"demand_score" numeric(5, 1),
	"opportunity_score" numeric(5, 1),
	"risk_score" numeric(5, 1),
	"notes" text,
	"purchased_at" timestamp DEFAULT now(),
	"listed_at" timestamp,
	"sold_at" timestamp,
	"sold_price" numeric(14, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "car_strategies" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(200) NOT NULL,
	"parameters" jsonb NOT NULL,
	"backtest_results" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "car_inventory" ADD CONSTRAINT "car_inventory_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_strategies" ADD CONSTRAINT "car_strategies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;