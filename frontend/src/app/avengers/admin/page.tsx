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
import { getStoredUser, getAccessToken, clearAuthTokens } from "@/lib/api";

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
  // Session State (checks stored admin session on mount)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const user = getStoredUser();
    const token = getAccessToken();
    return Boolean(token && user && user.role === "admin");
  });

  const [adminEmail, setAdminEmail] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const user = getStoredUser();
    return user && user.role === "admin" ? user.email : "";
  });

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
