DROP TABLE `users`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_pomodoros` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text,
	`status` text NOT NULL,
	`planned_duration` integer DEFAULT 1500 NOT NULL,
	`duration` integer NOT NULL,
	`started_at` text NOT NULL,
	`ended_at` text,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_pomodoros`("id", "task_id", "status", "planned_duration", "duration", "started_at", "ended_at") SELECT "id", "task_id", "status", "planned_duration", "duration", "started_at", "ended_at" FROM `pomodoros`;--> statement-breakpoint
DROP TABLE `pomodoros`;--> statement-breakpoint
ALTER TABLE `__new_pomodoros` RENAME TO `pomodoros`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`work_duration` integer DEFAULT 1500,
	`short_break_duration` integer DEFAULT 300,
	`long_break_duration` integer DEFAULT 1800,
	`rounds_before_long_break` integer DEFAULT 4,
	`alarm_sound` text DEFAULT 'default',
	`vibration_enabled` integer DEFAULT true,
	`dnd_enabled` integer DEFAULT false,
	`auto_start_break` integer DEFAULT true,
	`auto_start_work` integer DEFAULT false,
	`mom_mode` text DEFAULT 'standard'
);
--> statement-breakpoint
INSERT INTO `__new_settings`("id", "work_duration", "short_break_duration", "long_break_duration", "rounds_before_long_break", "alarm_sound", "vibration_enabled", "dnd_enabled", "auto_start_break", "auto_start_work", "mom_mode") SELECT "id", "work_duration", "short_break_duration", "long_break_duration", "rounds_before_long_break", "alarm_sound", "vibration_enabled", "dnd_enabled", "auto_start_break", "auto_start_work", "mom_mode" FROM `settings`;--> statement-breakpoint
DROP TABLE `settings`;--> statement-breakpoint
ALTER TABLE `__new_settings` RENAME TO `settings`;--> statement-breakpoint
CREATE TABLE `__new_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#FF6347' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_tags`("id", "name", "color") SELECT "id", "name", "color" FROM `tags`;--> statement-breakpoint
DROP TABLE `tags`;--> statement-breakpoint
ALTER TABLE `__new_tags` RENAME TO `tags`;--> statement-breakpoint
CREATE TABLE `__new_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'TODO' NOT NULL,
	`estimated_pomodoros` integer DEFAULT 0,
	`completed_pomodoros` integer DEFAULT 0,
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`completed_at` text
);
--> statement-breakpoint
INSERT INTO `__new_tasks`("id", "title", "status", "estimated_pomodoros", "completed_pomodoros", "sort_order", "created_at", "completed_at") SELECT "id", "title", "status", "estimated_pomodoros", "completed_pomodoros", "sort_order", "created_at", "completed_at" FROM `tasks`;--> statement-breakpoint
DROP TABLE `tasks`;--> statement-breakpoint
ALTER TABLE `__new_tasks` RENAME TO `tasks`;