// Centralized API Client for CEC HEIST Backend
// Handles base URL, auth token injection, automatic token refresh, and endpoint integrations.

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

const ACCESS_TOKEN_KEY = "cec_heist_access_token";
const REFRESH_TOKEN_KEY = "cec_heist_refresh_token";
const USER_KEY = "cec_heist_auth_user";

export interface ApiUser {
  id: number;
  email: string;
  role: "user" | "admin";
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
  expiresIn: number;
}

export interface RankedTeam {
  rank: number;
  id: number;
  team_name: string;
  score: number;
}

export interface LeaderboardPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LeaderboardResponse {
  success: boolean;
  data: RankedTeam[];
  pagination: LeaderboardPagination;
}

export interface TeamByRankResponse {
  success: boolean;
  rank: number;
  data: {
    id: number;
    team_name: string;
    score: number;
  };
}

export interface TeamResponse {
  success: boolean;
  data: {
    id: number;
    team_name: string;
    score: number;
  };
}

export interface CreateTeamPayload {
  team_name: string;
  score?: number;
}

export interface UpdateTeamPayload {
  team_name?: string;
  score?: number;
}

export interface CreateChallengePayload {
  title: string;
  description: string;
  flag: string;
  hintUrl?: string | null;
  level: number;
  difficulty: "easy" | "medium" | "high";
}

export interface ChallengeResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    title: string;
    description: string;
    hintUrl: string | null;
    level: number;
    difficulty: "easy" | "medium" | "high";
    createdAt: string;
  };
}

export interface HealthResponse {
  success: boolean;
  message: string;
}

// Token Storage Helpers
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): ApiUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuthTokens(session: {
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
}): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  } catch (err) {
    console.error("Failed to store tokens in localStorage", err);
  }
}

export function clearAuthTokens(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (err) {
    console.error("Failed to clear tokens from localStorage", err);
  }
}

// Core Request Handler with Auto Token Refresh
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearAuthTokens();
      return null;
    }

    const data: { success: boolean; accessToken: string } = await res.json();
    if (data.success && data.accessToken) {
      if (typeof window !== "undefined") {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      }
      return data.accessToken;
    }
    clearAuthTokens();
    return null;
  } catch {
    clearAuthTokens();
    return null;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new Error(
      `Network error connecting to backend: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  // Handle Token Expiry & Automatic Refresh (401)
  if (response.status === 401 && getRefreshToken() && !path.includes("/auth/")) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;
      refreshQueue.forEach((callback) => callback(newToken));
      refreshQueue = [];

      if (newToken) {
        headers.set("Authorization", `Bearer ${newToken}`);
        return apiRequest<T>(path, { ...options, headers });
      }
    } else {
      // Wait for existing refresh to complete
      const retryToken = await new Promise<string | null>((resolve) => {
        refreshQueue.push(resolve);
      });
      if (retryToken) {
        headers.set("Authorization", `Bearer ${retryToken}`);
        return apiRequest<T>(path, { ...options, headers });
      }
    }
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${response.statusText}`);
    }
    return {} as T;
  }

  if (!response.ok) {
    const errorMsg =
      (data as { message?: string })?.message ||
      `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

// Concrete API Endpoints
export const api = {
  // 1. Root and Health
  root: () =>
    fetch(`${API_BASE_URL}/`).then((res) => res.text()),

  health: () =>
    apiRequest<HealthResponse>("/api/health", { method: "GET" }),

  // 2. Authentication
  auth: {
    login: async (email: string, password: string) => {
      const res = await apiRequest<{
        success: boolean;
        message: string;
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        refreshExpiresIn: number;
        user: ApiUser;
      }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (res.success && res.accessToken) {
        setAuthTokens({
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          user: res.user,
        });
      }
      return res;
    },

    refresh: (refreshToken: string) =>
      apiRequest<{ success: boolean; accessToken: string; expiresIn: number }>(
        "/api/auth/refresh",
        {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        }
      ),

    logout: () => {
      clearAuthTokens();
    },
  },

  // 3. Leaderboard
  leaderboard: {
    get: (page = 1, limit = 10) =>
      apiRequest<LeaderboardResponse>(
        `/api/leaderboard?page=${page}&limit=${limit}`,
        { method: "GET" }
      ),

    getByRank: (rank: number) =>
      apiRequest<TeamByRankResponse>(`/api/leaderboard/${rank}`, {
        method: "GET",
      }),
  },

  // 4. Teams (Admin & User)
  teams: {
    getById: (id: number) =>
      apiRequest<TeamResponse>(`/api/teams/${id}`, { method: "GET" }),

    create: (payload: CreateTeamPayload) =>
      apiRequest<TeamResponse>("/api/teams", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    update: (id: number, payload: UpdateTeamPayload) =>
      apiRequest<TeamResponse>(`/api/teams/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),

    delete: (id: number) =>
      apiRequest<{ success: boolean; message: string }>(`/api/teams/${id}`, {
        method: "DELETE",
      }),
  },

  // 5. Challenges (Admin only)
  challenges: {
    create: (payload: CreateChallengePayload) =>
      apiRequest<ChallengeResponse>("/api/challenges", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },
};
