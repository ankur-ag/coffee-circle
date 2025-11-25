CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`meetup_id` text NOT NULL,
	`vibe` text NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`meetup_id`) REFERENCES `meetups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `coffee_shops` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`location` text NOT NULL,
	`description` text NOT NULL,
	`image` text NOT NULL,
	`rating` integer NOT NULL,
	`features` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `meetups` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`location_id` text,
	`status` text DEFAULT 'open' NOT NULL,
	FOREIGN KEY (`location_id`) REFERENCES `coffee_shops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`avatar` text,
	`bio` text,
	`created_at` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);