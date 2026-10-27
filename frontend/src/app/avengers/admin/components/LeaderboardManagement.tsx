"use client";

import React, { useState, useMemo } from "react";
import { Team, ActivityLog, Challenge } from "../data/mockData";
import { ConfirmationModal } from "./ConfirmationModal";
import {
  TrophyIcon,
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  PlusIcon,
  CloseIcon,
  ActivityIcon,
  ShieldIcon,
  UsersIcon,
} from "./CyberIcons";

interface LeaderboardManagementProps {
  teams: Team[];
  challenges: Challenge[];
  isFrozen: boolean;
  onToggleFreeze: (frozen: boolean) => void;
  onUpdateTeamScore: (
    teamId: string,
    deltaPoints: number,
    reason: string
  ) => void;
  onResetTeamScore: (teamId: string) => void;
  onAddLog: (log: ActivityLog) => void;
  onNavigateToTeams: () => void;
}

export const LeaderboardManagement: React.FC<LeaderboardManagementProps> = ({
  teams,
  challenges,
  isFrozen,
  onToggleFreeze,
  onUpdateTeamScore,
  onResetTeamScore,
  onAddLog,
  onNavigateToTeams,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [scoreFilter, setScoreFilter] = useState<"ALL" | "SCORED" | "ZERO">("ALL");

  // Modals State
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [adjustmentType, setAdjustmentType] = useState<"BONUS" | "PENALTY">("BONUS");
  const [pointDelta, setPointDelta] = useState<number | string>(50);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);

  // Freeze Confirmation Modal
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [pendingFreezeAction, setPendingFreezeAction] = useState<boolean>(false);

  // Reset Confirmation Modal
  const [teamToReset, setTeamToReset] = useState<Team | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Re-rank squads based on standard CTF rules:
  // 1. Score DESC
  // 2. Solved Count DESC
  // 3. ID ASC (deterministic tie-breaker)
  const rankedTeams = useMemo(() => {
    const sorted = [...teams].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
      return a.id.localeCompare(b.id);
    });

    return sorted.map((team, idx) => ({
      ...team,
      rank: idx + 1,
    }));
  }, [teams]);

  // Telemetry Calculations
  const totalScoredPoints = useMemo(
    () => teams.reduce((acc, t) => acc + (t.score || 0), 0),
    [teams]
  );
  const activeTeamsCount = useMemo(
    () => teams.filter((t) => (t.score || 0) > 0).length,
    [teams]
  );
  const apexSquad = rankedTeams.length > 0 && rankedTeams[0].score > 0 ? rankedTeams[0] : null;
  const maxSolves = useMemo(
    () => Math.max(0, ...teams.map((t) => t.solvedCount || 0)),
    [teams]
  );

  // Filtered Standings
  const filteredTeams = useMemo(() => {
    return rankedTeams.filter((t) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        q === "" ||
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.organization && t.organization.toLowerCase().includes(q)) ||
        (t.members &&
          t.members.some(
            (m) =>
              m.name.toLowerCase().includes(q) ||
              m.email.toLowerCase().includes(q)
          ));

      const matchStatus =
        statusFilter === "All" || t.registrationStatus === statusFilter;

      const matchScore =
        scoreFilter === "ALL" ||
        (scoreFilter === "SCORED" && t.score > 0) ||
        (scoreFilter === "ZERO" && t.score === 0);

      return matchSearch && matchStatus && matchScore;
    });
  }, [rankedTeams, searchQuery, statusFilter, scoreFilter]);

  // Handle Score Adjustment Submission
  const handleSubmitAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustmentError(null);

    const targetTeam = teams.find((t) => t.id === selectedTeamId);
    if (!targetTeam) {
      setAdjustmentError("Please select a valid squad from the tournament roster.");
      return;
    }

    const numericDelta = typeof pointDelta === "string" ? parseInt(pointDelta, 10) : pointDelta;
    if (isNaN(numericDelta) || numericDelta <= 0) {
      setAdjustmentError("Point delta must be a positive integer greater than 0.");
      return;
    }

    if (!adjustmentReason.trim()) {
      setAdjustmentError("A descriptive reason is required for audit logs.");
      return;
    }

    const appliedDelta = adjustmentType === "BONUS" ? numericDelta : -numericDelta;

    onUpdateTeamScore(
      selectedTeamId,
      appliedDelta,
      adjustmentReason.trim()
    );

    showToast(
      `${adjustmentType === "BONUS" ? "AWARDED +" : "DEDUCTED -"}${numericDelta} PTS for ${targetTeam.name}`
    );

    setIsAdjustmentModalOpen(false);
    setSelectedTeamId("");
    setPointDelta(50);
    setAdjustmentReason("");
  };

  // Quick Open Modal with Pre-selected Team and Mode
  const handleOpenQuickAdjust = (team: Team, type: "BONUS" | "PENALTY") => {
    setSelectedTeamId(team.id);
    setAdjustmentType(type);
    setPointDelta(type === "BONUS" ? 50 : 25);
    setAdjustmentReason(
      type === "BONUS"
        ? `First blood / rapid solve bonus for ${team.name}`
        : `Infraction penalty applied to ${team.name}`
    );
    setAdjustmentError(null);
    setIsAdjustmentModalOpen(true);
  };

  // Handle Freeze Confirmation
  const handleRequestToggleFreeze = () => {
    setPendingFreezeAction(!isFrozen);
    setIsFreezeModalOpen(true);
  };

  const handleConfirmToggleFreeze = () => {
    onToggleFreeze(pendingFreezeAction);
    setIsFreezeModalOpen(false);
    showToast(
      pendingFreezeAction
        ? "LEADERBOARD FROZEN // Public scoreboard is locked"
        : "LEADERBOARD UNFROZEN // Live scoreboard streaming resumed"
    );
  };

  // Handle Score Reset Confirmation
  const handleConfirmReset = () => {
    if (teamToReset) {
      onResetTeamScore(teamToReset.id);
      showToast(`Score reset to 0 PTS for squad ${teamToReset.name}`);
      setTeamToReset(null);
    }
  };

  // Export Standings to CSV
  const handleExportCSV = () => {
    if (rankedTeams.length === 0) {
      showToast("No squads to export.");
      return;
    }

    const headers = [
      "Rank",
      "Squad ID",
      "Squad Name",
      "Score (PTS)",
      "Solved Challenges",
      "Registration Status",
      "Organization",
      "Captain Name",
      "Captain Email",
      "Last Active",
    ];

    const rows = rankedTeams.map((t) => {
      const captain =
        t.members?.find((m) => m.role === "Captain") || t.members?.[0];
      return [
        t.rank,
        `"${t.id}"`,
        `"${t.name.replace(/"/g, '""')}"`,
        t.score,
        t.solvedCount,
        `"${t.registrationStatus}"`,
        `"${(t.organization || "").replace(/"/g, '""')}"`,
        `"${(captain?.name || "").replace(/"/g, '""')}"`,
        `"${(captain?.email || "").replace(/"/g, '""')}"`,
        `"${t.lastActive || "Idle"}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `cec_heist_leaderboard_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onAddLog({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toTimeString().split(" ")[0],
      type: "system_alert",
      message: `Exported official tournament leaderboard (${rankedTeams.length} squads) to CSV`,
    });
    showToast("Official standings exported to CSV");
  };

  return (
    <div className="admin-overview-container" style={{ gap: "2rem" }}>
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#00f3ff] text-[#040406] font-mono text-xs font-bold px-4 py-3 border border-white shadow-[0_0_20px_rgba(0,243,255,0.4)] flex items-center gap-2 animate-bounce">
          <span>&gt; [SYSTEM]:</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 1: HEADER & SCOREKEEPER CONTROLS                       */}
      {/* ============================================================== */}
      <div className="cec-panel-card cyber-corners" style={{ padding: "1.75rem 2rem" }}>
        <div className="overview-header-row" style={{ alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <TrophyIcon className="w-6 h-6 text-yellow" />
                <h2 className="overview-title" style={{ margin: 0, fontSize: "1.65rem" }}>
                  TOURNAMENT SCOREKEEPER // STANDINGS
                </h2>
              </div>
              {isFrozen ? (
                <span
                  className="status-pill status-pill-waiting font-pixel"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.85rem" }}
                >
                  <span className="w-2 h-2 rounded-full bg-yellow animate-ping inline-block" />
                  ❄️ LEADERBOARD FROZEN
                </span>
              ) : (
                <span
                  className="status-pill status-pill-live font-pixel"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.85rem" }}
                >
                  <span className="w-2 h-2 rounded-full bg-green inline-block animate-pulse" />
                  ● LIVE STREAMING
                </span>
              )}
            </div>
            <p className="overview-subtitle">
              {"// Real-time score validation, audit point adjustments, and freeze controls."}
            </p>
          </div>

          {/* Action Bar */}
          <div className="overview-quick-actions" style={{ gap: "0.85rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
            {/* Freeze Toggle Button */}
            <button
              type="button"
              onClick={handleRequestToggleFreeze}
              className="overview-action-btn"
              style={{
                borderColor: isFrozen ? "#f59e0b" : "rgba(245, 158, 11, 0.4)",
                color: isFrozen ? "#f59e0b" : "#ffffff",
                background: isFrozen ? "rgba(245, 158, 11, 0.15)" : "transparent",
              }}
              title={
                isFrozen
                  ? "Leaderboard is currently frozen for players. Click to unfreeze."
                  : "Freeze leaderboard for the final hour. Players will see frozen ranks."
              }
            >
              <span>{isFrozen ? "[ ▶️ UNFREEZE BOARD ]" : "[ ❄️ FREEZE LEADERBOARD ]"}</span>
            </button>

            {/* Adjust Score Button */}
            <button
              type="button"
              onClick={() => {
                if (teams.length > 0 && !selectedTeamId) {
                  setSelectedTeamId(teams[0].id);
                }
                setAdjustmentError(null);
                setIsAdjustmentModalOpen(true);
              }}
              disabled={teams.length === 0}
              className="overview-action-btn"
              style={{
                borderColor: "rgba(0, 243, 255, 0.5)",
                color: "#00f3ff",
                opacity: teams.length === 0 ? 0.4 : 1,
                cursor: teams.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              <span>[ ⚡ ADJUST SCORE ]</span>
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={teams.length === 0}
              className="overview-action-btn"
              style={{
                opacity: teams.length === 0 ? 0.4 : 1,
                cursor: teams.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              <DownloadIcon className="w-4 h-4 text-white" />
              <span>[ EXPORT STANDINGS ]</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION 2: 4 DISTINCT TELEMETRY CARDS (SPACED & STRUCTURED)    */}
      {/* ============================================================== */}
      <div className="overview-stats-grid">
        {/* Card 1: Apex Squad */}
        <div
          className="overview-stat-card cyber-corners"
          style={{
            borderColor: apexSquad ? "rgba(255, 215, 0, 0.5)" : "rgba(255, 255, 255, 0.22)",
            boxShadow: apexSquad ? "0 0 20px rgba(255, 215, 0, 0.1)" : undefined,
          }}
        >
          <div className="stat-card-top">
            <span className="stat-label">// 1ST PLACE (APEX)</span>
            <TrophyIcon className="stat-icon text-yellow" />
          </div>
          <div
            className="stat-value text-yellow"
            style={{ fontSize: "1.45rem", minHeight: "2.2rem", display: "flex", alignItems: "center" }}
          >
            {apexSquad ? apexSquad.name : "—"}
          </div>
          <div className="stat-meta">
            {apexSquad ? (
              <>
                <span className="meta-badge-green">● {apexSquad.score.toLocaleString()} PTS</span>
                <span className="meta-sub">{apexSquad.solvedCount} Solves</span>
              </>
            ) : (
              <span className="meta-sub">No scores recorded yet</span>
            )}
          </div>
        </div>

        {/* Card 2: Registered Squads */}
        <div className="overview-stat-card cyber-corners">
          <div className="stat-card-top">
            <span className="stat-label">// SQUADS ENLISTED</span>
            <UsersIcon className="stat-icon text-cyan" />
          </div>
          <div className="stat-value text-white">{teams.length}</div>
          <div className="stat-meta">
            <span className="meta-badge-green">● {activeTeamsCount} Scored</span>
            <span className="meta-sub">{teams.length - activeTeamsCount} at 0 PTS</span>
          </div>
        </div>

        {/* Card 3: Total Arena Points */}
        <div className="overview-stat-card cyber-corners">
          <div className="stat-card-top">
            <span className="stat-label">// ARENA POINTS SCORED</span>
            <ActivityIcon className="stat-icon text-cyan" />
          </div>
          <div className="stat-value text-cyan">
            {totalScoredPoints.toLocaleString()} PTS
          </div>
          <div className="stat-meta">
            <span className="meta-badge-neutral">
              {activeTeamsCount > 0
                ? `Avg: ${Math.round(totalScoredPoints / activeTeamsCount).toLocaleString()} PTS/active`
                : "Awaiting first solve"}
            </span>
          </div>
        </div>

        {/* Card 4: Challenges Available */}
        <div className="overview-stat-card cyber-corners">
          <div className="stat-card-top">
            <span className="stat-label">// TOURNAMENT ARENA</span>
            <ShieldIcon className="stat-icon text-white" />
          </div>
          <div className="stat-value text-white">
            {challenges.length} Vectors
          </div>
          <div className="stat-meta">
            <span className="meta-badge-neutral">Max Solves: {maxSolves}</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION 3: TOP 3 PODIUM CARDS (IF SQUADS >= 3 SCORED)          */}
      {/* ============================================================== */}
      {rankedTeams.length >= 3 && rankedTeams[0].score > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {/* Rank #2 (Silver) */}
          <div
            className="cec-panel-card cyber-corners"
            style={{
              borderColor: "rgba(192, 192, 192, 0.4)",
              background: "linear-gradient(180deg, rgba(192,192,192,0.06) 0%, rgba(10,12,18,0.9) 100%)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "1.5rem",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  className="font-pixel text-xs px-2.5 py-1 rounded"
                  style={{ background: "#c0c0c0", color: "#040406", fontWeight: "bold" }}
                >
                  🥈 2ND PLACE
                </span>
                <span className="font-mono text-xs text-muted">RANK #2</span>
              </div>
              <h3 className="font-pixel text-lg text-white mt-3 truncate" style={{ margin: "0.75rem 0 0.25rem 0" }}>
                {rankedTeams[1].name}
              </h3>
              <p className="font-mono text-xs text-muted" style={{ margin: 0 }}>
                {rankedTeams[1].organization || "Independent Operatives"}
              </p>
            </div>
            <div
              style={{
                marginTop: "1rem",
                paddingTop: "0.75rem",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span className="chal-points-badge" style={{ color: "#c0c0c0", borderColor: "#c0c0c0" }}>
                  <strong>{rankedTeams[1].score.toLocaleString()}</strong> PTS
                </span>
                <span className="font-mono text-xs text-muted" style={{ marginLeft: "0.5rem" }}>
                  {rankedTeams[1].solvedCount} Solves
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleOpenQuickAdjust(rankedTeams[1], "BONUS")}
                className="cec-action-btn"
                style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
              >
                + Bonus
              </button>
            </div>
          </div>

          {/* Rank #1 (Gold Apex) */}
          <div
            className="cec-panel-card cyber-corners"
            style={{
              borderColor: "rgba(255, 215, 0, 0.6)",
              background: "linear-gradient(180deg, rgba(255,215,0,0.1) 0%, rgba(10,12,18,0.95) 100%)",
              boxShadow: "0 0 25px rgba(255, 215, 0, 0.15)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "1.5rem",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  className="font-pixel text-xs px-3 py-1 rounded"
                  style={{ background: "#ffd700", color: "#040406", fontWeight: "bold" }}
                >
                  👑 1ST PLACE // APEX
                </span>
                <span className="font-mono text-xs text-yellow font-bold">RANK #1</span>
              </div>
              <h3 className="font-pixel text-xl text-yellow truncate" style={{ margin: "0.75rem 0 0.25rem 0" }}>
                {rankedTeams[0].name}
              </h3>
              <p className="font-mono text-xs text-muted" style={{ margin: 0 }}>
                {rankedTeams[0].organization || "Independent Operatives"}
              </p>
            </div>
            <div
              style={{
                marginTop: "1rem",
                paddingTop: "0.75rem",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span className="chal-points-badge" style={{ color: "#ffd700", borderColor: "#ffd700" }}>
                  <strong>{rankedTeams[0].score.toLocaleString()}</strong> PTS
                </span>
                <span className="font-mono text-xs text-yellow font-bold" style={{ marginLeft: "0.5rem" }}>
                  {rankedTeams[0].solvedCount} Solves
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleOpenQuickAdjust(rankedTeams[0], "BONUS")}
                className="cec-action-btn"
                style={{
                  padding: "0.25rem 0.6rem",
                  fontSize: "0.75rem",
                  borderColor: "#ffd700",
                  color: "#ffd700",
                }}
              >
                + Bonus
              </button>
            </div>
          </div>

          {/* Rank #3 (Bronze) */}
          <div
            className="cec-panel-card cyber-corners"
            style={{
              borderColor: "rgba(205, 127, 50, 0.4)",
              background: "linear-gradient(180deg, rgba(205,127,50,0.06) 0%, rgba(10,12,18,0.9) 100%)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "1.5rem",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  className="font-pixel text-xs px-2.5 py-1 rounded"
                  style={{ background: "#cd7f32", color: "#ffffff", fontWeight: "bold" }}
                >
                  🥉 3RD PLACE
                </span>
                <span className="font-mono text-xs text-muted">RANK #3</span>
              </div>
              <h3 className="font-pixel text-lg text-white mt-3 truncate" style={{ margin: "0.75rem 0 0.25rem 0" }}>
                {rankedTeams[2].name}
              </h3>
              <p className="font-mono text-xs text-muted" style={{ margin: 0 }}>
                {rankedTeams[2].organization || "Independent Operatives"}
              </p>
            </div>
            <div
              style={{
                marginTop: "1rem",
                paddingTop: "0.75rem",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span className="chal-points-badge" style={{ color: "#cd7f32", borderColor: "#cd7f32" }}>
                  <strong>{rankedTeams[2].score.toLocaleString()}</strong> PTS
                </span>
                <span className="font-mono text-xs text-muted" style={{ marginLeft: "0.5rem" }}>
                  {rankedTeams[2].solvedCount} Solves
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleOpenQuickAdjust(rankedTeams[2], "BONUS")}
                className="cec-action-btn"
                style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
              >
                + Bonus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 4: FULL STANDINGS TABLE                                */}
      {/* ============================================================== */}
      <div className="cec-panel-card cyber-corners" style={{ padding: "1.75rem 2rem" }}>
        <div className="cec-panel-header">
          <div className="panel-title-wrap">
            <TrophyIcon className="w-5 h-5 text-yellow" />
            <h3 className="cec-panel-title">OFFICIAL TOURNAMENT STANDINGS</h3>
            <span className="cec-count-badge">{teams.length} SQUADS</span>
          </div>

          <div className="cec-telemetry-strip">
            <span className="telemetry-item">
              // TIE-BREAKER: <strong className="text-cyan">SCORE → SOLVES → TIME</strong>
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="cec-filter-bar">
          <div className="cec-search-box">
            <SearchIcon className="w-4 h-4 text-gray" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search squad name, captain, email, or institution..."
              className="cec-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="cec-clear-search-btn"
                aria-label="Clear search"
              >
                <CloseIcon />
              </button>
            )}
          </div>

          <div className="cec-filters-wrap">
            {/* Status Filter */}
            <div className="filter-select-group">
              <FilterIcon className="w-3.5 h-3.5 text-gray" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="cec-filter-select"
              >
                <option value="All">All Statuses</option>
                <option value="VERIFIED">Verified Only</option>
                <option value="PENDING">Pending Only</option>
                <option value="FLAGGED">Flagged Only</option>
              </select>
            </div>

            {/* Score Tier Filter */}
            <div className="filter-select-group">
              <select
                value={scoreFilter}
                onChange={(e) =>
                  setScoreFilter(e.target.value as "ALL" | "SCORED" | "ZERO")
                }
                className="cec-filter-select"
              >
                <option value="ALL">All Scores</option>
                <option value="SCORED">Scored (&gt; 0 PTS)</option>
                <option value="ZERO">Zero Points (0 PTS)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Standings Table Content */}
        <div className="cec-table-responsive" style={{ marginTop: "1rem" }}>
          <table className="cec-data-table">
            <thead>
              <tr>
                <th style={{ width: "90px", textAlign: "center" }}>RANK</th>
                <th style={{ minWidth: "240px" }}>SQUAD &amp; INSTITUTION</th>
                <th style={{ minWidth: "180px" }}>CAPTAIN</th>
                <th style={{ width: "130px", textAlign: "center" }}>SOLVES</th>
                <th style={{ width: "130px", textAlign: "center" }}>LAST SOLVE</th>
                <th style={{ width: "130px", textAlign: "center" }}>TOTAL SCORE</th>
                <th style={{ width: "200px", textAlign: "center" }}>AUDIT ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {teams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="cec-empty-state-cell">
                    <div className="empty-state-terminal" style={{ padding: "2.5rem 1.5rem" }}>
                      <div className="terminal-prompt-line">
                        <span className="text-yellow">&gt; [SYSTEM: TOURNAMENT STANDINGS EMPTY]</span>
                      </div>
                      <p className="empty-main-text" style={{ margin: "0.75rem 0" }}>
                        ZERO SQUADS ENLISTED IN ARENA DATABASE.
                      </p>
                      <p className="empty-sub-text" style={{ margin: "0 0 1.25rem 0" }}>
                        Ingest squads via Excel (.xlsx) / CSV or manual registration in the <strong>Teams</strong> section to populate the tournament leaderboard.
                      </p>
                      <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
                        <button
                          type="button"
                          onClick={onNavigateToTeams}
                          className="cec-submit-btn"
                          style={{ minWidth: "auto", height: "42px", padding: "0.6rem 1.4rem" }}
                        >
                          [ GO TO SQUADS SECTION ]
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="cec-empty-state-cell">
                    <div className="empty-state-terminal" style={{ padding: "2rem" }}>
                      <p className="empty-main-text">
                        // NO SQUADS MATCH FILTER CRITERIA
                      </p>
                      <p className="empty-sub-text">
                        Try resetting your search query or score tier filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTeams.map((team) => {
                  const captain =
                    team.members?.find((m) => m.role === "Captain") ||
                    team.members?.[0];

                  const isTopOne = team.rank === 1 && team.score > 0;
                  const isTopTwo = team.rank === 2 && team.score > 0;
                  const isTopThree = team.rank === 3 && team.score > 0;

                  return (
                    <tr
                      key={team.id}
                      className="cec-table-row"
                      style={{
                        backgroundColor: isTopOne
                          ? "rgba(255, 215, 0, 0.04)"
                          : isTopTwo
                          ? "rgba(192, 192, 192, 0.03)"
                          : isTopThree
                          ? "rgba(205, 127, 50, 0.03)"
                          : undefined,
                      }}
                    >
                      {/* RANK */}
                      <td style={{ textAlign: "center" }}>
                        {isTopOne ? (
                          <span
                            className="font-pixel text-xs px-2.5 py-1 rounded inline-block font-bold"
                            style={{ background: "#ffd700", color: "#040406" }}
                          >
                            #1
                          </span>
                        ) : isTopTwo ? (
                          <span
                            className="font-pixel text-xs px-2 py-1 rounded inline-block"
                            style={{ background: "#c0c0c0", color: "#040406" }}
                          >
                            #2
                          </span>
                        ) : isTopThree ? (
                          <span
                            className="font-pixel text-xs px-2 py-1 rounded inline-block"
                            style={{ background: "#cd7f32", color: "#ffffff" }}
                          >
                            #3
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-muted font-bold">
                            #{team.rank}
                          </span>
                        )}
                      </td>

                      {/* SQUAD & INSTITUTION */}
                      <td className="cell-challenge-title">
                        <div className="chal-primary-title flex items-center gap-2">
                          <span>{team.name}</span>
                          {team.registrationStatus === "FLAGGED" && (
                            <span className="cec-category-badge cat-misc" style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem" }}>
                              FLAGGED
                            </span>
                          )}
                        </div>
                        {team.organization && (
                          <div className="chal-brief-text text-muted">
                            🏛️ {team.organization}
                          </div>
                        )}
                        <div className="chal-flag-chip">
                          <span className="flag-label">ID:</span>
                          <code>{team.id}</code>
                        </div>
                      </td>

                      {/* CAPTAIN */}
                      <td>
                        <div style={{ color: "#ffffff", fontWeight: 600 }}>
                          {captain?.name || "Unassigned"}
                        </div>
                        <div style={{ color: "#71717a", fontSize: "0.75rem" }}>
                          {captain?.email || "—"}
                        </div>
                      </td>

                      {/* SOLVES */}
                      <td style={{ textAlign: "center" }}>
                        <div className="font-mono text-sm font-bold text-white">
                          {team.solvedCount}
                          {challenges.length > 0 && (
                            <span className="text-muted text-xs font-normal">
                              {" "}/ {challenges.length}
                            </span>
                          )}
                        </div>
                        {challenges.length > 0 && (
                          <div
                            style={{
                              width: "80px",
                              height: "4px",
                              backgroundColor: "rgba(255,255,255,0.1)",
                              borderRadius: "2px",
                              margin: "0.35rem auto 0",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.min(
                                  100,
                                  (team.solvedCount / challenges.length) * 100
                                )}%`,
                                height: "100%",
                                backgroundColor: isTopOne ? "#ffd700" : "#00f3ff",
                              }}
                            />
                          </div>
                        )}
                      </td>

                      {/* LAST SOLVE */}
                      <td style={{ textAlign: "center" }}>
                        <span className="font-mono text-xs text-muted">
                          {team.lastActive || "Idle"}
                        </span>
                      </td>

                      {/* TOTAL SCORE */}
                      <td style={{ textAlign: "center" }}>
                        <span
                          className="chal-points-badge"
                          style={{
                            borderColor: isTopOne
                              ? "#ffd700"
                              : isTopTwo
                              ? "#c0c0c0"
                              : isTopThree
                              ? "#cd7f32"
                              : "#00f3ff",
                            color: isTopOne
                              ? "#ffd700"
                              : isTopTwo
                              ? "#c0c0c0"
                              : isTopThree
                              ? "#cd7f32"
                              : "#ffffff",
                          }}
                        >
                          <strong>{team.score.toLocaleString()}</strong> PTS
                        </span>
                      </td>

                      {/* AUDIT ACTIONS */}
                      <td style={{ textAlign: "center" }}>
                        <div className="cec-actions-flex" style={{ justifyContent: "center" }}>
                          {/* Bonus button */}
                          <button
                            type="button"
                            onClick={() => handleOpenQuickAdjust(team, "BONUS")}
                            className="cec-action-btn"
                            style={{
                              borderColor: "rgba(0, 243, 255, 0.4)",
                              color: "#00f3ff",
                              padding: "0.25rem 0.5rem",
                              fontSize: "0.75rem",
                            }}
                            title="Award bonus points"
                          >
                            + Bonus
                          </button>

                          {/* Penalty button */}
                          <button
                            type="button"
                            onClick={() => handleOpenQuickAdjust(team, "PENALTY")}
                            className="cec-action-btn"
                            style={{
                              borderColor: "rgba(255, 85, 85, 0.4)",
                              color: "#ff5555",
                              padding: "0.25rem 0.5rem",
                              fontSize: "0.75rem",
                            }}
                            title="Deduct penalty points"
                          >
                            - Penalty
                          </button>

                          {/* Reset button */}
                          <button
                            type="button"
                            onClick={() => setTeamToReset(team)}
                            className="cec-action-btn btn-delete"
                            style={{
                              padding: "0.25rem 0.45rem",
                              fontSize: "0.75rem",
                            }}
                            title="Reset squad score to 0"
                          >
                            ↺
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: SCORE ADJUSTMENT MODAL                                */}
      {/* ============================================================== */}
      {isAdjustmentModalOpen && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setIsAdjustmentModalOpen(false)}
        >
          <div
            className="admin-modal-card cyber-corners"
            style={{ maxWidth: "560px", width: "95vw" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal-header">
              <div className="modal-title-wrap">
                <TrophyIcon className="w-5 h-5 text-yellow" />
                <h3 className="modal-title">[ AUDIT ] MANUAL SCORE ADJUSTMENT</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="modal-close-btn"
                aria-label="Close modal"
              >
                <CloseIcon className="w-4 h-4 text-white" />
              </button>
            </div>

            <form
              onSubmit={handleSubmitAdjustment}
              noValidate
              className="admin-modal-body flex flex-col gap-4"
            >
              {adjustmentError && (
                <div className="cec-cyber-alert alert-error">
                  <span>⚠️ {adjustmentError}</span>
                </div>
              )}

              {/* Target Squad */}
              <div className="form-group">
                <label className="cec-field-label">TARGET SQUAD *</label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="cec-terminal-input"
                  required
                >
                  <option value="" disabled>
                    -- Select Squad from Roster --
                  </option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.score} PTS) [{t.id}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Adjustment Type Toggle */}
              <div className="form-group">
                <label className="cec-field-label">ADJUSTMENT ACTION *</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType("BONUS")}
                    className="cec-action-btn"
                    style={{
                      height: "44px",
                      borderColor:
                        adjustmentType === "BONUS" ? "#00f3ff" : "rgba(255,255,255,0.2)",
                      background:
                        adjustmentType === "BONUS" ? "rgba(0,243,255,0.15)" : "transparent",
                      color: adjustmentType === "BONUS" ? "#00f3ff" : "#ffffff",
                    }}
                  >
                    <span>[ + ] AWARD BONUS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustmentType("PENALTY")}
                    className="cec-action-btn"
                    style={{
                      height: "44px",
                      borderColor:
                        adjustmentType === "PENALTY" ? "#ff5555" : "rgba(255,255,255,0.2)",
                      background:
                        adjustmentType === "PENALTY" ? "rgba(255,85,85,0.15)" : "transparent",
                      color: adjustmentType === "PENALTY" ? "#ff5555" : "#ffffff",
                    }}
                  >
                    <span>[ - ] DEDUCT PENALTY</span>
                  </button>
                </div>
              </div>

              {/* Point Delta */}
              <div className="form-group">
                <label className="cec-field-label">
                  POINTS {adjustmentType === "BONUS" ? "TO AWARD (+)" : "TO DEDUCT (-)"} *
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={pointDelta}
                  onChange={(e) => setPointDelta(e.target.value)}
                  className="cec-terminal-input"
                  placeholder="e.g. 50"
                  required
                />
              </div>

              {/* Audit Reason */}
              <div className="form-group">
                <label className="cec-field-label">AUDIT LOG REASON *</label>
                <textarea
                  rows={2}
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g. First blood bonus for challenge WEB-01 / deduction for credential leak"
                  className="cec-terminal-textarea font-mono text-xs"
                  required
                />
                <span className="field-hint-text">
                  This explanation will be permanently recorded in the Admin Activity Stream.
                </span>
              </div>

              {/* Footer */}
              <div className="admin-modal-footer mt-4">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="modal-btn modal-btn-cancel"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="modal-btn modal-btn-confirm"
                  style={{
                    background: adjustmentType === "BONUS" ? "#00f3ff" : "#ff5555",
                    color: "#040406",
                    fontWeight: "bold",
                  }}
                >
                  {adjustmentType === "BONUS" ? "APPLY BONUS POINTS" : "APPLY PENALTY DEDUCTION"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: FREEZE TOGGLE CONFIRMATION MODAL                      */}
      {/* ============================================================== */}
      <ConfirmationModal
        isOpen={isFreezeModalOpen}
        title={pendingFreezeAction ? "FREEZE PUBLIC LEADERBOARD?" : "UNFREEZE PUBLIC LEADERBOARD?"}
        message={
          pendingFreezeAction
            ? "When frozen, player-facing leaderboards lock to their current ranks and will not show further solves. Admin telemetry continues calculating in real-time."
            : "Unfreezing will restore live real-time score updates to all participants on the public leaderboard."
        }
        confirmLabel={pendingFreezeAction ? "FREEZE LEADERBOARD" : "UNFREEZE LEADERBOARD"}
        type={pendingFreezeAction ? "warning" : "info"}
        onConfirm={handleConfirmToggleFreeze}
        onClose={() => setIsFreezeModalOpen(false)}
      />

      {/* ============================================================== */}
      {/* MODAL 3: SCORE RESET CONFIRMATION MODAL                        */}
      {/* ============================================================== */}
      <ConfirmationModal
        isOpen={!!teamToReset}
        title={`RESET SCORE: ${teamToReset?.name || ""}`}
        message={`Are you sure you want to reset this squad's score to 0 PTS? This will revert their solved count and drop their current ranking.`}
        confirmLabel="RESET SCORE TO 0"
        type="danger"
        onConfirm={handleConfirmReset}
        onClose={() => setTeamToReset(null)}
      />
    </div>
  );
};
