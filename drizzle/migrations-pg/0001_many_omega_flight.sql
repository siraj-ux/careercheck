CREATE TABLE "courses" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"level" text DEFAULT 'UG' NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "courses_category_idx" ON "courses" USING btree ("category");--> statement-breakpoint
CREATE INDEX "courses_level_idx" ON "courses" USING btree ("level");--> statement-breakpoint
CREATE INDEX "courses_name_idx" ON "courses" USING btree ("name");