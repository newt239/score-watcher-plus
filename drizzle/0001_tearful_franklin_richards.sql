ALTER TABLE `game` ADD `quiz_set_name` text;--> statement-breakpoint
ALTER TABLE `game` ADD `quiz_offset` integer DEFAULT 0 NOT NULL;