"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import {
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  TerminalIcon,
  ShieldIcon,
  AlertTriangleIcon,
} from "./CyberIcons";
import { playVaultTransitionSound } from "@/components/PixelTransition";

// Original Main Website Web Audio API Sound Generator for Clicks
const playCyberClick = () => {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") ctx.resume();

    const bufferSize = ctx.sampleRate * 0.05; // 50ms mechanical static
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 3000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  } catch {
    // Audio not supported or blocked
  }
};

// Subtle cyber hover hum from Arena / Leaderboard
const playCyberHover = () => {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(60, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {
    // Audio not supported or blocked
  }
};

// Interactive Text Scrambler from Main Website
const ScrambleText: React.FC<{ text: string }> = ({ text }) => {
  const [displayText, setDisplayText] = useState(text);
  const chars = "!<>-_\\/[]{}—=+*^?#_";

  const scramble = () => {
    playCyberHover();
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split("")
          .map((letter, index) => {
            if (index < iteration) {
              return text[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      if (iteration >= text.length) {
        clearInterval(interval);
      }

      iteration += 1 / 2;
    }, 30);
  };

  return (
    <span onMouseEnter={scramble} style={{ display: "inline-block" }}>
      {displayText}
    </span>
  );
};

type TransitionPhase = "idle" | "sliding-to-auth" | "authenticated" | "sliding-to-login";

interface AdminLoginProps {
  onLoginSuccess?: (email: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transitionPhase, setTransitionPhase] = useState<TransitionPhase>("idle");
  const [authenticatedUser, setAuthenticatedUser] = useState<string>("");
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const validateIdentifier = (val: string) => {
    return val.trim().length >= 3;
  };

  // Trigger login transition:
  // Connects directly to backend POST /api/auth/login and requires role === 'admin'
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playCyberClick();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError("AUTHENTICATION ERROR: Admin identity / username is required.");
      return;
    }

    if (!validateIdentifier(trimmedEmail)) {
      setError("VALIDATION FAILED: Admin identity must be at least 3 characters.");
      return;
    }

    if (!password) {
      setError("AUTHENTICATION ERROR: Passcode cannot be blank.");
      return;
    }

    try {
      const loginRes = await api.auth.login(trimmedEmail, password);

      if (loginRes.user.role !== "admin") {
        setError("ACCESS DENIED // ADMIN COMMAND CLEARANCE REQUIRED");
        return;
      }

      // Play original website vault sound (mechanical roll + 14 gear clicks)
      playVaultTransitionSound("right-to-left");
      setAuthenticatedUser(trimmedEmail);
      setCurrentTimeStr(new Date().toISOString());
      setTransitionPhase("sliding-to-auth");

      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = setTimeout(() => {
        setTransitionPhase("authenticated");
        if (onLoginSuccess) {
          onLoginSuccess(trimmedEmail);
        }
      }, 1120);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.toLowerCase().includes("invalid email or password") ||
        msg.toLowerCase().includes("invalid") ||
        msg.toLowerCase().includes("401")
      ) {
        setError("AUTHENTICATION FAILED: Invalid admin email or passcode.");
        return;
      }

      setError(`AUTHENTICATION FAILED: ${msg}`);
    }
  };

  // Return to Login with reverse slide animation & sound
  const handleLogout = () => {
    playCyberClick();
    playVaultTransitionSound("left-to-right");
    setTransitionPhase("sliding-to-login");

    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = setTimeout(() => {
      setTransitionPhase("idle");
    }, 1120);
  };

  return (
    <div className="crt-screen admin-screen-container">
      {/* Background Scanlines Overlay (Positioned strictly in background at z-index: 1) */}
      <div className="scanlines-overlay" />

      {/* Vault Wheel Machinery on Left & Right Borders — Strictly the TWO existing wheels, NO extra wheels */}
      <div
        className={`side-wheel-container side-wheel-left ${
          transitionPhase === "sliding-to-auth"
            ? "wheel-slide-left"
            : transitionPhase === "sliding-to-login"
            ? "wheel-slide-right"
            : ""
        }`}
        aria-hidden="true"
      >
        <Image
          src="/homepage/wheel.png"
          alt="Vault Wheel Left"
          width={780}
          height={780}
          className="side-wheel-img side-wheel-rotate-cw"
          priority
        />
      </div>

      <div className="side-wheel-container side-wheel-right" aria-hidden="true">
        <Image
          src="/homepage/wheel.png"
          alt="Vault Wheel Right"
          width={780}
          height={780}
          className="side-wheel-img side-wheel-rotate-ccw"
          priority
        />
      </div>

      {/* Main Slide Viewport (Positioned at z-index: 20 ABOVE scanlines so words are 100% clearly visible) */}
      <div className="admin-slide-viewport">
        {/* PANEL 1: Login Terminal Panel (Slides out to the left on access) */}
        {(transitionPhase === "idle" ||
          transitionPhase === "sliding-to-auth" ||
          transitionPhase === "sliding-to-login") && (
          <div
            className={`admin-slide-panel ${
              transitionPhase === "sliding-to-auth"
                ? "slide-out-left"
                : transitionPhase === "sliding-to-login"
                ? "slide-in-left"
                : ""
            }`}
          >
            <div className="admin-card-container">
              <div className="admin-terminal-card cyber-corners">
                {/* Header & Brand badge */}
                <div className="admin-login-header">
                  <div className="admin-brand-badge" onMouseEnter={playCyberHover}>
                    <Image
                      src="/cosc%20logo.png"
                      alt="COSC"
                      width={24}
                      height={24}
                      className="admin-brand-icon"
                      priority
                    />
                    <span className="admin-brand-text">CEC HEIST 2K26</span>
                  </div>

                  <h1 className="admin-title-text">
                    ADMIN ACCESS TERMINAL
                  </h1>
                  <p className="admin-subtitle-text">
                    {"// SURVEILLANCE & COMMAND NODE 01"}
                  </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="admin-login-form">
                  {/* Username / Email Input */}
                  <div className="admin-form-group">
                    <label htmlFor="admin-email" className="admin-form-label">
                      <TerminalIcon className="w-4 h-4 text-white flex-shrink-0" />
                      <span>Admin ID / Username</span>
                    </label>
                    <div className="admin-input-wrapper">
                      <input
                        id="admin-email"
                        type="text"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="coscadmin"
                        className="admin-text-input"
                        autoComplete="username"
                        disabled={transitionPhase !== "idle"}
                        spellCheck={false}
                      />
                    </div>
                  </div>

                  {/* Password Input with Visibility Toggle */}
                  <div className="admin-form-group">
                    <label htmlFor="admin-pass" className="admin-form-label">
                      <LockIcon className="w-4 h-4 text-white flex-shrink-0" />
                      <span>Cryptographic Passcode</span>
                    </label>
                    <div className="admin-input-wrapper">
                      <input
                        id="admin-pass"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="••••••••••••"
                        className="admin-text-input has-toggle"
                        autoComplete="current-password"
                        disabled={transitionPhase !== "idle"}
                        spellCheck={false}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          playCyberClick();
                          setShowPassword(!showPassword);
                        }}
                        className="admin-password-toggle"
                        aria-label={showPassword ? "Hide passcode" : "Show passcode"}
                      >
                        {showPassword ? (
                          <EyeOffIcon className="w-5 h-5 text-white" />
                        ) : (
                          <EyeIcon className="w-5 h-5 text-white" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="admin-login-error">
                      <AlertTriangleIcon className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submit Button styled identically to [ ENTER THE ARENA ] */}
                  <div className="admin-btn-stack">
                    <button
                      type="submit"
                      disabled={transitionPhase !== "idle"}
                      className="arena-enter-btn admin-submit-btn"
                      onMouseEnter={playCyberHover}
                    >
                      <span className="bracket">[</span>
                      <ScrambleText text="ACCESS SYSTEM" />
                      <span className="bracket">]</span>
                    </button>
                  </div>
                </form>

                {/* Security Notice */}
                <div className="admin-login-notice">
                  <div className="admin-notice-pill">
                    <ShieldIcon className="w-4 h-4 text-white" />
                    <span>FRONTEND TERMINAL INTERFACE</span>
                  </div>
                  <p className="admin-notice-desc">
                    Authenticated access synchronizes mechanical vault machinery.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANEL 2: Access Granted Screen (Slides in from the right, left wheel remains fully present) */}
        {(transitionPhase === "sliding-to-auth" ||
          transitionPhase === "authenticated" ||
          transitionPhase === "sliding-to-login") && (
          <div
            className={`admin-slide-panel ${
              transitionPhase === "sliding-to-auth"
                ? "slide-in-right"
                : transitionPhase === "sliding-to-login"
                ? "slide-out-right"
                : ""
            }`}
          >
            <div className="admin-card-container">
              <div className="admin-terminal-card admin-auth-card cyber-corners">
                <div className="admin-auth-icon-wrap">
                  <ShieldIcon className="w-16 h-16 text-white" />
                </div>

                <h2 className="admin-title-text admin-title-granted">
                  ACCESS GRANTED
                </h2>
                <p className="admin-subtitle-text">
                  {"// COMMAND NODE 01 // SURVEILLANCE ACTIVE"}
                </p>

                <div className="admin-auth-details">
                  <div className="auth-row">
                    <span className="auth-label">OPERATOR IDENTITY:</span>
                    <span className="auth-val">{authenticatedUser || "ADMIN_AGENT"}</span>
                  </div>
                  <div className="auth-row">
                    <span className="auth-label">AUTHORIZATION:</span>
                    <span className="auth-val">LEVEL 9 COMMAND CLEARANCE</span>
                  </div>
                  <div className="auth-row">
                    <span className="auth-label">GATEWAY STATUS:</span>
                    <span className="auth-val auth-status-online">● SECURE NODE LINKED</span>
                  </div>
                  <div className="auth-row">
                    <span className="auth-label">TIMESTAMP:</span>
                    <span className="auth-val">{currentTimeStr}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="arena-enter-btn admin-submit-btn"
                  onMouseEnter={playCyberHover}
                >
                  <span className="bracket">[</span>
                  <ScrambleText text="LOGOUT / RETURN TO TERMINAL" />
                  <span className="bracket">]</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cyber Crime Bottom Marquee Ticker from Main Website */}
      <div className="cyber-marquee-container" aria-hidden="true">
        <div className="cyber-marquee-content">
          <span>ACCESS DENIED MR.CREW, ACCESS DENIED MRS.CREW // </span>
          <span>RESTRICTED TERMINAL // SURVEILLANCE ACTIVE // AUTHORIZED ADM_KEY ONLY // </span>
          <span>ACCESS DENIED MR.CREW, ACCESS DENIED MRS.CREW // </span>
          <span>RESTRICTED TERMINAL // SURVEILLANCE ACTIVE // AUTHORIZED ADM_KEY ONLY // </span>
        </div>
      </div>
    </div>
  );
};
