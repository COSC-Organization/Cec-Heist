CREATE TABLE `team_challenge_assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL,
	`challenge_id` integer NOT NULL,
	`level` integer NOT NULL,
	`assigned_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`challenge_id`) REFERENCES `challenges`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_challenge_assignment_unique` ON `team_challenge_assignments` (`team_id`,`challenge_id`);--> statement-breakpoint
CREATE TABLE `team_challenge_solves` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL,
	`challenge_id` integer NOT NULL,
	`points_awarded` integer NOT NULL,
	`solved_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`challenge_id`) REFERENCES `challenges`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_challenge_solve_unique` ON `team_challenge_solves` (`team_id`,`challenge_id`);