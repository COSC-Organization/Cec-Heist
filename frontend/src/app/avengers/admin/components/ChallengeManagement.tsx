"use client";

import React, { useState, useMemo, useRef } from "react";
import { Challenge, ActivityLog } from "../data/mockData";
import { ConfirmationModal } from "./ConfirmationModal";
import {
  FlagIcon,
  SearchIcon,
  FilterIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  CloseIcon,
  TrophyIcon,
  ActivityIcon,
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

const CATEGORIES = ["WEB", "FORENSICS", "CRYPTO", "REVERSE", "MISC"] as const;
const LEVELS = ["All", "1", "2", "3", "4", "5"] as const;

// Red retro pixel demon/skull icon from user's image
export const PixelBugBountyIcon: React.FC<{ className?: string }> = ({
  className = "w-6 h-6",
}) => (
  <svg
    viewBox="0 0 16 16"
    className={className}
    style={{ imageRendering: "pixelated", shapeRendering: "crispEdges" }}
  >
    <rect x="2" y="1" width="2" height="3" fill="#e11d48" />
    <rect x="12" y="1" width="2" height="3" fill="#e11d48" />
    <rect x="3" y="3" width="10" height="2" fill="#e11d48" />
    <rect x="1" y="5" width="14" height="6" fill="#e11d48" />
    <rect x="4" y="6" width="2" height="2" fill="#000000" />
    <rect x="10" y="6" width="2" height="2" fill="#000000" />
    <rect x="3" y="9" width="2" height="2" fill="#e11d48" />
    <rect x="5" y="10" width="6" height="2" fill="#000000" />
    <rect x="6" y="10" width="1" height="1" fill="#e11d48" />
    <rect x="9" y="10" width="1" height="1" fill="#e11d48" />
    <rect x="11" y="9" width="2" height="2" fill="#e11d48" />
    <rect x="2" y="11" width="3" height="3" fill="#e11d48" />
    <rect x="11" y="11" width="3" height="3" fill="#e11d48" />
  </svg>
);

export const ChallengeManagement: React.FC<ChallengeManagementProps> = ({
  challenges,
  onAddChallenge,
  onUpdateChallenge,
  onDeleteChallenge,
  onAddLog,
}) => {
  const formRef = useRef<HTMLDivElement | null>(null);

  // Form State (Image 1)
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<string>("WEB");
  const [formPoints, setFormPoints] = useState<number>(100);
  const [formLevel, setFormLevel] = useState<number>(1);
  const [formDescription, setFormDescription] = useState("");
  const [formFlag, setFormFlag] = useState("");
  const [formClueLink, setFormClueLink] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Editing state (if editing a challenge, holds its reference)
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [deletingChallenge, setDeletingChallenge] = useState<Challenge | null>(null);

  // Search & Filters State (Image 2)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedLevel, setSelectedLevel] = useState<string>("All");
  const [selectedActiveFilter, setSelectedActiveFilter] = useState<string>("All");

  // Stats calculation
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

  // Filtered challenges list for Table (Image 2)
  const filteredChallenges = useMemo(() => {
    return challenges.filter((c) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.flag && c.flag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCat =
        selectedCategory === "All" ||
        c.category?.toUpperCase() === selectedCategory.toUpperCase();

      const matchLvl =
        selectedLevel === "All" || String(c.level) === selectedLevel;

      const matchActive =
        selectedActiveFilter === "All" ||
        (selectedActiveFilter === "ACTIVE" && c.isActive !== false) ||
        (selectedActiveFilter === "HALTED" && c.isActive === false);

      return matchSearch && matchCat && matchLvl && matchActive;
    });
  }, [challenges, searchQuery, selectedCategory, selectedLevel, selectedActiveFilter]);

  // Handle Form Submission: INITIALIZE CHALLENGE
  const handleSubmitChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedTitle = formTitle.trim();
    const trimmedDesc = formDescription.trim();
    const trimmedFlag = formFlag.trim();
    const cleanPoints = Number(formPoints);
    const cleanLevel = Math.max(1, Math.min(5, Number(formLevel) || 1));

    if (!trimmedTitle) {
      setFormError("Challenge TITLE is required.");
      return;
    }
    if (!trimmedDesc) {
      setFormError("Challenge DESCRIPTION is required.");
      return;
    }
    if (!trimmedFlag) {
      setFormError("FLAG (SECRET) is required (e.g. CTF{...}).");
      return;
    }
    if (cleanPoints <= 0) {
      setFormError("POINTS allocated must be greater than 0.");
      return;
    }

    const timestamp = new Date().toTimeString().split(" ")[0];

    if (editingChallenge) {
      // Update existing challenge
      const updated: Challenge = {
        ...editingChallenge,
        title: trimmedTitle,
        category: formCategory,
        points: cleanPoints,
        level: cleanLevel,
        description: trimmedDesc,
        flag: trimmedFlag,
        clueLink: formClueLink.trim() || undefined,
        isActive: editingChallenge.isActive ?? true,
        status: editingChallenge.isActive ? "Published" : "Draft",
      };
      onUpdateChallenge(updated);
      onAddLog({
        id: `LOG-EDIT-${Date.now()}`,
        timestamp,
        type: "challenge_add",
        message: `Challenge '${trimmedTitle}' [Level ${cleanLevel}] updated.`,
      });
      setSuccessToast(`CHALLENGE '${trimmedTitle}' UPDATED SUCCESSFULLY.`);
      setEditingChallenge(null);
    } else {
      // Create new initialized challenge
      const newId = `CHAL-${Date.now().toString(36).toUpperCase()}`;
      const newChal: Challenge = {
        id: newId,
        title: trimmedTitle,
        category: formCategory,
        points: cleanPoints,
        level: cleanLevel,
        description: trimmedDesc,
        flag: trimmedFlag,
        clueLink: formClueLink.trim() || undefined,
        isActive: true,
        status: "Published",
        solves: 0,
      };
      onAddChallenge(newChal);
      onAddLog({
        id: `LOG-INIT-${Date.now()}`,
        timestamp,
        type: "challenge_add",
        message: `Challenge Initialized: '${trimmedTitle}' [${formCategory} - Level ${cleanLevel} - ${cleanPoints} PTS]`,
      });
      setSuccessToast(`CHALLENGE '${trimmedTitle}' INITIALIZED IN MATRIX.`);
    }

    // Reset form fields
    setFormTitle("");
    setFormCategory("WEB");
    setFormPoints(100);
    setFormLevel(1);
    setFormDescription("");
    setFormFlag("");
    setFormClueLink("");
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Populate form for Editing
  const handleStartEdit = (c: Challenge) => {
    setEditingChallenge(c);
    setFormTitle(c.title);
    setFormCategory(c.category?.toUpperCase() || "WEB");
    setFormPoints(c.points || 100);
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
    setFormCategory("WEB");
    setFormPoints(100);
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
      timestamp: "AUTO",
      type: "challenge_add",
      message: `Challenge '${c.title}' is now [${nextActive ? "ACTIVE" : "HALTED"}].`,
    });
    setSuccessToast(`Challenge '${c.title}' set to ${nextActive ? "ACTIVE" : "HALTED"}.`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Delete challenge confirmation
  const handleConfirmDelete = () => {
    if (!deletingChallenge) return;
    onDeleteChallenge(deletingChallenge.id);
    onAddLog({
      id: `LOG-DEL-${deletingChallenge.id}`,
      timestamp: "AUTO",
      type: "challenge_add",
      message: `Challenge '${deletingChallenge.title}' deleted from challenge pool.`,
    });
    setSuccessToast(`CHALLENGE '${deletingChallenge.title}' DELETED.`);
    setDeletingChallenge(null);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Category Badge Colors matching Image 2
  const getCategoryBadgeClass = (category?: string) => {
    const cat = category?.toUpperCase() || "WEB";
    switch (cat) {
      case "WEB":
        return "bounty-badge-web";
      case "FORENSICS":
        return "bounty-badge-forensics";
      case "CRYPTO":
        return "bounty-badge-crypto";
      case "REVERSE":
        return "bounty-badge-reverse";
      default:
        return "bounty-badge-misc";
    }
  };

  return (
    <div className="bug-bounty-page-container">
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deletingChallenge !== null}
        title="DELETE CHALLENGE"
        message={`Are you sure you want to permanently delete '${deletingChallenge?.title}'? Points and question configuration will be removed from the matrix.`}
        confirmLabel="Delete"
        type="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingChallenge(null)}
      />

      {/* Success Notification Alert */}
      {successToast && (
        <div className="bounty-alert bounty-alert-success">
          <CheckIcon className="w-5 h-5 text-green" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 1: DEPLOY / INITIALIZE NEW CHALLENGE (EXACT IMAGE 1)  */}
      {/* ============================================================== */}
      <div ref={formRef} className="bounty-form-card">
        {/* Header with Red Pixel Icon & BUG BOUNTY */}
        <div className="bounty-form-header">
          <div className="bounty-header-left">
            <PixelBugBountyIcon className="w-7 h-7 text-crimson" />
            <span className="bounty-title-red">BUG BOUNTY</span>
          </div>
          <span className="bounty-subtitle-gray">
            {editingChallenge ? `// MODIFY CHALLENGE: ${editingChallenge.id}` : "Deploy New Challenge"}
          </span>
        </div>

        {formError && (
          <div className="bounty-alert bounty-alert-error">
            <span>⚠️ {formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmitChallenge} className="bounty-form-body">
          {/* TITLE */}
          <div className="bounty-form-group">
            <label htmlFor="bounty-title" className="bounty-label">
              TITLE
            </label>
            <input
              id="bounty-title"
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Enter challenge question title..."
              required
              className="bounty-input"
            />
          </div>

          {/* CATEGORY & POINTS (2 Columns) */}
          <div className="bounty-grid-2">
            <div className="bounty-form-group">
              <label htmlFor="bounty-category" className="bounty-label">
                CATEGORY
              </label>
              <select
                id="bounty-category"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="bounty-select"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="bounty-form-group">
              <label htmlFor="bounty-points" className="bounty-label">
                POINTS
              </label>
              <input
                id="bounty-points"
                type="number"
                min={1}
                step={1}
                value={formPoints}
                onChange={(e) => setFormPoints(Number(e.target.value))}
                required
                className="bounty-input"
              />
            </div>
          </div>

          {/* LEVEL (Track ID and Batch ID REMOVED as instructed) */}
          <div className="bounty-form-group">
            <label htmlFor="bounty-level" className="bounty-label">
              LEVEL
            </label>
            <input
              id="bounty-level"
              type="number"
              min={1}
              max={5}
              value={formLevel}
              onChange={(e) => setFormLevel(Number(e.target.value))}
              placeholder="1, 2,3,4 or 5"
              required
              className="bounty-input"
            />
            <span className="bounty-helper-text">Challenge level (1 to 5)</span>
          </div>

          {/* DESCRIPTION */}
          <div className="bounty-form-group">
            <label htmlFor="bounty-desc" className="bounty-label">
              DESCRIPTION
            </label>
            <textarea
              id="bounty-desc"
              rows={5}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Type question description, mission objective, and vulnerability parameters..."
              required
              className="bounty-input bounty-textarea"
            />
          </div>

          {/* FLAG (SECRET) */}
          <div className="bounty-form-group">
            <label htmlFor="bounty-flag" className="bounty-label">
              FLAG (SECRET)
            </label>
            <input
              id="bounty-flag"
              type="text"
              value={formFlag}
              onChange={(e) => setFormFlag(e.target.value)}
              placeholder="CTF{...}"
              required
              className="bounty-input bounty-flag-input"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {/* CLUE LINK (OPTIONAL) / MEDIA */}
          <div className="bounty-form-group">
            <label htmlFor="bounty-clue" className="bounty-label">
              CLUE LINK / MEDIA (OPTIONAL)
            </label>
            <input
              id="bounty-clue"
              type="text"
              value={formClueLink}
              onChange={(e) => setFormClueLink(e.target.value)}
              placeholder="https://example.com/clue"
              className="bounty-input"
            />
            <span className="bounty-helper-text">Optional hint/clue URL or media link</span>
          </div>

          {/* BIG RED ACTION BUTTON (IMAGE 1) */}
          <div className="bounty-action-row">
            <button type="submit" className="bounty-submit-red-btn">
              {editingChallenge ? "SAVE MODIFICATIONS" : "INITIALIZE CHALLENGE"}
            </button>
            {editingChallenge && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bounty-cancel-btn"
              >
                CANCEL EDIT
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ============================================================== */}
      {/* SECTION 2: ALL CHALLENGES TABLE (EXACT IMAGE 2)                */}
      {/* ============================================================== */}
      <div className="bounty-table-card">
        {/* Table Header with Red Pixel Icon & Navigation Links */}
        <div className="bounty-table-header">
          <div className="bounty-header-left">
            <PixelBugBountyIcon className="w-6 h-6 text-crimson" />
            <h2 className="bounty-table-title">ALL CHALLENGES</h2>
            <span className="bounty-count-pill">{challenges.length} QUESTIONS</span>
          </div>

          {/* Mini Nav / Stats Strip */}
          <div className="bounty-nav-strip">
            <span className="bounty-nav-item active">// CHALLENGES</span>
            <span className="bounty-nav-item">
              // ACTIVE: <b className="text-green">{activeCount}</b>
            </span>
            <span className="bounty-nav-item">
              // HALTED: <b className="text-yellow">{haltedCount}</b>
            </span>
            <span className="bounty-nav-item">
              // TOTAL PTS: <b className="text-crimson">{totalPoints}</b>
            </span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bounty-filter-bar">
          <div className="bounty-search-box">
            <SearchIcon className="w-4 h-4 text-gray" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, description, flag..."
              className="bounty-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="bounty-clear-search"
                aria-label="Clear search"
              >
                <CloseIcon />
              </button>
            )}
          </div>

          <div className="bounty-filters-inline">
            <div className="bounty-filter-item">
              <FilterIcon className="w-3.5 h-3.5 text-gray" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bounty-filter-select"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="bounty-filter-item">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="bounty-filter-select"
              >
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl === "All" ? "All Levels" : `Level ${lvl}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="bounty-filter-item">
              <select
                value={selectedActiveFilter}
                onChange={(e) => setSelectedActiveFilter(e.target.value)}
                className="bounty-filter-select"
              >
                <option value="All">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="HALTED">Halted Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content (Columns: LEVEL, TITLE, CATEGORY, POINTS, CLUE LINK, ACTIVE, ACTIONS) */}
        <div className="bounty-table-wrapper">
          <table className="bounty-data-table">
            <thead>
              <tr>
                <th style={{ width: "70px", textAlign: "center" }}>LEVEL</th>
                <th style={{ minWidth: "260px" }}>TITLE</th>
                <th style={{ width: "120px", textAlign: "center" }}>CATEGORY</th>
                <th style={{ width: "80px", textAlign: "center" }}>POINTS</th>
                <th style={{ width: "120px", textAlign: "center" }}>CLUE LINK</th>
                <th style={{ width: "90px", textAlign: "center" }}>ACTIVE</th>
                <th style={{ width: "210px", textAlign: "center" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredChallenges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="bounty-empty-cell">
                    {"// NO CHALLENGES MATCH YOUR SEARCH QUERY"}
                  </td>
                </tr>
              ) : (
                filteredChallenges.map((c) => {
                  const isActive = c.isActive !== false;

                  return (
                    <tr key={c.id} className="bounty-table-row">
                      {/* LEVEL */}
                      <td className="bounty-cell-level">
                        <span>{c.level || 1}</span>
                      </td>

                      {/* TITLE (Title bold on top, description underneath) */}
                      <td className="bounty-cell-title">
                        <div className="bounty-title-text">{c.title}</div>
                        <div className="bounty-desc-text">{c.description}</div>
                        {c.flag && (
                          <div className="bounty-flag-preview">
                            <span className="flag-tag-label">FLAG:</span>
                            <code>{c.flag}</code>
                          </div>
                        )}
                      </td>

                      {/* CATEGORY (Colored Badge) */}
                      <td style={{ textAlign: "center" }}>
                        <span className={`bounty-cat-badge ${getCategoryBadgeClass(c.category)}`}>
                          {c.category?.toUpperCase() || "WEB"}
                        </span>
                      </td>

                      {/* POINTS */}
                      <td className="bounty-cell-points">
                        <span>{c.points}</span>
                      </td>

                      {/* CLUE LINK */}
                      <td style={{ textAlign: "center" }}>
                        {c.clueLink ? (
                          <a
                            href={c.clueLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bounty-clue-link"
                          >
                            View Link
                          </a>
                        ) : (
                          <span className="bounty-clue-none">-</span>
                        )}
                      </td>

                      {/* ACTIVE TOGGLE BUTTON */}
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(c)}
                          className={`bounty-active-pill ${isActive ? "active-yes" : "active-halted"}`}
                          title={`Click to ${isActive ? "HALT" : "ACTIVATE"} challenge`}
                        >
                          {isActive ? "YES" : "HALTED"}
                        </button>
                      </td>

                      {/* ACTIONS: MAKE ACTIVE, HALT, EDIT, DELETE */}
                      <td style={{ textAlign: "center" }}>
                        <div className="bounty-actions-group">
                          {/* EDIT BUTTON */}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(c)}
                            className="bounty-action-btn edit-btn"
                            title="Edit this challenge question"
                          >
                            <EditIcon className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {/* HALT / ACTIVATE BUTTON */}
                          <button
                            type="button"
                            onClick={() => handleToggleActive(c)}
                            className={`bounty-action-btn ${isActive ? "halt-btn" : "activate-btn"}`}
                            title={isActive ? "Halt challenge from competition" : "Activate challenge"}
                          >
                            <span>{isActive ? "Halt" : "Activate"}</span>
                          </button>

                          {/* DELETE BUTTON (RED RECTANGULAR BUTTON MATCHING IMAGE 2) */}
                          <button
                            type="button"
                            onClick={() => setDeletingChallenge(c)}
                            className="bounty-delete-btn"
                            title="Delete challenge"
                          >
                            Delete
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
