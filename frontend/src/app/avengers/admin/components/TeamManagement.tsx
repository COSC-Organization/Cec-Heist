"use client";

import React, { useState, useMemo, useRef } from "react";
import { Team, TeamMember, ActivityLog } from "../data/mockData";
import { api } from "@/lib/api";
import { ConfirmationModal } from "./ConfirmationModal";
import {
  UsersIcon,
  SearchIcon,
  FilterIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  CloseIcon,
  UploadIcon,
  DownloadIcon,
  PlusIcon,
  ShieldIcon,
  ActivityIcon,
} from "./CyberIcons";

interface TeamManagementProps {
  teams: Team[];
  onAddTeam: (team: Team) => void;
  onAddTeams: (teams: Team[]) => void;
  onUpdateTeam: (team: Team) => void;
  onDeleteTeam: (id: string) => void;
  onDeleteAllTeams: () => void;
  onAddLog: (log: ActivityLog) => void;
}

interface ParsedTeamRow {
  id: string;
  name: string;
  captainName: string;
  captainEmail: string;
  operatives: string[];
  organization?: string;
  passcode?: string;
  isValid: boolean;
  warnings: string[];
  selected: boolean;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  teams,
  onAddTeam,
  onAddTeams,
  onUpdateTeam,
  onDeleteTeam,
  onDeleteAllTeams,
  onAddLog,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Modals & Drawers
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkActiveTab, setBulkActiveTab] = useState<"file" | "paste">("file");
  const [pastedText, setPastedText] = useState("");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [parsedPreviewRows, setParsedPreviewRows] = useState<ParsedTeamRow[]>([]);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // Single Team Add/Edit State
  const [isSingleTeamModalOpen, setIsSingleTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamFormName, setTeamFormName] = useState("");
  const [teamFormPasscode, setTeamFormPasscode] = useState("HEIST2026");
  const [teamFormScore, setTeamFormScore] = useState<number>(0);
  const [singleFormError, setSingleFormError] = useState<string | null>(null);
  const [isSingleSaving, setIsSingleSaving] = useState(false);

  // Deletion Modal
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [isPurgeAllModalOpen, setIsPurgeAllModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Telemetry Metrics
  const totalOperatives = useMemo(
    () => teams.reduce((acc, t) => acc + (t.members?.length || 0), 0),
    [teams]
  );
  const verifiedCount = useMemo(
    () => teams.filter((t) => t.registrationStatus === "VERIFIED").length,
    [teams]
  );
  const pendingCount = useMemo(
    () => teams.filter((t) => t.registrationStatus === "PENDING").length,
    [teams]
  );

  // Filtered Teams
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        q === "" ||
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.members &&
          t.members.some(
            (m) =>
              m.name.toLowerCase().includes(q) ||
              m.email.toLowerCase().includes(q)
          ));

      const matchStatus =
        statusFilter === "All" || t.registrationStatus === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [teams, searchQuery, statusFilter]);

  // Robust Native CSV/TSV Parser with quoted values support
  const parseDelimitedText = (text: string, delimiter?: string): string[][] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];

    // Auto-detect delimiter if not provided: tab vs comma vs semicolon
    let delim = delimiter;
    if (!delim) {
      const firstLine = lines[0];
      if (firstLine.includes("\t")) delim = "\t";
      else if (firstLine.includes(";")) delim = ";";
      else delim = ",";
    }

    const rows: string[][] = [];
    for (const line of lines) {
      const row: string[] = [];
      let inQuotes = false;
      let current = "";

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === delim && !inQuotes) {
          row.push(current.trim().replace(/^["']|["']$/g, ""));
          current = "";
        } else {
          current += char;
        }
      }
      row.push(current.trim().replace(/^["']|["']$/g, ""));
      rows.push(row);
    }
    return rows;
  };

  // Map header row to indices
  const normalizeRowsToTeams = (
    headers: string[],
    dataRows: string[][]
  ): ParsedTeamRow[] => {
    const cleanHeaders = headers.map((h) =>
      h.toLowerCase().trim().replace(/[^a-z0-9]/g, "")
    );

    const findIndex = (keywords: string[]) =>
      cleanHeaders.findIndex((h) => keywords.some((k) => h.includes(k)));

    const nameIdx = findIndex(["teamname", "squadname", "team", "squad", "name"]);
    const captainNameIdx = findIndex([
      "captainname",
      "leadername",
      "captain",
      "leader",
      "lead",
    ]);
    const captainEmailIdx = findIndex([
      "captainemail",
      "leaderemail",
      "email",
      "mail",
      "contactemail",
    ]);
    const membersIdx = findIndex([
      "operatives",
      "members",
      "teammembers",
      "squadmembers",
      "participants",
    ]);
    const orgIdx = findIndex([
      "college",
      "institution",
      "organization",
      "dept",
      "university",
    ]);
    const passcodeIdx = findIndex(["passcode", "password", "pin", "code"]);

    const existingNames = new Set(teams.map((t) => t.name.toLowerCase().trim()));
    const seenInBatch = new Set<string>();

    const parsed: ParsedTeamRow[] = [];

    dataRows.forEach((row, rowIdx) => {
      if (row.length === 0 || row.every((c) => c === "")) return;

      const rawName = (nameIdx !== -1 ? row[nameIdx] : row[0]) || "";
      const rawCaptain =
        (captainNameIdx !== -1 ? row[captainNameIdx] : row[1]) || "Squad Lead";
      const rawEmail =
        (captainEmailIdx !== -1 ? row[captainEmailIdx] : row[2]) || "";
      const rawMembers = membersIdx !== -1 ? row[membersIdx] : "";
      const rawOrg = orgIdx !== -1 ? row[orgIdx] : "";
      const rawPass = passcodeIdx !== -1 ? row[passcodeIdx] : "HEIST2026";

      const name = rawName.trim();
      const warnings: string[] = [];

      if (!name) {
        warnings.push("Missing squad name");
      }

      if (existingNames.has(name.toLowerCase())) {
        warnings.push("Squad already exists in database");
      }

      if (seenInBatch.has(name.toLowerCase())) {
        warnings.push("Duplicate squad name in file");
      } else if (name) {
        seenInBatch.add(name.toLowerCase());
      }

      if (!rawEmail || !rawEmail.includes("@")) {
        warnings.push("No valid captain email provided");
      }

      // Parse operatives from members column or extra columns
      let ops: string[] = [];
      if (rawMembers) {
        ops = rawMembers
          .split(/[,;\n]/)
          .map((m) => m.trim())
          .filter((m) => m.length > 0 && m.toLowerCase() !== rawCaptain.toLowerCase());
      } else {
        // Look for columns 3, 4, 5 if not mapped
        for (let c = 3; c < row.length; c++) {
          const val = row[c]?.trim();
          if (
            val &&
            c !== orgIdx &&
            c !== passcodeIdx &&
            val.toLowerCase() !== rawCaptain.toLowerCase()
          ) {
            ops.push(val);
          }
        }
      }

      parsed.push({
        id: `TM-${Date.now().toString(36).toUpperCase()}-${rowIdx + 1}`,
        name: name || `UNNAMED_SQUAD_${rowIdx + 1}`,
        captainName: rawCaptain.trim(),
        captainEmail: rawEmail.trim(),
        operatives: ops,
        organization: rawOrg.trim() || undefined,
        passcode: rawPass.trim() || "HEIST2026",
        isValid: warnings.length === 0,
        warnings,
        selected: warnings.length === 0 || !warnings.includes("Missing squad name"),
      });
    });

    return parsed;
  };

  // Dynamic Excel SheetJS (.xlsx/.xls) Loader
  const loadSheetJS = async (): Promise<any> => {
    if (typeof window !== "undefined" && (window as any).XLSX) {
      return (window as any).XLSX;
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js";
      script.async = true;
      script.onload = () => resolve((window as any).XLSX);
      script.onerror = () => {
        // Fallback CDN
        const script2 = document.createElement("script");
        script2.src =
          "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
        script2.async = true;
        script2.onload = () => resolve((window as any).XLSX);
        script2.onerror = reject;
        document.head.appendChild(script2);
      };
      document.head.appendChild(script);
    });
  };

  // Handle File Selection (.csv, .xlsx, .xls, .tsv)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setBulkError(null);
    setIsParsing(true);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "xlsx" || ext === "xls") {
        // Parse with SheetJS
        const XLSX = await loadSheetJS();
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (rows.length < 2) {
          setBulkError("Uploaded spreadsheet contains no data rows.");
          setIsParsing(false);
          return;
        }

        const headers = rows[0].map((h: any) => String(h || ""));
        const dataRows = rows.slice(1).map((r: any[]) => r.map((c) => String(c ?? "")));
        const parsed = normalizeRowsToTeams(headers, dataRows);
        setParsedPreviewRows(parsed);
      } else {
        // Parse text/CSV/TSV
        const text = await file.text();
        const rows = parseDelimitedText(text);

        if (rows.length < 2) {
          setBulkError("Uploaded file contains insufficient rows. Must include headers and data.");
          setIsParsing(false);
          return;
        }

        const headers = rows[0];
        const dataRows = rows.slice(1);
        const parsed = normalizeRowsToTeams(headers, dataRows);
        setParsedPreviewRows(parsed);
      }
    } catch (err: any) {
      setBulkError(`Failed to parse file: ${err.message || "Invalid spreadsheet format"}`);
    } finally {
      setIsParsing(false);
    }
  };

  // Handle Pasted Text Parsing
  const handleParsePastedText = () => {
    setBulkError(null);
    if (!pastedText.trim()) {
      setBulkError("Please paste tab-separated or comma-separated rows first.");
      return;
    }

    try {
      const rows = parseDelimitedText(pastedText);
      if (rows.length < 1) {
        setBulkError("No recognizable tabular rows detected.");
        return;
      }

      // Check if first row is header or data
      const firstRow = rows[0].join(" ").toLowerCase();
      const hasHeaderKeywords =
        firstRow.includes("team") ||
        firstRow.includes("squad") ||
        firstRow.includes("captain") ||
        firstRow.includes("email") ||
        firstRow.includes("member");

      const headers = hasHeaderKeywords
        ? rows[0]
        : ["Squad Name", "Captain Name", "Captain Email", "Operatives", "Organization"];
      const dataRows = hasHeaderKeywords ? rows.slice(1) : rows;

      const parsed = normalizeRowsToTeams(headers, dataRows);
      setParsedPreviewRows(parsed);
      setSelectedFileName("Clipboard / Direct Paste");
    } catch (err: any) {
      setBulkError(`Error parsing pasted data: ${err.message}`);
    }
  };

  // Toggle selection of a row in the preview table
  const handleToggleRowSelection = (id: string) => {
    setParsedPreviewRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  // Select / Deselect All
  const handleSelectAllPreview = (select: boolean) => {
    setParsedPreviewRows((prev) => prev.map((r) => ({ ...r, selected: select })));
  };

  // Confirm Ingestion of Parsed Squads
  const handleConfirmBulkIngestion = () => {
    const selectedRows = parsedPreviewRows.filter((r) => r.selected);
    if (selectedRows.length === 0) {
      setBulkError("No squads selected for import.");
      return;
    }

    const newTeams: Team[] = selectedRows.map((r, idx) => {
      const members: TeamMember[] = [
        {
          name: r.captainName,
          email: r.captainEmail || `${r.name.toLowerCase().replace(/\s+/g, "")}@cec.heist`,
          role: "Captain",
        },
      ];

      r.operatives.forEach((op, opIdx) => {
        members.push({
          name: op,
          email: `${op.toLowerCase().replace(/\s+/g, "")}@cec.heist`,
          role: "Operative",
        });
      });

      return {
        id: `TM-${(teams.length + idx + 1).toString().padStart(3, "0")}`,
        name: r.name,
        members,
        score: 0,
        solvedCount: 0,
        registrationStatus: "VERIFIED",
        lastActive: "Just now",
        rank: teams.length + idx + 1,
        organization: r.organization,
        passcode: r.passcode || "HEIST2026",
      };
    });

    onAddTeams(newTeams);
    onAddLog({
      id: `LOG-BULK-${Date.now()}`,
      timestamp: new Date().toTimeString().split(" ")[0],
      type: "team_register",
      message: `Bulk Ingested ${newTeams.length} squads from ${selectedFileName || "file"}.`,
    });

    showToast(`SUCCESSFULLY INGESTED ${newTeams.length} SQUADS INTO MATRIX.`);
    setIsBulkModalOpen(false);
    setParsedPreviewRows([]);
    setSelectedFileName(null);
    setPastedText("");
  };

  // Download Sample Template CSV
  const handleDownloadTemplate = () => {
    const sampleCSV = `Squad Name,Captain Name,Captain Email,Operative 1,Operative 2,Operative 3,Organization,Passcode
Zero Day Syndicate,Alex Mercer,alex@zeroday.io,Elena Rostova,Kaelen Voss,,CyberSec Institute,HEIST2026
Byte Bandits,Marcus Shaw,marcus@bytebandits.net,Samantha Cross,Devon Reed,,Tech University,HEIST2026
Red Team Six,Jax Thorne,jax@redteam6.sec,Nadia Belova,Tariq Mansour,,Security Lab,HEIST2026
Phantom Node,Viktor Gray,viktor@phantom.cc,Chloe Bennett,Rohan Patel,,Engineering College,HEIST2026`;

    const blob = new Blob([sampleCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "cec_heist_squads_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Registered Squads CSV
  const handleExportSquads = () => {
    if (teams.length === 0) {
      showToast("NO SQUADS TO EXPORT.");
      return;
    }

    const headers = [
      "Squad ID",
      "Squad Name",
      "Registration Status",
      "Captain Name",
      "Captain Email",
      "Operatives",
      "Solved Challenges",
      "Score",
      "Organization",
    ];

    const rows = teams.map((t) => {
      const captain = t.members.find((m) => m.role === "Captain") || t.members[0];
      const operatives = t.members
        .filter((m) => m.role === "Operative")
        .map((m) => m.name)
        .join("; ");

      return [
        `"${t.id}"`,
        `"${t.name}"`,
        `"${t.registrationStatus}"`,
        `"${captain?.name || ""}"`,
        `"${captain?.email || ""}"`,
        `"${operatives}"`,
        t.solvedCount,
        t.score,
        `"${t.organization || ""}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `cec_heist_registered_squads_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Single Team Add / Edit Submit
  const handleSubmitSingleTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleFormError(null);

    const name = teamFormName.trim();
    const passcode = teamFormPasscode.trim() || "HEIST2026";
    const scoreVal = Number(teamFormScore) || 0;

    if (!name) {
      setSingleFormError("Squad Name is required.");
      return;
    }
    if (!passcode || passcode.length < 4) {
      setSingleFormError("Squad Password must be at least 4 characters.");
      return;
    }

    setIsSingleSaving(true);
    try {
      if (editingTeam) {
        const numId = Number(editingTeam.id);
        if (Number.isSafeInteger(numId) && numId > 0) {
          await api.teams.update(numId, {
            team_name: name,
            password: passcode,
            score: scoreVal,
          });
        }
        const updated: Team = {
          ...editingTeam,
          name,
          score: scoreVal,
          passcode,
        };
        onUpdateTeam(updated);
        onAddLog({
          id: `LOG-TEAM-EDIT-${Date.now()}`,
          timestamp: new Date().toTimeString().split(" ")[0],
          type: "team_register",
          message: `Squad '${name}' credentials updated.`,
        });
        showToast(`SQUAD '${name}' UPDATED.`);
      } else {
        const res = await api.teams.create({
          team_name: name,
          password: passcode,
          score: scoreVal,
        });

        const newTeam: Team = {
          id: String(res.data.id),
          name: res.data.team_name,
          members: [
            {
              name: name,
              email: `${name.toLowerCase().replace(/\s+/g, "")}@cec.heist`,
              role: "Captain",
            },
          ],
          score: res.data.score ?? scoreVal,
          solvedCount: 0,
          registrationStatus: "VERIFIED",
          lastActive: "Just now",
          rank: teams.length + 1,
          passcode,
        };
        onAddTeam(newTeam);
        onAddLog({
          id: `LOG-TEAM-NEW-${Date.now()}`,
          timestamp: new Date().toTimeString().split(" ")[0],
          type: "team_register",
          message: `New Squad Registered: '${name}'.`,
        });
        showToast(`SQUAD '${name}' REGISTERED IN DATABASE.`);
      }

      setIsSingleTeamModalOpen(false);
      setEditingTeam(null);
      setTeamFormName("");
      setTeamFormPasscode("HEIST2026");
      setTeamFormScore(0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSingleFormError(`Failed to save squad: ${msg}`);
    } finally {
      setIsSingleSaving(false);
    }
  };

  // Start Editing Team
  const handleStartEditTeam = (team: Team) => {
    setEditingTeam(team);
    setTeamFormName(team.name);
    setTeamFormPasscode(team.passcode || "HEIST2026");
    setTeamFormScore(team.score || 0);
    setSingleFormError(null);
    setIsSingleTeamModalOpen(true);
  };

  // Toggle Team Status
  const handleToggleStatus = (team: Team) => {
    const nextStatus =
      team.registrationStatus === "VERIFIED"
        ? "PENDING"
        : team.registrationStatus === "PENDING"
        ? "FLAGGED"
        : "VERIFIED";

    const updated: Team = {
      ...team,
      registrationStatus: nextStatus,
    };
    onUpdateTeam(updated);
    showToast(`SQUAD '${team.name}' STATUS: [${nextStatus}].`);
  };

  // Confirm Delete Single Team
  const handleConfirmDeleteSingle = async () => {
    if (!deletingTeam) return;
    try {
      const numId = Number(deletingTeam.id);
      if (Number.isSafeInteger(numId) && numId > 0) {
        await api.teams.delete(numId);
      }
    } catch (err: unknown) {
      console.warn("Backend team deletion warning:", err);
    }
    onDeleteTeam(deletingTeam.id);
    onAddLog({
      id: `LOG-DEL-TEAM-${Date.now()}`,
      timestamp: new Date().toTimeString().split(" ")[0],
      type: "team_register",
      message: `Squad '${deletingTeam.name}' deleted.`,
    });
    showToast(`SQUAD '${deletingTeam.name}' DELETED.`);
    setDeletingTeam(null);
  };

  // Confirm Purge All
  const handleConfirmPurgeAll = () => {
    onDeleteAllTeams();
    onAddLog({
      id: `LOG-PURGE-TEAMS-${Date.now()}`,
      timestamp: new Date().toTimeString().split(" ")[0],
      type: "team_register",
      message: "ALL squads purged from grid by Commander.",
    });
    showToast("ALL SQUADS PURGED FROM ARENA GRID.");
    setIsPurgeAllModalOpen(false);
  };

  return (
    <div className="cec-teams-root">
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deletingTeam !== null}
        title="PURGE SQUAD CREDENTIALS"
        message={`Are you sure you want to delete squad '${deletingTeam?.name}' (${deletingTeam?.id})? Their members and arena score (${deletingTeam?.score || 0} PTS) will be permanently cleared.`}
        confirmLabel="PURGE SQUAD"
        type="danger"
        onConfirm={handleConfirmDeleteSingle}
        onClose={() => setDeletingTeam(null)}
      />

      {/* Purge All Confirmation Modal */}
      <ConfirmationModal
        isOpen={isPurgeAllModalOpen}
        title="PURGE ALL REGISTERED SQUADS"
        message="Are you sure you want to remove ALL registered teams from the database? This action cannot be undone."
        confirmLabel="PURGE ALL TEAMS"
        type="danger"
        onConfirm={handleConfirmPurgeAll}
        onClose={() => setIsPurgeAllModalOpen(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="cec-cyber-alert alert-success">
          <CheckIcon className="w-5 h-5 text-green" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 1: TOP SQUADS TELEMETRY & ACTIONS BANNER               */}
      {/* ============================================================== */}
      <div className="cec-matrix-hud cyber-corners">
        <div className="hud-header-bar">
          <div className="hud-header-left">
            <span className="hud-matrix-tag">{"// SQUAD DIRECTORY & REGISTRATION"}</span>
            <h2 className="hud-matrix-title">FIELD SQUAD MATRIX TELEMETRY</h2>
          </div>
          <div className="hud-header-right flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setParsedPreviewRows([]);
                setSelectedFileName(null);
                setBulkError(null);
                setIsBulkModalOpen(true);
              }}
              className="overview-action-btn"
              style={{ background: "#00f3ff", color: "#040406", borderColor: "#00f3ff", fontWeight: 700 }}
            >
              <UploadIcon className="w-4 h-4" />
              <span>[ BULK UPLOAD SQUADS ]</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingTeam(null);
                setTeamFormName("");
                setTeamFormPasscode("HEIST2026");
                setTeamFormScore(0);
                setSingleFormError(null);
                setIsSingleTeamModalOpen(true);
              }}
              className="overview-action-btn"
            >
              <PlusIcon className="w-4 h-4 text-white" />
              <span>[ + ADD SQUAD ]</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="overview-action-btn"
              title="Download Excel / CSV template for bulk team upload"
            >
              <DownloadIcon className="w-4 h-4 text-white" />
              <span>Template</span>
            </button>

            {teams.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleExportSquads}
                  className="overview-action-btn"
                  title="Export all squads to CSV"
                >
                  <DownloadIcon className="w-4 h-4 text-white" />
                  <span>Export</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPurgeAllModalOpen(true)}
                  className="overview-action-btn"
                  style={{ borderColor: "rgba(255, 0, 60, 0.4)", color: "#fb7185" }}
                >
                  <TrashIcon className="w-4 h-4" />
                  <span>Purge All</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="hud-levels-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {/* REGISTERED SQUADS */}
          <div className="hud-level-card">
            <div className="level-card-head">
              <span className="level-badge-tag">REGISTERED SQUADS</span>
              <span className="level-pts-label">
                <strong className="text-white">{teams.length}</strong> IN GRID
              </span>
            </div>
            <div className="level-progress-track">
              <div
                className="level-progress-bar level-1-fill"
                style={{ width: `${Math.min(100, (teams.length / 50) * 100)}%` }}
              />
            </div>
            <div className="level-card-meta">
              <span>Verified Squads</span>
              <span className="text-green font-bold">{verifiedCount} Active</span>
            </div>
          </div>

          {/* TOTAL OPERATIVES */}
          <div className="hud-level-card">
            <div className="level-card-head">
              <span className="level-badge-tag">FIELD OPERATIVES</span>
              <span className="level-pts-label">
                <strong className="text-white">{totalOperatives}</strong> PARTICIPANTS
              </span>
            </div>
            <div className="level-progress-track">
              <div
                className="level-progress-bar level-2-fill"
                style={{ width: `${Math.min(100, (totalOperatives / 150) * 100)}%` }}
              />
            </div>
            <div className="level-card-meta">
              <span>Squad Average</span>
              <span className="text-white">
                {(totalOperatives / (teams.length || 1)).toFixed(1)} / squad
              </span>
            </div>
          </div>

          {/* STATUS BREAKDOWN */}
          <div className="hud-level-card">
            <div className="level-card-head">
              <span className="level-badge-tag">STATUS METRICS</span>
              <span className="level-pts-label">CLEARANCE LEVELS</span>
            </div>
            <div className="level-progress-track">
              <div
                className="level-progress-bar level-3-fill"
                style={{
                  width: `${teams.length > 0 ? (verifiedCount / teams.length) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="level-card-meta">
              <span className="text-yellow">{pendingCount} Pending</span>
              <span className="text-green">{verifiedCount} Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION 2: SQUADS DIRECTORY TABLE                              */}
      {/* ============================================================== */}
      <div className="cec-panel-card cyber-corners">
        <div className="cec-panel-header">
          <div className="panel-title-wrap">
            <UsersIcon className="w-5 h-5 text-cyan" />
            <h3 className="cec-panel-title">SQUAD DIRECTORY</h3>
            <span className="cec-count-badge">{teams.length} SQUADS</span>
          </div>

          <div className="cec-telemetry-strip">
            <span className="telemetry-item">
              // VERIFIED: <strong className="text-green">{verifiedCount}</strong>
            </span>
            <span className="telemetry-item">
              // PENDING: <strong className="text-yellow">{pendingCount}</strong>
            </span>
            <span className="telemetry-item">
              // OPERATIVES: <strong className="text-cyan">{totalOperatives}</strong>
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
              placeholder="Search squad name, captain, email, operatives..."
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
          </div>
        </div>

        {/* Table Content */}
        <div className="cec-table-responsive">
          <table className="cec-data-table">
            <thead>
              <tr>
                <th style={{ width: "90px", textAlign: "center" }}>SQUAD ID</th>
                <th style={{ minWidth: "240px" }}>SQUAD &amp; INSTITUTION</th>
                <th style={{ minWidth: "220px" }}>CAPTAIN / CONTACT</th>
                <th style={{ minWidth: "220px" }}>OPERATIVES</th>
                <th style={{ width: "100px", textAlign: "center" }}>SCORE</th>
                <th style={{ width: "110px", textAlign: "center" }}>STATUS</th>
                <th style={{ width: "160px", textAlign: "center" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {teams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="cec-empty-state-cell">
                    <div className="empty-state-terminal">
                      <div className="terminal-prompt-line">
                        <span className="text-cyan">&gt; [SYSTEM: SQUAD DIRECTORY EMPTY]</span>
                      </div>
                      <p className="empty-main-text">
                        ZERO TEAMS CURRENTLY REGISTERED IN THE ARENA DATABASE.
                      </p>
                      <p className="empty-sub-text">
                        Upload an <strong>Excel file (.xlsx, .xls)</strong> or <strong>CSV</strong>, paste clipboard data, or register individual squads using the controls above.
                      </p>
                      <div className="flex gap-3 mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setParsedPreviewRows([]);
                            setSelectedFileName(null);
                            setBulkError(null);
                            setIsBulkModalOpen(true);
                          }}
                          className="cec-submit-btn"
                          style={{ minWidth: "auto", height: "42px", padding: "0.6rem 1.4rem" }}
                        >
                          [ BULK UPLOAD EXCEL / CSV ]
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="cec-empty-state-cell">
                    <div className="empty-state-terminal">
                      <p className="empty-main-text">
                        // NO SQUADS MATCH YOUR SEARCH CRITERIA
                      </p>
                      <p className="empty-sub-text">
                        Try resetting your search query or status filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTeams.map((team) => {
                  const captain =
                    team.members.find((m) => m.role === "Captain") ||
                    team.members[0];
                  const operatives = team.members.filter(
                    (m) => m.role === "Operative"
                  );

                  return (
                    <tr key={team.id} className="cec-table-row">
                      {/* ID */}
                      <td style={{ textAlign: "center" }}>
                        <span className="cec-level-pill lvl-1">{team.id}</span>
                      </td>

                      {/* SQUAD NAME & ORG */}
                      <td className="cell-challenge-title">
                        <div className="chal-primary-title">{team.name}</div>
                        {team.organization && (
                          <div className="chal-brief-text text-muted">
                            🏛️ {team.organization}
                          </div>
                        )}
                        <div className="chal-flag-chip">
                          <span className="flag-label">LAST ACTIVE:</span>
                          <code>{team.lastActive || "Idle"}</code>
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

                      {/* OPERATIVES */}
                      <td>
                        {operatives.length === 0 ? (
                          <span className="text-muted text-xs">— No other members —</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {operatives.map((op, i) => (
                              <span
                                key={i}
                                className="cec-category-badge cat-web"
                                style={{ fontSize: "0.68rem", padding: "0.15rem 0.45rem" }}
                              >
                                {op.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* SCORE */}
                      <td style={{ textAlign: "center" }}>
                        <span className="chal-points-badge">
                          <strong>{team.score.toLocaleString()}</strong> PTS
                        </span>
                        <div style={{ fontSize: "0.7rem", color: "#71717a" }}>
                          {team.solvedCount} Solves
                        </div>
                      </td>

                      {/* STATUS TOGGLE */}
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(team)}
                          className={`cec-active-toggle-btn ${
                            team.registrationStatus === "VERIFIED"
                              ? "is-active"
                              : "is-halted"
                          }`}
                          title="Click to cycle status: VERIFIED -> PENDING -> FLAGGED"
                        >
                          {team.registrationStatus}
                        </button>
                      </td>

                      {/* ACTIONS */}
                      <td style={{ textAlign: "center" }}>
                        <div className="cec-actions-flex">
                          <button
                            type="button"
                            onClick={() => handleStartEditTeam(team)}
                            className="cec-action-btn btn-edit"
                            title="Edit squad details"
                          >
                            <EditIcon className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingTeam(team)}
                            className="cec-action-btn btn-delete"
                            title="Delete squad"
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

      {/* ============================================================== */}
      {/* MODAL 1: BULK UPLOAD MODAL (EXCEL / CSV / DIRECT PASTE)        */}
      {/* ============================================================== */}
      {isBulkModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsBulkModalOpen(false)}>
          <div
            className="admin-modal-card cyber-corners"
            style={{ maxWidth: "900px", width: "95vw", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="admin-modal-header">
              <div className="modal-title-wrap">
                <UploadIcon className="w-5 h-5 text-cyan" />
                <h3 className="modal-title">BULK SQUAD INGESTION ENGINE</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="modal-close-btn"
                aria-label="Close modal"
              >
                <CloseIcon className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="admin-modal-body" style={{ overflowY: "auto", flex: 1, padding: "1.25rem 1.5rem" }}>
              {/* Tabs: File Upload vs Direct Paste */}
              <div className="flex gap-2 border-b border-white/10 pb-3 mb-4">
                <button
                  type="button"
                  onClick={() => setBulkActiveTab("file")}
                  className={`cec-action-btn ${bulkActiveTab === "file" ? "btn-edit" : ""}`}
                  style={{
                    padding: "0.5rem 1rem",
                    fontSize: "0.85rem",
                    borderColor: bulkActiveTab === "file" ? "#00f3ff" : "rgba(255,255,255,0.2)",
                    background: bulkActiveTab === "file" ? "rgba(0,243,255,0.15)" : "transparent",
                  }}
                >
                  <UploadIcon className="w-4 h-4" />
                  <span>[ CHOOSE FILE FROM DEVICE (.XLSX / .CSV) ]</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkActiveTab("paste")}
                  className={`cec-action-btn ${bulkActiveTab === "paste" ? "btn-edit" : ""}`}
                  style={{
                    padding: "0.5rem 1rem",
                    fontSize: "0.85rem",
                    borderColor: bulkActiveTab === "paste" ? "#00f3ff" : "rgba(255,255,255,0.2)",
                    background: bulkActiveTab === "paste" ? "rgba(0,243,255,0.15)" : "transparent",
                  }}
                >
                  <span>[ DIRECT PASTE / CLIPBOARD ]</span>
                </button>
              </div>

              {bulkError && (
                <div className="cec-cyber-alert alert-error mb-4">
                  <span>⚠️ {bulkError}</span>
                </div>
              )}

              {/* TAB 1: FILE UPLOAD */}
              {bulkActiveTab === "file" && (
                <div className="flex flex-col gap-4">
                  {/* Drag & Drop Box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-cyan/40 hover:border-cyan transition-colors rounded-lg p-8 text-center cursor-pointer bg-white/[0.02] flex flex-col items-center justify-center gap-3"
                  >
                    <UploadIcon className="w-10 h-10 text-cyan animate-pulse" />
                    <div>
                      <p className="font-pixel text-white text-base tracking-wider mb-1">
                        DRAG &amp; DROP YOUR EXCEL OR CSV SPREADSHEET HERE
                      </p>
                      <p className="font-mono text-xs text-muted">
                        Supports <strong>.xlsx, .xls, .csv, .tsv</strong> up to 10MB
                      </p>
                    </div>

                    <button
                      type="button"
                      className="cec-submit-btn"
                      style={{ minWidth: "auto", height: "40px", fontSize: "0.8rem", padding: "0.4rem 1.2rem", marginTop: "0.5rem" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      [ CHOOSE FILE FROM DEVICE ]
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv, .xlsx, .xls, .tsv, .txt, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                  </div>

                  {selectedFileName && (
                    <div className="flex items-center justify-between p-3 rounded bg-white/5 border border-white/10 font-mono text-xs">
                      <span>📄 SELECTED: <strong className="text-cyan">{selectedFileName}</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFileName(null);
                          setParsedPreviewRows([]);
                        }}
                        className="text-red hover:underline"
                      >
                        [ Clear ]
                      </button>
                    </div>
                  )}

                  {isParsing && (
                    <div className="text-center font-mono text-xs text-cyan animate-pulse py-2">
                      &gt; PARSING SPREADSHEET STRUCTURE...
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DIRECT PASTE */}
              {bulkActiveTab === "paste" && (
                <div className="flex flex-col gap-3">
                  <label className="cec-field-label">
                    PASTE SPREADSHEET ROWS (TAB-SEPARATED OR CSV)
                  </label>
                  <textarea
                    rows={6}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`Squad Name\tCaptain Name\tCaptain Email\tOperative 1\tOperative 2\tOrganization\nZero Day Syndicate\tAlex Mercer\talex@zeroday.io\tElena Rostova\tKaelen Voss\tTech Univ\nByte Bandits\tMarcus Shaw\tmarcus@byte.io\tSam Cross\tDevon Reed\tMIT College`}
                    className="cec-terminal-textarea font-mono text-xs"
                    style={{ minHeight: "120px" }}
                  />
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs text-muted">
                      💡 Tip: Copy cells directly from Excel or Google Sheets (Ctrl+C) and paste here.
                    </span>
                    <button
                      type="button"
                      onClick={handleParsePastedText}
                      className="cec-action-btn btn-edit"
                      style={{ padding: "0.5rem 1.2rem" }}
                    >
                      [ PARSE PASTED DATA ]
                    </button>
                  </div>
                </div>
              )}

              {/* PREVIEW & VALIDATION TABLE */}
              {parsedPreviewRows.length > 0 && (
                <div className="mt-6 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-mono text-xs text-white">
                      PARSED PREVIEW: <strong>{parsedPreviewRows.length}</strong> Squads found (
                      <strong className="text-green">
                        {parsedPreviewRows.filter((r) => r.isValid).length} Valid
                      </strong>
                      )
                    </span>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectAllPreview(true)}
                        className="font-mono text-xs text-cyan hover:underline"
                      >
                        [ Select All ]
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectAllPreview(false)}
                        className="font-mono text-xs text-muted hover:underline"
                      >
                        [ Deselect All ]
                      </button>
                    </div>
                  </div>

                  <div className="cec-table-responsive" style={{ maxHeight: "250px", overflowY: "auto" }}>
                    <table className="cec-data-table">
                      <thead>
                        <tr>
                          <th style={{ width: "40px", textAlign: "center" }}>✓</th>
                          <th>SQUAD NAME</th>
                          <th>CAPTAIN</th>
                          <th>EMAIL</th>
                          <th>OPERATIVES</th>
                          <th>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedPreviewRows.map((row) => (
                          <tr key={row.id} className="cec-table-row">
                            <td style={{ textAlign: "center" }}>
                              <input
                                type="checkbox"
                                checked={row.selected}
                                onChange={() => handleToggleRowSelection(row.id)}
                                style={{ accentColor: "#00f3ff", cursor: "pointer" }}
                              />
                            </td>
                            <td className="font-mono font-bold text-white text-xs">{row.name}</td>
                            <td className="font-mono text-xs text-muted">{row.captainName}</td>
                            <td className="font-mono text-xs text-muted">{row.captainEmail || "—"}</td>
                            <td className="font-mono text-xs text-muted">
                              {row.operatives.length > 0 ? row.operatives.join(", ") : "—"}
                            </td>
                            <td>
                              {row.isValid ? (
                                <span className="cec-category-badge cat-crypto">VALID</span>
                              ) : (
                                <span
                                  className="cec-category-badge cat-misc"
                                  title={row.warnings.join(", ")}
                                >
                                  {row.warnings[0]}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="admin-modal-footer">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="modal-btn modal-btn-cancel"
              >
                CANCEL
              </button>

              <button
                type="button"
                onClick={handleConfirmBulkIngestion}
                disabled={parsedPreviewRows.filter((r) => r.selected).length === 0}
                className="modal-btn modal-btn-confirm"
                style={{
                  background: "#00f3ff",
                  color: "#040406",
                  opacity: parsedPreviewRows.filter((r) => r.selected).length === 0 ? 0.4 : 1,
                  cursor:
                    parsedPreviewRows.filter((r) => r.selected).length === 0
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                CONFIRM INGESTION ({parsedPreviewRows.filter((r) => r.selected).length} SQUADS)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: SINGLE SQUAD ADD / EDIT MODAL                         */}
      {/* ============================================================== */}
      {isSingleTeamModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsSingleTeamModalOpen(false)}>
          <div
            className="admin-modal-card cyber-corners"
            style={{ maxWidth: "600px", width: "95vw" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal-header">
              <div className="modal-title-wrap">
                <UsersIcon className="w-5 h-5 text-cyan" />
                <h3 className="modal-title">
                  {editingTeam ? `[ ~ ] EDIT SQUAD: ${editingTeam.id}` : "[ + ] REGISTER NEW SQUAD"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSingleTeamModalOpen(false)}
                className="modal-close-btn"
                aria-label="Close modal"
              >
                <CloseIcon className="w-4 h-4 text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmitSingleTeam} noValidate className="admin-modal-body flex flex-col gap-4">
              {singleFormError && (
                <div className="cec-cyber-alert alert-error">
                  <span>⚠️ {singleFormError}</span>
                </div>
              )}

              <div className="form-group">
                <label className="cec-field-label">SQUAD NAME *</label>
                <input
                  type="text"
                  value={teamFormName}
                  onChange={(e) => setTeamFormName(e.target.value)}
                  placeholder="e.g. Zero Day Syndicate, Byte Bandits..."
                  required
                  className="cec-terminal-input"
                />
              </div>

              <div className="form-group">
                <label className="cec-field-label">SQUAD PASSWORD / PASSCODE *</label>
                <input
                  type="text"
                  value={teamFormPasscode}
                  onChange={(e) => setTeamFormPasscode(e.target.value)}
                  placeholder="e.g. HEIST2026"
                  required
                  className="cec-terminal-input"
                />
                <span className="field-hint-text">All members will use this squad name and password to enter the arena</span>
              </div>

              <div className="form-group">
                <label className="cec-field-label">INITIAL SCORE (PTS)</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={teamFormScore}
                  onChange={(e) => setTeamFormScore(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="cec-terminal-input"
                />
                <span className="field-hint-text">Starting points for the squad in the tournament leaderboard (default: 0)</span>
              </div>

              <div className="admin-modal-footer mt-4">
                <button
                  type="button"
                  disabled={isSingleSaving}
                  onClick={() => setIsSingleTeamModalOpen(false)}
                  className="modal-btn modal-btn-cancel"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSingleSaving}
                  className="modal-btn modal-btn-confirm"
                  style={{ background: "#00f3ff", color: "#040406" }}
                >
                  {isSingleSaving
                    ? "SAVING SQUAD..."
                    : editingTeam
                    ? "SAVE SQUAD"
                    : "REGISTER SQUAD"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
