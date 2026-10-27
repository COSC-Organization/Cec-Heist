"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { usePixelTransition } from "../../components/PixelTransition";
import { useAuth } from "../../context/AuthContext";
import AuthGuard from "../../components/AuthGuard";

// Web Audio API Sound Generators
const playCyberHover = () => {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") return;

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
    // Audio unsupported
  }
};

const playCyberClick = () => {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const bufferSize = ctx.sampleRate * 0.05;
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
    // Audio unsupported
  }
};

const ScrambleText = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState(text);
  const chars = "!<>-_\\\\/[]{}—=+*^?#_";

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

// Dummy Team Operatives Data
const DUMMY_MEMBERS = [
  {
    slot: "01",
    name: "Alex Vance",
    role: "Team Lead",
  },
  {
    slot: "02",
    name: "Elena Rostova",
    role: "Operative",
  },
  {
    slot: "03",
    name: "Kaelen Chen",
    role: "Operative",
  },
  {
    slot: "04",
    name: "Marcus Brody",
    role: "Operative",
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { triggerTransition } = usePixelTransition();
  const { user, isLoggedIn, logout, openLoginModal, refreshTeamData } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      refreshTeamData();
    }
  }, [isLoggedIn, user?.id, refreshTeamData]);

  const isActuallyLoggedIn = Boolean(isLoggedIn && user);
  const currentTeamName = user?.teamName || "";
  const currentScore = user?.score ?? 0;

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    playCyberClick();

    if (href.startsWith("#") || href.startsWith("/#")) {
      setMenuOpen(false);
      const hash = href.includes("#")
        ? href.substring(href.indexOf("#") + 1)
        : "";
      if (pathname === "/" || pathname === "") {
        const elem = document.getElementById(hash);
        if (elem) elem.scrollIntoView({ behavior: "smooth" });
      } else {
        setTimeout(() => {
          router.push(href);
        }, 580);
      }
      return;
    }

    if (pathname === href) {
      setMenuOpen(false);
      return;
    }

    if (href === "/") {
      setMenuOpen(false);
      triggerTransition("/", "right-to-left");
      return;
    }

    if (href === "/arena") {
      setMenuOpen(false);
      if (!isLoggedIn) {
        openLoginModal("/arena");
        return;
      }
      triggerTransition("/arena", "left-to-right");
      return;
    }

    if (href === "/leaderboard") {
      setMenuOpen(false);
      if (!isLoggedIn) {
        openLoginModal("/leaderboard");
        return;
      }
      triggerTransition("/leaderboard", "left-to-right");
      return;
    }

    router.prefetch(href);
    setMenuOpen(false);

    setTimeout(() => {
      router.push(href);
    }, 580);
  };

  const handleLogout = () => {
    playCyberClick();
    logout();
  };

  useEffect(() => {
    const handleFirstClick = () => {
      if (audioRef.current) {
        audioRef.current.volume = 0.1;
        audioRef.current.play().catch((e) => console.log("Audio blocked", e));
      }
      document.removeEventListener("click", handleFirstClick);
    };
    document.addEventListener("click", handleFirstClick);
    return () => document.removeEventListener("click", handleFirstClick);
  }, []);

  return (
    <AuthGuard sectorName="SQUAD DOSSIER">
      <main className="crt-screen profile-screen">
      <audio ref={audioRef} src="/music/background%20music.mpeg" loop />
      <div className="scanlines-overlay" />

      {/* Header Pill */}
      <header className="header-wrapper">
        <div className={`header-pill ${menuOpen ? "expanded" : ""}`}>
          <div className="header-content-top" style={{ position: "relative" }}>
            <Link
              href="/"
              className="header-brand"
              onClick={(e) => handleNavClick(e, "/")}
            >
              <Image
                src="/cosc%20logo.png"
                alt="COSC Logo"
                width={56}
                height={56}
                className="header-logo"
              />
            </Link>

            <img
              src="/homepage/menu.png?v=2"
              alt="Menu"
              width={100}
              height={24}
              style={{
                objectFit: "contain",
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            />

            <button
              className={`menu-toggle-btn ${menuOpen ? "open" : ""}`}
              onClick={() => {
                setMenuOpen(!menuOpen);
                playCyberClick();
              }}
              aria-label="Toggle menu"
            >
              <div className="hamburger-icon">
                <span className="line top"></span>
                <span className="line bottom"></span>
              </div>
            </button>
          </div>

          <div className="header-menu-content">
            <div className="menu-modal-header">{"// CEC HEIST 2K26 INDEX"}</div>
            <nav className="menu-nav-list">
              <Link
                href="/"
                className="menu-nav-item"
                onClick={(e) => handleNavClick(e, "/")}
              >
                <ScrambleText text="01. HOME" />
              </Link>
              <Link
                href="/arena"
                className="menu-nav-item"
                onClick={(e) => handleNavClick(e, "/arena")}
              >
                <ScrambleText text="02. ARENA" />
              </Link>
              <Link
                href="/leaderboard"
                className="menu-nav-item"
                onClick={(e) => handleNavClick(e, "/leaderboard")}
              >
                <ScrambleText text="03. LEADERBOARD" />
              </Link>
              <Link
                href="/profile"
                className="menu-nav-item active"
                onClick={(e) => handleNavClick(e, "/profile")}
              >
                <ScrambleText text="04. PROFILE" />
              </Link>
            </nav>

            <img
              src="/homepage/menu-image.png"
              alt="Menu Decor"
              className="menu-decor-image"
            />
          </div>
        </div>
      </header>

      {/* Vault Wheel Machinery on Left & Right Borders */}
      <div className="side-wheel-container side-wheel-left">
        <img
          src="/homepage/wheel.png"
          alt="Vault Wheel Left"
          className="side-wheel-img side-wheel-rotate-cw"
          draggable={false}
        />
      </div>
      <div className="side-wheel-container side-wheel-right">
        <img
          src="/homepage/wheel.png"
          alt="Vault Wheel Right"
          className="side-wheel-img side-wheel-rotate-ccw"
          draggable={false}
        />
      </div>

      {/* Main Profile Clean Content */}
      <div className="profile-content-wrapper">
        <div className="profile-dossier-card profile-card-clean">
          {!isActuallyLoggedIn ? (
            <div className="profile-empty-content">
              {/* Center Top: Unauthenticated Header */}
              <div className="profile-center-header">
                <div className="profile-squad-tag">{"// PROFILE ACCESS"}</div>
                <h1 className="profile-team-name profile-empty-title">NO SQUAD LOGGED IN</h1>
                <div className="profile-empty-subtag">
                  {"// AUTHENTICATION REQUIRED TO VIEW SQUAD DOSSIER"}
                </div>
              </div>

              {/* Center Notice / Placeholder Box */}
              <div className="profile-empty-lock-box">
                <div className="empty-lock-badge">
                  <span className="empty-lock-bracket">[</span>
                  ACCESS RESTRICTED
                  <span className="empty-lock-bracket">]</span>
                </div>
                <p className="empty-lock-desc">
                  NO TEAM CREDENTIALS DETECTED FOR THIS TERMINAL.
                  <br />
                  PLEASE LOG IN WITH YOUR ORGANIZER ASSIGNED TEAM ID &amp; PASSCODE TO ACCESS SQUAD DOSSIER AND ARENA RECORDS.
                </p>
              </div>

              {/* Login Action Bar */}
              <div className="profile-actions-bar">
                <button
                  type="button"
                  className="cyber-btn cyber-btn-login"
                  onClick={() => {
                    playCyberClick();
                    openLoginModal("/profile");
                  }}
                >
                  <span className="bracket">[</span>
                  LOGIN
                  <span className="bracket">]</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Center Top: Team Name & Total Points Earned */}
              <div className="profile-center-header">
                <div className="profile-squad-tag">{"// SQUAD DOSSIER"}</div>
                <h1 className="profile-team-name">{currentTeamName.toUpperCase()}</h1>

                <div className="profile-points-pill">
                  <span className="points-label">TOTAL POINTS EARNED:</span>
                  <span className="points-value">{currentScore.toLocaleString()} PTS</span>
                </div>
              </div>

              {/* Team Members */}
              <div className="profile-members-clean">
                <div className="profile-section-heading">{"// TEAM MEMBERS"}</div>
                <div className="members-clean-grid">
                  {DUMMY_MEMBERS.map((member) => (
                    <div
                      key={member.slot}
                      className={`member-clean-card ${
                        member.role.toLowerCase().includes("lead")
                          ? "member-lead-card"
                          : ""
                      }`}
                    >
                      <span className="member-slot">#{member.slot}</span>
                      <div className="member-clean-info">
                        <span className="member-clean-name">{member.name}</span>
                        <span className="member-clean-role">{member.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logout Button */}
              <div className="profile-actions-bar">
                <button
                  type="button"
                  className="cyber-btn cyber-btn-logout"
                  onClick={handleLogout}
                >
                  <span className="bracket">[</span>
                  LOGOUT
                  <span className="bracket">]</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cyber Marquee Banner at Bottom */}
      <div className="cyber-marquee-container" aria-hidden="true">
        <div className="cyber-marquee-track cyber-marquee-content">
          <div className="cyber-marquee-group">
            {[...Array(8)].map((_, i) => (
              <span key={`ticker-a-${i}`}>
                ACCESS DENIED MR.CREW, ACCESS DENIED MRS.CREW //{" "}
              </span>
            ))}
          </div>
          <div className="cyber-marquee-group" aria-hidden="true">
            {[...Array(8)].map((_, i) => (
              <span key={`ticker-b-${i}`}>
                ACCESS DENIED MR.CREW, ACCESS DENIED MRS.CREW //{" "}
              </span>
            ))}
          </div>
        </div>
      </div>
      </main>
    </AuthGuard>
  );
}
