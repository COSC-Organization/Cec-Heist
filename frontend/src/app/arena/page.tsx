"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { usePixelTransition } from "../../components/PixelTransition";
import ArenaCar from "../../components/ArenaCar";

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

const playCyberDenied = () => {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sawtooth";
    osc2.type = "sawtooth";
    osc1.frequency.setValueAtTime(110, ctx.currentTime);
    osc2.frequency.setValueAtTime(116, ctx.currentTime);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.25);
    osc2.stop(ctx.currentTime + 0.25);
  } catch {
    // Audio not supported or blocked
  }
};

const playPowerUpChime = () => {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") return;

    const notes = [220, 330, 440, 660];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.2);
    });
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
    }, 30);
  };

  return (
    <span onMouseEnter={scramble} style={{ display: "inline-block" }}>
      {displayText}
    </span>
  );
};

const FACILITIES = [
  {
    id: "factory",
    number: "01",
    name: "INDUSTRIAL REFINERY",
    sector: "SECTOR 01",
    type: "POWER & FUEL REFINERY",
    security: "CLASS 01 // STANDARD",
    objective: "OVERRIDE POWER GRID",
    intel: "Intel indicates key encryption ciphers are stored in the refinery control room. Infiltrate the terminal to decrypt the primary security clearance and unlock Sector 02.",
    icon: "⚡",
    tagText: "SECTOR 01 // FACTORY",
    className: "facility-1-btn",
  },
  {
    id: "logistics",
    number: "02",
    name: "LOGISTICS DEPOT",
    sector: "SECTOR 02",
    type: "SUPPLY DEPOT & CONVOY TERMINAL",
    security: "CLASS 02 // RESTRICTED",
    objective: "INTERCEPT CARGO MANIFEST",
    intel: "Ground transport manifests reveal the transport schedule for classified security keys. Hack the dispatch terminal to locate the master keycard.",
    icon: "📦",
    tagText: "SECTOR 02 // LOGISTICS",
    className: "facility-2-btn",
  },
  {
    id: "command",
    number: "03",
    name: "COMMAND COMPLEX",
    sector: "SECTOR 03",
    type: "SURVEILLANCE & SECURITY HUB",
    security: "CLASS 03 // HIGH SECURITY",
    objective: "DISABLE SURVEILLANCE MATRIX",
    intel: "The command complex manages regional CCTV feeds and perimeter sensors. Neutralize the primary firewall to disable vault countermeasures.",
    icon: "🔒",
    tagText: "SECTOR 03 // COMMAND",
    className: "facility-3-btn",
  },
  {
    id: "vault",
    number: "04",
    name: "HEIST VAULT & HELIPAD",
    sector: "SECTOR 04",
    type: "FORTIFIED AIRBORNE VAULT",
    security: "CLASS 04 // MAXIMUM CLEARANCE",
    objective: "BREACH CENTRAL HEIST VAULT",
    intel: "Final objective location. Reinforced rooftop helipad fortress housing the ultimate prize. Decrypt the multi-layered biometric vault lock to complete the heist.",
    icon: "🚁",
    tagText: "SECTOR 04 // VAULT",
    className: "facility-4-btn",
  },
];

const PLAY_CARDS = [
  {
    id: "card-1",
    number: "01",
    title: "BREACH PROTOCOL",
    desc: "Bypass perimeter surveillance and decrypt security keys to initiate sector access.",
    status: "COMPLETED",
    pic: "/arena/pic1.png",
  },
  {
    id: "card-2",
    number: "02",
    title: "CIPHER DECRYPT",
    desc: "Extract classified frequency ciphers from localized memory registers.",
    status: "PENDING",
    pic: "/arena/pic2.png",
  },
  {
    id: "card-3",
    number: "03",
    title: "NEURAL OVERRIDE",
    desc: "Deploy automated payload routines to disrupt command complex sentry units.",
    status: "PENDING",
    pic: "/arena/pic3.png",
  },
  {
    id: "card-4",
    number: "04",
    title: "VAULT EXTRACTION",
    desc: "Infiltrate fortified airborne vault and secure primary heist asset.",
    status: "PENDING",
    pic: "/arena/pic4.png",
  },
];

