"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { usePixelTransition } from "../../components/PixelTransition";

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
    osc.frequency.setValueAtTime(70, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {
    // Audio not supported or blocked
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
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  } catch {
    // Audio not supported or blocked
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
    }, 28);
  };

  return (
    <span onMouseEnter={scramble} style={{ display: "inline-block" }}>
      {displayText}
    </span>
  );
};

interface LeaderboardEntry {
  rank: number;
  teamName: string;
  score: number;
}

interface LeaderboardApiResponse {
  success: boolean;
  data: {
    rank: number;
    team_name: string;
    score: number;
  }[];
}

export default function LeaderboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { triggerTransition } = usePixelTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFrozen, setIsFrozen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsFrozen(localStorage.getItem("cec_heist_leaderboard_frozen") === "true");
    }

    const fetchLeaderboard = async () => {
      try {
        const response = await fetch("http://localhost:8788/api/leaderboard?page=1&limit=10");

        if (!response.ok) {
          throw new Error(`Leaderboard request failed (${response.status})`);
        }

        const result: LeaderboardApiResponse = await response.json();

        if (!result.success) {
          throw new Error("The leaderboard API returned an error.");
        }

        setLeaderboardData(
          result.data.map((team) => ({
            rank: team.rank,
            teamName: team.team_name,
            score: team.score,
          }))
        );
        setError("");
      } catch (err) {
        // Fallback to local tournament squads if available
        if (typeof window !== "undefined") {
          const localTeams = localStorage.getItem("cec_heist_teams_v1");
          if (localTeams) {
            try {
              const parsed = JSON.parse(localTeams);
              if (Array.isArray(parsed) && parsed.length > 0) {
                const sorted = [...parsed].sort((a, b) => {
                  if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
                  if ((b.solvedCount || 0) !== (a.solvedCount || 0)) return (b.solvedCount || 0) - (a.solvedCount || 0);
                  return (a.id || "").localeCompare(b.id || "");
                });
                setLeaderboardData(
                  sorted.map((t, idx) => ({
                    rank: idx + 1,
                    teamName: t.name,
                    score: t.score || 0,
                  }))
                );
                setError("");
                return;
              }
            } catch {}
          }
        }
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the leaderboard."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return leaderboardData;
    return leaderboardData.filter((entry) =>
      entry.teamName.toLowerCase().includes(q)
    );
  }, [searchQuery, leaderboardData]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    playCyberClick();

    if (href.startsWith("#") || href.startsWith("/#")) {
      setMenuOpen(false);
      const hash = href.includes("#") ? href.substring(href.indexOf("#") + 1) : "";
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

    if (href === "/" || href === "/#") {
      setMenuOpen(false);
      triggerTransition("/", "right-to-left");
      return;
    }

    if (href === "/arena") {
      setMenuOpen(false);
      triggerTransition("/arena", "left-to-right");
      return;
    }

    if (href === "/profile") {
      setMenuOpen(false);
      triggerTransition("/profile", "left-to-right");
      return;
    }

    router.prefetch(href);
    setMenuOpen(false);

    setTimeout(() => {
      router.push(href);
    }, 580);
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
    <main className="crt-screen leaderboard-screen">
      <audio ref={audioRef} src="/music/background%20music.mpeg" loop />
      <div className="scanlines-overlay" />

      {/* Header Pill */}
      <header className="header-wrapper">
        <div className={`header-pill ${menuOpen ? "expanded" : ""}`}>
          <div className="header-content-top" style={{ position: "relative" }}>
            <Link
              href="/"
              className="header-brand"
              onClick={(e) => {
                handleNavClick(e, "/");
              }}
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
              draggable={false}
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
                className="menu-nav-item active"
                onClick={(e) => handleNavClick(e, "/leaderboard")}
              >
                <ScrambleText text="03. LEADERBOARD" />
              </Link>
              
              <Link
                href="/profile"
                className="menu-nav-item"
                onClick={(e) => handleNavClick(e, "/profile")}
              >
                <ScrambleText text="04. PROFILE" />
              </Link>
            </nav>

            <img
              src="/homepage/menu-image.png"
              alt="Menu Decor"
              className="menu-decor-image"
              draggable={false}
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

      {/* Simple Leaderboard Content */}
      <div className="leaderboard-content-wrapper">
        <div className="simple-leaderboard-container">
          <div className="leaderboard-title-wrapper">
            <img
              src="/leaderboard/leaderboard.png?v=2"
              alt="LEADERBOARD"
              className="leaderboard-title-img"
              draggable={false}
            />
          </div>

          {/* Small, perfectly placed Search Box */}
          <div className="leaderboard-top-bar">
            <span className="leaderboard-count-badge font-pixel">
              {"// "}
              {filteredData.length} {filteredData.length === 1 ? "TEAM" : "TEAMS"}
            </span>

            <div className="search-team-wrapper">
              <span className="search-team-icon font-pixel" aria-hidden="true">
                ⌕
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH TEAM..."
                className="search-team-input font-pixel"
                spellCheck={false}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {isFrozen && (
            <div
              className="font-pixel text-center py-2 px-4 mb-4 rounded border"
              style={{
                backgroundColor: "rgba(255, 184, 0, 0.15)",
                borderColor: "#ffb800",
                color: "#ffb800",
                fontSize: "0.85rem",
                letterSpacing: "1px",
              }}
            >
              ❄️ LEADERBOARD FROZEN // SCORES ARE TEMPORARILY LOCKED FOR TOURNAMENT AUDIT
            </div>
          )}
          {/* Simple Table: Rank | Team Name | Score */}
          <div className="simple-leaderboard-card">
            <div className="simple-table-header font-pixel">
              <span className="col-rank">RANK</span>
              <span className="col-team">TEAM NAME</span>
              <span className="col-score">SCORE</span>
            </div>

            <div className="simple-table-body">
              {loading ? (
                <div className="simple-table-empty font-pixel">
                  LOADING LEADERBOARD...
                </div>
              ) : error ? (
                <div className="simple-table-empty font-pixel">
                  {error} Make sure the backend is running.
                </div>
              ) : filteredData.length === 0 ? (
                <div className="simple-table-empty font-pixel">
                  NO TEAMS FOUND MATCHING &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                filteredData.map((entry) => {
                  const isTop1 = entry.rank === 1;
                  const isTop2 = entry.rank === 2;
                  const isTop3 = entry.rank === 3;

                  return (
                    <div
                      key={entry.rank}
                      className={`simple-table-row ${
                        isTop1 ? "row-rank-1" : isTop2 ? "row-rank-2" : isTop3 ? "row-rank-3" : ""
                      }`}
                      onMouseEnter={playCyberHover}
                    >
                      <div className="col-rank font-pixel">
                        #{entry.rank < 10 ? `0${entry.rank}` : entry.rank}
                      </div>
                      <div className="col-team font-pixel">
                        {entry.teamName}
                      </div>
                      <div className="col-score font-pixel">
                        {entry.score.toLocaleString()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
