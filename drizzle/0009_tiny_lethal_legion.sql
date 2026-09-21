DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
ALTER TABLE `game_log` ALTER COLUMN "timestamp" TO "timestamp" integer NOT NULL DEFAULT (unixepoch('subsec') * 1000);--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
UPDATE `game_log` SET `timestamp` = `timestamp` * 1000 WHERE `timestamp` < 100000000000;
