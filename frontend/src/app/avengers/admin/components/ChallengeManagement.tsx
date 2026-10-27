"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Challenge,
  ActivityLog,
  LEVEL_POINTS_CONFIG,
  TOTAL_COMPETITION_POINTS,
} from "../data/mockData";
import { api } from "@/lib/api";
import { ConfirmationModal } from "./ConfirmationModal";
import {
  FlagIcon,
  SearchIcon,
  FilterIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  CloseIcon,
  ActivityIcon,
  ExternalLinkIcon,
} from "./CyberIcons";

interface ChallengeManagementProps {
  challenges: Challenge[];
  onAddChallenge: (challenge: Challenge) => void;
  onUpdateChallenge: (challenge: Challenge) => void;
  onDeleteChallenge: (id: string) => void;
  onAddLog: (log: ActivityLog) => void;
  initialDeployModalOpen?: boolean;
  onCloseInitialDeployModal?: () => void;
}

const LEVELS = [1, 2, 3, 4] as const;
type DifficultyType = "easy" | "medium" | "high";
const DIFFICULTY_POINTS: Record<DifficultyType, number> = {
  easy: 10,
  medium: 20,
  high: 30,
};

export const ChallengeManagement: React.FC<ChallengeManagementProps> = ({
  challenges,
  onAddChallenge,
  onUpdateChallenge,
  onDeleteChallenge,
  onAddLog,
}) => {
  const formRef = useRef<HTMLDivElement | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formLevel, setFormLevel] = useState<number>(1);
  const [formDifficulty, setFormDifficulty] = useState<DifficultyType>("easy");
  const [formDescription, setFormDescription] = useState("");
  const [formFlag, setFormFlag] = useState("");
  const [formClueLink, setFormClueLink] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editing / Deleting state
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [deletingChallenge, setDeletingChallenge] = useState<Challenge | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [selectedLevel, setSelectedLevel] = useState<string>("All");
  const [selectedActiveFilter, setSelectedActiveFilter] = useState<string>("All");

  // Level-specific points allocations across all existing challenges
  const levelAllocations = useMemo(() => {
    const acc = { 1: 0, 2: 0, 3: 0, 4: 0 };
    challenges.forEach((c) => {
      const lvl = (c.level >= 1 && c.level <= 4 ? c.level : 1) as 1 | 2 | 3 | 4;
      acc[lvl] = (acc[lvl] || 0) + (c.points || 0);
    });
    return acc;
  }, [challenges]);

  const totalPoints = useMemo(
    () => challenges.reduce((sum, c) => sum + (c.points || 0), 0),
    [challenges]
  );

  const activeCount = useMemo(
    () => challenges.filter((c) => c.isActive !== false).length,
    [challenges]
  );

  const haltedCount = useMemo(
    () => challenges.filter((c) => c.isActive === false).length,
    [challenges]
  );

  // Filtered challenges list for Table
  const filteredChallenges = useMemo(() => {
    return challenges.filter((c) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.flag && c.flag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchDiff =
        selectedDifficulty === "All" ||
        (c.difficulty && c.difficulty.toLowerCase() === selectedDifficulty.toLowerCase()) ||
        (c.category && c.category.toLowerCase() === selectedDifficulty.toLowerCase());

      const matchLvl =
        selectedLevel === "All" || String(c.level) === selectedLevel;

      const matchActive =
        selectedActiveFilter === "All" ||
        (selectedActiveFilter === "ACTIVE" && c.isActive !== false) ||
        (selectedActiveFilter === "HALTED" && c.isActive === false);

      return matchSearch && matchDiff && matchLvl && matchActive;
    });
  }, [challenges, searchQuery, selectedDifficulty, selectedLevel, selectedActiveFilter]);

  // Handle Form Submission: INITIALIZE / UPDATE CHALLENGE
  const handleSubmitChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedTitle = formTitle.trim();
    const trimmedDesc = formDescription.trim();
    const trimmedFlag = formFlag.trim();
    const cleanLevel = Math.max(1, Math.min(4, Number(formLevel) || 1));
    const cleanDifficulty = formDifficulty;
    const cleanHintUrl = formClueLink.trim() || undefined;

    if (!trimmedTitle) {
      setFormError("Challenge TITLE is required.");
      return;
    }
    if (!trimmedDesc) {
      setFormError("Challenge DESCRIPTION is required.");
      return;
    }
    if (!trimmedFlag) {
      setFormError("FLAG (SECRET) is required (e.g. CTF{...} or FLAG{...}).");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingChallenge) {
        const pts = DIFFICULTY_POINTS[cleanDifficulty];
        const updated: Challenge = {
          ...editingChallenge,
          title: trimmedTitle,
          category: cleanDifficulty.toUpperCase(),
          points: pts,
          level: cleanLevel,
          difficulty: (cleanDifficulty.charAt(0).toUpperCase() + cleanDifficulty.slice(1)) as "Easy" | "Medium" | "Hard",
          description: trimmedDesc,
          flag: trimmedFlag,
          clueLink: cleanHintUrl,
          isActive: editingChallenge.isActive ?? true,
          status: editingChallenge.isActive ? "Published" : "Draft",
        };
        onUpdateChallenge(updated);
        onAddLog({
          id: `LOG-EDIT-${Date.now()}`,
          timestamp: new Date().toTimeString().split(" ")[0],
          type: "challenge_add",
          message: `Challenge '${trimmedTitle}' [Level ${cleanLevel} - ${cleanDifficulty.toUpperCase()}] updated.`,
        });
        setSuccessToast(`CHALLENGE '${trimmedTitle}' UPDATED SUCCESSFULLY.`);
        setEditingChallenge(null);
      } else {
        const res = await api.challenges.create({
          title: trimmedTitle,
          description: trimmedDesc,
          flag: trimmedFlag,
          level: cleanLevel,
          difficulty: cleanDifficulty,
          hintUrl: cleanHintUrl,
        });

        const pts = DIFFICULTY_POINTS[cleanDifficulty];
        const newChal: Challenge = {
          id: String(res.data.id),
          title: res.data.title,
          category: cleanDifficulty.toUpperCase(),
          points: pts,
          level: res.data.level,
          difficulty: (cleanDifficulty.charAt(0).toUpperCase() + cleanDifficulty.slice(1)) as "Easy" | "Medium" | "Hard",
          description: res.data.description,
          flag: trimmedFlag,
          clueLink: res.data.hintUrl || undefined,
          isActive: true,
          status: "Published",
          solves: 0,
        };
        onAddChallenge(newChal);
        onAddLog({
          id: `LOG-INIT-${Date.now()}`,
          timestamp: new Date().toTimeString().split(" ")[0],
          type: "challenge_add",
          message: `Challenge Initialized: '${trimmedTitle}' [Level ${cleanLevel} - ${cleanDifficulty.toUpperCase()} - ${pts} PTS]`,
        });
        setSuccessToast(`CHALLENGE '${trimmedTitle}' DEPLOYED TO DATABASE.`);
      }

      // Reset form fields
      setFormTitle("");
      setFormDifficulty("easy");
      setFormLevel(cleanLevel);
      setFormDescription("");
      setFormFlag("");
      setFormClueLink("");
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(`Failed to save challenge: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Populate form for Editing
  const handleStartEdit = (c: Challenge) => {
    setEditingChallenge(c);
    setFormTitle(c.title);
    const diff = (c.difficulty?.toLowerCase() || "easy") as DifficultyType;
    setFormDifficulty(["easy", "medium", "high"].includes(diff) ? diff : "easy");
    setFormLevel(c.level || 1);
    setFormDescription(c.description || "");
    setFormFlag(c.flag || "");
    setFormClueLink(c.clueLink || "");
    setFormError(null);

    // Scroll smoothly to form
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingChallenge(null);
    setFormTitle("");
    setFormDifficulty("easy");
    setFormLevel(1);
    setFormDescription("");
    setFormFlag("");
    setFormClueLink("");
    setFormError(null);
  };

  // Toggle Active / Halted state
  const handleToggleActive = (c: Challenge) => {
    const nextActive = !c.isActive;
    const updated: Challenge = {
      ...c,
      isActive: nextActive,
      status: nextActive ? "Published" : "Draft",
    };
    onUpdateChallenge(updated);
    onAddLog({
      id: `LOG-TOGGLE-${c.id}-${nextActive ? "ACTIVE" : "HALTED"}`,
      timestamp: new Date().toTimeString().split(" ")[0],
      type: "challenge_add",
      message: `Challenge '${c.title}' is now [${nextActive ? "ACTIVE" : "HALTED"}].`,
    });
    setSuccessToast(`Challenge '${c.title}' status toggled to [${nextActive ? "ACTIVE" : "HALTED"}].`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Delete challenge confirmation
  const handleConfirmDelete = async () => {
    if (!deletingChallenge) return;
    try {
      const numId = Number(deletingChallenge.id);
      if (Number.isSafeInteger(numId) && numId > 0) {
        await api.challenges.delete(numId);
      }
    } catch (err: unknown) {
      console.warn("Backend challenge deletion warning:", err);
    }
    onDeleteChallenge(deletingChallenge.id);
    onAddLog({
      id: `LOG-DEL-${deletingChallenge.id}`,
      timestamp: new Date().toTimeString().split(" ")[0],
      type: "challenge_add",
      message: `Challenge '${deletingChallenge.title}' deleted from challenge pool.`,
    });
    setSuccessToast(`CHALLENGE '${deletingChallenge.title}' PURGED.`);
    setDeletingChallenge(null);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  return (
    <div className="cec-challenges-root">
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deletingChallenge !== null}
        title="PURGE CHALLENGE VECTOR"
        message={`Are you sure you want to permanently delete '${deletingChallenge?.title}'? All allotted points (${deletingChallenge?.points || 0} PTS) will be freed up in Level 0${deletingChallenge?.level || 1}.`}
        confirmLabel="PURGE QUESTION"
        type="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingChallenge(null)}
      />

      {/* Success Notification Alert */}
      {successToast && (
        <div className="cec-cyber-alert alert-success">
          <CheckIcon className="w-5 h-5 text-green" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 1: LEVEL POINTS ALLOCATION MATRIX (1,000 PTS TOTAL)    */}
      {/* ============================================================== */}
      <div className="cec-matrix-hud cyber-corners">
        <div className="hud-header-bar">
          <div className="hud-header-left">
            <span className="hud-matrix-tag">{"// ARENA SCORING ARCHITECTURE"}</span>
            <h2 className="hud-matrix-title">1,000 PTS COMPETITION MATRIX POOL</h2>
          </div>
          <div className="hud-header-right">
            <span className="hud-total-pill">
              TOTAL ALLOCATED: <strong className="text-cyan">{totalPoints}</strong> / {TOTAL_COMPETITION_POINTS} PTS
            </span>
          </div>
        </div>

        {/* 4 Level Progress Cards */}
        <div className="hud-levels-grid">
          {LEVELS.map((lvl) => {
            const maxPts = LEVEL_POINTS_CONFIG[lvl];
            const currentPts = levelAllocations[lvl] || 0;
            const chalCount = challenges.filter((c) => (c.level || 1) === lvl).length;
            const pct = Math.min(100, Math.round((currentPts / maxPts) * 100));
            const isFull = currentPts >= maxPts;

            return (
              <div key={lvl} className={`hud-level-card ${isFull ? "level-card-full" : ""}`}>
                <div className="level-card-head">
                  <span className="level-badge-tag">LEVEL 0{lvl}</span>
                  <span className="level-pts-label">
                    <strong className="text-white">{currentPts}</strong> / {maxPts} PTS
                  </span>
                </div>

                <div className="level-progress-track">
                  <div
                    className={`level-progress-bar level-${lvl}-fill`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="level-card-meta">
                  <span className="level-count">{chalCount} {chalCount === 1 ? "Question" : "Questions"}</span>
                  <span className={`level-status-pill ${isFull ? "text-green font-bold" : ""}`}>
                    {currentPts === 0
                      ? "0 PTS ALLOCATED"
                      : currentPts === maxPts
                      ? "SATISFIED (100%)"
                      : `${maxPts - currentPts} PTS REMAINING`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION 2: INITIALIZE / DEPLOY CHALLENGE FORM                  */}
      {/* ============================================================== */}
      <div ref={formRef} className="cec-panel-card cyber-corners">
        <div className="cec-panel-header">
          <div className="panel-title-wrap">
            <FlagIcon className="w-5 h-5 text-cyan" />
            <h3 className="cec-panel-title">
              {editingChallenge
                ? `[ ~ ] MODIFY CHALLENGE VECTOR: ${editingChallenge.id}`
                : "[ + ] DEPLOY CHALLENGE VECTOR"}
            </h3>
          </div>
          <span className="panel-subtitle-tag">
            {"// PROTOCOL: QUESTION REGISTRATION & INGESTION"}
          </span>
        </div>

        {formError && (
          <div className="cec-cyber-alert alert-error">
            <span>⚠️ {formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmitChallenge} noValidate className="cec-form-container">
          {/* TITLE */}
          <div className="form-group-full">
            <label htmlFor="cec-chal-title" className="cec-field-label">
              QUESTION TITLE <span className="text-red">*</span>
            </label>
            <input
              id="cec-chal-title"
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Hidden in plain sight, Buffer Overflow Exploit, RSA Keygen..."
              required
              className="cec-terminal-input"
            />
          </div>

          {/* ROW 1: LEVEL & DIFFICULTY TIER (2-Column Layout) */}
          <div className="form-grid-2">
            {/* LEVEL */}
            <div className="form-group">
              <label htmlFor="cec-chal-level" className="cec-field-label">
                LEVEL (TARGET POOL) <span className="text-red">*</span>
              </label>
              <select
                id="cec-chal-level"
                value={formLevel}
                onChange={(e) => setFormLevel(Number(e.target.value))}
                className="cec-terminal-select"
              >
                {LEVELS.map((lvl) => {
                  const count = challenges.filter((c) => (c.level || 1) === lvl).length;
                  return (
                    <option key={lvl} value={lvl}>
                      LEVEL 0{lvl} ({count} {count === 1 ? "question" : "questions"} registered)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* DIFFICULTY TIER */}
            <div className="form-group">
              <label htmlFor="cec-chal-difficulty" className="cec-field-label">
                DIFFICULTY TIER <span className="text-red">*</span>
              </label>
              <select
                id="cec-chal-difficulty"
                value={formDifficulty}
                onChange={(e) => setFormDifficulty(e.target.value as DifficultyType)}
                className="cec-terminal-select"
              >
                <option value="easy">EASY — 10 PTS</option>
                <option value="medium">MEDIUM — 20 PTS</option>
                <option value="high">HIGH — 30 PTS</option>
              </select>
              <span className="field-hint-text">
                Points scored on capture: Easy = 10 PTS, Medium = 20 PTS, High = 30 PTS
              </span>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="form-group-full">
            <label htmlFor="cec-chal-desc" className="cec-field-label">
              QUESTION DESCRIPTION &amp; MISSION BRIEF <span className="text-red">*</span>
            </label>
            <textarea
              id="cec-chal-desc"
              rows={4}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Provide mission background, exploit scenario, hints, and vulnerability parameters for operatives..."
              required
              className="cec-terminal-textarea"
            />
          </div>

          {/* ROW 2: FLAG (SECRET) & CLUE LINK (2-Column Layout) */}
          <div className="form-grid-2">
            {/* FLAG (SECRET) */}
            <div className="form-group">
              <label htmlFor="cec-chal-flag" className="cec-field-label">
                FLAG (SECRET) <span className="text-red">*</span>
              </label>
              <input
                id="cec-chal-flag"
                type="text"
                value={formFlag}
                onChange={(e) => setFormFlag(e.target.value)}
                placeholder="CTF{s3cr3t_fl4g_h3r3} or FLAG{...}"
                required
                className="cec-terminal-input flag-input-code"
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {/* CLUE LINK / MEDIA (OPTIONAL) */}
            <div className="form-group">
              <label htmlFor="cec-chal-clue" className="cec-field-label">
                CLUE LINK / MEDIA (OPTIONAL)
              </label>
              <input
                id="cec-chal-clue"
                type="text"
                value={formClueLink}
                onChange={(e) => setFormClueLink(e.target.value)}
                placeholder="https://example.com/asset.pdf or drive/raw link"
                className="cec-terminal-input"
              />
              <span className="field-hint-text">Optional external clue, downloadable binary, or intel URL</span>
            </div>
          </div>

          {/* ACTION BUTTON ROW — Strictly anchored in place, never shifts */}
          <div className="form-action-row">
            <button
              type="submit"
              className="cec-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "[ TRANSMITTING TO DATABASE... ]"
                : editingChallenge
                ? "[ SAVE MODIFICATIONS ]"
                : "[ + DEPLOY CHALLENGE TO DATABASE ]"}
            </button>
            {editingChallenge && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="cec-cancel-btn"
              >
                [ CANCEL EDIT ]
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ============================================================== */}
      {/* SECTION 3: ALL CHALLENGES TABLE / REPOSITORY                   */}
      {/* ============================================================== */}
      <div className="cec-panel-card cyber-corners">
        {/* Table Panel Header */}
        <div className="cec-panel-header">
          <div className="panel-title-wrap">
            <ActivityIcon className="w-5 h-5 text-cyan" />
            <h3 className="cec-panel-title">CHALLENGE VECTOR REPOSITORY</h3>
            <span className="cec-count-badge">{challenges.length} QUESTIONS</span>
          </div>

          {/* Quick Telemetry Indicators */}
          <div className="cec-telemetry-strip">
            <span className="telemetry-item">
              // ACTIVE: <strong className="text-green">{activeCount}</strong>
            </span>
            <span className="telemetry-item">
              // HALTED: <strong className="text-yellow">{haltedCount}</strong>
            </span>
            <span className="telemetry-item">
              // POOL: <strong className="text-cyan">{totalPoints}</strong> / 1,000 PTS
            </span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="cec-filter-bar">
          <div className="cec-search-box">
            <SearchIcon className="w-4 h-4 text-gray" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, description, flag secret..."
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
            {/* Difficulty Filter */}
            <div className="filter-select-group">
              <FilterIcon className="w-3.5 h-3.5 text-gray" />
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="cec-filter-select"
              >
                <option value="All">All Difficulties</option>
                <option value="easy">Easy (10 PTS)</option>
                <option value="medium">Medium (20 PTS)</option>
                <option value="high">High (30 PTS)</option>
              </select>
            </div>

            {/* Level Filter */}
            <div className="filter-select-group">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="cec-filter-select"
              >
                <option value="All">All Levels</option>
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={String(lvl)}>
                    Level 0{lvl} ({LEVEL_POINTS_CONFIG[lvl]} PTS)
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="filter-select-group">
              <select
                value={selectedActiveFilter}
                onChange={(e) => setSelectedActiveFilter(e.target.value)}
                className="cec-filter-select"
              >
                <option value="All">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="HALTED">Halted Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Challenges Table Content */}
        <div className="cec-table-responsive">
          <table className="cec-data-table">
            <thead>
              <tr>
                <th style={{ width: "90px", textAlign: "center" }}>LEVEL</th>
                <th style={{ minWidth: "280px" }}>TITLE &amp; BRIEFING</th>
                <th style={{ width: "120px", textAlign: "center" }}>DIFFICULTY</th>
                <th style={{ width: "100px", textAlign: "center" }}>POINTS</th>
                <th style={{ width: "120px", textAlign: "center" }}>CLUE LINK</th>
                <th style={{ width: "100px", textAlign: "center" }}>ACTIVE</th>
                <th style={{ width: "230px", textAlign: "center" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {challenges.length === 0 ? (
                /* Authentic Zero-Question Empty State */
                <tr>
                  <td colSpan={7} className="cec-empty-state-cell">
                    <div className="empty-state-terminal">
                      <div className="terminal-prompt-line">
                        <span className="text-cyan">&gt; [SYSTEM: ARENA CHALLENGE REGISTRY EMPTY]</span>
                      </div>
                      <p className="empty-main-text">
                        ZERO QUESTIONS CURRENTLY REGISTERED IN THE COMPETITION MATRIX.
                      </p>
                      <p className="empty-sub-text">
                        The entire 1,000 PTS competition pool is ready for allocation.
                        You can allocate any number of questions and points for each level up to its cap:
                        Level 1 (200 PTS), Level 2 (100 PTS), Level 3 (250 PTS), and Level 4 (450 PTS).
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredChallenges.length === 0 ? (
                /* Search No Results State */
                <tr>
                  <td colSpan={7} className="cec-empty-state-cell">
                    <div className="empty-state-terminal">
                      <p className="empty-main-text">
                        // NO CHALLENGES MATCH YOUR SEARCH / FILTER CRITERIA
                      </p>
                      <p className="empty-sub-text">
                        Try resetting the category, level, or search keyword filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredChallenges.map((c) => {
                  const isActive = c.isActive !== false;
                  const lvl = c.level || 1;

                  return (
                    <tr key={c.id} className="cec-table-row">
                      {/* LEVEL */}
                      <td style={{ textAlign: "center" }}>
                        <span className={`cec-level-pill lvl-${lvl}`}>
                          LVL 0{lvl}
                        </span>
                      </td>

                      {/* TITLE & BRIEFING */}
                      <td className="cell-challenge-title">
                        <div className="chal-primary-title">{c.title}</div>
                        <div className="chal-brief-text">{c.description}</div>
                        {c.flag && (
                          <div className="chal-flag-chip">
                            <span className="flag-label">FLAG:</span>
                            <code>{c.flag}</code>
                          </div>
                        )}
                      </td>

                      {/* DIFFICULTY */}
                      <td style={{ textAlign: "center" }}>
                        <span className={`cec-category-badge cat-${(c.difficulty || "easy").toLowerCase()}`}>
                          {(c.difficulty || "EASY").toUpperCase()}
                        </span>
                      </td>

                      {/* POINTS */}
                      <td style={{ textAlign: "center" }}>
                        <span className="chal-points-badge">
                          <strong>{c.points}</strong> PTS
                        </span>
                      </td>

                      {/* CLUE LINK */}
                      <td style={{ textAlign: "center" }}>
                        {c.clueLink ? (
                          <a
                            href={c.clueLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cec-clue-link"
                          >
                            <span>Link</span>
                            <ExternalLinkIcon className="w-3.5 h-3.5 inline ml-1" />
                          </a>
                        ) : (
                          <span className="cec-clue-none">—</span>
                        )}
                      </td>

                      {/* ACTIVE STATUS TOGGLE */}
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(c)}
                          className={`cec-active-toggle-btn ${isActive ? "is-active" : "is-halted"}`}
                          title={`Click to ${isActive ? "HALT" : "ACTIVATE"} challenge`}
                        >
                          {isActive ? "YES" : "HALTED"}
                        </button>
                      </td>

                      {/* ACTIONS: EDIT, HALT / ACTIVATE, DELETE */}
                      <td style={{ textAlign: "center" }}>
                        <div className="cec-actions-flex">
                          {/* EDIT BUTTON */}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(c)}
                            className="cec-action-btn btn-edit"
                            title="Edit this challenge question"
                          >
                            <EditIcon className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {/* HALT / ACTIVATE BUTTON */}
                          <button
                            type="button"
                            onClick={() => handleToggleActive(c)}
                            className={`cec-action-btn ${isActive ? "btn-halt" : "btn-activate"}`}
                            title={isActive ? "Halt challenge from arena" : "Activate challenge in arena"}
                          >
                            <span>{isActive ? "Halt" : "Activate"}</span>
                          </button>

                          {/* DELETE BUTTON */}
                          <button
                            type="button"
                            onClick={() => setDeletingChallenge(c)}
                            className="cec-action-btn btn-delete"
                            title="Purge challenge permanently"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                            <span>Delete</span>
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
    </div>
  );
};