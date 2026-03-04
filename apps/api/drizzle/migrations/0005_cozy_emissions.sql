CREATE TABLE "emissions" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"scope" integer NOT NULL,
	"category" text NOT NULL,
	"subcategory" text NOT NULL,
	"source" text NOT NULL,
	"description" text NOT NULL,
	"amount" real NOT NULL,
	"unit" text NOT NULL,
	"co2_kg" real NOT NULL,
	"method" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "emissions_date_idx" ON "emissions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "emissions_scope_category_idx" ON "emissions" USING btree ("scope","category");
