"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export type TransitionDirection = "left-to-right" | "right-to-left";

// Web Audio API Sound Generator for Pixel Sweep
export const playPixelSweep = (direction: TransitionDirection = "left-to-right") => {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const now = ctx.currentTime;

    // Ascending tones for entering Arena (LTR), descending tones for returning Home (RTL)
    const freqs =
      direction === "left-to-right"
        ? [180, 280, 380, 480, 600, 740]
        : [740, 600, 480, 380, 280, 180];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      osc.frequency.exponentialRampToValueAtTime(
        direction === "left-to-right" ? freq * 1.15 : freq * 0.85,
        now + idx * 0.07 + 0.07
      );

      gain.gain.setValueAtTime(0.07, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.07);
    });

    // Mechanical sweep / sub-bass thud
    const oscLow = ctx.createOscillator();
    const gainLow = ctx.createGain();
    oscLow.type = "triangle";
    oscLow.frequency.setValueAtTime(120, now);
    oscLow.frequency.exponentialRampToValueAtTime(30, now + 0.85);
    gainLow.gain.setValueAtTime(0.18, now);
    gainLow.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    oscLow.connect(gainLow);
    gainLow.connect(ctx.destination);
    oscLow.start(now);
    oscLow.stop(now + 0.85);
  } catch {
    // Audio not supported or blocked
  }
};

const COLS = 20;
const ROWS = 12;

interface CellConfig {
  row: number;
  col: number;
  delayLTR: number;
  delayRTL: number;
  isAccent: boolean;
  isGlitch: boolean;
}

// Precomputed grid cells for slower, more cinematic sweeps
const CELLS: CellConfig[] = [];
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const jitter = ((r * 3 + c * 7) % 5) * 14;
    // Left-to-right: 32ms per column for a smoother, slower sweep
    const delayLTR = c * 32 + jitter;
    // Right-to-left: 32ms per column
    const delayRTL = (COLS - 1 - c) * 32 + jitter;
    const isAccent = (r * 7 + c * 13) % 7 === 0;
    const isGlitch = (r * 11 + c * 5) % 17 === 0;
    CELLS.push({ row: r, col: c, delayLTR, delayRTL, isAccent, isGlitch });
  }
}

interface PixelTransitionContextType {
  triggerTransition: (targetUrl: string, direction?: TransitionDirection) => void;
  isTransitioning: boolean;
}

const PixelTransitionContext = createContext<PixelTransitionContextType>({
  triggerTransition: () => {},
  isTransitioning: false,
});

export const usePixelTransition = () => useContext(PixelTransitionContext);

export function PixelTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "revealing">("idle");
  const [direction, setDirection] = useState<TransitionDirection>("left-to-right");
  const timeoutRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimeouts = () => {
    timeoutRef.current.forEach((t) => clearTimeout(t));
    timeoutRef.current = [];
  };

  useEffect(() => {
    return () => clearAllTimeouts();
  }, []);

  const triggerTransition = useCallback(
    (targetUrl: string, explicitDirection?: TransitionDirection) => {
      if (phase !== "idle") return;

      clearAllTimeouts();

      // Home -> Arena travels left to right; Arena -> Home travels right to left
      const resolvedDir: TransitionDirection =
        explicitDirection || (targetUrl.includes("arena") ? "left-to-right" : "right-to-left");

      setDirection(resolvedDir);
      playPixelSweep(resolvedDir);

      // Navigate immediately to destination
      router.push(targetUrl);

      // Single animation pass: light white pixel boxes sweep in the designated direction
      setPhase("revealing");

      // Maximum delay is (19 * 32) + 56 = 664ms, animation duration 450ms => total ~1114ms
      const t1 = setTimeout(() => {
        setPhase("idle");
      }, 1150);
      timeoutRef.current.push(t1);
    },
    [phase, router]
  );

  return (
    <PixelTransitionContext.Provider
      value={{
        triggerTransition,
        isTransitioning: phase !== "idle",
      }}
    >
      {children}

      {/* Full-screen Single-pass Pixel Reveal Transition Overlay */}
      {phase !== "idle" && (
        <div
          className={`pixel-transition-overlay phase-${phase} dir-${direction}`}
          aria-hidden="true"
        >
          <div
            className="pixel-transition-grid"
            style={{
              gridTemplateColumns: `repeat(${COLS}, 1fr)`,
              gridTemplateRows: `repeat(${ROWS}, 1fr)`,
            }}
          >
            {CELLS.map((cell) => {
              const isLTR = direction === "left-to-right";
              const delay = isLTR ? cell.delayLTR : cell.delayRTL;
              const animClass = isLTR ? "anim-reveal-ltr" : "anim-reveal-rtl";

              return (
                <div
                  key={`${cell.row}-${cell.col}`}
                  className={`pixel-cell ${cell.isAccent ? "accent-cell" : ""} ${
                    cell.isGlitch ? "glitch-cell" : ""
                  } ${animClass}`}
                  style={{
                    animationDelay: `${delay}ms`,
                  }}
                >
                  <span className="pixel-cell-inner" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PixelTransitionContext.Provider>
  );
}
