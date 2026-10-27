"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api, RankedTeam } from "@/lib/api";
import { UsersIcon, PlusIcon, CrosshairIcon } from "./CyberIcons";

export const AdminTeams: React.FC = () => {
  const [teams, setTeams] = useState<RankedTeam[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<RankedTeam | null>(null);

  // Form Inputs
  const [teamName, setTeamName] = useState("");
  const [teamPassword, setTeamPassword] = useState("HEIST2026");
  const [teamScore, setTeamScore] = useState<number>(1000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all squads from backend
  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.leaderboard.get(1, 100);
      if (res.success && Array.isArray(res.data)) {
        setTeams(res.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  // Handle Create Squad: POST /api/teams
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.teams.create({
        team_name: teamName.trim(),
        password: teamPassword.trim() || "HEIST2026",
        score: Number(teamScore) || 0,
      });

      if (res.success) {
        setSuccessMsg(`SQUAD CREATED: ${res.data.team_name} (ID: ${res.data.id})`);
        setIsCreateOpen(false);
        setTeamName("");
        setTeamPassword("HEIST2026");
        setTeamScore(1000);
        await loadTeams();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Update Squad: PATCH /api/teams/:id
  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const updatePayload: { team_name: string; score: number; password?: string } = {
        team_name: teamName.trim(),
        score: Number(teamScore),
      };

      if (teamPassword.trim()) {
        updatePayload.password = teamPassword.trim();
      }

      const res = await api.teams.update(selectedTeam.id, updatePayload);

      if (res.success) {
        setSuccessMsg(`SQUAD UPDATED: ${res.data.team_name} - Score: ${res.data.score}`);
        setIsEditOpen(false);
        setSelectedTeam(null);
        setTeamPassword("");
        await loadTeams();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Squad: DELETE /api/teams/:id
  const handleDeleteTeam = async (teamId: number, teamTitle: string) => {
    if (!window.confirm(`CONFIRM ELIMINATION: Permanently delete squad "${teamTitle}"?`)) {
      return;
    }

    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.teams.delete(teamId);
      if (res.success) {
        setSuccessMsg(`SQUAD DELETED: ${teamTitle} (ID: ${teamId})`);
        await loadTeams();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  };

  const openCreateModal = () => {
    setTeamName("");
    setTeamPassword("HEIST2026");
    setTeamScore(1000);
    setIsCreateOpen(true);
  };

  const openEditModal = (team: RankedTeam) => {
    setSelectedTeam(team);
    setTeamName(team.team_name);
    setTeamScore(team.score);
    setTeamPassword("");
    setIsEditOpen(true);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Banner */}
      <div className="overview-header-row">
        <div>
          <h2 className="overview-title">SQUAD REGISTRY &amp; ROSTER</h2>
          <p className="overview-subtitle">
            {"// LIVE TEAMS DATABASE: CREATE, MODIFY & TERMINATE SQUADS"}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="overview-action-btn"
        >
          <PlusIcon className="w-4 h-4 text-white" />
          <span>Register New Squad</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div
          style={{
            padding: "0.85rem 1.25rem",
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            border: "1px solid #10b981",
            borderRadius: "6px",
            color: "#10b981",
            fontFamily: "monospace",
            fontSize: "0.85rem",
          }}
        >
          ● {successMsg}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "0.85rem 1.25rem",
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            border: "1px solid #ef4444",
            borderRadius: "6px",
            color: "#ef4444",
            fontFamily: "monospace",
            fontSize: "0.85rem",
          }}
        >
          ✕ {error}
        </div>
      )}

      {/* Teams Table */}
      <div className="overview-panel cyber-corners">
        <div className="panel-header">
          <div className="panel-header-title">
            <UsersIcon className="w-4 h-4 text-cyan" />
            <span>AUTHENTICATED DATABASE SQUADS ({teams.length})</span>
          </div>
          <button
            type="button"
            onClick={loadTeams}
            className="panel-link-btn"
            disabled={loading}
          >
            [ REFRESH SYNC ]
          </button>
        </div>

        <div className="top-teams-table-wrap">
          {loading ? (
            <div style={{ padding: "2.5rem", textAlign: "center", color: "#a1a1aa", fontFamily: "monospace" }}>
              LOADING DATABASE SQUADS...
            </div>
          ) : teams.length === 0 ? (
            <div style={{ padding: "2.5rem", textAlign: "center", color: "#a1a1aa", fontFamily: "monospace" }}>
              NO TEAMS REGISTERED IN BACKEND DATABASE
            </div>
          ) : (
            <table className="overview-mini-table">
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>RANK</th>
                  <th style={{ width: "80px" }}>DB ID</th>
                  <th>SQUAD DESIGNATION</th>
                  <th className="th-score">CURRENT SCORE</th>
                  <th style={{ textAlign: "right" }}>OPERATIONS</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team.id} className="mini-table-row">
                    <td className="td-rank">#{team.rank}</td>
                    <td style={{ color: "#71717a", fontFamily: "monospace" }}>{team.id}</td>
                    <td style={{ fontWeight: 600 }}>{team.team_name}</td>
                    <td className="td-score" style={{ color: "#00f0ff" }}>
                      {team.score.toLocaleString()} PTS
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={() => openEditModal(team)}
                          style={{
                            background: "transparent",
                            border: "1px solid rgba(0, 240, 255, 0.4)",
                            color: "#00f0ff",
                            padding: "0.25rem 0.6rem",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            fontFamily: "monospace",
                          }}
                        >
                          [EDIT]
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTeam(team.id, team.team_name)}
                          style={{
                            background: "transparent",
                            border: "1px solid rgba(239, 68, 68, 0.4)",
                            color: "#ef4444",
                            padding: "0.25rem 0.6rem",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            fontFamily: "monospace",
                          }}
                        >
                          [DELETE]
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsCreateOpen(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="modal-title-wrap">
                <CrosshairIcon className="w-5 h-5 text-white" />
                <h3 className="modal-title">REGISTER NEW SQUAD</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="modal-close-btn"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="admin-modal-body">
              <div className="admin-form-group">
                <label className="admin-form-label">Squad Designation / Name</label>
                <div className="admin-input-wrapper">
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. CYBER_TITANS"
                    className="admin-text-input"
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Squad Passcode / Password *</label>
                <div className="admin-input-wrapper">
                  <input
                    type="text"
                    required
                    value={teamPassword}
                    onChange={(e) => setTeamPassword(e.target.value)}
                    placeholder="e.g. HEIST2026"
                    className="admin-text-input"
                  />
                </div>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "4px", display: "block" }}>
                  All squad members will use the squad name and this password to log in.
                </span>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Initial Score (PTS)</label>
                <div className="admin-input-wrapper">
                  <input
                    type="number"
                    min="0"
                    required
                    value={teamScore}
                    onChange={(e) => setTeamScore(Number(e.target.value))}
                    className="admin-text-input"
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="modal-btn modal-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="modal-btn modal-btn-confirm"
                >
                  {isSubmitting ? "Creating..." : "Save to DB"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && selectedTeam && (
        <div className="admin-modal-backdrop" onClick={() => setIsEditOpen(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="modal-title-wrap">
                <CrosshairIcon className="w-5 h-5 text-white" />
                <h3 className="modal-title">EDIT SQUAD #{selectedTeam.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="modal-close-btn"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateTeam} className="admin-modal-body">
              <div className="admin-form-group">
                <label className="admin-form-label">Squad Designation</label>
                <div className="admin-input-wrapper">
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="admin-text-input"
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Update Score (PTS)</label>
                <div className="admin-input-wrapper">
                  <input
                    type="number"
                    min="0"
                    required
                    value={teamScore}
                    onChange={(e) => setTeamScore(Number(e.target.value))}
                    className="admin-text-input"
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Reset Password (Optional)</label>
                <div className="admin-input-wrapper">
                  <input
                    type="text"
                    value={teamPassword}
                    onChange={(e) => setTeamPassword(e.target.value)}
                    placeholder="Leave blank to keep existing password"
                    className="admin-text-input"
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="modal-btn modal-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="modal-btn modal-btn-confirm"
                >
                  {isSubmitting ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
