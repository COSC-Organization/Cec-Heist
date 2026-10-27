"use client";

import React, { useState } from "react";
import { api, ChallengeResponse } from "@/lib/api";
import { FlagIcon, PlusIcon, CrosshairIcon } from "./CyberIcons";

export const AdminChallenges: React.FC = () => {
  const [deployedChallenges, setDeployedChallenges] = useState<ChallengeResponse["data"][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [flag, setFlag] = useState("");
  const [hintUrl, setHintUrl] = useState("");
  const [level, setLevel] = useState<number>(1);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "high">("medium");

  const handleDeployChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !flag.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.challenges.create({
        title: title.trim(),
        description: description.trim(),
        flag: flag.trim(),
        hintUrl: hintUrl.trim() || null,
        level: Number(level),
        difficulty,
      });

      if (res.success && res.data) {
        setSuccessMsg(`CHALLENGE DEPLOYED SUCCESSFULLY: "${res.data.title}" (ID: ${res.data.id})`);
        setDeployedChallenges((prev) => [res.data, ...prev]);
        setIsDeployOpen(false);
        setTitle("");
        setDescription("");
        setFlag("");
        setHintUrl("");
        setLevel(1);
        setDifficulty("medium");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Banner */}
      <div className="overview-header-row">
        <div>
          <h2 className="overview-title">CHALLENGE DEPLOYMENT MATRIX</h2>
          <p className="overview-subtitle">
            {"// CLOUD INFILTRATION NODES: DEPLOY NEW CTF & HEIST PUZZLES"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setSuccessMsg(null);
            setIsDeployOpen(true);
          }}
          className="overview-action-btn"
        >
          <PlusIcon className="w-4 h-4 text-white" />
          <span>Deploy New Challenge</span>
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

      {/* Deployed Challenges Live Stream */}
      <div className="overview-panel cyber-corners">
        <div className="panel-header">
          <div className="panel-header-title">
            <FlagIcon className="w-4 h-4 text-cyan" />
            <span>SESSION DEPLOYED CHALLENGES ({deployedChallenges.length})</span>
          </div>
        </div>

        <div className="top-teams-table-wrap">
          {deployedChallenges.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#a1a1aa", fontFamily: "monospace" }}>
              <p>NO CHALLENGES DEPLOYED IN THIS ADMIN SESSION YET.</p>
              <button
                type="button"
                onClick={() => setIsDeployOpen(true)}
                className="panel-link-btn"
                style={{ margin: "1rem auto 0 auto" }}
              >
                [ + DEPLOY CHALLENGE NOW ]
              </button>
            </div>
          ) : (
            <table className="overview-mini-table">
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>CHAL ID</th>
                  <th>CHALLENGE TITLE</th>
                  <th>LEVEL</th>
                  <th>DIFFICULTY</th>
                  <th>DEPLOYED AT</th>
                </tr>
              </thead>
              <tbody>
                {deployedChallenges.map((chal) => (
                  <tr key={chal.id} className="mini-table-row">
                    <td style={{ color: "#00f0ff", fontFamily: "monospace" }}>#{chal.id}</td>
                    <td style={{ fontWeight: 600 }}>{chal.title}</td>
                    <td>
                      <span className="font-pixel" style={{ color: "#f59e0b" }}>
                        LEVEL {chal.level}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          textTransform: "uppercase",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          backgroundColor:
                            chal.difficulty === "easy"
                              ? "rgba(16, 185, 129, 0.2)"
                              : chal.difficulty === "medium"
                              ? "rgba(245, 158, 11, 0.2)"
                              : "rgba(239, 68, 68, 0.2)",
                          color:
                            chal.difficulty === "easy"
                              ? "#10b981"
                              : chal.difficulty === "medium"
                              ? "#f59e0b"
                              : "#ef4444",
                        }}
                      >
                        {chal.difficulty}
                      </span>
                    </td>
                    <td style={{ color: "#71717a", fontSize: "0.78rem" }}>
                      {chal.createdAt || "Just now"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* DEPLOY MODAL */}
      {isDeployOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsDeployOpen(false)}>
          <div className="admin-modal-card" style={{ maxWidth: "620px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="modal-title-wrap">
                <CrosshairIcon className="w-5 h-5 text-white" />
                <h3 className="modal-title">DEPLOY NEW CHALLENGE</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDeployOpen(false)}
                className="modal-close-btn"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDeployChallenge} className="admin-modal-body">
              <div className="admin-form-group">
                <label className="admin-form-label">Challenge Title</label>
                <div className="admin-input-wrapper">
                  <input
                    type="text"
                    required
                    maxLength={150}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Buffer Overflow Infiltration"
                    className="admin-text-input"
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Description &amp; Briefing</label>
                <div className="admin-input-wrapper">
                  <textarea
                    required
                    rows={3}
                    maxLength={5000}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed challenge instructions, mission objective, and connection port..."
                    className="admin-text-input"
                    style={{ resize: "vertical", height: "auto" }}
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Flag Cipher (Secret Answer)</label>
                <div className="admin-input-wrapper">
                  <input
                    type="text"
                    required
                    maxLength={500}
                    value={flag}
                    onChange={(e) => setFlag(e.target.value)}
                    placeholder="e.g. FLAG{secret_buffer_overflow_123}"
                    className="admin-text-input"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Level (1 to 4)</label>
                  <div className="admin-input-wrapper">
                    <select
                      value={level}
                      onChange={(e) => setLevel(Number(e.target.value))}
                      className="admin-text-input"
                      style={{ background: "#0a0a0f", color: "#fff" }}
                    >
                      <option value={1}>Level 1 - Sector 1</option>
                      <option value={2}>Level 2 - Sector 2</option>
                      <option value={3}>Level 3 - Sector 3</option>
                      <option value={4}>Level 4 - Airborne Vault</option>
                    </select>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Difficulty</label>
                  <div className="admin-input-wrapper">
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "high")}
                      className="admin-text-input"
                      style={{ background: "#0a0a0f", color: "#fff" }}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Hint URL (Optional HTTP/HTTPS)</label>
                <div className="admin-input-wrapper">
                  <input
                    type="url"
                    value={hintUrl}
                    onChange={(e) => setHintUrl(e.target.value)}
                    placeholder="https://example.com/hint"
                    className="admin-text-input"
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsDeployOpen(false)}
                  className="modal-btn modal-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="modal-btn modal-btn-confirm"
                >
                  {isSubmitting ? "Deploying..." : "Deploy to D1 DB"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
