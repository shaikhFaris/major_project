ALTER TABLE "simulation_results" ADD COLUMN "units_sold" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "simulation_results" ADD COLUMN "cost" numeric(14, 2) DEFAULT '0' NOT NULL;