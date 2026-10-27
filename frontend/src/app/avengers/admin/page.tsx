"use client";

import React, { useState, useEffect } from "react";
import "./admin.css";

import { AdminLogin } from "./components/AdminLogin";
import { AdminLayout } from "./components/AdminLayout";
import { DashboardOverview } from "./components/DashboardOverview";
import { EventControls } from "./components/EventControls";
import { AdminTeams } from "./components/AdminTeams";
import { AdminChallenges } from "./components/AdminChallenges";
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
  const [teams] = useState<Team[]>(INITIAL_TEAMS);
  const [challenges] = useState<Challenge[]>(INITIAL_CHALLENGES);
  const [logs, setLogs] = useState<ActivityLog[]>(INITIAL_LOGS);
  const [eventConfig, setEventConfig] = useState<EventConfig>(INITIAL_EVENT_CONFIG);

  const handleAddLog = (newLog: ActivityLog) => {
    setLogs((prev) => [newLog, ...prev]);
  };

  const handleOpenAddTeam = () => {
    setActiveTab("teams");
  };

  const handleOpenAddChallenge = () => {
    setActiveTab("challenges");
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

        {activeTab === "teams" && <AdminTeams />}

        {activeTab === "challenges" && <AdminChallenges />}

        {/* Feature Placeholders for any other tabs */}
        {activeTab !== "overview" &&
          activeTab !== "event-controls" &&
          activeTab !== "teams" &&
          activeTab !== "challenges" && (
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
