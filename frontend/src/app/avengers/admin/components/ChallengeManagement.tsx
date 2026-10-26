"use client";

import React, { useState, useMemo } from "react";
import { Challenge, ActivityLog } from "../data/mockData";
import { ConfirmationModal } from "./ConfirmationModal";
import {
  FlagIcon,
  PlusIcon,
  SearchIcon,
  FilterIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
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

const CATEGORIES = [
  "All",
  "Web Exploitation",
  "Cryptography",
  "Forensics",
  "Reverse Engineering",
] as const;

const DIFFICULTIES = ["All", "Easy", "Medium", "Hard", "Insane"] as const;
const STATUSES = ["All", "Published", "Draft", "Archived"] as const;
const SECTORS_LIST = [
  { id: "All", label: "All Sectors" },
  { id: "factory", label: "Sector 01: Refinery" },
  { id: "logistics", label: "Sector 02: Logistics" },
  { id: "command", label: "Sector 03: Command" },
  { id: "vault", label: "Sector 04: Vault" },
] as const;

export const ChallengeManagement: React.FC<ChallengeManagementProps> = ({
  challenges,
  onAddChallenge,
  onUpdateChallenge,
  onDeleteChallenge,
  onAddLog,
  initialDeployModalOpen = false,
  onCloseInitialDeployModal,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedSector, setSelectedSector] = useState<string>("All");

  // Modals State
  const [internalDeployOpen, setInternalDeployOpen] = useState(false);
  const isDeployModalOpen = initialDeployModalOpen || internalDeployOpen;

  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [viewingChallenge, setViewingChallenge] = useState<Challenge | null>(null);
  const [deletingChallenge, setDeletingChallenge] = useState<Challenge | null>(null);
  const [showDossierFlag, setShowDossierFlag] = useState<boolean>(false);

  // Deploy / Edit Form State
  const [formId, setFormId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<Challenge["category"]>("Web Exploitation");
  const [formDifficulty, setFormDifficulty] = useState<Challenge["difficulty"]>("Medium");
  const [formFacilityId, setFormFacilityId] = useState<"factory" | "logistics" | "command" | "vault">("factory");
  const [formPoints, setFormPoints] = useState<number>(100);
  const [formDescription, setFormDescription] = useState("");
  const [formFlag, setFormFlag] = useState("");
  const [formHint, setFormHint] = useState("");
  const [formStatus, setFormStatus] = useState<Challenge["status"]>("Published");
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleCloseDeployModal = () => {
    setInternalDeployOpen(false);
    if (onCloseInitialDeployModal) {
      onCloseInitialDeployModal();
    }
  };

  // Derived filtered challenges
  const filteredChallenges = useMemo(() => {
    return challenges.filter((c) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory =
        selectedCategory === "All" || c.category === selectedCategory;

      const matchDifficulty =
        selectedDifficulty === "All" || c.difficulty === selectedDifficulty;

      const matchStatus =
        selectedStatus === "All" || c.status === selectedStatus;

      const matchSector = selectedSector === "All" || c.facilityId === selectedSector;
      return matchSearch && matchCategory && matchDifficulty && matchStatus && matchSector;
    });
  }, [challenges, searchQuery, selectedCategory, selectedDifficulty, selectedStatus, selectedSector]);

  // Calculated Stats
  const totalPoints = challenges.reduce((sum, c) => sum + c.points, 0);
  const totalSolves = challenges.reduce((sum, c) => sum + c.solves, 0);
  const publishedCount = challenges.filter((c) => c.status === "Published").length;
  const draftCount = challenges.filter((c) => c.status === "Draft").length;

  // Open Deploy Modal (Fresh)
  const handleOpenDeployModal = () => {
    // Generate clean suggest ID
    const count = challenges.length + 1;
    const catPrefix =
      formCategory === "Web Exploitation"
        ? "WEB"
        : formCategory === "Cryptography"
        ? "CRYPTO"
        : formCategory === "Forensics"
        ? "FOR"
        : "REV";
    setFormId(`${catPrefix}-${String(count).padStart(2, "0")}`);
    setFormTitle("");
    setFormCategory("Web Exploitation");
    setFormDifficulty("Medium");
    setFormFacilityId("factory");
    setFormPoints(100);
    setFormDescription("");
    setFormFlag("");
    setFormHint("");
    setFormStatus("Published");
    setFormError(null);
    setEditingChallenge(null);
    setInternalDeployOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (c: Challenge) => {
    setEditingChallenge(c);
    setFormId(c.id);
    setFormTitle(c.title);
    setFormCategory(c.category);
    setFormDifficulty(c.difficulty);
    setFormFacilityId(c.facilityId || "factory");
    setFormPoints(c.points);
    setFormDescription(c.description);
    setFormFlag(c.flag || "");
    setFormHint(c.hint || "");
    setFormStatus(c.status);
    setFormError(null);
    setInternalDeployOpen(true);
  };

  // Submit Deploy / Edit Form
  const handleSubmitChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedTitle = formTitle.trim();
    const trimmedId = formId.trim().toUpperCase();

    if (!trimmedTitle) {
      setFormError("Challenge title cannot be empty.");
      return;
    }
    if (!trimmedId) {
      setFormError("Challenge ID cannot be empty.");
      return;
    }
    if (formPoints <= 0) {
      setFormError("Points allocated must be greater than zero.");
      return;
    }

    // Check duplicate ID if new challenge
    if (!editingChallenge && challenges.some((c) => c.id.toUpperCase() === trimmedId)) {
      setFormError(`Challenge ID '${trimmedId}' already exists in matrix. Use a unique identifier.`);
      return;
    }

    const timestamp = new Date().toTimeString().split(" ")[0];

    if (editingChallenge) {
      // Update
      const updated: Challenge = {
        ...editingChallenge,
        id: trimmedId,
        title: trimmedTitle,
        category: formCategory,
        difficulty: formDifficulty,
        points: Number(formPoints),
        description: formDescription.trim(),
        facilityId: formFacilityId,
        flag: formFlag.trim() || undefined,
        hint: formHint.trim() || undefined,
        pic: formFacilityId === "factory" ? "/arena/pic1.png" : formFacilityId === "logistics" ? "/arena/pic2.png" : formFacilityId === "command" ? "/arena/pic3.png" : "/arena/pic4.png",
        status: formStatus,
      };
      onUpdateChallenge(updated);
      onAddLog({
        id: `LOG-${Date.now()}`,
        timestamp,
        type: "challenge_add",
        message: `Challenge '${trimmedTitle}' [${trimmedId}] updated by Commander.`,
      });
      setSuccessToast(`CHALLENGE '${trimmedTitle}' UPDATED SUCCESSFULLY.`);
    } else {
      // Create new challenge
      const newChal: Challenge = {
        id: trimmedId,
        title: trimmedTitle,
        category: formCategory,
        difficulty: formDifficulty,
        points: Number(formPoints),
        description: formDescription.trim(),
        facilityId: formFacilityId,
        flag: formFlag.trim() || undefined,
        hint: formHint.trim() || undefined,
        pic: formFacilityId === "factory" ? "/arena/pic1.png" : formFacilityId === "logistics" ? "/arena/pic2.png" : formFacilityId === "command" ? "/arena/pic3.png" : "/arena/pic4.png",
        status: formStatus,
        solves: 0,
      };
      onAddChallenge(newChal);
      onAddLog({
        id: `LOG-${Date.now()}`,
        timestamp,
        type: "challenge_add",
        message: `New challenge deployed: '${trimmedTitle}' [${trimmedId} - ${formPoints} pts]`,
      });
      setSuccessToast(`CHALLENGE '${trimmedTitle}' SUCCESSFULLY DEPLOYED TO ARENA.`);
    }

    handleCloseDeployModal();
    setEditingChallenge(null);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Quick Toggle Status (Publish <-> Draft)
  const handleQuickToggleStatus = (c: Challenge) => {
    const nextStatus = c.status === "Published" ? "Draft" : "Published";
    const updated: Challenge = { ...c, status: nextStatus };
    onUpdateChallenge(updated);
    onAddLog({
      id: `LOG-TOGGLE-${c.id}-${nextStatus}`,
      timestamp: "AUTO",
      type: "challenge_add",
      message: `Challenge '${c.title}' status changed to [${nextStatus.toUpperCase()}].`,
    });
    setSuccessToast(`Challenge '${c.title}' is now ${nextStatus.toUpperCase()}.`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Delete Action Confirmation
  const handleConfirmDelete = () => {
    if (!deletingChallenge) return;
    onDeleteChallenge(deletingChallenge.id);
    onAddLog({
      id: `LOG-PURGE-${deletingChallenge.id}`,
      timestamp: "AUTO",
      type: "challenge_add",
      message: `Challenge '${deletingChallenge.title}' [${deletingChallenge.id}] was purged from arena.`,
    });
    setSuccessToast(`CHALLENGE '${deletingChallenge.title}' PURGED.`);
    setDeletingChallenge(null);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Difficulty badge helper
  const getDifficultyBadgeClass = (diff: Challenge["difficulty"]) => {
    switch (diff) {
      case "Easy":
        return "diff-badge-easy";
      case "Medium":
        return "diff-badge-medium";
      case "Hard":
        return "diff-badge-hard";
      case "Insane":
        return "diff-badge-insane";
      default:
        return "";
    }
  };

  const getSectorBadge = (facilityId?: string) => {
    switch (facilityId) {
      case "factory":
        return { label: "SEC 01 // REFINERY", className: "sector-badge-factory" };
      case "logistics":
        return { label: "SEC 02 // LOGISTICS", className: "sector-badge-logistics" };
      case "command":
        return { label: "SEC 03 // COMMAND", className: "sector-badge-command" };
      case "vault":
        return { label: "SEC 04 // VAULT", className: "sector-badge-vault" };
      default:
        return { label: "SEC 01 // REFINERY", className: "sector-badge-factory" };
    }
  };

  return (
    <div className="challenge-management-container">
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deletingChallenge !== null}
        title="PURGE CHALLENGE FROM ARENA"
        message={`Are you sure you want to permanently delete '${deletingChallenge?.title}' (${deletingChallenge?.id})? Solves telemetry and allocated points will be purged from the competition matrix.`}
        confirmLabel="Purge Challenge"
        type="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingChallenge(null)}
      />

      {/* View Challenge Details Modal */}
      {viewingChallenge && (
        <div className="admin-modal-backdrop" onClick={() => setViewingChallenge(null)}>
          <div className="admin-modal-card cyber-corners" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="modal-title-wrap">
                <FlagIcon className="w-5 h-5 text-white" />
                <h3 className="modal-title">CHALLENGE DOSSIER: {viewingChallenge.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingChallenge(null)}
                className="modal-close-btn"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="challenge-dossier-grid">
                <div className="dossier-header-block">
                  <h2 className="dossier-challenge-title">{viewingChallenge.title}</h2>
                  <div className="dossier-badges-row">
                    <span className="cat-badge">{viewingChallenge.category}</span>
                    {(() => {
                      const s = getSectorBadge(viewingChallenge.facilityId);
                      return <span className={`sector-badge ${s.className}`}>{s.label}</span>;
                    })()}
                    <span className={`diff-badge ${getDifficultyBadgeClass(viewingChallenge.difficulty)}`}>
                      {viewingChallenge.difficulty}
                    </span>
                    <span className={`status-badge ${viewingChallenge.status === "Published" ? "badge-green" : "badge-amber"}`}>
                      ● {viewingChallenge.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="dossier-stats-strip">
                  <div className="dossier-stat-pill">
                    <span className="pill-key">REWARD POOL:</span>
                    <span className="pill-val text-green">{viewingChallenge.points} PTS</span>
                  </div>
                  <div className="dossier-stat-pill">
                    <span className="pill-key">SOLVED BY:</span>
                    <span className="pill-val text-yellow">{viewingChallenge.solves} SQUADS</span>
                  </div>
                </div>

                <div className="dossier-desc-block">
                  <span className="block-label">MISSION BRIEF &amp; OBJECTIVES:</span>
                  <p className="dossier-desc-text">{viewingChallenge.description}</p>
                </div>

                {viewingChallenge.hint && (
                  <div className="dossier-desc-block">
                    <span className="block-label">// TACTICAL HINT:</span>
                    <p className="dossier-desc-text text-yellow">{viewingChallenge.hint}</p>
                  </div>
                )}

                {viewingChallenge.flag && (
                  <div className="dossier-desc-block">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                      <span className="block-label">// DECRYPTION CIPHER / FLAG:</span>
                      <button
                        type="button"
                        className="flag-reveal-toggle-btn"
                        onClick={() => setShowDossierFlag(!showDossierFlag)}
                      >
                        {showDossierFlag ? "[ HIDE CIPHER ]" : "[ 👁️ REVEAL CIPHER ]"}
                      </button>
                    </div>
                    <div className="dossier-flag-box">
                      <code>{showDossierFlag ? viewingChallenge.flag : "••••••••••••••••••••••••••••••••"}</code>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="modal-btn modal-btn-cancel"
                onClick={() => setViewingChallenge(null)}
              >
                [ CLOSE ]
              </button>
              <button
                type="button"
                className="modal-btn modal-btn-confirm"
                onClick={() => {
                  const toEdit = viewingChallenge;
                  setViewingChallenge(null);
                  handleOpenEditModal(toEdit);
                }}
              >
                [ EDIT CHALLENGE ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deploy / Edit Challenge Modal */}
      {isDeployModalOpen && (
        <div className="admin-modal-backdrop" onClick={handleCloseDeployModal}>
          <div className="admin-modal-card cyber-corners deploy-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="modal-title-wrap">
                <FlagIcon className="w-5 h-5 text-white" />
                <h3 className="modal-title">
                  {editingChallenge ? `MODIFY CHALLENGE: ${editingChallenge.id}` : "DEPLOY NEW CHALLENGE"}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseDeployModal}
                className="modal-close-btn"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleSubmitChallenge}>
              <div className="admin-modal-body modal-form-body">
                {formError && (
                  <div className="cyber-alert cyber-alert-danger" style={{ marginBottom: "1rem" }}>
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-grid-2">
                  <div className="form-field-group">
                    <label htmlFor="field-chal-id" className="field-label">
                      CHALLENGE IDENTIFIER (ID)
                    </label>
                    <input
                      id="field-chal-id"
                      type="text"
                      value={formId}
                      onChange={(e) => setFormId(e.target.value.toUpperCase())}
                      placeholder="e.g. WEB-05"
                      required
                      className="admin-input-field"
                    />
                  </div>

                  <div className="form-field-group">
                    <label htmlFor="field-chal-title" className="field-label">
                      CHALLENGE TITLE
                    </label>
                    <input
                      id="field-chal-title"
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Broken Authentication Matrix"
                      required
                      className="admin-input-field"
                    />
                  </div>
                </div>

                <div className="form-grid-2" style={{ marginTop: "1rem" }}>
                  <div className="form-field-group">
                    <label htmlFor="field-chal-category" className="field-label">
                      SECTOR / CATEGORY
                    </label>
                    <select
                      id="field-chal-category"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as Challenge["category"])}
                      className="admin-select-field"
                    >
                      <option value="Web Exploitation">Web Exploitation</option>
                      <option value="Cryptography">Cryptography</option>
                      <option value="Forensics">Forensics</option>
                      <option value="Reverse Engineering">Reverse Engineering</option>
                    </select>
                  </div>

                  <div className="form-field-group">
                    <label htmlFor="field-chal-diff" className="field-label">
                      DIFFICULTY TIER
                    </label>
                    <select
                      id="field-chal-diff"
                      value={formDifficulty}
                      onChange={(e) => setFormDifficulty(e.target.value as Challenge["difficulty"])}
                      className="admin-select-field"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                      <option value="Insane">Insane</option>
                    </select>
                  </div>

                </div>

                <div className="form-grid-2" style={{ marginTop: "1rem" }}>
                  <div className="form-field-group">
                    <label htmlFor="field-chal-sector" className="field-label">
                      TARGET HEIST FACILITY (SECTOR)
                    </label>
                    <select
                      id="field-chal-sector"
                      value={formFacilityId}
                      onChange={(e) => setFormFacilityId(e.target.value as "factory" | "logistics" | "command" | "vault")}
                      className="admin-select-field"
                    >
                      <option value="factory">Sector 01: Industrial Refinery (Power Grid)</option>
                      <option value="logistics">Sector 02: Logistics Depot (Convoy)</option>
                      <option value="command">Sector 03: Command Complex (Surveillance)</option>
                      <option value="vault">Sector 04: Central Heist Vault (Helipad)</option>
                    </select>
                  </div>

                  <div className="form-field-group">
                    <label htmlFor="field-chal-pts" className="field-label">
                      POINTS ALLOCATION
                    </label>
                    <input
                      id="field-chal-pts"
                      type="number"
                      min={10}
                      step={10}
                      value={formPoints}
                      onChange={(e) => setFormPoints(Number(e.target.value))}
                      required
                      className="admin-input-field"
                    />
                  </div>
                </div>

                <div className="form-grid-2" style={{ marginTop: "1rem" }}>
                  <div className="form-field-group">
                    <label htmlFor="field-chal-flag" className="field-label">
                      CAPTURE THE FLAG (SECRET CIPHER KEY)
                    </label>
                    <input
                      id="field-chal-flag"
                      type="text"
                      value={formFlag}
                      onChange={(e) => setFormFlag(e.target.value)}
                      placeholder="e.g. FLAG{secret_exploit_cipher}"
                      className="admin-input-field"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>

                  <div className="form-field-group">
                    <label htmlFor="field-chal-hint" className="field-label">
                      TACTICAL HINT (OPTIONAL)
                    </label>
                    <input
                      id="field-chal-hint"
                      type="text"
                      value={formHint}
                      onChange={(e) => setFormHint(e.target.value)}
                      placeholder="e.g. Inspect HTTP Authorization headers..."
                      className="admin-input-field"
                    />
                  </div>
                </div>


                <div className="form-field-group" style={{ marginTop: "1rem" }}>
                  <label htmlFor="field-chal-desc" className="field-label">
                    CHALLENGE BRIEF &amp; OBJECTIVES
                  </label>
                  <textarea
                    id="field-chal-desc"
                    rows={4}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Describe vulnerability premise, scenario brief, and flags protocol..."
                    required
                    className="admin-input-field admin-textarea"
                  />
                </div>

                <div className="form-field-group" style={{ marginTop: "1rem" }}>
                  <label htmlFor="field-chal-status" className="field-label">
                    DEPLOYMENT STATE
                  </label>
                  <select
                    id="field-chal-status"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as Challenge["status"])}
                    className="admin-select-field"
                  >
                    <option value="Published">Published (Active in Arena)</option>
                    <option value="Draft">Draft (Hidden in Stage)</option>
                    <option value="Archived">Archived (Retired)</option>
                  </select>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="modal-btn modal-btn-cancel"
                  onClick={handleCloseDeployModal}
                >
                  [ CANCEL ]
                </button>
                <button type="submit" className="modal-btn modal-btn-confirm">
                  {editingChallenge ? "[ SAVE MODIFICATIONS ]" : "[ DEPLOY CHALLENGE ]"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">CHALLENGE COMMAND GRID</h1>
          <p className="admin-page-subtitle">
            {"// DEPLOY, CONFIGURE, AND ORCHESTRATE BUG BOUNTY QUESTIONS & CTF VECTORS"}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenDeployModal}
          className="arena-enter-btn admin-submit-btn"
          style={{ maxWidth: "240px" }}
        >
          <PlusIcon className="w-4 h-4 text-white" />
          <span>+ DEPLOY CHALLENGE</span>
        </button>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="cyber-alert cyber-alert-success cyber-corners">
          <CheckIcon className="alert-icon" />
          <span className="alert-text">{successToast}</span>
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="overview-stats-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="overview-stat-card cyber-corners">
          <div className="stat-card-top">
            <span className="stat-label">TOTAL CHALLENGES</span>
            <FlagIcon className="stat-icon text-yellow" />
          </div>
          <div className="stat-value">{challenges.length}</div>
          <div className="stat-meta">
            <span className="meta-badge-green">{publishedCount} Published</span>
            <span className="meta-sub">{draftCount} Drafts</span>
          </div>
        </div>

        <div className="overview-stat-card cyber-corners">
          <div className="stat-card-top">
            <span className="stat-label">TOTAL ALLOCATED POINTS</span>
            <TrophyIcon className="stat-icon text-green" />
          </div>
          <div className="stat-value">{totalPoints.toLocaleString()}</div>
          <div className="stat-meta">
            <span className="meta-badge-neutral">MAX ARENA POOL</span>
          </div>
        </div>

        <div className="overview-stat-card cyber-corners">
          <div className="stat-card-top">
            <span className="stat-label">TOTAL SOLVES LOGGED</span>
            <ActivityIcon className="stat-icon text-cyan" />
          </div>
          <div className="stat-value">{totalSolves}</div>
          <div className="stat-meta">
            <span className="meta-badge-green">
              Avg {(totalSolves / (challenges.length || 1)).toFixed(1)} / challenge
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="overview-panel cyber-corners">
        <div className="challenges-filters-row">
          {/* Search Box */}
          <div className="search-input-wrap">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, title, or description..."
              className="admin-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="search-clear-btn"
                aria-label="Clear search"
              >
                <CloseIcon />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="filter-select-wrap">
            <FilterIcon className="filter-icon" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="admin-filter-select"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  Category: {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className="filter-select-wrap">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="admin-filter-select"
            >
              {DIFFICULTIES.map((diff) => (
                <option key={diff} value={diff}>
                  Difficulty: {diff}
                </option>
              ))}
            </select>
          </div>

          {/* Sector Filter */}
          <div className="filter-select-wrap">
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="admin-filter-select"
            >
              {SECTORS_LIST.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="filter-select-wrap">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="admin-filter-select"
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  Status: {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Challenges Table */}
        <div className="challenges-table-wrapper">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th style={{ width: "95px" }}>ID</th>
                <th>CHALLENGE TITLE</th>
                <th>SECTOR</th>
                <th>CATEGORY</th>
                <th>DIFFICULTY</th>
                <th style={{ textAlign: "right" }}>POINTS</th>
                <th style={{ textAlign: "right" }}>SOLVES</th>
                <th>STATUS</th>
                <th style={{ textAlign: "center", width: "150px" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredChallenges.length === 0 ? (
                <tr>
                  <td colSpan={9} className="table-empty-cell">
                    {"// NO MATCHING CHALLENGES FOUND IN MATRIX"}
                  </td>
                </tr>
              ) : (
                filteredChallenges.map((c) => (
                  <tr key={c.id} className="data-table-row">
                    <td className="chal-id-cell">{c.id}</td>
                    <td className="chal-title-cell">
                      <div className="chal-title-text">{c.title}</div>
                      <div className="chal-desc-preview">{c.description}</div>
                      {c.flag && (
                        <div style={{ marginTop: "0.25rem" }}>
                          <span className="chal-flag-tag">FLAG // CONFIGURED</span>
                        </div>
                      )}
                    </td>
                    <td>
                      {(() => {
                        const s = getSectorBadge(c.facilityId);
                        return <span className={`sector-badge ${s.className}`}>{s.label}</span>;
                      })()}
                    </td>
                    <td>
                      <span className="cat-badge">{c.category}</span>
                    </td>
                    <td>
                      <span className={`diff-badge ${getDifficultyBadgeClass(c.difficulty)}`}>
                        {c.difficulty}
                      </span>
                    </td>
                    <td className="chal-pts-cell">{c.points}</td>
                    <td className="chal-solves-cell">{c.solves}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleQuickToggleStatus(c)}
                        title="Click to toggle status"
                        className={`status-pill-btn ${c.status === "Published" ? "status-pill-live" : "status-pill-waiting"}`}
                      >
                        ● {c.status.toUpperCase()}
                      </button>
                    </td>
                    <td className="actions-cell">
                      <div className="table-actions-group">
                        <button
                          type="button"
                          onClick={() => setViewingChallenge(c)}
                          className="table-action-icon-btn"
                          title="View Details"
                        >
                          <EyeIcon className="action-svg" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(c)}
                          className="table-action-icon-btn"
                          title="Edit Challenge"
                        >
                          <EditIcon className="action-svg" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingChallenge(c)}
                          className="table-action-icon-btn action-btn-danger"
                          title="Purge Challenge"
                        >
                          <TrashIcon className="action-svg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
