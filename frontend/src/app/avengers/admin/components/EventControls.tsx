"use client";

import React, { useState } from "react";
import { EventConfig, ActivityLog } from "../data/mockData";
import { ConfirmationModal } from "./ConfirmationModal";
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  AlertTriangleIcon,
  ShieldIcon,
  ActivityIcon,
  SettingsIcon,
  CheckIcon,
} from "./CyberIcons";

interface EventControlsProps {
  eventConfig: EventConfig;
  onUpdateEventConfig: (newConfig: EventConfig) => void;
  onAddLog: (log: ActivityLog) => void;
}

type PendingAction = "start" | "stop" | "end" | "publish-toggle" | null;

export const EventControls: React.FC<EventControlsProps> = ({
  eventConfig,
  onUpdateEventConfig,
  onAddLog,
}) => {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form State for Event Details
  const [eventName, setEventName] = useState(eventConfig.name);
  const [eventEdition, setEventEdition] = useState(eventConfig.edition);
  const [startTime, setStartTime] = useState(eventConfig.startTime);
  const [endTime, setEndTime] = useState(eventConfig.endTime);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Status Styling & Label
  const getStatusBadge = () => {
    switch (eventConfig.status) {
      case "LIVE":
        return {
          label: "COMPETITION LIVE",
          dotClass: "status-dot-green",
          badgeClass: "badge-green",
          desc: "Submissions active, realtime leaderboard scoring enabled.",
        };
      case "ENDED":
        return {
          label: "COMPETITION ENDED",
          dotClass: "status-dot-red",
          badgeClass: "badge-red",
          desc: "Competition concluded. All flags locked against submissions.",
        };
      case "NOT STARTED":
      default:
        return {
          label: "NOT STARTED",
          dotClass: "status-dot-amber",
          badgeClass: "badge-amber",
          desc: "Event armed in standby mode. Waiting for organizer launch.",
        };
    }
  };

  const statusInfo = getStatusBadge();

  // Execution Handlers with Confirmation Modal
  const handleTriggerAction = (action: PendingAction) => {
    setPendingAction(action);
  };

  const handleConfirmAction = () => {
    if (!pendingAction) return;

    const timestamp = new Date().toTimeString().split(" ")[0];

    if (pendingAction === "start") {
      onUpdateEventConfig({
        ...eventConfig,
        status: "LIVE",
      });
      onAddLog({
        id: `LOG-${Date.now()}`,
        timestamp,
        type: "event_status",
        message: "Competition state transitioned to LIVE by Commander.",
      });
      setStatusMessage("COMPETITION SUCCESSFULLY LAUNCHED [STATUS: LIVE]");
    } else if (pendingAction === "stop") {
      onUpdateEventConfig({
        ...eventConfig,
        status: "NOT STARTED",
      });
      onAddLog({
        id: `LOG-${Date.now()}`,
        timestamp,
        type: "event_status",
        message: "Competition paused / halted by Commander.",
      });
      setStatusMessage("COMPETITION HALTED [STATUS: NOT STARTED]");
    } else if (pendingAction === "end") {
      onUpdateEventConfig({
        ...eventConfig,
        status: "ENDED",
      });
      onAddLog({
        id: `LOG-${Date.now()}`,
        timestamp,
        type: "event_status",
        message: "Competition terminated and concluded by Commander.",
      });
      setStatusMessage("COMPETITION OFFICIALLY CONCLUDED [STATUS: ENDED]");
    } else if (pendingAction === "publish-toggle") {
      const nextPublished = !eventConfig.isPublished;
      onUpdateEventConfig({
        ...eventConfig,
        isPublished: nextPublished,
      });
      onAddLog({
        id: `LOG-${Date.now()}`,
        timestamp,
        type: "event_status",
        message: `Public event access turned ${nextPublished ? "ONLINE" : "OFFLINE"} by Commander.`,
      });
      setStatusMessage(
        `EVENT PORTAL IS NOW ${nextPublished ? "PUBLICLY VISIBLE" : "RESTRICTED / HIDDEN"}`
      );
    }

    setPendingAction(null);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateEventConfig({
      ...eventConfig,
      name: eventName,
      edition: eventEdition,
      startTime,
      endTime,
    });
    onAddLog({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toTimeString().split(" ")[0],
      type: "event_status",
      message: `Event configuration metadata updated: ${eventName} ${eventEdition}`,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="event-controls-container">
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={pendingAction !== null}
        title={
          pendingAction === "start"
            ? "LAUNCH LIVE COMPETITION"
            : pendingAction === "stop"
            ? "HALT / PAUSE COMPETITION"
            : pendingAction === "end"
            ? "CONCLUDE & END COMPETITION"
            : "TOGGLE PUBLIC PORTAL VISIBILITY"
        }
        message={
          pendingAction === "start"
            ? "Are you sure you want to transition the competition status to LIVE? Flag submissions and scoring mechanisms will be immediately simulated as active."
            : pendingAction === "stop"
            ? "Are you sure you want to pause or halt the competition? Submissions will be temporarily placed on standby."
            : pendingAction === "end"
            ? "CAUTION: This will officially conclude CEC HEIST 2K26. Scores will be locked and final ranks will be sealed."
            : `Are you sure you want to ${
                eventConfig.isPublished ? "UNPUBLISH" : "PUBLISH"
              } the event portal for participants?`
        }
        confirmLabel={
          pendingAction === "start"
            ? "Confirm Launch [LIVE]"
            : pendingAction === "stop"
            ? "Confirm Halt [STANDBY]"
            : pendingAction === "end"
            ? "Confirm Termination [END]"
            : "Confirm Visibility Change"
        }
        type={pendingAction === "end" ? "danger" : "warning"}
        onConfirm={handleConfirmAction}
        onClose={() => setPendingAction(null)}
      />

      {/* Header Banner */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">EVENT COMMAND MATRIX</h1>
          <p className="admin-page-subtitle">
            {"// ORCHESTRATE REALTIME COMPETITION LIFECYCLE, SECTORS, AND TIMERS"}
          </p>
        </div>
        <div className="demo-notice-pill">
          <span className="demo-dot" />
          <span>FRONTEND DEMO CONTROLS // REACT STATE</span>
        </div>
      </div>

      {/* Toast / Status feedback alert */}
      {statusMessage && (
        <div className="cyber-alert cyber-alert-success cyber-corners">
          <CheckIcon className="alert-icon" />
          <span className="alert-text">{statusMessage}</span>
        </div>
      )}

      {/* Primary Status & Power Matrix Grid */}
      <div className="event-controls-grid">
        {/* Left Card: Live Competition Status */}
        <div className="overview-panel cyber-corners">
          <div className="panel-header">
            <h2 className="panel-title">
              <ShieldIcon className="panel-title-icon" />
              CURRENT EVENT STATE
            </h2>
            <div className={`status-badge ${statusInfo.badgeClass}`}>
              <span className={statusInfo.dotClass} />
              <span>{statusInfo.label}</span>
            </div>
          </div>

          <div className="event-status-display">
            <div className="status-highlight-box">
              <div className="status-large-state">
                <span className={statusInfo.dotClass} />
                <span className="status-large-text">{eventConfig.status}</span>
              </div>
              <p className="status-desc-text">{statusInfo.desc}</p>
            </div>

            {/* Quick Metrics */}
            <div className="event-meta-list">
              <div className="event-meta-item">
                <span className="meta-label">EVENT TITLE:</span>
                <span className="meta-value">{eventConfig.name} {eventConfig.edition}</span>
              </div>
              <div className="event-meta-item">
                <span className="meta-label">PUBLIC VISIBILITY:</span>
                <span className={`meta-value ${eventConfig.isPublished ? "text-cyan" : "text-amber"}`}>
                  {eventConfig.isPublished ? "PUBLISHED (ONLINE)" : "UNPUBLISHED (OFFLINE)"}
                </span>
              </div>
              <div className="event-meta-item">
                <span className="meta-label">ALLOCATED POINTS:</span>
                <span className="meta-value text-green">{eventConfig.totalPoints.toLocaleString()} PTS</span>
              </div>
              <div className="event-meta-item">
                <span className="meta-label">TOTAL CHALLENGES:</span>
                <span className="meta-value">{eventConfig.totalChallenges} MODULES</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Lifecycle State Actions */}
        <div className="overview-panel cyber-corners">
          <div className="panel-header">
            <h2 className="panel-title">
              <SettingsIcon className="panel-title-icon" />
              LIFECYCLE TRANSITIONS
            </h2>
            <span className="panel-header-tag">{"// ARMED"}</span>
          </div>

          <div className="event-action-buttons">
            {/* Start Competition Button */}
            <div className="action-row">
              <div className="action-info">
                <span className="action-title">START COMPETITION</span>
                <span className="action-desc">ARM challenges, enable scoreboard scoring, unlock sectors.</span>
              </div>
              <button
                type="button"
                className={`event-action-btn btn-start ${eventConfig.status === "LIVE" ? "is-active" : ""}`}
                onClick={() => handleTriggerAction("start")}
                disabled={eventConfig.status === "LIVE"}
              >
                <PlayIcon className="btn-icon" />
                <span>{eventConfig.status === "LIVE" ? "LIVE NOW" : "START EVENT"}</span>
              </button>
            </div>

            {/* Pause / Stop Competition Button */}
            <div className="action-row">
              <div className="action-info">
                <span className="action-title">HALT / STANDBY</span>
                <span className="action-desc">Pause active submissions and set event to NOT STARTED / STANDBY.</span>
              </div>
              <button
                type="button"
                className={`event-action-btn btn-stop ${eventConfig.status === "NOT STARTED" ? "is-active" : ""}`}
                onClick={() => handleTriggerAction("stop")}
                disabled={eventConfig.status === "NOT STARTED"}
              >
                <PauseIcon className="btn-icon" />
                <span>HALT EVENT</span>
              </button>
            </div>

            {/* End Competition Button */}
            <div className="action-row">
              <div className="action-info">
                <span className="action-title">CONCLUDE &amp; TERMINATE</span>
                <span className="action-desc">Lock final leaderboards and close submission portals permanently.</span>
              </div>
              <button
                type="button"
                className={`event-action-btn btn-end ${eventConfig.status === "ENDED" ? "is-active" : ""}`}
                onClick={() => handleTriggerAction("end")}
                disabled={eventConfig.status === "ENDED"}
              >
                <StopIcon className="btn-icon" />
                <span>{eventConfig.status === "ENDED" ? "CONCLUDED" : "END EVENT"}</span>
              </button>
            </div>

            {/* Publish Toggle Button */}
            <div className="action-row highlight-row">
              <div className="action-info">
                <span className="action-title">PUBLIC VISIBILITY TOGGLE</span>
                <span className="action-desc">
                  Toggle whether participants can view the public portal and challenge listings.
                </span>
              </div>
              <button
                type="button"
                className={`event-action-btn btn-toggle ${eventConfig.isPublished ? "btn-toggle-on" : "btn-toggle-off"}`}
                onClick={() => handleTriggerAction("publish-toggle")}
              >
                <span>{eventConfig.isPublished ? "[ PORTAL: PUBLISHED ]" : "[ PORTAL: UNPUBLISHED ]"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Event Configuration & Schedule Settings Form */}
      <div className="overview-panel cyber-corners" style={{ marginTop: "1.5rem" }}>
        <div className="panel-header">
          <h2 className="panel-title">
            <ActivityIcon className="panel-title-icon" />
            EVENT METADATA &amp; SCHEDULE PARAMETERS
          </h2>
          {savedSuccess && (
            <span className="save-badge-success">CONFIG SAVED TO DEMO STATE</span>
          )}
        </div>

        <form onSubmit={handleSaveDetails} className="event-config-form">
          <div className="form-grid-2">
            <div className="form-field-group">
              <label htmlFor="cfg-event-name" className="field-label">
                EVENT NAME
              </label>
              <input
                id="cfg-event-name"
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                required
                className="admin-input-field"
              />
            </div>

            <div className="form-field-group">
              <label htmlFor="cfg-event-edition" className="field-label">
                EDITION / SEASON
              </label>
              <input
                id="cfg-event-edition"
                type="text"
                value={eventEdition}
                onChange={(e) => setEventEdition(e.target.value)}
                required
                className="admin-input-field"
              />
            </div>
          </div>

          <div className="form-grid-2" style={{ marginTop: "1rem" }}>
            <div className="form-field-group">
              <label htmlFor="cfg-start-time" className="field-label">
                OFFICIAL START TIME (UTC)
              </label>
              <input
                id="cfg-start-time"
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="admin-input-field"
              />
            </div>

            <div className="form-field-group">
              <label htmlFor="cfg-end-time" className="field-label">
                OFFICIAL END TIME (UTC)
              </label>
              <input
                id="cfg-end-time"
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="admin-input-field"
              />
            </div>
          </div>

          <div className="form-submit-row">
            <div className="form-note">
              <AlertTriangleIcon className="note-icon" />
              <span>Simulated configuration updates take effect instantly in local React memory.</span>
            </div>
            <button type="submit" className="arena-enter-btn admin-submit-btn" style={{ maxWidth: "240px" }}>
              [ UPDATE EVENT CONFIG ]
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
