import React from "react";

export function StarEyeEmblem({ className = "", onClick }: { className?: string; onClick?: () => void }) {
  return (
    <svg
      viewBox="0 0 160 100"
      className={`star-eye-emblem ${className}`}
      onClick={onClick}
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
    >
      <defs>
        <filter id="purple-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#8b5cf6" floodOpacity="0.8" />
        </filter>
      </defs>
      
      {/* Pixel Star Wings & Body (Electric Indigo / Purple) */}
      <g fill="#635bff" filter="url(#purple-glow)">
        {/* Top Pixel Crown */}
        <rect x="75" y="0" width="10" height="10" />
        <rect x="70" y="10" width="20" height="10" />
        <rect x="65" y="20" width="30" height="10" />

        {/* Center Wing Extensions */}
        <rect x="10" y="30" width="140" height="10" />
        <rect x="0" y="40" width="160" height="10" />
        <rect x="15" y="50" width="130" height="10" />

        {/* Lower Spikes & Taper */}
        <rect x="30" y="60" width="100" height="10" />
        <rect x="55" y="70" width="50" height="10" />
        <rect x="70" y="80" width="20" height="10" />
        <rect x="75" y="90" width="10" height="10" />
      </g>

      {/* Pixel Wing Side Accents (Brighter Purple) */}
      <g fill="#9333ea">
        <rect x="20" y="20" width="15" height="10" />
        <rect x="125" y="20" width="15" height="10" />
        <rect x="5" y="30" width="15" height="10" />
        <rect x="140" y="30" width="15" height="10" />
      </g>

      {/* Eye Outline (Deep Background Cutout) */}
      <g fill="#040406">
        <rect x="50" y="35" width="60" height="20" />
        <rect x="60" y="30" width="40" height="30" />
      </g>

      {/* Eye Iris & Pupil (Bright Neon Cyan / White Pixel) */}
      <g fill="#00f0ff">
        <rect x="65" y="35" width="30" height="20" />
      </g>

      <g fill="#ffffff">
        <rect x="75" y="40" width="10" height="10" />
        <rect x="78" y="42" width="4" height="4" fill="#040406" />
      </g>
    </svg>
  );
}

export function PixelFlame({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={`inline-icon flame-icon ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
    >
      {/* Outer Flame (Purple) */}
      <g fill="#7c3aed">
        <rect x="14" y="2" width="4" height="4" />
        <rect x="12" y="6" width="8" height="4" />
        <rect x="8" y="10" width="16" height="4" />
        <rect x="6" y="14" width="20" height="6" />
        <rect x="4" y="20" width="24" height="6" />
        <rect x="8" y="26" width="16" height="4" />
      </g>
      {/* Inner Flame (Electric Blue/Violet) */}
      <g fill="#c084fc">
        <rect x="14" y="10" width="4" height="4" />
        <rect x="10" y="14" width="12" height="6" />
        <rect x="8" y="20" width="16" height="4" />
      </g>
      {/* Core (Stark White) */}
      <g fill="#ffffff">
        <rect x="14" y="16" width="4" height="6" />
        <rect x="12" y="18" width="8" height="4" />
      </g>
    </svg>
  );
}

export function PixelTaco({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={`inline-icon taco-icon ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
    >
      {/* Outer Shell (Neon Lime Green) */}
      <g fill="#b5ff00">
        <rect x="10" y="6" width="12" height="4" />
        <rect x="6" y="10" width="20" height="4" />
        <rect x="4" y="14" width="24" height="4" />
        <rect x="2" y="18" width="28" height="4" />
        <rect x="4" y="22" width="24" height="4" />
        <rect x="8" y="26" width="16" height="2" />
      </g>
      {/* Cutout / Filling Details (White/Dark) */}
      <g fill="#040406">
        <rect x="10" y="14" width="4" height="4" />
        <rect x="18" y="14" width="4" height="4" />
        <rect x="8" y="20" width="16" height="2" />
      </g>
      <g fill="#ffffff">
        <rect x="14" y="10" width="4" height="4" />
        <rect x="12" y="16" width="8" height="2" />
      </g>
    </svg>
  );
}

export function PixelLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`nav-brand-logo ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
    >
      <g fill="#7c3aed">
        <rect x="10" y="0" width="4" height="4" />
        <rect x="0" y="10" width="4" height="4" />
        <rect x="20" y="10" width="4" height="4" />
        <rect x="10" y="20" width="4" height="4" />
        <rect x="4" y="4" width="4" height="4" />
        <rect x="16" y="4" width="4" height="4" />
        <rect x="4" y="16" width="4" height="4" />
        <rect x="16" y="16" width="4" height="4" />
      </g>
      <g fill="#b5ff00">
        <rect x="10" y="10" width="4" height="4" />
      </g>
    </svg>
  );
}
