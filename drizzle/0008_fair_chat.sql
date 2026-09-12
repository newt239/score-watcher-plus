ALTER TABLE `account` ADD `issuer` text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE `account` SET `issuer` = 'https://accounts.google.com' WHERE `provider_id` = 'google';--> statement-breakpoint
UPDATE `account` SET `issuer` = 'local:credential' WHERE `provider_id` = 'credential';
