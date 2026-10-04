CREATE TABLE "car_datasets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"file_name" varchar(255),
	"row_count" integer DEFAULT 0 NOT NULL,
	"rows" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "car_predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"dataset_id" integer,
	"model_version" varchar(100) NOT NULL,
	"inputs" jsonb NOT NULL,
	"price" numeric(14, 2) NOT NULL,
	"units_sold" numeric(14, 2) NOT NULL,
	"revenue" numeric(14, 2) NOT NULL,
	"profit" numeric(14, 2) NOT NULL,
	"price_was_predicted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "car_datasets" ADD CONSTRAINT "car_datasets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_predictions" ADD CONSTRAINT "car_predictions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_predictions" ADD CONSTRAINT "car_predictions_dataset_id_car_datasets_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."car_datasets"("id") ON DELETE set null ON UPDATE no action;