"use client";

import React, { useState, useEffect } from "react";
import "./admin.css";

import { AdminLogin } from "./components/AdminLogin";
import { AdminLayout } from "./components/AdminLayout";
import { DashboardOverview } from "./components/DashboardOverview";
import { EventControls } from "./components/EventControls";
import { ChallengeManagement } from "./components/ChallengeManagement";
import { TeamManagement } from "./components/TeamManagement";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { playVaultTransitionSound } from "@/components/PixelTransition";
import { getStoredUser, getAccessToken, clearAuthTokens, api } from "@/lib/api";

import {
  INITIAL_TEAMS,
  INITIAL_CHALLENGES,
  INITIAL_LOGS,
  INITIAL_EVENT_CONFIG,
  Team,
  Challenge,
  ActivityLog,
  EventConfig,
  AdminTab,
} from "./data/mockData";

export default function AdminPage() {
  // Mount state to prevent SSR / Client hydration mismatch
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string>("");

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  // Core Datasets start with initial constants on SSR & initial client render
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [challenges, setChallenges] = useState<Challenge[]>(INITIAL_CHALLENGES);

  // Initialize client-side state after mounting
  useEffect(() => {
    setIsMounted(true);

    const user = getStoredUser();
    const token = getAccessToken();
    const hasAdminSession = Boolean(token && user && user.role === "admin");
    setIsAuthenticated(hasAdminSession);
    if (hasAdminSession && user?.email) {
      setAdminEmail(user.email);
    }

    if (typeof window !== "undefined") {
      const savedTeams = localStorage.getItem("cec_heist_teams_v1");
      if (savedTeams) {
        try {
          const parsed = JSON.parse(savedTeams);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTeams(parsed);
          }
        } catch {}
      }

      const savedV3 =
        localStorage.getItem("cec_heist_challenges_v3") ||
        localStorage.getItem("cec_heist_challenges");
      if (savedV3) {
        try {
          const parsed = JSON.parse(savedV3);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setChallenges(parsed);
          }
        } catch {}
      }
    }
  }, []);

  // Sync challenges and teams with localStorage and cross-tab updates
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if ((e.key === "cec_heist_challenges_v3" || e.key === "cec_heist_challenges") && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setChallenges(parsed);
        } catch {}
      }
      if (e.key === "cec_heist_teams_v1" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setTeams(parsed);
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Load live challenges and teams from backend when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    let isSubscribed = true;

    async function loadAdminData() {
      try {
        const [teamsRes, challengesRes] = await Promise.allSettled([
          api.teams.getAll(),
          api.challenges.getAll(),
        ]);

        if (!isSubscribed) return;

        if (
          teamsRes.status === "fulfilled" &&
          teamsRes.value.success &&
          Array.isArray(teamsRes.value.data)
        ) {
          const mappedTeams: Team[] = teamsRes.value.data.map((t, idx) => ({
            id: String(t.id),
            name: t.team_name,
            score: t.score ?? 0,
            members: [
              {
                name: t.team_name,
                email: `${t.team_name.toLowerCase().replace(/\s+/g, "")}@cec.heist`,
                role: "Captain",
              },
            ],
            solvedCount: 0,
            registrationStatus: "VERIFIED",
            lastActive: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "Just now",
            rank: idx + 1,
          }));
          setTeams(mappedTeams);
        }

        if (
          challengesRes.status === "fulfilled" &&
          challengesRes.value.success &&
          Array.isArray(challengesRes.value.data)
        ) {
          const ptsMap: Record<string, number> = { easy: 10, medium: 20, high: 30 };
          const mappedChals: Challenge[] = challengesRes.value.data.map((c) => ({
            id: String(c.id),
            title: c.title,
            category: (c.difficulty || "easy").toUpperCase(),
            points: ptsMap[c.difficulty] || 10,
            level: c.level,
            difficulty: (c.difficulty
              ? c.difficulty.charAt(0).toUpperCase() + c.difficulty.slice(1)
              : "Easy") as "Easy" | "Medium" | "Hard",
            description: c.description,
            flag: c.flag || "CTF{hidden}",
            clueLink: c.hintUrl || undefined,
            isActive: true,
            status: "Published",
            solves: 0,
          }));
          setChallenges(mappedChals);
        }
      } catch (err) {
        console.warn("Live admin data load error:", err);
      }
    }

    loadAdminData();

    return () => {
      isSubscribed = false;
    };
  }, [isAuthenticated]);

  const [logs, setLogs] = useState<ActivityLog[]>(INITIAL_LOGS);
  const [eventConfig, setEventConfig] = useState<EventConfig>(INITIAL_EVENT_CONFIG);
  const [isDeployModalRequested, setIsDeployModalRequested] = useState<boolean>(false);

  const handleAddLog = (newLog: ActivityLog) => {
    setLogs((prev) => [newLog, ...prev]);
  };

  const handleAddChallenge = (newChallenge: Challenge) => {
    setChallenges((prev) => {
      const next = [newChallenge, ...prev];
      if (typeof window !== "undefined") {
        localStorage.setItem("cec_heist_challenges_v3", JSON.stringify(next));
        localStorage.setItem("cec_heist_challenges", JSON.stringify(next));
      }
      return next;
    });
  };

  const handleUpdateChallenge = (updated: Challenge) => {
    setChallenges((prev) => {
      const next = prev.map((c) => (c.id === updated.id ? updated : c));
      if (typeof window !== "undefined") {
        localStorage.setItem("cec_heist_challenges_v3", JSON.stringify(next));
        localStorage.setItem("cec_heist_challenges", JSON.stringify(next));
      }
      return next;
    });
  };

  const handleDeleteChallenge = (id: string) => {
    setChallenges((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (typeof window !== "undefined") {
        localStorage.setItem("cec_heist_challenges_v3", JSON.stringify(next));
        localStorage.setItem("cec_heist_challenges", JSON.stringify(next));
      }
      return next;
    });
  };

  // Squad / Team Handlers
  const handleAddTeam = (newTeam: Team) => {
    setTeams((prev) => {
      const next = [newTeam, ...prev];
      if (typeof window !== "undefined") {
        localStorage.setItem("cec_heist_teams_v1", JSON.stringify(next));
      }
      return next;
    });
    handleAddLog({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toTimeString().split(" ")[0],
      type: "team_register",
      message: `Squad ${newTeam.name} enlisted into tournament roster`,
    });
  };

  const handleAddTeams = (newTeams: Team[]) => {
    setTeams((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const toAdd = newTeams.filter((t) => !existingIds.has(t.id));
      const next = [...toAdd, ...prev];
      if (typeof window !== "undefined") {
        localStorage.setItem("cec_heist_teams_v1", JSON.stringify(next));
      }
      return next;
    });
    handleAddLog({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toTimeString().split(" ")[0],
      type: "team_register",
      message: `Batch ingested ${newTeams.length} squads via bulk spreadsheet upload`,
    });
  };

  const handleUpdateTeam = (updated: Team) => {
    setTeams((prev) => {
      const next = prev.map((t) => (t.id === updated.id ? updated : t));
      if (typeof window !== "undefined") {
        localStorage.setItem("cec_heist_teams_v1", JSON.stringify(next));
      }
      return next;
    });
    handleAddLog({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toTimeString().split(" ")[0],
      type: "team_register",
      message: `Squad profile updated for ${updated.name}`,
    });
  };

  const handleDeleteTeam = (id: string) => {
    setTeams((prev) => {
      const deleted = prev.find((t) => t.id === id);
      const next = prev.filter((t) => t.id !== id);
      if (typeof window !== "undefined") {
        localStorage.setItem("cec_heist_teams_v1", JSON.stringify(next));
      }
      if (deleted) {
        handleAddLog({
          id: `LOG-${Date.now()}`,
          timestamp: new Date().toTimeString().split(" ")[0],
          type: "system_alert",
          message: `Squad ${deleted.name} (${id}) revoked from tournament`,
        });
      }
      return next;
    });
  };

  const handleDeleteAllTeams = () => {
    setTeams([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("cec_heist_teams_v1");
    }
    handleAddLog({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toTimeString().split(" ")[0],
      type: "system_alert",
      message: "Squad roster purged. All team registrations cleared.",
    });
  };

  // Quick modals
  const handleOpenAddTeam = () => {
    setActiveTab("teams");
  };

  const handleOpenAddChallenge = () => {
    setActiveTab("challenges");
    setIsDeployModalRequested(true);
  };

  // Auth Handlers
  const handleLoginSuccess = (email: string) => {
    setAdminEmail(email);
    setIsAuthenticated(true);
    const newLog: ActivityLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toTimeString().split(" ")[0],
      type: "system_alert",
      message: `Commander session established for ${email}`,
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const handleConfirmLogout = () => {
    playVaultTransitionSound("left-to-right");
    clearAuthTokens();
    setIsAuthenticated(false);
    setIsLogoutModalOpen(false);
    setActiveTab("overview");
  };

  // Prevent SSR/Client hydration mismatch
  if (!isMounted) {
    return (
      <main
        className="crt-screen admin-screen-container"
        style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}
      >
        <div className="font-pixel" style={{ color: "#00f0ff", fontSize: "1.1rem" }}>
          {"// INITIALIZING COMMAND MATRIX..."}
        </div>
      </main>
    );
  }

  // 1. If not authenticated, render the Admin Login Terminal
  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. If authenticated, render Admin Dashboard Layout
  return (
    <>
      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        title="TERMINATE COMMAND SESSION"
        message="Are you sure you want to log out of the CEC HEIST Admin Terminal? Local simulated session state will reset upon logout."
        confirmLabel="Logout Terminal"
        type="danger"
        onConfirm={handleConfirmLogout}
        onClose={() => setIsLogoutModalOpen(false)}
      />

      <AdminLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        teamCount={teams.length}
        challengeCount={challenges.length}
        eventStatus={eventConfig.status}
        adminEmail={adminEmail || "admin@test.com"}
        onLogoutRequest={() => setIsLogoutModalOpen(true)}
      >
        {activeTab === "overview" && (
          <DashboardOverview
            teams={teams}
            challenges={challenges}
            logs={logs}
            eventConfig={eventConfig}
            onNavigateTab={setActiveTab}
            onOpenAddTeamModal={handleOpenAddTeam}
            onOpenAddChallengeModal={handleOpenAddChallenge}
          />
        )}

        {activeTab === "event-controls" && (
          <EventControls
            eventConfig={eventConfig}
            onUpdateEventConfig={setEventConfig}
            onAddLog={handleAddLog}
          />
        )}

        {activeTab === "challenges" && (
          <ChallengeManagement
            challenges={challenges}
            onAddChallenge={handleAddChallenge}
            onUpdateChallenge={handleUpdateChallenge}
            onDeleteChallenge={handleDeleteChallenge}
            onAddLog={handleAddLog}
            initialDeployModalOpen={isDeployModalRequested}
            onCloseInitialDeployModal={() => setIsDeployModalRequested(false)}
          />
        )}

        {activeTab === "teams" && (
          <TeamManagement
            teams={teams}
            onAddTeam={handleAddTeam}
            onAddTeams={handleAddTeams}
            onUpdateTeam={handleUpdateTeam}
            onDeleteTeam={handleDeleteTeam}
            onDeleteAllTeams={handleDeleteAllTeams}
            onAddLog={handleAddLog}
          />
        )}

        {/* Feature Placeholders for any other tabs */}
        {activeTab !== "overview" &&
          activeTab !== "event-controls" &&
          activeTab !== "challenges" &&
          activeTab !== "teams" && (
            <div
              className="overview-panel cyber-corners"
              style={{ padding: "3rem", textAlign: "center" }}
            >
              <h3 className="overview-title" style={{ fontSize: "1.4rem" }}>
                MODULE STANDBY: {activeTab.toUpperCase()}
              </h3>
              <p
                className="overview-subtitle"
                style={{ margin: "0.75rem 0 1.5rem 0" }}
              >
                {"// Ready for next feature implementation step."}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className="arena-enter-btn admin-submit-btn"
                style={{ maxWidth: "260px", margin: "0 auto" }}
              >
                [ RETURN TO OVERVIEW ]
              </button>
            </div>
          )}
      </AdminLayout>
    </>
  );
}