// Calibrated Vector Path for Road 1 from 1arena-map.jpg
const ROAD_1_PATH =
  "M 307 340 C 310.0 342.5, 316.0 349.5, 322 355 C 326.3 359.2, 332.0 364.5, 337 369 C 342.0 373.5, 347.0 378.0, 352 382 C 357.0 386.0, 362.0 390.2, 367 393 C 372.0 395.8, 377.0 397.5, 382 399 C 387.0 400.5, 392.0 401.8, 397 402 C 402.0 402.2, 407.0 400.2, 412 400 C 417.0 399.8, 422.0 401.0, 427 401 C 432.0 401.0, 437.0 400.5, 442 400 C 447.0 399.5, 452.0 398.5, 457 398 C 462.0 397.5, 467.0 397.2, 472 397 C 477.0 396.8, 484.5 397.0, 487 397 C 492.0 397.0, 495.0 397.0, 498 397";

// Calibrated Vector Path for Road 2 from 2arena-map.jpg
const ROAD_2_PATH =
  "M 677 515 C 678.8 515.5, 683.7 517.0, 688 518 C 692.3 519.0, 698.0 520.3, 703 521 C 708.0 521.7, 713.0 522.3, 718 522 C 723.0 521.7, 728.0 520.3, 733 519 C 738.0 517.7, 743.0 515.3, 748 514 C 753.0 512.7, 758.0 511.8, 763 511 C 768.0 510.2, 773.0 509.3, 778 509 C 783.0 508.7, 788.0 508.3, 793 509 C 798.0 509.7, 803.0 511.2, 808 513 C 813.0 514.8, 818.0 517.5, 823 520 C 828.0 522.5, 833.0 525.0, 838 528 C 843.0 531.0, 848.0 534.3, 853 538 C 858.0 541.7, 863.0 545.8, 868 550 C 873.0 554.2, 878.0 559.7, 883 563 C 888.0 566.3, 893.5 567.8, 898 570 C 902.5 572.2, 907.0 575.0, 910 576 C 913.0 577.0, 915.0 576.0, 916 576";

// Calibrated Vector Path for Road 3 from 3arena-map.jpg
const ROAD_3_PATH =
  "M 1210 659 C 1211.8 659.0, 1216.7 658.8, 1221 659 C 1225.3 659.2, 1231.0 659.8, 1236 660 C 1241.0 660.2, 1246.0 660.5, 1251 660 C 1256.0 659.5, 1261.0 658.2, 1266 657 C 1271.0 655.8, 1276.0 654.5, 1281 653 C 1286.0 651.5, 1290.8 650.7, 1296 648 C 1301.2 645.3, 1307.0 643.2, 1312 637 C 1317.0 630.8, 1321.3 621.2, 1326 611 C 1330.7 600.8, 1335.2 586.0, 1340 576 C 1344.8 566.0, 1350.0 556.7, 1355 551 C 1360.0 545.3, 1367.5 543.5, 1370 542";

