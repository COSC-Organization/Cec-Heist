"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";

export type TransitionDirection = "left-to-right" | "right-to-left";

// Web Audio API Sound Generator for Smooth Mechanical Vault Wheel Roll
export const playVaultTransitionSound = (
  direction: TransitionDirection = "left-to-right"
) => {
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
    const dur = 1.15;

    // 1. Smooth mechanical friction / roll sound (filtered noise)
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(360, now);
    filter.frequency.linearRampToValueAtTime(420, now + dur * 0.5);
    filter.frequency.exponentialRampToValueAtTime(140, now + dur);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.02, now);
    noiseGain.gain.linearRampToValueAtTime(0.32, now + 0.2);
    noiseGain.gain.linearRampToValueAtTime(0.32, now + 0.85);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    whiteNoise.start(now);
    whiteNoise.stop(now + dur);

    // 2. Gentle mechanical gear clicks as cogwheel turns
    const clickCount = 14;
    for (let i = 0; i < clickCount; i++) {
      const clickTime = now + (i / clickCount) * 1.0;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      const freq =
        direction === "left-to-right" ? 180 + i * 14 : 360 - i * 14;
      osc.frequency.setValueAtTime(freq, clickTime);

      gain.gain.setValueAtTime(0.02, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(clickTime);
      osc.stop(clickTime + 0.04);
    }
  } catch {
    // Audio context not allowed or unsupported
  }
};

// Backwards compatibility alias
export const playPixelSweep = playVaultTransitionSound;

interface PixelTransitionContextType {
  triggerTransition: (
    targetUrl: string,
    direction?: TransitionDirection
  ) => void;
  isTransitioning: boolean;
}

const PixelTransitionContext = createContext<PixelTransitionContextType>({
  triggerTransition: () => {},
  isTransitioning: false,
});

export const usePixelTransition = () => useContext(PixelTransitionContext);
export const useVaultTransition = usePixelTransition;

export function PixelTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] =
    useState<TransitionDirection>("left-to-right");
  const [snapshotHtml, setSnapshotHtml] = useState<string | null>(null);
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
      if (isTransitioning) return;

      clearAllTimeouts();

      const resolvedDir: TransitionDirection =
        explicitDirection ||
        (targetUrl.includes("arena") || targetUrl.includes("leaderboard")
          ? "left-to-right"
          : "right-to-left");

      // Snapshot the current page DOM before routing
      const mainEl = document.querySelector("main");
      if (mainEl) {
        const clone = mainEl.cloneNode(true) as HTMLElement;
        clone
          .querySelectorAll("audio, .scanlines-overlay, .side-wheel-container")
          .forEach((el) => el.remove());
        clone.style.pointerEvents = "none";
        clone.style.background = "transparent";
        clone.style.boxShadow = "none";
        setSnapshotHtml(clone.outerHTML);
      }

      setDirection(resolvedDir);
      setIsTransitioning(true);
      playVaultTransitionSound(resolvedDir);

      // Navigate immediately: new page mounts underneath the snapshot
      router.push(targetUrl);

      // Single continuous pass across the screen (no stops): 1.15s
      const t1 = setTimeout(() => {
        setIsTransitioning(false);
        setSnapshotHtml(null);
      }, 1180);
      timeoutRef.current.push(t1);
    },
    [isTransitioning, router]
  );

  return (
    <PixelTransitionContext.Provider
      value={{
        triggerTransition,
        isTransitioning,
      }}
    >
      {children}

      {/* Single-Pass Live Wheel Wipe Transition */}
      {isTransitioning && snapshotHtml && (
        <div
          className={`wheel-wipe-overlay dir-${direction}`}
          aria-hidden="true"
        >
          {/* Old Page Snapshot (Clipped away in the wake of the rolling wheel) */}
          <div
            className={`wheel-wipe-snapshot clip-${direction}`}
            dangerouslySetInnerHTML={{ __html: snapshotHtml }}
          />

          {/* The Rolling Vault Wheel at the dividing boundary */}
          <div className={`wheel-wipe-runner roll-${direction}`}>
            <img
              src="/homepage/wheel.png"
              alt="Vault Wheel"
              className={`wheel-wipe-img spin-${
                direction === "left-to-right" ? "cw" : "ccw"
              }`}
              draggable={false}
            />
          </div>
        </div>
      )}
    </PixelTransitionContext.Provider>
  );
}

export const VaultTransitionProvider = PixelTransitionProvider;
