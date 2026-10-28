-- Seed Competition Challenges for CEC HEIST 2026 across all 4 Sectors / Levels

-- Delete test challenge ID 1 if exists to ensure clean IDs
DELETE FROM `challenges` WHERE id = 1 AND (title = 'example' OR title = 'challenge');

INSERT OR IGNORE INTO `challenges` (`id`, `title`, `description`, `flag`, `hint_url`, `level`, `difficulty`) VALUES
-- LEVEL 1 (Sector 01: Industrial Refinery)
(1, 'Perimeter Sensor Breach', 'Perimeter sensors detect incoming intrusion attempts on refinery sub-network 192.168.1.0/24. Analyze telemetry logs to recover the primary bypass security key.', 'FLAG{byp4ss_pr0t0c0l_s3c01}', 'https://cecheist.internal/hints/sec01-telemetry', 1, 'easy'),
(2, 'Refinery Valve Override', 'Identify the weak 4-digit default security PIN in the refinery PLC controller to override primary coolant flow.', 'FLAG{v4lv3_0v3rr1d3_992}', 'https://cecheist.internal/hints/sec01-plc-docs', 1, 'easy'),
(3, 'Grid Frequency Sniffer', 'Demodulate raw RF frequency samples on 433MHz to decode the maintenance door access code.', 'FLAG{rf_sn1ff3r_8172}', 'https://cecheist.internal/hints/sec01-rf-sample', 1, 'easy'),
(4, 'SCADA Logic Injection', 'Craft an anomalous Modbus TCP packet sequence to inject unauthorized register commands and halt the backup generator.', 'FLAG{sc4d4_m0dbus_1nj3ct}', 'https://cecheist.internal/hints/sec01-modbus-spec', 1, 'medium'),
(5, 'Substation Relay Bypass', 'Exploit a race condition in the high-voltage substation relay controller to trigger an automated blackout.', 'FLAG{r3l4y_byp4ss_s3c01}', 'https://cecheist.internal/hints/sec01-relay-timing', 1, 'medium'),
(6, 'Core Reactor Firmware Patch', 'Reverse-engineer the ARM Cortex-M firmware binary extracted from the reactor controller to find the hardcoded root override backdoor.', 'FLAG{arm_c0r3_f1rmw4r3_p4tch}', 'https://cecheist.internal/hints/sec01-firmware-bin', 1, 'high'),

-- LEVEL 2 (Sector 02: Logistics Depot)
(7, 'Manifest Barcode Decoder', 'Extract and decode the corrupted high-density PDF417 barcode from the digitized cargo manifest.', 'FLAG{c4rg0_m4n1f3st_881}', 'https://cecheist.internal/hints/sec02-barcode', 2, 'easy'),
(8, 'Depot RFID Cloner', 'Demodulate the 125kHz FSK badge recording captured by the loading dock sensor to duplicate the supervisor tag.', 'FLAG{rf1d_cl0n3_d3p0t}', 'https://cecheist.internal/hints/sec02-rfid-raw', 2, 'easy'),
(9, 'Cipher Decrypt', 'A memory dump from the depot logistics terminal reveals an encrypted sequence obfuscated with multi-stage XOR. Reverse the stream to extract the master dispatch cipher.', 'FLAG{c1ph3r_x0r_d3crypt3d}', 'https://cecheist.internal/hints/sec02-memdump', 2, 'medium'),
(10, 'Convoy GPS Spoofer', 'Replay and manipulate NMEA sentences with recalculated checksums to divert the transport convoy.', 'FLAG{gps_sp00f_c0nv0y}', 'https://cecheist.internal/hints/sec02-nmea-stream', 2, 'medium'),
(11, 'Warehouse PLC Root', 'Construct a Return-Oriented-Programming (ROP) chain to bypass ASLR and stack canaries on the conveyor belt dispatch daemon.', 'FLAG{r0p_ch41n_w4r3h0us3}', 'https://cecheist.internal/hints/sec02-dispatch-elf', 2, 'high'),

-- LEVEL 3 (Sector 03: Command Complex)
(12, 'Surveillance Matrix Killswitch', 'Bypass flawed JWT token validation on the CCTV gateway by exploiting algorithm substitution (none/RS256).', 'FLAG{cctv_04uth2_byp4ss}', 'https://cecheist.internal/hints/sec03-jwt-pubkey', 3, 'medium'),
(13, 'Neural Override', 'Command complex sentries communicate via custom binary protocol on port 8443. Craft an exception-triggering payload to force a crash dump.', 'FLAG{n3ur4l_0v3rr1d3_byp4ss}', 'https://cecheist.internal/hints/sec03-sentry-proto', 3, 'medium'),
(14, 'Sensor Array Poisoning', 'Feed crafted statistical noise into the acoustic motion detector kalman filter to create an undetected blind spot.', 'FLAG{s3ns0r_p01s0n_773}', 'https://cecheist.internal/hints/sec03-kalman-filter', 3, 'medium'),
(15, 'Firewall Kernel Panic', 'Trigger a double-free vulnerability in the custom eBPF packet inspection filter to achieve ring0 execution.', 'FLAG{3bpf_k3rn3l_p4n1c}', 'https://cecheist.internal/hints/sec03-ebpf-src', 3, 'high'),
(16, 'Commander Biometric Spoof', 'Reconstruct the cryptographic challenge response bypassing the zero-knowledge biometric scanner.', 'FLAG{zk_1r1s_sc4nn3r_pwn}', 'https://cecheist.internal/hints/sec03-zk-circuit', 3, 'high'),

-- LEVEL 4 (Sector 04: Vault & Helipad)
(17, 'Helipad Transponder Hijack', 'Impersonate the emergency extraction helicopter computer by forging ADS-B Mode-S authentication bursts.', 'FLAG{h3l1_tr4nsp0nd3r_h1j4ck}', 'https://cecheist.internal/hints/sec04-adsb-spec', 4, 'medium'),
(18, 'Laser Grid Timing Attack', 'Measure clock jitter in the optocoupler circuit to predict the 50ms window when the perimeter laser grid cycle drops.', 'FLAG{l4s3r_t1m1ng_4tt4ck}', 'https://cecheist.internal/hints/sec04-laser-osc', 4, 'medium'),
(19, 'Vault Extraction', 'Reconstruct elliptic curve private keys from biased pseudo-random nonce leaks to disengage the biometric vault seal.', 'FLAG{v4ult_m4st3r_3xtr4ct10n}', 'https://cecheist.internal/hints/sec04-ecdsa-nonces', 4, 'high'),
(20, 'Zero-Day Master Keygen', 'Solve an ECDSA lattice reduction (Hidden Number Problem) to forge the vault root authorization certificate.', 'FLAG{z3r0_d4y_m4st3r_k3yg3n}', 'https://cecheist.internal/hints/sec04-lattice-hnp', 4, 'high'),
(21, 'Quantum Vault Depletion', 'Simulate quantum Fourier transform phase estimation to compute discrete logs and empty the central vault treasury.', 'FLAG{sh0r_qu4ntum_v4ult}', 'https://cecheist.internal/hints/sec04-qft-circuit', 4, 'high');
