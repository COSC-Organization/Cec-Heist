"use client";

import React from "react";
import {
  UsersIcon,
  FlagIcon,
  TrophyIcon,
  ActivityIcon,
  CrosshairIcon,
  SettingsIcon,
  PlusIcon,
  ChevronRightIcon,
} from "./CyberIcons";
import { Team, Challenge, ActivityLog, EventConfig, AdminTab } from "../data/mockData";

interface DashboardOverviewProps {
  teams: Team[];
  challenges: Challenge[];
  logs: ActivityLog[];
  eventConfig: EventConfig;
  onNavigateTab: (tab: AdminTab) => void;
  onOpenAddTeamModal: () => void;
  onOpenAddChallengeModal: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  teams,
  challenges,
  logs,
  eventConfig,
  onNavigateTab,
  onOpenAddTeamModal,
  onOpenAddChallengeModal,
}) => {
  const totalOperatives = teams.reduce((acc, team) => acc + team.members.length, 0);
  const totalPoints = challenges.reduce((acc, c) => acc + c.points, 0);
  const totalSolves = challenges.reduce((acc, c) => acc + c.solves, 0);
  const topTeams = [...teams].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <div className="admin-overview-container">
      {/* Overview Top Header Banner */}
      <div className="overview-header-row">
        <div>
          <h2 className="overview-title">COMMAND OVERVIEW</h2>
          <p className="overview-subtitle">
            {"// REAL-TIME ARENA TELEMETRY & SYSTEM HEALTH"}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="overview-quick-actions">
          <button
            type="button"
            onClick={onOpenAddTeamModal}
            className="overview-action-btn"
          >
            <PlusIcon className="w-4 h-4 text-white" />
            <span>Register Squad</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddChallengeModal}
            className="overview-action-btn"
          >
            <PlusIcon className="w-4 h-4 text-white" />
            <span>Deploy Challenge</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="overview-stats-grid">
        {/* Card 1: Registered Squads */}
        <div className="overview-stat-card cyber-corners">
          <div className="stat-card-top">
            <span className="stat-label">REGISTERED SQUADS</span>
            <UsersIcon className="stat-icon text-cyan" />
          </div>
          <div className="stat-value">{teams.length}</div>
          <div className="stat-meta">
            <span className="meta-badge-green">● VERIFIED</span>
            <span className="meta-sub">Active in grid</span>
          </div>
        </div>

        {/* Card 2: Field Operatives */}
        <div className="overview-stat-card cyber-corners">
          <div className="stat-card-top">
            <span className="stat-label">FIELD OPERATIVES</span>
            <CrosshairIcon className="stat-icon text-white" />
          </div>
          <div className="stat-value">{totalOperatives}</div>
          <div className="stat-meta">
            <span className="meta-badge-neutral">
              Avg {(totalOperatives / (teams.length || 1)).toFixed(1)} / squad
            </span>
            <span className="meta-sub">Authenticated</span>
          </div>
        </div>

        {/* Card 3: Active Challenges */}
        <div className="overview-stat-card cyber-corners">
          <div className="stat-card-top">
            <span className="stat-label">ACTIVE CHALLENGES</span>
            <FlagIcon className="stat-icon text-yellow" />
          </div>
          <div className="stat-value">{challenges.length}</div>
          <div className="stat-meta">
            <span className="meta-badge-yellow">{totalSolves} Solves</span>
            <span className="meta-sub">Across 4 sectors</span>
          </div>
        </div>

        {/* Card 4: Total Points Pool */}
        <div className="overview-stat-card cyber-corners">
          <div className="stat-card-top">
            <span className="stat-label">POINTS IN ARENA</span>
            <TrophyIcon className="stat-icon text-green" />
          </div>
          <div className="stat-value">{totalPoints.toLocaleString()}</div>
          <div className="stat-meta">
            <span className="meta-badge-green">
              Top: {topTeams[0]?.score.toLocaleString() || "0"}
            </span>
            <span className="meta-sub">Scored pool</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Competition Status & Activity Stream */}
      <div className="overview-middle-grid">
        {/* Panel A: Live Event Status */}
        <div className="overview-panel status-panel cyber-corners">
          <div className="panel-header">
            <div className="panel-header-title">
              <SettingsIcon className="w-4 h-4 text-white" />
              <span>ARENA OPERATION STATUS</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("event-controls")}
              className="panel-link-btn"
            >
              <span>Controls</span>
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="status-display-box">
            <div className="status-indicator-row">
              <span className="status-label-meta">EVENT STATE:</span>
              <span
                className={`status-pill ${
                  eventConfig.status === "LIVE"
                    ? "status-pill-live"
                    : eventConfig.status === "NOT STARTED"
                    ? "status-pill-waiting"
                    : "status-pill-ended"
                }`}
              >
                ● {eventConfig.status}
              </span>
            </div>

            <div className="status-info-rows font-mono">
              <div className="info-row">
                <span className="info-key">OPERATION:</span>
                <span className="info-val">CEC HEIST 2K26</span>
              </div>
              <div className="info-row">
                <span className="info-key">MAX POOL:</span>
                <span className="info-val text-green">{eventConfig.totalPoints.toLocaleString()} PTS</span>
              </div>
              <div className="info-row">
                <span className="info-key">START TIME:</span>
                <span className="info-val">{new Date(eventConfig.startTime).toUTCString()}</span>
              </div>
              <div className="info-row">
                <span className="info-key">EST. CONCLUSION:</span>
                <span className="info-val">{new Date(eventConfig.endTime).toUTCString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel B: Top 5 Squads Preview */}
        <div className="overview-panel top-teams-panel cyber-corners">
          <div className="panel-header">
            <div className="panel-header-title">
              <TrophyIcon className="w-4 h-4 text-white" />
              <span>TOP SQUADS PREVIEW</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("leaderboard")}
              className="panel-link-btn"
            >
              <span>Full Board</span>
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="top-teams-table-wrap">
            <table className="overview-mini-table">
              <thead>
                <tr>
                  <th className="th-rank">RANK</th>
                  <th className="th-name">SQUAD</th>
                  <th className="th-solves">SOLVES</th>
                  <th className="th-score">SCORE</th>
                </tr>
              </thead>
              <tbody>
                {topTeams.map((team, idx) => (
                  <tr key={team.id} className={`mini-table-row row-${idx + 1}`}>
                    <td className="td-rank">#{idx + 1}</td>
                    <td className="td-name font-mono">{team.name}</td>
                    <td className="td-solves">{team.solvedCount} / {challenges.length}</td>
                    <td className="td-score font-mono">{team.score.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Live Activity Feed */}
      <div className="overview-panel log-feed-panel cyber-corners">
        <div className="panel-header">
          <div className="panel-header-title">
            <ActivityIcon className="w-4 h-4 text-white" />
            <span>REAL-TIME TELEMETRY FEED</span>
          </div>
          <span className="font-mono text-xs text-muted">LIVE SOCKET LINKED</span>
        </div>

        <div className="log-feed-list font-mono">
          {logs.map((log) => (
            <div key={log.id} className="log-feed-item">
              <span className="log-time">[{log.timestamp}]</span>
              <span
                className={`log-badge ${
                  log.type === "flag_solved"
                    ? "badge-solved"
                    : log.type === "team_register"
                    ? "badge-register"
                    : log.type === "system_alert"
                    ? "badge-alert"
                    : "badge-status"
                }`}
              >
                {log.type.toUpperCase()}
              </span>
              <span className="log-msg">
                {log.teamName && <span className="log-team-tag">[{log.teamName}] </span>}
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
