"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ActivityIcon,
  SettingsIcon,
  UsersIcon,
  FlagIcon,
  TrophyIcon,
  GlobeIcon,
  CrosshairIcon,
  LogoutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
} from "./CyberIcons";
import { AdminTab } from "../data/mockData";

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  teamCount: number;
  challengeCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogoutRequest: () => void;
  adminEmail?: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onTabChange,
  teamCount,
  challengeCount,
  isCollapsed,
  onToggleCollapse,
  onLogoutRequest,
  adminEmail = "admin@cecheist.internal",
}) => {
  return (
    <aside className={`admin-sidebar ${isCollapsed ? "is-collapsed" : ""}`}>
      {/* Top Sidebar Header & Brand */}
      <div className="admin-sidebar-header">
        <div className="admin-sidebar-brand">
          <Image
            src="/cosc%20logo.png"
            alt="COSC"
            width={26}
            height={26}
            className="admin-brand-icon"
            priority
          />
          {!isCollapsed && (
            <div className="admin-sidebar-brand-text">
              <span className="brand-title">CEC HEIST</span>
              <span className="brand-subtitle">ADMIN CORE 2K26</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="admin-collapse-toggle-btn"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
      </div>

      {/* Primary Navigation Section */}
      <div className="admin-nav-section">
        {!isCollapsed && <div className="admin-nav-heading">{"// CORE MODULES"}</div>}
        <nav className="admin-nav-menu">
          {/* 1. Overview */}
          <button
            type="button"
            className={`admin-nav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => onTabChange("overview")}
            title="Overview"
          >
            <ActivityIcon className="nav-icon" />
            {!isCollapsed && <span className="nav-label">Overview</span>}
            {activeTab === "overview" && <span className="nav-active-pill" />}
          </button>

          {/* 2. Event Controls */}
          <button
            type="button"
            className={`admin-nav-item ${activeTab === "event-controls" ? "active" : ""}`}
            onClick={() => onTabChange("event-controls")}
            title="Event Controls"
          >
            <SettingsIcon className="nav-icon" />
            {!isCollapsed && <span className="nav-label">Event Controls</span>}
            {activeTab === "event-controls" && <span className="nav-active-pill" />}
          </button>

          {/* 3. Teams */}
          <button
            type="button"
            className={`admin-nav-item ${activeTab === "teams" ? "active" : ""}`}
            onClick={() => onTabChange("teams")}
            title="Teams"
          >
            <UsersIcon className="nav-icon" />
            {!isCollapsed && (
              <>
                <span className="nav-label">Teams</span>
                <span className="nav-count-badge">{teamCount}</span>
              </>
            )}
            {activeTab === "teams" && <span className="nav-active-pill" />}
          </button>

          {/* 4. Challenges */}
          <button
            type="button"
            className={`admin-nav-item ${activeTab === "challenges" ? "active" : ""}`}
            onClick={() => onTabChange("challenges")}
            title="Challenges"
          >
            <FlagIcon className="nav-icon" />
            {!isCollapsed && (
              <>
                <span className="nav-label">Challenges</span>
                <span className="nav-count-badge">{challengeCount}</span>
              </>
            )}
            {activeTab === "challenges" && <span className="nav-active-pill" />}
          </button>

          {/* 5. Leaderboard */}
          <button
            type="button"
            className={`admin-nav-item ${activeTab === "leaderboard" ? "active" : ""}`}
            onClick={() => onTabChange("leaderboard")}
            title="Leaderboard"
          >
            <TrophyIcon className="nav-icon" />
            {!isCollapsed && <span className="nav-label">Leaderboard</span>}
            {activeTab === "leaderboard" && <span className="nav-active-pill" />}
          </button>
        </nav>
      </div>

      {/* External Links Section */}
      <div className="admin-nav-section external-section">
        {!isCollapsed && <div className="admin-nav-heading">{"// PUBLIC NODES"}</div>}
        <nav className="admin-nav-menu">
          <Link
            href="/arena"
            className="admin-nav-item external-link"
            target="_blank"
            rel="noopener noreferrer"
            title="Open Participant Arena"
          >
            <CrosshairIcon className="nav-icon" />
            {!isCollapsed && (
              <>
                <span className="nav-label">Arena Portal</span>
                <ExternalLinkIcon className="ext-icon" />
              </>
            )}
          </Link>

          <Link
            href="/"
            className="admin-nav-item external-link"
            target="_blank"
            rel="noopener noreferrer"
            title="View Public Homepage"
          >
            <GlobeIcon className="nav-icon" />
            {!isCollapsed && (
              <>
                <span className="nav-label">Public Website</span>
                <ExternalLinkIcon className="ext-icon" />
              </>
            )}
          </Link>
        </nav>
      </div>

      {/* Sidebar Footer — Operator Status & Logout */}
      <div className="admin-sidebar-footer">
        {!isCollapsed ? (
          <div className="admin-operator-box">
            <div className="operator-role">{"// COMMANDER NODE"}</div>
            <div className="operator-email" title={adminEmail}>
              {adminEmail}
            </div>
            <div className="operator-status">
              <span className="status-dot-green" />
              <span>CLEARANCE: LEVEL 9</span>
            </div>
          </div>
        ) : (
          <div className="operator-avatar-collapsed" title={adminEmail}>
            <span className="status-dot-green" />
          </div>
        )}

        <button
          type="button"
          onClick={onLogoutRequest}
          className="admin-sidebar-logout-btn"
          title="Terminate Admin Session"
        >
          <LogoutIcon className="logout-icon" />
          {!isCollapsed && <span>TERMINATE SESSION</span>}
        </button>
      </div>
    </aside>
  );
};
