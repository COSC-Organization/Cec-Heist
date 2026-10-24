"use client";

import React, { useState } from "react";
import "./admin.css";

import { AdminLogin } from "./components/AdminLogin";
import { AdminLayout } from "./components/AdminLayout";
import { DashboardOverview } from "./components/DashboardOverview";
import { EventControls } from "./components/EventControls";
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
  const [teams] = useState<Team[]>(INITIAL_TEAMS);
  const [challenges] = useState<Challenge[]>(INITIAL_CHALLENGES);
  const [logs, setLogs] = useState<ActivityLog[]>(INITIAL_LOGS);
  const [eventConfig, setEventConfig] = useState<EventConfig>(INITIAL_EVENT_CONFIG);

  const handleAddLog = (newLog: ActivityLog) => {
    setLogs((prev) => [newLog, ...prev]);
  };

  // Quick modals placeholder (will connect with Feature 2 & 3)
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

        {/* Feature Placeholders ready to build next */}
        {activeTab !== "overview" && activeTab !== "event-controls" && (
          <div className="overview-panel cyber-corners" style={{ padding: "3rem", textAlign: "center" }}>
            <h3 className="overview-title" style={{ fontSize: "1.4rem" }}>
              MODULE STANDBY: {activeTab.toUpperCase()}
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
