"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { usePixelTransition } from "./PixelTransition";

// Audio sound effects
const playCyberBeep = (freq = 440, type: OscillatorType = "sine", dur = 0.08) => {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch {
    // Audio unsupported
  }
};

const playCyberSuccess = () => {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;
    [520, 659, 784, 1046].forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, now + idx * 0.06);

      gain.gain.setValueAtTime(0.15, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.12);
    });
  } catch {
    // Audio unsupported
  }
};

const playCyberError = () => {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;
    [220, 180].forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(f, now + idx * 0.1);

      gain.gain.setValueAtTime(0.18, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.15);
    });
  } catch {
    // Audio unsupported
  }
};

export default function LoginModal() {
  const {
    isLoginModalOpen,
    closeLoginModal,
    login,
    redirectTarget,
  } = useAuth();
  const { triggerTransition } = usePixelTransition();

  const [teamId, setTeamId] = useState("");
  const [passcode, setPasscode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const teamInputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
    closeLoginModal();
  }, [closeLoginModal]);

  useEffect(() => {
    if (isLoginModalOpen) {
      playCyberBeep(580, "sine", 0.1);
      const timer = setTimeout(() => {
        teamInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isLoginModalOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isLoginModalOpen && !isSubmitting) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoginModalOpen, isSubmitting, handleClose]);

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    playCyberBeep(880, "sine", 0.05);

    try {
      const res = await login(teamId, passcode);
      if (res.success) {
        playCyberSuccess();
        setSuccessMessage("CLEARANCE GRANTED");

        // Short timeout for user to see the success state
        setTimeout(() => {
          closeLoginModal();
          const target = redirectTarget || "/arena";
          triggerTransition(target, "left-to-right");
        }, 650);
      } else {
        playCyberError();
        setErrorMessage(
          res.message || "CLEARANCE DENIED // INVALID CREDENTIALS"
        );
      }
    } catch {
      playCyberError();
      setErrorMessage("SYSTEM ERROR // CONTACT ORGANIZERS");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="cyber-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          closeLoginModal();
        }
      }}
    >
      <div
        className="cyber-modal-card login-modal-custom"
        role="dialog"
        aria-modal="true"
      >
        {/* Corner Cyber Brackets */}
        <div className="corner-bracket top-left" />
        <div className="corner-bracket top-right" />
        <div className="corner-bracket bottom-left" />
        <div className="corner-bracket bottom-right" />

        {/* Close Button top right */}
        <button
          type="button"
          className="modal-close-btn modal-corner-close"
          onClick={() => {
            playCyberBeep(320, "square", 0.06);
            handleClose();
          }}
          disabled={isSubmitting}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Header Center: Rotating Wheel, CEC HEIST, and 2026 */}
        <div className="modal-custom-header">
          <div className="modal-wheel-wrapper">
            <img
              src="/homepage/wheel.png"
              alt="Rotating Vault Wheel"
              className="modal-wheel-spinning"
              draggable={false}
            />
          </div>

          <div className="modal-branding-group">
            <img
              src="/homepage/cec-heist.png"
              alt="CEC HEIST"
              className="modal-logo-heist"
              draggable={false}
            />
            <img
              src="/homepage/2026.png"
              alt="2026"
              className="modal-logo-year"
              draggable={false}
            />
          </div>
        </div>

        {/* Clean Login Form: Team ID and Password with Login Button */}
        <form onSubmit={handleSubmit} className="cyber-form modal-custom-form">
          <div className="form-group">
            <label htmlFor="team-id-input" className="form-label">
              EMAIL / TEAM ID
            </label>
            <div className="input-wrapper">
              <input
                id="team-id-input"
                ref={teamInputRef}
                type="text"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                placeholder="user@test.com or SQUAD_NAME"
                className="cyber-input"
                autoComplete="off"
                spellCheck={false}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="passcode-input" className="form-label">
                PASSWORD
              </label>
              <button
                type="button"
                className="toggle-pwd-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                [{showPassword ? "HIDE" : "SHOW"}]
              </button>
            </div>
            <div className="input-wrapper">
              <input
                id="passcode-input"
                type={showPassword ? "text" : "password"}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="ENTER PASSWORD"
                className="cyber-input"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="cyber-alert cyber-alert-error" role="alert">
              <span className="alert-badge">DENIED</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message Box */}
          {successMessage && (
            <div className="cyber-alert cyber-alert-success" role="status">
              <span className="alert-badge">GRANTED</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form Action: Login Button */}
          <div className="form-actions modal-action-single">
            <button
              type="submit"
              className="cyber-btn cyber-btn-primary modal-login-btn-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="cyber-spinner" />
                  VERIFYING...
                </>
              ) : (
                <>
                  <span className="bracket">[</span>
                  LOGIN
                  <span className="bracket">]</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
