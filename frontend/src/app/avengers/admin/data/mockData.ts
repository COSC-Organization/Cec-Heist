export type AdminTab = "overview" | "event-controls" | "teams" | "challenges" | "leaderboard";

export interface EventConfig {
  name: string;
  edition: string;
  status: "NOT STARTED" | "LIVE" | "ENDED";
  isPublished: boolean;
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
  category: "Web Exploitation" | "Cryptography" | "Forensics" | "Reverse Engineering";
  difficulty: "Easy" | "Medium" | "Hard" | "Insane";
  points: number;
  description: string;
  status: "Draft" | "Published" | "Archived";
  solves: number;
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
  isPublished: true,
  startTime: "2026-10-14T09:00:00Z",
  endTime: "2026-10-15T21:00:00Z",
  totalPoints: 124500,
  totalChallenges: 16,
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
    score: 15420,
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
    score: 13200,
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
    score: 11850,
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
    score: 9940,
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
    score: 8650,
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
    score: 7420,
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
    score: 6810,
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
    score: 5920,
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
    score: 5180,
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
    score: 4620,
    solvedCount: 4,
    registrationStatus: "VERIFIED",
    lastActive: "2 hours ago",
    rank: 10,
  },
];

export const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: "WEB-01",
    title: "SQL Injection Gateway",
    category: "Web Exploitation",
    difficulty: "Easy",
    points: 200,
    description: "Bypass the refinery authentication portal using a blind boolean SQL injection vulnerability.",
    status: "Published",
    solves: 42,
  },
  {
    id: "WEB-02",
    title: "JWT Key Forgery",
    category: "Web Exploitation",
    difficulty: "Medium",
    points: 400,
    description: "Forge an admin JSON Web Token by exploiting algorithm confusion between RS256 and HS256.",
    status: "Published",
    solves: 24,
  },
  {
    id: "WEB-03",
    title: "SSRF Internal Metadata",
    category: "Web Exploitation",
    difficulty: "Hard",
    points: 750,
    description: "Chain Server-Side Request Forgery through a PDF invoice generator to extract cloud metadata tokens.",
    status: "Published",
    solves: 11,
  },
  {
    id: "WEB-04",
    title: "Prototype Pollution RCE",
    category: "Web Exploitation",
    difficulty: "Insane",
    points: 1000,
    description: "Pollute the Object prototype in the Node.js backend to achieve remote command execution.",
    status: "Published",
    solves: 3,
  },
  {
    id: "CRYPTO-01",
    title: "Classic Substitution Matrix",
    category: "Cryptography",
    difficulty: "Easy",
    points: 150,
    description: "Analyze letter frequency in an intercepted diplomatic cable to reconstruct the polyalphabetic key.",
    status: "Published",
    solves: 51,
  },
  {
    id: "CRYPTO-02",
    title: "Padding Oracle Attack",
    category: "Cryptography",
    difficulty: "Medium",
    points: 500,
    description: "Exploit PKCS#7 CBC padding leakage to decrypt military telemetry without knowing the AES key.",
    status: "Published",
    solves: 18,
  },
  {
    id: "CRYPTO-03",
    title: "Broken RSA Common Modulus",
    category: "Cryptography",
    difficulty: "Hard",
    points: 800,
    description: "Recover the private key when two different public exponents share an identical RSA modulus N.",
    status: "Published",
    solves: 8,
  },
  {
    id: "FOR-01",
    title: "Memory Dump Volatility",
    category: "Forensics",
    difficulty: "Medium",
    points: 450,
    description: "Analyze a 4GB Windows memory dump to extract suspicious process trees and injected DLLs.",
    status: "Published",
    solves: 29,
  },
  {
    id: "FOR-02",
    title: "PCAP Packet Infiltration",
    category: "Forensics",
    difficulty: "Hard",
    points: 700,
    description: "Reconstruct exfiltrated data concealed within DNS TXT queries in an encrypted network capture.",
    status: "Published",
    solves: 14,
  },
  {
    id: "REV-01",
    title: "Obfuscated Binary Keygen",
    category: "Reverse Engineering",
    difficulty: "Medium",
    points: 550,
    description: "Decompile an x86-64 ELF binary and extract the cryptographic algorithm to build a working keygen.",
    status: "Published",
    solves: 16,
  },
  {
    id: "REV-02",
    title: "Firmware Bootloader Bypass",
    category: "Reverse Engineering",
    difficulty: "Insane",
    points: 1200,
    description: "Reverse engineer an ARM Cortex-M micro-controller firmware to bypass signature checks.",
    status: "Published",
    solves: 2,
  },
];

export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: "LOG-001",
    timestamp: "20:12:45",
    type: "flag_solved",
    message: "Solved challenge 'SQL Injection Gateway' [+200 pts]",
    teamName: "ZERO_DAY_SYNDICATE",
    points: 200,
  },
  {
    id: "LOG-002",
    timestamp: "20:09:18",
    type: "flag_solved",
    message: "Solved challenge 'JWT Key Forgery' [+400 pts]",
    teamName: "BYTE_BANDITS",
    points: 400,
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
    message: "New challenge deployed: 'Firmware Bootloader Bypass' [1200 pts]",
  },
  {
    id: "LOG-006",
    timestamp: "19:00:00",
    type: "event_status",
    message: "Competition state updated to LIVE by Commander Admin",
  },
];
