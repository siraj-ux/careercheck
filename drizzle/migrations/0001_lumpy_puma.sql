ALTER TABLE `student_profiles` ADD `assigned_consultant_id` text;--> statement-breakpoint
CREATE INDEX `student_profiles_consultant_idx` ON `student_profiles` (`assigned_consultant_id`);