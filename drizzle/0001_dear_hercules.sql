ALTER TABLE `users_table` RENAME TO `pomodoros`;--> statement-breakpoint
ALTER TABLE `pomodoros` RENAME COLUMN "name" TO "task_id";--> statement-breakpoint
ALTER TABLE `pomodoros` RENAME COLUMN "age" TO "status";--> statement-breakpoint
ALTER TABLE `pomodoros` RENAME COLUMN "email" TO "planned_duration";--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`work_duration` integer DEFAULT 1500,
	`short_break_duration` integer DEFAULT 300,
	`long_break_duration` integer DEFAULT 1800,
	`rounds_before_long_break` integer DEFAULT 4,
	`alarm_sound` text DEFAULT 'default',
	`vibration_enabled` integer DEFAULT true,
	`dnd_enabled` integer DEFAULT false,
	`auto_start_break` integer DEFAULT true,
	`auto_start_work` integer DEFAULT false,
	`mom_mode` text DEFAULT 'standard',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_user_id_unique` ON `settings` (`user_id`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#FF6347' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `task_tags` (
	`task_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`task_id`, `tag_id`),
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'TODO' NOT NULL,
	`estimated_pomodoros` integer DEFAULT 0,
	`completed_pomodoros` integer DEFAULT 0,
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`completed_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`nickname` text NOT NULL,
	`avatar` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
DROP INDEX `users_table_email_unique`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_pomodoros` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`task_id` text,
	`status` text NOT NULL,
	`planned_duration` integer DEFAULT 1500 NOT NULL,
	`duration` integer NOT NULL,
	`started_at` text NOT NULL,
	`ended_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_pomodoros`("id", "user_id", "task_id", "status", "planned_duration", "duration", "started_at", "ended_at") SELECT "id", "user_id", "task_id", "status", "planned_duration", "duration", "started_at", "ended_at" FROM `pomodoros`;--> statement-breakpoint
DROP TABLE `pomodoros`;--> statement-breakpoint
ALTER TABLE `__new_pomodoros` RENAME TO `pomodoros`;--> statement-breakpoint
PRAGMA foreign_keys=ON;