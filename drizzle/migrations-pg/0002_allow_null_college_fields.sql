ALTER TABLE "colleges" ALTER COLUMN "type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "colleges" ALTER COLUMN "annual_fees" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "colleges" ALTER COLUMN "cutoff_percent" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "colleges" ALTER COLUMN "exams_json" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "colleges" ALTER COLUMN "courses_json" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "colleges" ALTER COLUMN "level" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ALTER COLUMN "level" DROP NOT NULL;

