"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { usePixelTransition } from "../../components/PixelTransition";
import { useAuth } from "../../context/AuthContext";
import AuthGuard from "../../components/AuthGuard";
import { api, RankedTeam, TeamRankData } from "../../lib/api";

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
  id: number;
  teamName: string;
  score: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { triggerTransition } = usePixelTransition();
  const { user, isLoggedIn, openLoginModal } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTeams, setTotalTeams] = useState(0);
  const [myStanding, setMyStanding] = useState<TeamRankData | null>(null);
  const [myStandingLoading, setMyStandingLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchMyStanding = useCallback(async () => {
    if (!isLoggedIn) {
      setMyStanding(null);
      return;
    }
    setMyStandingLoading(true);
    try {
      let res;
      try {
        res = await api.leaderboard.getMyRank(10);
      } catch {
        const teamNum = Number(user?.teamId || user?.id);
        if (teamNum && !isNaN(teamNum)) {
          res = await api.leaderboard.getTeamRank(teamNum, 10);
        }
      }

      if (res && res.success && res.data) {
        setMyStanding(res.data);
      }
    } catch {
      // Ignore unranked or unauthorized
    } finally {
      setMyStandingLoading(false);
    }
  }, [isLoggedIn, user?.teamId, user?.id]);

  useEffect(() => {
    fetchMyStanding();
  }, [fetchMyStanding]);

  const fetchLeaderboard = useCallback(async (page: number) => {
    setLoading(true);
    setError("");
    try {
      const result = await api.leaderboard.get(page, 10);
      if (result.success && Array.isArray(result.data)) {
        setLeaderboardData(
          result.data.map((team: RankedTeam) => ({
            rank: team.rank,
            id: team.id,
            teamName: team.team_name,
            score: team.score,
          }))
        );
        if (result.pagination) {
          setCurrentPage(result.pagination.page);
          setTotalPages(result.pagination.totalPages || 1);
          setTotalTeams(result.pagination.total || result.data.length);
        }
      } else {
        throw new Error("Unable to retrieve leaderboard records.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard(currentPage);
  }, [currentPage, fetchLeaderboard, isLoggedIn]);

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return leaderboardData;
    return leaderboardData.filter((entry) =>
      entry.teamName.toLowerCase().includes(q) || String(entry.rank) === q
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
      if (!isLoggedIn) {
        openLoginModal("/arena");
        return;
      }
      triggerTransition("/arena", "left-to-right");
      return;
    }

    if (href === "/profile") {
      setMenuOpen(false);
      if (!isLoggedIn) {
        openLoginModal("/profile");
        return;
      }
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
    <AuthGuard sectorName="LEADERBOARD ARCHIVE">
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

          {/* Small, perfectly placed Search Box & Pagination Stats */}
          <div className="leaderboard-top-bar">
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span className="leaderboard-count-badge font-pixel">
                {"// "}
                {totalTeams > 0 ? `${totalTeams} REGISTERED` : `${filteredData.length} TEAMS`}
              </span>
              {totalPages > 1 && (
                <span className="leaderboard-count-badge font-pixel" style={{ color: "#00f0ff" }}>
                  PAGE {currentPage} / {totalPages}
                </span>
              )}
            </div>

            <div className="search-team-wrapper">
              <span className="search-team-icon font-pixel" aria-hidden="true">
                ⌕
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH SQUAD OR RANK..."
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
                  LOADING LIVE LEADERBOARD FROM BACKEND...
                </div>
              ) : error ? (
                <div className="simple-table-empty font-pixel" style={{ padding: "2rem 1rem", textAlign: "center" }}>
                  <div style={{ color: "#ff4d4d", marginBottom: "0.75rem" }}>
                    {error.includes("Authentication required")
                      ? "// AUTHENTICATION REQUIRED TO VIEW LIVE LEADERBOARD"
                      : error}
                  </div>
                  {error.includes("Authentication required") && (
                    <button
                      type="button"
                      onClick={() => openLoginModal("/leaderboard")}
                      className="arena-enter-btn admin-submit-btn"
                      style={{ maxWidth: "260px", margin: "0 auto", padding: "0.5rem 1rem" }}
                    >
                      [ LOGIN TO VIEW SCORES ]
                    </button>
                  )}
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
                  const isMySquad = Boolean(
                    (myStanding && entry.id === myStanding.id) ||
                    (user && (
                      entry.id === Number(user.teamId || user.id) ||
                      (user.teamName && entry.teamName.trim().toLowerCase() === user.teamName.trim().toLowerCase())
                    ))
                  );

                  return (
                    <div
                      key={entry.id || entry.rank}
                      className={`simple-table-row ${
                        isTop1 ? "row-rank-1" : isTop2 ? "row-rank-2" : isTop3 ? "row-rank-3" : ""
                      } ${isMySquad ? "row-current-squad" : ""}`}
                      onMouseEnter={playCyberHover}
                    >
                      <div className="col-rank font-pixel">
                        #{entry.rank < 10 ? `0${entry.rank}` : entry.rank}
                      </div>
                      <div className="col-team font-pixel" style={{ display: "flex", alignItems: "center", gap: "0.45rem", minWidth: 0 }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {entry.teamName}
                        </span>
                        {isMySquad && (
                          <span className="my-squad-badge font-pixel">YOUR SQUAD</span>
                        )}
                      </div>
                      <div className="col-score font-pixel">
                        {entry.score.toLocaleString()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls Footer */}
            {totalPages > 1 && !loading && !error && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.75rem 1.25rem",
                  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                }}
              >
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => {
                    playCyberClick();
                    setCurrentPage((prev) => Math.max(1, prev - 1));
                  }}
                  className="font-pixel"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: currentPage <= 1 ? "rgba(255, 255, 255, 0.3)" : "#00f0ff",
                    padding: "0.35rem 0.8rem",
                    cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                    fontSize: "0.75rem",
                  }}
                >
                  [ &lt; PREV PAGE ]
                </button>

                <span className="font-pixel" style={{ color: "#aaa", fontSize: "0.75rem" }}>
                  PAGE {currentPage} OF {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => {
                    playCyberClick();
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                  }}
                  className="font-pixel"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: currentPage >= totalPages ? "rgba(255, 255, 255, 0.3)" : "#00f0ff",
                    padding: "0.35rem 0.8rem",
                    cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                    fontSize: "0.75rem",
                  }}
                >
                  [ NEXT PAGE &gt; ]
                </button>
              </div>
            )}
          </div>

          {/* Bottom Squad Live Standing Dock: Shows live squad position & rank */}
          {isLoggedIn ? (
            user?.role === "admin" && !myStanding ? (
              <div className="leaderboard-my-standing-dock font-pixel">
                <div className="standing-dock-left">
                  <span className="standing-dock-label">
                    <span style={{ color: "#facc15" }}>★</span> ADMIN OVERVIEW MODE
                  </span>
                  <span className="standing-dock-team-name">
                    {user.email || "SYSTEM ADMINISTRATOR"}
                  </span>
                </div>
                <div className="standing-dock-right">
                  <span style={{ color: "#a1a1aa", fontSize: "0.8rem", letterSpacing: "1px" }}>
                    MONITORING ALL SQUADS ({totalTeams > 0 ? totalTeams : leaderboardData.length})
                  </span>
                </div>
              </div>
            ) : (
              <div className="leaderboard-my-standing-dock font-pixel">
                <div className="standing-dock-left">
                  <span className="standing-dock-label">
                    <span style={{ color: "#00f0ff" }}>●</span> YOUR SQUAD LIVE STANDING
                  </span>
                  <span className="standing-dock-team-name">
                    {myStanding?.team_name || user?.teamName || "YOUR SQUAD"}
                  </span>
                </div>

                <div className="standing-dock-right">
                  <div className="standing-stat-box">
                    <span className="standing-stat-label">GLOBAL RANK</span>
                    <span className="standing-stat-value highlight-cyan">
                      {myStandingLoading ? (
                        "CALCULATING..."
                      ) : myStanding ? (
                        `#${myStanding.rank < 10 ? `0${myStanding.rank}` : myStanding.rank} ${
                          myStanding.totalTeams ? `/ ${myStanding.totalTeams}` : ""
                        }`
                      ) : (
                        "UNRANKED"
                      )}
                    </span>
                  </div>

                  <div className="standing-stat-box">
                    <span className="standing-stat-label">SCORE</span>
                    <span className="standing-stat-value">
                      {(myStanding?.score ?? user?.score ?? 0).toLocaleString()} PTS
                    </span>
                  </div>

                  {myStanding && myStanding.page && (
                    <button
                      type="button"
                      onClick={() => {
                        playCyberClick();
                        if (myStanding.page !== currentPage) {
                          setCurrentPage(myStanding.page);
                        }
                      }}
                      className="standing-jump-btn font-pixel"
                      title={`Go to page ${myStanding.page}`}
                    >
                      {myStanding.page === currentPage
                        ? "[ ON CURRENT PAGE ]"
                        : `[ JUMP TO MY PAGE (${myStanding.page}) ]`}
                    </button>
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="leaderboard-my-standing-dock font-pixel">
              <div className="standing-dock-unauth">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ color: "#00f0ff" }}>◈</span>
                  <span style={{ color: "#a1a1aa", fontSize: "0.85rem", letterSpacing: "1px" }}>
                    WANT TO TRACK YOUR SQUAD&apos;S LIVE POSITION &amp; RANK?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playCyberClick();
                    openLoginModal("/leaderboard");
                  }}
                  className="standing-jump-btn font-pixel"
                >
                  [ SQUAD LOGIN ]
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </main>
    </AuthGuard>
  );
}
