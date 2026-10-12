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

const LEADERBOARD_DATA: LeaderboardEntry[] = [
  { rank: 1, teamName: "ZERO_DAY_SYNDICATE", score: 15420 },
  { rank: 2, teamName: "BYTE_BANDITS", score: 13200 },
  { rank: 3, teamName: "RED_TEAM_SIX", score: 11850 },
  { rank: 4, teamName: "PHANTOM_NODE", score: 9940 },
  { rank: 5, teamName: "KRONOS_PROTOCOL", score: 8650 },
  { rank: 6, teamName: "NEO_MATRIX_CREW", score: 7420 },
  { rank: 7, teamName: "CYBER_VIPERS", score: 6810 },
  { rank: 8, teamName: "QUANTUM_HEIST", score: 5920 },
  { rank: 9, teamName: "DARK_SOLARIS", score: 5180 },
  { rank: 10, teamName: "VECTOR_CORPS", score: 4620 },
  { rank: 11, teamName: "SYNAPSE_RAIDERS", score: 4410 },
  { rank: 12, teamName: "OMEGA_CIPHER", score: 4280 },
  { rank: 13, teamName: "ROOT_FORCE", score: 4150 },
  { rank: 14, teamName: "MR_ROBOT_CREW", score: 4020 },
  { rank: 15, teamName: "BIT_INFILTRATORS", score: 3890 },
  { rank: 16, teamName: "NULL_POINTERS", score: 3760 },
  { rank: 17, teamName: "SHADOW_BROKERS", score: 3640 },
  { rank: 18, teamName: "GLITCH_MOB", score: 3520 },
  { rank: 19, teamName: "RECON_SQUAD_07", score: 3410 },
  { rank: 20, teamName: "BINARY_GHOSTS", score: 3300 },
  { rank: 21, teamName: "KALI_LEGION", score: 3190 },
  { rank: 22, teamName: "SPECTRE_PROTOCOL", score: 3080 },
  { rank: 23, teamName: "PACKET_SNIFFERS", score: 2980 },
  { rank: 24, teamName: "FIREWALL_BREACH", score: 2870 },
  { rank: 25, teamName: "HEX_OVERLORDS", score: 2770 },
  { rank: 26, teamName: "DAEMON_HUNTERS", score: 2680 },
  { rank: 27, teamName: "LOGIC_BOMBERS", score: 2590 },
  { rank: 28, teamName: "CIPHER_PUNKS", score: 2500 },
  { rank: 29, teamName: "STEALTH_OPS_X", score: 2410 },
  { rank: 30, teamName: "CYBER_PHANTOMS", score: 2330 },
  { rank: 31, teamName: "BUFFER_OVERFLOW", score: 2250 },
  { rank: 32, teamName: "MALWARE_MASTERS", score: 2170 },
  { rank: 33, teamName: "ENIGMA_CORPS", score: 2090 },
  { rank: 34, teamName: "ECHO_CHAMBER", score: 2020 },
  { rank: 35, teamName: "GRID_RUNNERS", score: 1950 },
  { rank: 36, teamName: "PAYLOAD_PIRATES", score: 1880 },
  { rank: 37, teamName: "DECRYPT_KNIGHTS", score: 1810 },
  { rank: 38, teamName: "VOID_WALKERS", score: 1740 },
  { rank: 39, teamName: "KERNEL_PANIC", score: 1680 },
  { rank: 40, teamName: "BLACK_HAT_ELITE", score: 1620 },
  { rank: 41, teamName: "NEURAL_NETWORKS", score: 1560 },
  { rank: 42, teamName: "SYNTAX_TERROR", score: 1500 },
  { rank: 43, teamName: "OVERCLOCK_CREW", score: 1440 },
  { rank: 44, teamName: "CIRCUIT_BREAKERS", score: 1390 },
  { rank: 45, teamName: "DIGITAL_VANDALS", score: 1340 },
  { rank: 46, teamName: "SCRIPT_KIDDIES", score: 1290 },
  { rank: 47, teamName: "BRUTE_FORCERS", score: 1240 },
  { rank: 48, teamName: "PROTOCOL_ZERO", score: 1190 },
  { rank: 49, teamName: "MEMORY_LEAK", score: 1150 },
  { rank: 50, teamName: "SUBROUTINE_X", score: 1100 },
  { rank: 51, teamName: "ZERO_COOL", score: 1060 },
  { rank: 52, teamName: "ACID_BURN", score: 1020 },
  { rank: 53, teamName: "CRASH_OVERRIDE", score: 980 },
  { rank: 54, teamName: "THE_PLAGUE", score: 940 },
  { rank: 55, teamName: "LORD_NIKON", score: 900 },
  { rank: 56, teamName: "PHREAKERS_UNITED", score: 860 },
  { rank: 57, teamName: "DATA_DRIFTERS", score: 820 },
  { rank: 58, teamName: "STACK_TRACERS", score: 790 },
  { rank: 59, teamName: "BIT_SHIFT_BOYS", score: 750 },
  { rank: 60, teamName: "HEIST_NEWBIES", score: 710 },
];

export default function LeaderboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { triggerTransition } = usePixelTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return LEADERBOARD_DATA;
    return LEADERBOARD_DATA.filter((entry) =>
      entry.teamName.toLowerCase().includes(q)
    );
  }, [searchQuery]);

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
                href="/#profile"
                className="menu-nav-item"
                onClick={(e) => handleNavClick(e, "/#profile")}
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
              src="/leaderboard/leaderboard.png"
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

          {/* Simple Table: Rank | Team Name | Score */}
          <div className="simple-leaderboard-card">
            <div className="simple-table-header font-pixel">
              <span className="col-rank">RANK</span>
              <span className="col-team">TEAM NAME</span>
              <span className="col-score">SCORE</span>
            </div>

            <div className="simple-table-body">
              {filteredData.length === 0 ? (
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
