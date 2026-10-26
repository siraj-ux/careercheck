CREATE TABLE "auth_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" text NOT NULL,
	"device_info" text,
	"created_at" text NOT NULL,
	CONSTRAINT "auth_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"parent_phone" text NOT NULL,
	"policy_version" text NOT NULL,
	"accepted_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"board" text,
	"stream" text,
	"marks_percent" real,
	"pg_degree" text,
	"pg_specialisation" text,
	"pg_grad_year" integer,
	"pg_cgpa_or_percent" text,
	"interests_json" text,
	"preferred_cities_json" text,
	"relocate" integer DEFAULT 0 NOT NULL,
	"budget_band" text,
	"budget_amount" integer,
	"loan_openness" integer DEFAULT 0 NOT NULL,
	"knowledge_level" integer,
	"assigned_consultant_id" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "student_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"role" text NOT NULL,
	"name" text,
	"level" text,
	"plan" text DEFAULT 'free' NOT NULL,
	"dob" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" text PRIMARY KEY NOT NULL,
	"section" text NOT NULL,
	"sub_type" text,
	"type" text NOT NULL,
	"stem_text" text NOT NULL,
	"stem_image" text,
	"options_json" text,
	"correct_key" text,
	"riasec_letter" text,
	"spectrum" text,
	"value_key" text,
	"reverse_scored" integer DEFAULT 0 NOT NULL,
	"level" text DEFAULT 'both' NOT NULL,
	"status" text DEFAULT 'live' NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"question_id" text NOT NULL,
	"answer" text NOT NULL,
	"time_taken_seconds" integer,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "results" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text NOT NULL,
	"riasec_code" text NOT NULL,
	"radar_scores_json" text NOT NULL,
	"aptitude_scores_json" text NOT NULL,
	"personality_spectrums_json" text NOT NULL,
	"top_values_json" text NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "results_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "test_section_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"section" text NOT NULL,
	"started_at" text NOT NULL,
	"deadline" text,
	"submitted_at" text,
	"time_taken_seconds" integer
);
--> statement-breakpoint
CREATE TABLE "test_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"level" text NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"current_section" text DEFAULT 'interests' NOT NULL,
	"current_question_index" integer DEFAULT 0 NOT NULL,
	"started_at" text,
	"completed_at" text,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "career_matches" (
	"id" text PRIMARY KEY NOT NULL,
	"result_id" text NOT NULL,
	"user_id" text NOT NULL,
	"cluster" text NOT NULL,
	"title" text NOT NULL,
	"fit_percent" integer NOT NULL,
	"reasons_json" text NOT NULL,
	"consultant_status" text DEFAULT 'pending' NOT NULL,
	"consultant_notes" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "colleges" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"type" text NOT NULL,
	"annual_fees" integer NOT NULL,
	"cutoff_percent" real NOT NULL,
	"exams_json" text NOT NULL,
	"courses_json" text NOT NULL,
	"level" text DEFAULT 'both' NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_colleges" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"college_id" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultant_availabilities" (
	"id" text PRIMARY KEY NOT NULL,
	"consultant_id" text NOT NULL,
	"weekday" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultants" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"credentials_json" text NOT NULL,
	"bio" text NOT NULL,
	"languages_json" text NOT NULL,
	"specialisations_json" text NOT NULL,
	"rating" real DEFAULT 5 NOT NULL,
	"student_count" integer DEFAULT 0 NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "consultants_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"consultant_id" text NOT NULL,
	"visibility" text DEFAULT 'private' NOT NULL,
	"body" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"consultant_id" text NOT NULL,
	"scheduled_at" text NOT NULL,
	"duration_minutes" integer DEFAULT 45 NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"join_link" text,
	"reschedule_count" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roadmap_milestones" (
	"id" text PRIMARY KEY NOT NULL,
	"roadmap_id" text NOT NULL,
	"order_index" integer NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"deadline" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roadmaps" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"consultant_id" text NOT NULL,
	"plan_type" text DEFAULT 'primary' NOT NULL,
	"is_published" integer DEFAULT 0 NOT NULL,
	"published_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"plan_unlocked" text DEFAULT 'career_plan' NOT NULL,
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"razorpay_signature" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"consultant_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"body" text NOT NULL,
	"read_at" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_configs" (
	"key" text PRIMARY KEY NOT NULL,
	"value_json" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text NOT NULL,
	"action" text NOT NULL,
	"target_user_id" text,
	"details_json" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"payload_json" text,
	"read_at" text,
	"emailed_at" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"consumed_at" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parent_share_links" (
	"id" text PRIMARY KEY NOT NULL,
	"result_id" text NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" text NOT NULL,
	"revoked_at" text,
	"created_at" text NOT NULL,
	CONSTRAINT "parent_share_links_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_session_id_test_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."test_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_session_id_test_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."test_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_section_progress" ADD CONSTRAINT "test_section_progress_session_id_test_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."test_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_sessions" ADD CONSTRAINT "test_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_matches" ADD CONSTRAINT "career_matches_result_id_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_matches" ADD CONSTRAINT "career_matches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_colleges" ADD CONSTRAINT "saved_colleges_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_colleges" ADD CONSTRAINT "saved_colleges_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultant_availabilities" ADD CONSTRAINT "consultant_availabilities_consultant_id_consultants_id_fk" FOREIGN KEY ("consultant_id") REFERENCES "public"."consultants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultants" ADD CONSTRAINT "consultants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_consultant_id_consultants_id_fk" FOREIGN KEY ("consultant_id") REFERENCES "public"."consultants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_consultant_id_consultants_id_fk" FOREIGN KEY ("consultant_id") REFERENCES "public"."consultants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_milestones" ADD CONSTRAINT "roadmap_milestones_roadmap_id_roadmaps_id_fk" FOREIGN KEY ("roadmap_id") REFERENCES "public"."roadmaps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmaps_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmaps_consultant_id_consultants_id_fk" FOREIGN KEY ("consultant_id") REFERENCES "public"."consultants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_consultant_id_consultants_id_fk" FOREIGN KEY ("consultant_id") REFERENCES "public"."consultants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_share_links" ADD CONSTRAINT "parent_share_links_result_id_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_share_links" ADD CONSTRAINT "parent_share_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_sessions_user_idx" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_token_idx" ON "auth_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "auth_sessions_expires_idx" ON "auth_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "consent_records_user_idx" ON "consent_records" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "student_profiles_user_idx" ON "student_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "student_profiles_consultant_idx" ON "student_profiles" USING btree ("assigned_consultant_id");--> statement-breakpoint
CREATE INDEX "users_phone_idx" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "questions_section_idx" ON "questions" USING btree ("section");--> statement-breakpoint
CREATE INDEX "questions_status_idx" ON "questions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "questions_level_idx" ON "questions" USING btree ("level");--> statement-breakpoint
CREATE INDEX "responses_session_idx" ON "responses" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "responses_question_idx" ON "responses" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "results_user_idx" ON "results" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "results_session_idx" ON "results" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "section_progress_session_idx" ON "test_section_progress" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "section_progress_section_idx" ON "test_section_progress" USING btree ("section");--> statement-breakpoint
CREATE INDEX "test_sessions_user_idx" ON "test_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "test_sessions_status_idx" ON "test_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "career_matches_user_idx" ON "career_matches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "career_matches_result_idx" ON "career_matches" USING btree ("result_id");--> statement-breakpoint
CREATE INDEX "career_matches_status_idx" ON "career_matches" USING btree ("consultant_status");--> statement-breakpoint
CREATE INDEX "colleges_city_idx" ON "colleges" USING btree ("city");--> statement-breakpoint
CREATE INDEX "colleges_level_idx" ON "colleges" USING btree ("level");--> statement-breakpoint
CREATE INDEX "colleges_cutoff_idx" ON "colleges" USING btree ("cutoff_percent");--> statement-breakpoint
CREATE INDEX "saved_colleges_student_idx" ON "saved_colleges" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "saved_colleges_college_idx" ON "saved_colleges" USING btree ("college_id");--> statement-breakpoint
CREATE INDEX "availabilities_consultant_idx" ON "consultant_availabilities" USING btree ("consultant_id");--> statement-breakpoint
CREATE INDEX "consultants_user_idx" ON "consultants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "consultants_active_idx" ON "consultants" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "notes_student_idx" ON "notes" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "notes_consultant_idx" ON "notes" USING btree ("consultant_id");--> statement-breakpoint
CREATE INDEX "notes_visibility_idx" ON "notes" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "sessions_student_idx" ON "sessions" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "sessions_consultant_idx" ON "sessions" USING btree ("consultant_id");--> statement-breakpoint
CREATE INDEX "sessions_status_idx" ON "sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sessions_scheduled_idx" ON "sessions" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "milestones_roadmap_idx" ON "roadmap_milestones" USING btree ("roadmap_id");--> statement-breakpoint
CREATE INDEX "milestones_deadline_idx" ON "roadmap_milestones" USING btree ("deadline");--> statement-breakpoint
CREATE INDEX "roadmaps_student_idx" ON "roadmaps" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "roadmaps_consultant_idx" ON "roadmaps" USING btree ("consultant_id");--> statement-breakpoint
CREATE INDEX "payments_user_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_order_idx" ON "payments" USING btree ("razorpay_order_id");--> statement-breakpoint
CREATE INDEX "messages_student_idx" ON "messages" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "messages_consultant_idx" ON "messages" USING btree ("consultant_id");--> statement-breakpoint
CREATE INDEX "messages_sender_idx" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_logs_target_idx" ON "audit_logs" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("read_at");--> statement-breakpoint
CREATE INDEX "otp_codes_phone_idx" ON "otp_codes" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "otp_codes_expires_idx" ON "otp_codes" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "parent_share_token_idx" ON "parent_share_links" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "parent_share_user_idx" ON "parent_share_links" USING btree ("user_id");