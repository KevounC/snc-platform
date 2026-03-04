CREATE TABLE "content" (
	"id" text PRIMARY KEY NOT NULL,
	"creator_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"description" text,
	"visibility" text DEFAULT 'public' NOT NULL,
	"thumbnail_key" text,
	"media_key" text,
	"cover_art_key" text,
	"published_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_creator_active_idx" ON "content" USING btree ("creator_id","deleted_at");--> statement-breakpoint
CREATE INDEX "content_type_active_idx" ON "content" USING btree ("type","deleted_at");--> statement-breakpoint
CREATE INDEX "content_feed_idx" ON "content" USING btree ("visibility","deleted_at","published_at");