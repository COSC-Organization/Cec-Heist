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

export const INITIAL_TEAMS: Team[] = [];

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
