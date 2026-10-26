export type AdminTab = "overview" | "event-controls" | "teams" | "challenges" | "leaderboard";

export interface EventConfig {
  name: string;
  edition: string;
  status: "NOT STARTED" | "LIVE" | "ENDED";
  startTime: string;
  endTime: string;
  totalPoints: number;
  totalChallenges: number;
}

export interface TeamMember {
  name: string;
  email: string;
  role: "Captain" | "Operative";
}

export interface Team {
  id: string;
  name: string;
  members: TeamMember[];
  score: number;
  solvedCount: number;
  registrationStatus: "VERIFIED" | "PENDING" | "FLAGGED";
  lastActive: string;
  rank: number;
}

export interface Challenge {
  id: string;
  title: string;
  category: "WEB" | "FORENSICS" | "CRYPTO" | "REVERSE" | "MISC" | string;
  level: number;
  difficulty?: "Easy" | "Medium" | "Hard" | "Insane";
  flag: string;
  clueLink?: string;
  isActive: boolean;
  points: number;
  description: string;
  status: "Draft" | "Published" | "Archived";
  solves: number;
  facilityId?: "factory" | "logistics" | "command" | "vault";

  hint?: string;
  pic?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: "flag_solved" | "team_register" | "challenge_add" | "event_status" | "system_alert";
  message: string;
  teamName?: string;
  points?: number;
}

export const INITIAL_EVENT_CONFIG: EventConfig = {
  name: "CEC HEIST",
  edition: "2K26",
  status: "LIVE",
  startTime: "2026-10-14T09:00:00Z",
  endTime: "2026-10-15T21:00:00Z",
  totalPoints: 1600,
  totalChallenges: 11,
};

export const INITIAL_TEAMS: Team[] = [
  {
    id: "TM-001",
    name: "ZERO_DAY_SYNDICATE",
    members: [
      { name: "Alex Mercer", email: "alex@zeroday.io", role: "Captain" },
      { name: "Elena Rostova", email: "elena@zeroday.io", role: "Operative" },
      { name: "Kaelen Voss", email: "kael@zeroday.io", role: "Operative" },
    ],
    score: 1450,
    solvedCount: 14,
    registrationStatus: "VERIFIED",
    lastActive: "2 mins ago",
    rank: 1,
  },
  {
    id: "TM-002",
    name: "BYTE_BANDITS",
    members: [
      { name: "Marcus Shaw", email: "marcus@bytebandits.net", role: "Captain" },
      { name: "Samantha Cross", email: "sam@bytebandits.net", role: "Operative" },
      { name: "Devon Reed", email: "devon@bytebandits.net", role: "Operative" },
    ],
    score: 1300,
    solvedCount: 12,
    registrationStatus: "VERIFIED",
    lastActive: "6 mins ago",
    rank: 2,
  },
  {
    id: "TM-003",
    name: "RED_TEAM_SIX",
    members: [
      { name: "Jax Thorne", email: "jax@redteam6.sec", role: "Captain" },
      { name: "Nadia Belova", email: "nadia@redteam6.sec", role: "Operative" },
      { name: "Tariq Mansour", email: "tariq@redteam6.sec", role: "Operative" },
    ],
    score: 1150,
    solvedCount: 11,
    registrationStatus: "VERIFIED",
    lastActive: "14 mins ago",
    rank: 3,
  },
  {
    id: "TM-004",
    name: "PHANTOM_NODE",
    members: [
      { name: "Viktor Gray", email: "viktor@phantom.cc", role: "Captain" },
      { name: "Chloe Bennett", email: "chloe@phantom.cc", role: "Operative" },
      { name: "Rohan Patel", email: "rohan@phantom.cc", role: "Operative" },
    ],
    score: 950,
    solvedCount: 9,
    registrationStatus: "VERIFIED",
    lastActive: "25 mins ago",
    rank: 4,
  },
  {
    id: "TM-005",
    name: "KRONOS_PROTOCOL",
    members: [
      { name: "Soren Lind", email: "soren@kronos.tech", role: "Captain" },
      { name: "Aria Sterling", email: "aria@kronos.tech", role: "Operative" },
      { name: "Kenji Sato", email: "kenji@kronos.tech", role: "Operative" },
    ],
    score: 800,
    solvedCount: 8,
    registrationStatus: "VERIFIED",
    lastActive: "38 mins ago",
    rank: 5,
  },
  {
    id: "TM-006",
    name: "NEO_MATRIX_CREW",
    members: [
      { name: "Thomas Anderson", email: "neo@matrix.org", role: "Captain" },
      { name: "Trinity Bell", email: "trinity@matrix.org", role: "Operative" },
      { name: "Morpheus King", email: "morpheus@matrix.org", role: "Operative" },
    ],
    score: 650,
    solvedCount: 7,
    registrationStatus: "VERIFIED",
    lastActive: "45 mins ago",
    rank: 6,
  },
  {
    id: "TM-007",
    name: "CYBER_VIPERS",
    members: [
      { name: "Viper One", email: "lead@vipers.net", role: "Captain" },
      { name: "Fang Wu", email: "fang@vipers.net", role: "Operative" },
    ],
    score: 500,
    solvedCount: 6,
    registrationStatus: "VERIFIED",
    lastActive: "1 hour ago",
    rank: 7,
  },
  {
    id: "TM-008",
    name: "QUANTUM_HEIST",
    members: [
      { name: "Dr. Paul Dirac", email: "dirac@qheist.io", role: "Captain" },
      { name: "Lisa Randall", email: "lisa@qheist.io", role: "Operative" },
    ],
    score: 400,
    solvedCount: 5,
    registrationStatus: "PENDING",
    lastActive: "1 hour ago",
    rank: 8,
  },
  {
    id: "TM-009",
    name: "DARK_SOLARIS",
    members: [
      { name: "Solaris Prime", email: "prime@solaris.org", role: "Captain" },
      { name: "Nova Flare", email: "nova@solaris.org", role: "Operative" },
    ],
    score: 250,
    solvedCount: 5,
    registrationStatus: "VERIFIED",
    lastActive: "2 hours ago",
    rank: 9,
  },
  {
    id: "TM-010",
    name: "VECTOR_CORPS",
    members: [
      { name: "Vector Lead", email: "lead@vectorcorps.io", role: "Captain" },
      { name: "Dot Product", email: "dot@vectorcorps.io", role: "Operative" },
    ],
    score: 100,
    solvedCount: 4,
    registrationStatus: "VERIFIED",
    lastActive: "2 hours ago",
    rank: 10,
  },
];

