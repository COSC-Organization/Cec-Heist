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

export const LEVEL_POINTS_CONFIG = {
  1: 200,
  2: 100,
  3: 250,
  4: 450,
} as const;

export const TOTAL_COMPETITION_POINTS = 1000;

export const INITIAL_EVENT_CONFIG: EventConfig = {
  name: "CEC HEIST",
  edition: "2K26",
  status: "LIVE",
  startTime: "2026-10-14T09:00:00Z",
  endTime: "2026-10-15T21:00:00Z",
  totalPoints: 1000,
  totalChallenges: 0,
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
    score: 850,
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
    score: 720,
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
    score: 380,
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
    score: 550,
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
    score: 450,
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
    score: 290,
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
    score: 200,
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
    score: 120,
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
    score: 50,
    solvedCount: 4,
    registrationStatus: "VERIFIED",
    lastActive: "2 hours ago",
    rank: 10,
  },
];

export const INITIAL_CHALLENGES: Challenge[] = [];

export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: "LOG-001",
    timestamp: "12:00:00",
    type: "system_alert",
    message: "CEC HEIST 2K26 Competition Matrix Online [1,000 PTS Pool]",
  },
  {
    id: "LOG-002",
    timestamp: "12:01:00",
    type: "event_status",
    message: "Level 1-4 Challenge Vectors Ready for Deployment",
  },
];
