CREATE UNIQUE INDEX `idx_account_unique` ON `account` (`provider_id`,`account_id`);--> statement-breakpoint
CREATE INDEX `idx_session_expires_at` ON `session` (`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_user_preference_user_id` ON `user_preference` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_game_user_id` ON `game` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_game_rule_type` ON `game` (`rule_type`);--> statement-breakpoint
CREATE INDEX `idx_game_is_public` ON `game` (`is_public`);--> statement-breakpoint
CREATE INDEX `idx_game_log_game_id` ON `game_log` (`game_id`);--> statement-breakpoint
CREATE INDEX `idx_game_log_timestamp` ON `game_log` (`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_game_player_game_id` ON `game_player` (`game_id`);--> statement-breakpoint
CREATE INDEX `idx_game_player_game_id_player_id` ON `game_player` (`game_id`,`player_id`);--> statement-breakpoint
CREATE INDEX `idx_game_tag_game_id_tag_id` ON `game_tag` (`game_id`,`tag_id`);--> statement-breakpoint
CREATE INDEX `idx_player_name` ON `player` (`name`);--> statement-breakpoint
CREATE INDEX `idx_player_player_tag_player_id_tag_name` ON `player_player_tag` (`player_id`,`player_tag_id`);--> statement-breakpoint
CREATE INDEX `idx_tag_name` ON `tag` (`name`);--> statement-breakpoint
CREATE INDEX `idx_quiz_question_quiz_set_id_question_number` ON `quiz_question` (`quiz_set_id`,`question_number`);--> statement-breakpoint
CREATE INDEX `idx_user_subscription_user_id` ON `user_subscription` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_subscription_customer_id` ON `user_subscription` (`stripe_customer_id`);