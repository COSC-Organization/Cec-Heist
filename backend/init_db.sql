-- CEC HEIST Production Database Initial Setup
-- 1. Create Tables & Indexes

CREATE TABLE IF NOT EXISTS `teams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_name` text NOT NULL,
	`password_hash` text NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS `score_idx` ON `teams` (`score`);
CREATE UNIQUE INDEX IF NOT EXISTS `teams_team_name_unique` ON `teams` (`team_name`);

CREATE TABLE IF NOT EXISTS `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'admin' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS `users_email_unique` ON `users` (`email`);

CREATE TABLE IF NOT EXISTS `challenges` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`flag` text NOT NULL,
	`hint_url` text,
	`level` integer NOT NULL,
	`difficulty` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS `team_challenge_assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL REFERENCES `teams`(`id`) ON DELETE CASCADE,
	`challenge_id` integer NOT NULL REFERENCES `challenges`(`id`) ON DELETE CASCADE,
	`level` integer NOT NULL,
	`assigned_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS `team_challenge_assignment_unique` ON `team_challenge_assignments` (`team_id`, `challenge_id`);

CREATE TABLE IF NOT EXISTS `team_challenge_solves` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL REFERENCES `teams`(`id`) ON DELETE CASCADE,
	`challenge_id` integer NOT NULL REFERENCES `challenges`(`id`) ON DELETE CASCADE,
	`points_awarded` integer NOT NULL,
	`solved_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`submission_id` text
);
CREATE UNIQUE INDEX IF NOT EXISTS `team_challenge_solve_unique` ON `team_challenge_solves` (`team_id`, `challenge_id`);

-- 2. Insert Admin User:
-- ID / Email: coscadmin
-- Password: cosccore2025 (Bcrypt hash: $2b$10$r7vOJYR3NhSePbt0Wfi01eE1mVK9fHIF8Sy.I1af9FZZ.AYpy0doy)
INSERT OR IGNORE INTO `users` (`email`, `password_hash`, `role`)
VALUES ('coscadmin', '$2b$10$r7vOJYR3NhSePbt0Wfi01eE1mVK9fHIF8Sy.I1af9FZZ.AYpy0doy', 'admin');

-- Optional alias to support standard email format:
INSERT OR IGNORE INTO `users` (`email`, `password_hash`, `role`)
VALUES ('coscadmin@cecheist.internal', '$2b$10$r7vOJYR3NhSePbt0Wfi01eE1mVK9fHIF8Sy.I1af9FZZ.AYpy0doy', 'admin');

-- 3. Initial Competition Seed Teams (Default Password: HEIST2026, hash: $2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou)
INSERT OR IGNORE INTO `teams` (`id`, `team_name`, `password_hash`, `score`) VALUES
(1, 'ZERO_DAY_SYNDICATE', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 15420),
(2, 'BYTE_BANDITS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 13200),
(3, 'RED_TEAM_SIX', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 11850),
(4, 'PHANTOM_NODE', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 9940),
(5, 'KRONOS_PROTOCOL', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 8650),
(6, 'NEO_MATRIX_CREW', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 7420),
(7, 'CYBER_VIPERS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 6810),
(8, 'QUANTUM_HEIST', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 5920),
(9, 'DARK_SOLARIS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 5180),
(10, 'VECTOR_CORPS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 4620),
(11, 'SYNAPSE_RAIDERS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 4410),
(12, 'OMEGA_CIPHER', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 4280),
(13, 'ROOT_FORCE', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 4150),
(14, 'MR_ROBOT_CREW', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 4020),
(15, 'BIT_INFILTRATORS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 3890),
(16, 'NULL_POINTERS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 3760),
(17, 'SHADOW_BROKERS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 3640),
(18, 'GLITCH_MOB', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 3520),
(19, 'RECON_SQUAD_07', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 3410),
(20, 'BINARY_GHOSTS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 3300),
(21, 'KALI_LEGION', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 3190),
(22, 'SPECTRE_PROTOCOL', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 3080),
(23, 'PACKET_SNIFFERS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 2980),
(24, 'FIREWALL_BREACH', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 2870),
(25, 'HEX_OVERLORDS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 2770),
(26, 'DAEMON_HUNTERS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 2680),
(27, 'LOGIC_BOMBERS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 2590),
(28, 'CIPHER_PUNKS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 2500),
(29, 'STEALTH_OPS_X', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 2410),
(30, 'CYBER_PHANTOMS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 2330),
(31, 'BUFFER_OVERFLOW', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 2250),
(32, 'MALWARE_MASTERS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 2170),
(33, 'ENIGMA_CORPS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 2090),
(34, 'ECHO_CHAMBER', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 2020),
(35, 'GRID_RUNNERS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 1950),
(36, 'PAYLOAD_PIRATES', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 1880),
(37, 'DECRYPT_KNIGHTS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 1810),
(38, 'VOID_WALKERS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 1740),
(39, 'KERNEL_PANIC', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 1680),
(40, 'BLACK_HAT_ELITE', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 1620),
(41, 'NEURAL_NETWORKS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 1560),
(42, 'SYNTAX_TERROR', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 1500),
(43, 'OVERCLOCK_CREW', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 1440),
(44, 'CIRCUIT_BREAKERS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 1390),
(45, 'DIGITAL_VANDALS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 1340),
(46, 'SCRIPT_KIDDIES', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 1290),
(47, 'BRUTE_FORCERS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 1240),
(48, 'PROTOCOL_ZERO', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 1190),
(49, 'MEMORY_LEAK', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 1150),
(50, 'SUBROUTINE_X', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 1100),
(51, 'ZERO_COOL', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 1060),
(52, 'ACID_BURN', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 1020),
(53, 'CRASH_OVERRIDE', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 980),
(54, 'THE_PLAGUE', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 940),
(55, 'LORD_NIKON', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 900),
(56, 'PHREAKERS_UNITED', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 860),
(57, 'DATA_DRIFTERS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 820),
(58, 'STACK_TRACERS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 790),
(59, 'BIT_SHIFT_BOYS', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 750),
(60, 'HEIST_NEWBIES', '$2b$10$ReAf3PjZV/VJV80ebSC56Oi884W0.n2lo.fIKwfeSsb12dui1NZou', 710);
