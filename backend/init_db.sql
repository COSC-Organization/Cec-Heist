-- CEC HEIST Production Database Initial Setup
-- 1. Create Tables & Indexes

CREATE TABLE IF NOT EXISTS `teams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_name` text NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS `score_idx` ON `teams` (`score`);

CREATE TABLE IF NOT EXISTS `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
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

-- 2. Insert Admin User:
-- ID / Email: coscadmin
-- Password: cosccore2025 (Bcrypt hash: $2b$10$r7vOJYR3NhSePbt0Wfi01eE1mVK9fHIF8Sy.I1af9FZZ.AYpy0doy)
INSERT OR IGNORE INTO `users` (`email`, `password_hash`, `role`)
VALUES ('coscadmin', '$2b$10$r7vOJYR3NhSePbt0Wfi01eE1mVK9fHIF8Sy.I1af9FZZ.AYpy0doy', 'admin');

-- Optional alias to support standard email format:
INSERT OR IGNORE INTO `users` (`email`, `password_hash`, `role`)
VALUES ('coscadmin@cecheist.internal', '$2b$10$r7vOJYR3NhSePbt0Wfi01eE1mVK9fHIF8Sy.I1af9FZZ.AYpy0doy', 'admin');

-- 3. Initial Competition Seed Teams
INSERT OR IGNORE INTO `teams` (`id`, `team_name`, `score`) VALUES
(1, 'ZERO_DAY_SYNDICATE', 15420),
(2, 'BYTE_BANDITS', 13200),
(3, 'RED_TEAM_SIX', 11850),
(4, 'PHANTOM_NODE', 9940),
(5, 'KRONOS_PROTOCOL', 8650),
(6, 'NEO_MATRIX_CREW', 7420),
(7, 'CYBER_VIPERS', 6810),
(8, 'QUANTUM_HEIST', 5920),
(9, 'DARK_SOLARIS', 5180),
(10, 'VECTOR_CORPS', 4620),
(11, 'SYNAPSE_RAIDERS', 4410),
(12, 'OMEGA_CIPHER', 4280),
(13, 'ROOT_FORCE', 4150),
(14, 'MR_ROBOT_CREW', 4020),
(15, 'BIT_INFILTRATORS', 3890),
(16, 'NULL_POINTERS', 3760),
(17, 'SHADOW_BROKERS', 3640),
(18, 'GLITCH_MOB', 3520),
(19, 'RECON_SQUAD_07', 3410),
(20, 'BINARY_GHOSTS', 3300),
(21, 'KALI_LEGION', 3190),
(22, 'SPECTRE_PROTOCOL', 3080),
(23, 'PACKET_SNIFFERS', 2980),
(24, 'FIREWALL_BREACH', 2870),
(25, 'HEX_OVERLORDS', 2770),
(26, 'DAEMON_HUNTERS', 2680),
(27, 'LOGIC_BOMBERS', 2590),
(28, 'CIPHER_PUNKS', 2500),
(29, 'STEALTH_OPS_X', 2410),
(30, 'CYBER_PHANTOMS', 2330),
(31, 'BUFFER_OVERFLOW', 2250),
(32, 'MALWARE_MASTERS', 2170),
(33, 'ENIGMA_CORPS', 2090),
(34, 'ECHO_CHAMBER', 2020),
(35, 'GRID_RUNNERS', 1950),
(36, 'PAYLOAD_PIRATES', 1880),
(37, 'DECRYPT_KNIGHTS', 1810),
(38, 'VOID_WALKERS', 1740),
(39, 'KERNEL_PANIC', 1680),
(40, 'BLACK_HAT_ELITE', 1620),
(41, 'NEURAL_NETWORKS', 1560),
(42, 'SYNTAX_TERROR', 1500),
(43, 'OVERCLOCK_CREW', 1440),
(44, 'CIRCUIT_BREAKERS', 1390),
(45, 'DIGITAL_VANDALS', 1340),
(46, 'SCRIPT_KIDDIES', 1290),
(47, 'BRUTE_FORCERS', 1240),
(48, 'PROTOCOL_ZERO', 1190),
(49, 'MEMORY_LEAK', 1150),
(50, 'SUBROUTINE_X', 1100),
(51, 'ZERO_COOL', 1060),
(52, 'ACID_BURN', 1020),
(53, 'CRASH_OVERRIDE', 980),
(54, 'THE_PLAGUE', 940),
(55, 'LORD_NIKON', 900),
(56, 'PHREAKERS_UNITED', 860),
(57, 'DATA_DRIFTERS', 820),
(58, 'STACK_TRACERS', 790),
(59, 'BIT_SHIFT_BOYS', 750),
(60, 'HEIST_NEWBIES', 710);