export default function ArenaPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { triggerTransition } = usePixelTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeFacility, setActiveFacility] = useState<string | null>(null);

  // Factory Unlock Progression State (1 to 4)
  const [unlockedStages, setUnlockedStages] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cec_unlocked_stage");
      if (saved) {
        const val = parseInt(saved, 10);
        if (val >= 1 && val <= 4) return val;
      }
    }
    return 1;
  });
  const [justUnlockedStage, setJustUnlockedStage] = useState<number | null>(null);
  const [lockedWarning, setLockedWarning] = useState<string | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerUnlock = (targetStage?: number) => {
    const next = targetStage !== undefined ? targetStage : Math.min(4, unlockedStages + 1);
    setUnlockedStages(next);
    setJustUnlockedStage(next);
    playPowerUpChime();
    if (typeof window !== "undefined") {
      localStorage.setItem("cec_unlocked_stage", next.toString());
    }
    setTimeout(() => {
      setJustUnlockedStage(null);
    }, 2000);
  };

  const showLockedWarning = (msg: string) => {
    playCyberDenied();
    setLockedWarning(msg);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningTimerRef.current = setTimeout(() => {
      setLockedWarning(null);
    }, 3200);
  };

  // External / Backend event listeners for programmatic factory unlocking:
  // window.dispatchEvent(new CustomEvent("unlock_stage", { detail: { stage: 2 } }))
  useEffect(() => {
    const handleUnlockEvent = (e: Event) => {
      const custom = e as CustomEvent<{ stage?: number; factoryNumber?: number }>;
      const nextStage = custom.detail?.stage || custom.detail?.factoryNumber;
      if (nextStage && nextStage >= 1 && nextStage <= 4) {
        triggerUnlock(nextStage);
      }
    };
    window.addEventListener("unlock_stage", handleUnlockEvent);
    window.addEventListener("unlock_factory", handleUnlockEvent);
    return () => {
      window.removeEventListener("unlock_stage", handleUnlockEvent);
      window.removeEventListener("unlock_factory", handleUnlockEvent);
    };
  }, [unlockedStages]);

  const selectedFacility = FACILITIES.find((f) => f.id === activeFacility);

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

    if (href === "/leaderboard") {
      setMenuOpen(false);
      triggerTransition("/leaderboard", "left-to-right");
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeFacility) {
        setActiveFacility(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeFacility]);

  return (
    <main className="arena-screen">
      <audio ref={audioRef} src="/music/background%20music.mpeg" loop />

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
                className="menu-nav-item active"
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

      {/* Arena Map Container & Responsive 1672x941 Stage */}
      <div className="arena-map-container">
        <div className="arena-map-stage">
          {/* Base Map: All Factory Lights Completely OFF */}
          <img
            src="/arena/arena-map(light off).png"
            alt="Arena Map Base (Offline)"
            className="arena-map-stage-img"
            draggable={false}
          />

          {/* Layer 1: Sector 01 (Industrial Refinery) Lights */}
          <img
            src="/arena/arena-f1-lit.webp"
            alt="Sector 01 Lighting"
            className={`arena-map-light-layer ${unlockedStages >= 1 ? "lit" : ""} ${
              justUnlockedStage === 1 ? "just-unlocked" : ""
            }`}
            draggable={false}
          />

          {/* Layer 2: Sector 02 (Logistics Depot) Lights */}
          <img
            src="/arena/arena-f2-lit.webp"
            alt="Sector 02 Lighting"
            className={`arena-map-light-layer ${unlockedStages >= 2 ? "lit" : ""} ${
              justUnlockedStage === 2 ? "just-unlocked" : ""
            }`}
            draggable={false}
          />

          {/* Layer 3: Sector 03 (Command Complex) Lights */}
          <img
            src="/arena/arena-f3-lit.webp"
            alt="Sector 03 Lighting"
            className={`arena-map-light-layer ${unlockedStages >= 3 ? "lit" : ""} ${
              justUnlockedStage === 3 ? "just-unlocked" : ""
            }`}
            draggable={false}
          />

          {/* Layer 4: Sector 04 (Heist Vault & Helipad) Lights */}
          <img
            src="/arena/arena-f4-lit.webp"
            alt="Sector 04 Lighting"
            className={`arena-map-light-layer ${unlockedStages >= 4 ? "lit" : ""} ${
              justUnlockedStage === 4 ? "just-unlocked" : ""
            }`}
            draggable={false}
          />

          {/* Animated Road Lines (Active when Sector Unlocked) */}
          <svg
            className="arena-road-svg"
            viewBox="0 0 1672 941"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Road 1 Moving White Dashes */}
            <path
              d={ROAD_1_PATH}
              className={`road-white-line road-speed-1 ${
                unlockedStages >= 1 ? "road-active" : "road-dimmed"
              }`}
            />

            {/* Road 2 Moving White Dashes */}
            <path
              d={ROAD_2_PATH}
              className={`road-white-line road-speed-2 ${
                unlockedStages >= 2 ? "road-active" : "road-dimmed"
              }`}
            />

            {/* Road 3 Moving White Dashes */}
            <path
              d={ROAD_3_PATH}
              className={`road-white-line road-speed-3 ${
                unlockedStages >= 3 ? "road-active" : "road-dimmed"
              }`}
            />

            {/* Tactical Mission Vehicle */}
            <ArenaCar />
          </svg>

          {/* All 4 Interactive Facilities Buttons with Locked / Unlocked States */}
          {FACILITIES.map((facility, idx) => {
            const factoryNum = idx + 1;
            const isUnlocked = factoryNum <= unlockedStages;

            return (
              <button
                key={facility.id}
                type="button"
                className={`map-facility-btn ${facility.className} ${
                  isUnlocked ? "facility-unlocked" : "facility-locked"
                }`}
                onClick={() => {
                  if (isUnlocked) {
                    playCyberClick();
                    setActiveFacility(facility.id);
                  } else {
                    showLockedWarning(
                      `ACCESS RESTRICTED // ${facility.sector} IS OFFLINE. COMPLETE SECTOR 0${
                        factoryNum - 1
                      } MISSION TO RESTORE POWER.`
                    );
                  }
                }}
                onMouseEnter={() => {
                  if (isUnlocked) {
                    playCyberHover();
                  }
                }}
                aria-label={`${facility.sector}: ${facility.name} (${
                  isUnlocked ? "ONLINE" : "LOCKED"
                })`}
              >
                {!isUnlocked && (
                  <div className="facility-locked-badge">
                    <span>🔒</span>
                    <span>LOCKED // SEC 0{factoryNum}</span>
                  </div>
                )}
              </button>
            );
          })}


        </div>
      </div>

      {/* Arena HUD Alert Toast */}
      {lockedWarning && (
        <div className="arena-hud-alert">
          <div
            className={`hud-alert-inner ${
              lockedWarning.includes("OVERRIDE") ? "success" : ""
            }`}
          >
            <span>{lockedWarning.includes("OVERRIDE") ? "⚡" : "⚠️"}</span>
            <span>{lockedWarning}</span>
          </div>
        </div>
      )}

      {/* Big Empty Facility Page */}
      {selectedFacility && (
        <div
          className="facility-modal-backdrop"
          onClick={() => setActiveFacility(null)}
        >
          <div
            className="facility-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="scanlines-overlay" />
            <div className="facility-modal-mission-bar">
              <div className="mission-bar-intel">
                <span className="mission-bar-sector">{selectedFacility.sector}</span>
                <span className="mission-bar-title">{selectedFacility.name}</span>
                <span className="mission-bar-obj">
                  OBJ: {selectedFacility.objective}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="facility-modal-close-btn"
              onClick={() => {
                playCyberClick();
                setActiveFacility(null);
              }}
              aria-label="Close"
            >
              [×]
            </button>
            <div className="facility-modal-body empty-page">
              <div className="facility-quad-columns">
                {PLAY_CARDS.map((card, idx) => (
                  <div key={card.id} className={`facility-column-box box-${idx + 1}`}>
                    <span className="box-corner-num">{card.number}</span>
                    <div className="playcard-img-wrap">
                      <img
                        src={card.pic}
                        alt={`Card ${card.number}`}
                        className="playcard-img"
                        onError={(e) => {
                          // Hide broken image placeholder until user adds the file
                          (e.target as HTMLElement).style.opacity = "0";
                        }}
                        onLoad={(e) => {
                          (e.target as HTMLElement).style.opacity = "1";
                        }}
                      />
                    </div>
                    <div className="playcard-body">
                      <h4 className="playcard-title">{card.title}</h4>
                      <p className="playcard-desc">{card.desc}</p>
                      <div className="playcard-status-row">
                        <span className="status-label">STATUS</span>
                        <span
                          className={`playcard-status-badge ${
                            card.status === "COMPLETED"
                              ? "status-completed"
                              : "status-pending"
                          }`}
                        >
                          ● {card.status}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="playcard-enter-btn"
                      onClick={() => {
                        playCyberClick();
                      }}
                    >
                      [ ENTER ]
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
