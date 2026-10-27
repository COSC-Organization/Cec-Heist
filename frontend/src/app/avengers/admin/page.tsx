"use client";

import React, { useState, useEffect } from "react";
import "./admin.css";

import { AdminLogin } from "./components/AdminLogin";
import { AdminLayout } from "./components/AdminLayout";
import { DashboardOverview } from "./components/DashboardOverview";
import { EventControls } from "./components/EventControls";
import { ChallengeManagement } from "./components/ChallengeManagement";
import { TeamManagement } from "./components/TeamManagement";
import { LeaderboardManagement } from "./components/LeaderboardManagement";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { playVaultTransitionSound } from "@/components/PixelTransition";

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
  // Session State (simulated client-side session)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  // Core Datasets
  const [teams, setTeams] = useState<Team[]>(() => {
    if (typeof window !== "undefined") {
      const savedTeams = localStorage.getItem("cec_heist_teams_v1");
      if (savedTeams) {
        try {
          const parsed = JSON.parse(savedTeams);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
    }
    return INITIAL_TEAMS;
  });
  const [challenges, setChallenges] = useState<Challenge[]>(() => {
    if (typeof window !== "undefined") {
      const savedV3 = localStorage.getItem("cec_heist_challenges_v3");
      if (savedV3) {
        try {
          const parsed = JSON.parse(savedV3);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
      const oldSaved = localStorage.getItem("cec_heist_challenges");
      if (oldSaved) {
        try {
          const parsed = JSON.parse(oldSaved);
          if (Array.isArray(parsed) && parsed.some((c: any) => c.id?.startsWith("CHAL-0"))) {
            localStorage.removeItem("cec_heist_challenges");
          }
        } catch {}
      }
    }
    return INITIAL_CHALLENGES;
  });

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
  const [isLeaderboardFrozen, setIsLeaderboardFrozen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("cec_heist_leaderboard_frozen") === "true";
    }
    return false;
  });
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


  // Leaderboard / Scorekeeper Handlers
  const handleToggleFreeze = (frozen: boolean) => {
    setIsLeaderboardFrozen(frozen);
    if (typeof window !== "undefined") {
      localStorage.setItem("cec_heist_leaderboard_frozen", String(frozen));
    }
    handleAddLog({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toTimeString().split(" ")[0],
      type: "system_alert",
      message: frozen
        ? "Leaderboard FROZEN. Public scoreboard locked to current standings."
        : "Leaderboard UNFROZEN. Real-time scoreboard streaming resumed.",
    });
  };

  const handleUpdateTeamScore = (
    teamId: string,
    deltaPoints: number,
    reason: string
  ) => {
    setTeams((prev) => {
      const next = prev.map((t) => {
        if (t.id === teamId) {
          const newScore = Math.max(0, (t.score || 0) + deltaPoints);
          return {
            ...t,
            score: newScore,
            lastActive: new Date().toTimeString().split(" ")[0],
          };
        }
        return t;
      });

      const sorted = [...next].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
        return a.id.localeCompare(b.id);
      });
      const reRanked = sorted.map((t, idx) => ({ ...t, rank: idx + 1 }));

      if (typeof window !== "undefined") {
        localStorage.setItem("cec_heist_teams_v1", JSON.stringify(reRanked));
      }
      return reRanked;
    });

    const targetTeam = teams.find((t) => t.id === teamId);
    handleAddLog({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toTimeString().split(" ")[0],
      type: deltaPoints >= 0 ? "flag_solved" : "system_alert",
      message: `Score adjustment for ${targetTeam?.name || teamId}: ${deltaPoints > 0 ? "+" : ""}${deltaPoints} PTS. Reason: ${reason}`,
    });
  };

  const handleResetTeamScore = (teamId: string) => {
    setTeams((prev) => {
      const next = prev.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            score: 0,
            solvedCount: 0,
            lastActive: "Idle",
          };
        }
        return t;
      });

      const sorted = [...next].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
        return a.id.localeCompare(b.id);
      });
      const reRanked = sorted.map((t, idx) => ({ ...t, rank: idx + 1 }));

      if (typeof window !== "undefined") {
        localStorage.setItem("cec_heist_teams_v1", JSON.stringify(reRanked));
      }
      return reRanked;
    });

    const targetTeam = teams.find((t) => t.id === teamId);
    handleAddLog({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toTimeString().split(" ")[0],
      type: "system_alert",
      message: `Score reset to 0 PTS for squad ${targetTeam?.name || teamId}`,
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
    setIsAuthenticated(false);
    setIsLogoutModalOpen(false);
    setActiveTab("overview");
  };

  // 1. If not authenticated, render the Admin Login Terminal
  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. If authenticated, render Admin Dashboard Layout with Feature 1: Overview
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
        adminEmail={adminEmail || "admin@cecheist.internal"}
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

        {/* Feature Placeholders ready to build next */}
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
        {activeTab === "leaderboard" && (
          <LeaderboardManagement
            teams={teams}
            challenges={challenges}
            isFrozen={isLeaderboardFrozen}
            onToggleFreeze={handleToggleFreeze}
            onUpdateTeamScore={handleUpdateTeamScore}
            onResetTeamScore={handleResetTeamScore}
            onAddLog={handleAddLog}
            onNavigateToTeams={() => setActiveTab("teams")}
          />
        )}
        {activeTab !== "overview" &&
          activeTab !== "event-controls" &&
          activeTab !== "challenges" &&
          activeTab !== "teams" &&
          activeTab !== "leaderboard" && (
          <div className="overview-panel cyber-corners" style={{ padding: "3rem", textAlign: "center" }}>
            <h3 className="overview-title" style={{ fontSize: "1.4rem" }}>
              MODULE STANDBY: {String(activeTab).toUpperCase()}
            </h3>
            <p className="overview-subtitle" style={{ margin: "0.75rem 0 1.5rem 0" }}>
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
