"use client";

import React, { useState, useEffect } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTab } from "../data/mockData";
import { MenuIcon, TerminalIcon, LogoutIcon } from "./CyberIcons";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  teamCount: number;
  challengeCount: number;
  eventStatus: "NOT STARTED" | "LIVE" | "ENDED";
  adminEmail: string;
  onLogoutRequest: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  teamCount,
  challengeCount,
  eventStatus,
  adminEmail,
  onLogoutRequest,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [clockStr, setClockStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClockStr(
        now.toTimeString().split(" ")[0] + " UTC " + (now.getTimezoneOffset() <= 0 ? "+" : "-")
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const tabTitles: Record<AdminTab, string> = {
    overview: "SYSTEM TELEMETRY // OVERVIEW",
    "event-controls": "OPERATION COMMAND // EVENT CONTROLS",
    teams: "SQUAD DIRECTORY // TEAM MANAGEMENT",
    challenges: "ARENA ARSENAL // CHALLENGE REPOSITORY",
    leaderboard: "GLOBAL SCORING // LIVE LEADERBOARD",
  };

  return (
    <div className="admin-dashboard-root">
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="admin-mobile-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop Collapsible & Mobile Drawer) */}
      <div className={`admin-sidebar-wrapper ${isMobileMenuOpen ? "mobile-open" : ""}`}>
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            onTabChange(tab);
            setIsMobileMenuOpen(false);
          }}
          teamCount={teamCount}
          challengeCount={challengeCount}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onLogoutRequest={onLogoutRequest}
          adminEmail={adminEmail}
        />
      </div>

      {/* Main Content Area with Topbar */}
      <div className={`admin-main-wrapper ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        {/* Top Header Bar */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="topbar-mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              <MenuIcon className="w-5 h-5 text-white" />
            </button>

            <div className="topbar-breadcrumbs">
              <TerminalIcon className="w-4 h-4 text-white" />
              <span className="breadcrumb-path">NODE 01</span>
              <span className="breadcrumb-divider">/</span>
              <span className="breadcrumb-current">{tabTitles[activeTab]}</span>
            </div>
          </div>

          <div className="topbar-right">
            {/* Live Competition Indicator */}
            <div className="topbar-event-pill">
              <span
                className={`event-dot ${
                  eventStatus === "LIVE"
                    ? "dot-live"
                    : eventStatus === "NOT STARTED"
                    ? "dot-waiting"
                    : "dot-ended"
                }`}
              />
              <span className="event-label">{eventStatus}</span>
            </div>

            {/* Live Clock */}
            {clockStr && (
              <div className="topbar-clock font-mono">
                <span>{clockStr}</span>
              </div>
            )}

            {/* Quick Logout Button */}
            <button
              type="button"
              onClick={onLogoutRequest}
              className="topbar-quick-logout"
              title="Terminate Admin Session"
            >
              <LogoutIcon className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">LOGOUT</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content Viewport */}
        <main className="admin-content-viewport">{children}</main>
      </div>
    </div>
  );
};