export const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: "CHAL-01",
    level: 1,
    title: "Hidden in plain sight!!!",
    description: "Analyse the pdf given below and find the clue.",
    category: "WEB",
    points: 100,
    flag: "CTF{h1dd3n_1n_pl41n_s1ght}",
    clueLink: "https://example.com/files/hidden_clue.pdf",
    isActive: true,
    status: "Published",
    solves: 42,
  },
  {
    id: "CHAL-02",
    level: 1,
    title: "Its right there isnt it?",
    description: "analyse the pdf below to find the clue",
    category: "WEB",
    points: 150,
    flag: "CTF{r1ght_th3r3_und3r_n0s3}",
    clueLink: "https://example.com/clues/target_intel.pdf",
    isActive: true,
    status: "Published",
    solves: 24,
  },
  {
    id: "CHAL-03",
    level: 1,
    title: "Testing 1",
    description: "wtw1 - inspect raw memory stream for the secret canary token",
    category: "FORENSICS",
    points: 100,
    flag: "CTF{t3st1ng_f0r3ns1cs_01}",
    clueLink: "https://example.com/dumps/memory_vol.raw",
    isActive: true,
    status: "Published",
    solves: 31,
  },
  {
    id: "CHAL-04",
    level: 1,
    title: "WHERE IS IT???",
    description: "there's text in this image somewhere,find them",
    category: "WEB",
    points: 100,
    flag: "CTF{st3g0_t3xt_1n_p1x3ls}",
    clueLink: "https://example.com/assets/visual_cipher.png",
    isActive: true,
    status: "Published",
    solves: 19,
  },
  {
    id: "CHAL-05",
    level: 1,
    title: "Ungarble the garbled!!!",
    description: "Each letter of this word is incremented by a constant number to obfuscate the origin cipher.",
    category: "CRYPTO",
    points: 100,
    flag: "CTF{c43s4r_sh1ft_ung4rbl3d}",
    clueLink: "https://example.com/ciphers/garbled_msg.txt",
    isActive: true,
    status: "Published",
    solves: 38,
  },
  {
    id: "CHAL-06",
    level: 1,
    title: "Yellow Yellow Dirty Fellow",
    description: "Basically 'yellow' but in numbers (dont leave spaces) - decode the numeric sequence.",
    category: "WEB",
    points: 50,
    flag: "CTF{y3ll0w_num3r1c_c0d3}",
    clueLink: "",
    isActive: true,
    status: "Published",
    solves: 55,
  },
  {
    id: "CHAL-07",
    level: 1,
    title: "From the inside out?",
    description: "analyze the image to get the clue concealed within metadata chunks",
    category: "WEB",
    points: 150,
    flag: "CTF{1ns1d3_0ut_m3t4d4t4}",
    clueLink: "https://example.com/img/heist_vault.png",
    isActive: true,
    status: "Published",
    solves: 14,
  },
  {
    id: "CHAL-08",
    level: 2,
    title: "Ghost in the Shell",
    description: "What you see on the screen is merely a facade; the truth lies in the websocket stream.",
    category: "WEB",
    points: 200,
    flag: "CTF{gh0st_1n_th3_sh3ll_ws}",
    clueLink: "https://example.com/portal/shell_stream",
    isActive: true,
    status: "Published",
    solves: 9,
  },
  {
    id: "CHAL-09",
    level: 2,
    title: "Console Cowboy",
    description: "Terminal backdoor bypass through serial UART emulation interface.",
    category: "REVERSE",
    points: 250,
    flag: "CTF{c0ns0l3_c0wb0y_r00t}",
    clueLink: "https://example.com/bin/firmware_uart.bin",
    isActive: true,
    status: "Published",
    solves: 7,
  },
  {
    id: "CHAL-10",
    level: 3,
    title: "Quantum Biometrics Decrypt",
    description: "Reconstruct RSA private key from leaked low entropy random generator nonces.",
    category: "CRYPTO",
    points: 250,
    flag: "CTF{qu4ntum_l4tt1c3_br34k}",
    clueLink: "https://example.com/vault/biometric_key.pem",
    isActive: true,
    status: "Published",
    solves: 3,
  },
  {
    id: "CHAL-11",
    level: 3,
    title: "Firmware Bootloader Bypass",
    description: "Reverse engineer the ARM Cortex bootloader to bypass signature integrity checks.",
    category: "REVERSE",
    points: 150,
    flag: "CTF{arm_b00tl04d3r_0v3rr1d3}",
    clueLink: "https://example.com/hw/bootloader.hex",
    isActive: true,
    status: "Published",
    solves: 4,
  },
];

export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: "LOG-001",
    timestamp: "20:12:45",
    type: "flag_solved",
    message: "Solved challenge 'SQL Injection Gateway' [+100 pts]",
    teamName: "ZERO_DAY_SYNDICATE",
    points: 100,
  },
  {
    id: "LOG-002",
    timestamp: "20:09:18",
    type: "flag_solved",
    message: "Solved challenge 'JWT Key Forgery' [+150 pts]",
    teamName: "BYTE_BANDITS",
    points: 150,
  },
  {
    id: "LOG-003",
    timestamp: "19:54:30",
    type: "team_register",
    message: "Squad registered: VECTOR_CORPS (2 operatives)",
    teamName: "VECTOR_CORPS",
  },
  {
    id: "LOG-004",
    timestamp: "19:41:02",
    type: "system_alert",
    message: "Arena load balancer health check: All sectors operational [0 latency anomalies]",
  },
  {
    id: "LOG-005",
    timestamp: "19:22:15",
    type: "challenge_add",
    message: "New challenge deployed: 'Firmware Bootloader Bypass' [200 pts]",
  },
  {
    id: "LOG-006",
    timestamp: "19:00:00",
    type: "event_status",
    message: "Competition state updated to LIVE by Commander Admin",
  },
];
