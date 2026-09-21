PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_game_log` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text,
	`player_id` text,
	`question_number` integer,
	`action_type` text NOT NULL,
	`score_change` integer DEFAULT 0,
	`panel` integer,
	`removed_panel` integer,
	`timestamp` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`is_system_action` integer DEFAULT false,
	`deleted_at` integer,
	`user_id` text,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_game_log`("id", "game_id", "player_id", "question_number", "action_type", "score_change", "panel", "removed_panel", "timestamp", "is_system_action", "deleted_at", "user_id") SELECT "id", "game_id", "player_id", "question_number", "action_type", "score_change", "panel", "removed_panel", "timestamp", "is_system_action", "deleted_at", "user_id" FROM `game_log`;--> statement-breakpoint
DROP TABLE `game_log`;--> statement-breakpoint
ALTER TABLE `__new_game_log` RENAME TO `game_log`;--> statement-breakpoint
PRAGMA foreign_keys=ON;