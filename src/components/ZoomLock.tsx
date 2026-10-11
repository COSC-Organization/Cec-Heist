"use client";

import { useEffect } from "react";

export default function ZoomLock() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect Ctrl or Meta (Command on Mac)
      if (e.ctrlKey || e.metaKey) {
        if (
          e.key === "+" ||
          e.key === "-" ||
          e.key === "=" ||
          e.key === "_" ||
          e.key === "0" ||
          e.keyCode === 187 ||
          e.keyCode === 189 ||
          e.keyCode === 107 ||
          e.keyCode === 109 ||
          e.keyCode === 96 ||
          e.keyCode === 48 ||
          e.code === "NumpadAdd" ||
          e.code === "NumpadSubtract" ||
          e.code === "Equal" ||
          e.code === "Minus" ||
          e.code === "Digit0" ||
          e.code === "Numpad0"
        ) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    const handleGesture = (e: Event) => {
      e.preventDefault();
    };

    // Attach listeners with capture: true to intercept before default browser actions
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    document.addEventListener("gesturestart", handleGesture, { capture: true });
    document.addEventListener("gesturechange", handleGesture, { capture: true });
    document.addEventListener("gestureend", handleGesture, { capture: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("wheel", handleWheel, { capture: true });
      document.removeEventListener("gesturestart", handleGesture, { capture: true });
      document.removeEventListener("gesturechange", handleGesture, { capture: true });
      document.removeEventListener("gestureend", handleGesture, { capture: true });
    };
  }, []);

  return null;
}
