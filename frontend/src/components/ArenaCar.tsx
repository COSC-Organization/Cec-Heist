"use client";

import React, { useEffect, useRef } from "react";

// Calibrated paths connecting all 4 facilities seamlessly
const LEG_1_PATH =
  "M 307 340 C 310.0 342.5, 316.0 349.5, 322 355 C 326.3 359.2, 332.0 364.5, 337 369 C 342.0 373.5, 347.0 378.0, 352 382 C 357.0 386.0, 362.0 390.2, 367 393 C 372.0 395.8, 377.0 397.5, 382 399 C 387.0 400.5, 392.0 401.8, 397 402 C 402.0 402.2, 407.0 400.2, 412 400 C 417.0 399.8, 422.0 401.0, 427 401 C 432.0 401.0, 437.0 400.5, 442 400 C 447.0 399.5, 452.0 398.5, 457 398 C 462.0 397.5, 467.0 397.2, 472 397 C 477.0 396.8, 484.5 397.0, 487 397 C 492.0 397.0, 495.0 397.0, 498 397 C 515 398, 535 410, 560 428 C 580 445, 600 460, 615 470";

const LEG_2_PATH =
  "M 615 470 C 635 485, 655 500, 677 515 C 678.8 515.5, 683.7 517.0, 688 518 C 692.3 519.0, 698.0 520.3, 703 521 C 708.0 521.7, 713.0 522.3, 718 522 C 723.0 521.7, 728.0 520.3, 733 519 C 738.0 517.7, 743.0 515.3, 748 514 C 753.0 512.7, 758.0 511.8, 763 511 C 768.0 510.2, 773.0 509.3, 778 509 C 783.0 508.7, 788.0 508.3, 793 509 C 798.0 509.7, 803.0 511.2, 808 513 C 813.0 514.8, 818.0 517.5, 823 520 C 828.0 522.5, 833.0 525.0, 838 528 C 843.0 531.0, 848.0 534.3, 853 538 C 858.0 541.7, 863.0 545.8, 868 550 C 873.0 554.2, 878.0 559.7, 883 563 C 888.0 566.3, 893.5 567.8, 898 570 C 902.5 572.2, 907.0 575.0, 910 576 C 913.0 577.0, 915.0 576.0, 916 576 C 930 585, 955 615, 985 645 C 1005 665, 1025 675, 1040 680";

const LEG_3_PATH =
  "M 1040 680 C 1075 688, 1115 688, 1150 682 C 1175 675, 1195 665, 1210 659 C 1211.8 659.0, 1216.7 658.8, 1221 659 C 1225.3 659.2, 1231.0 659.8, 1236 660 C 1241.0 660.2, 1246.0 660.5, 1251 660 C 1256.0 659.5, 1261.0 658.2, 1266 657 C 1271.0 655.8, 1276.0 654.5, 1281 653 C 1286.0 651.5, 1290.8 650.7, 1296 648 C 1301.2 645.3, 1307.0 643.2, 1312 637 C 1317.0 630.8, 1321.3 621.2, 1326 611 C 1330.7 600.8, 1335.2 586.0, 1340 576 C 1344.8 566.0, 1350.0 556.7, 1355 551 C 1360.0 545.3, 1367.5 543.5, 1370 542 C 1385 532, 1400 525, 1415 520";

// Isometric perspective offset: car sprite rests at ~41° (down-right)
const CAR_SPRITE_NATURAL_ANGLE = 41;

// Exhaust pipe position relative to center of car sprite
const LOCAL_EXHAUST_X = -16.8;
const LOCAL_EXHAUST_Y = -6.2;

// Normalizes angle difference to -180..180 for smooth lerp without flipping
function normalizeAngleDiff(diff: number) {
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  return diff;
}

interface SmokeParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  maxRadius: number;
  initialOpacity: number;
  life: number;
  age: number;
}

export default function ArenaCar() {
  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);
  const path3Ref = useRef<SVGPathElement>(null);

  const carGroupRef = useRef<SVGGElement>(null);
  const carWrapperRef = useRef<SVGGElement>(null);
  const idleOscillatorRef = useRef<SVGGElement>(null);
  const smokeGroupRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const paths = [path1Ref.current, path2Ref.current, path3Ref.current];
    if (!paths[0] || !paths[1] || !paths[2]) return;

    // Cache exact SVG path lengths
    const legLengths = paths.map((p) => p?.getTotalLength() || 100);

    // Speed & duration configuration
    const CRUISING_SPEED = 78; // px/sec on 1672x941 stage
    const STOP_DURATIONS = [2400, 2400, 2400, 2800]; // ms stopped at each facility
    const FADE_DURATION = 800; // ms for stealth cloaking loop reset

    // Discrete State Model:
    let legIndex = 0;
    let stopIndex = 0;
    let distance = 0;
    let smoothedAngle = 0;
    let angleInitialized = false;

    // Phase: "STOPPED" | "DRIVING" | "FADING_OUT" | "FADING_IN"
    let phase: "STOPPED" | "DRIVING" | "FADING_OUT" | "FADING_IN" = "STOPPED";
    let phaseTime = 0;

    // Smoke Particle System Pool (40 particles)
    const MAX_SMOKE_PARTICLES = 40;
    const particles: SmokeParticle[] = Array.from({ length: MAX_SMOKE_PARTICLES }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 1.8,
      maxRadius: 7.5,
      initialOpacity: 0.6,
      life: 0.9,
      age: 0,
    }));

    // Pre-create SVG circle DOM elements in smoke group pool
    const smokeElements: SVGCircleElement[] = [];
    if (smokeGroupRef.current) {
      smokeGroupRef.current.innerHTML = "";
      for (let i = 0; i < MAX_SMOKE_PARTICLES; i++) {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("fill", "url(#smoke-white-puff)");
        circle.setAttribute("display", "none");
        smokeGroupRef.current.appendChild(circle);
        smokeElements.push(circle);
      }
    }

    let smokeEmitTimer = 0;

    let lastTimestamp = performance.now();
    let animFrameId: number;

    const updateFrame = (now: number) => {
      const dt = Math.min((now - lastTimestamp) / 1000, 0.1);
      lastTimestamp = now;

      if (phase === "STOPPED") {
        phaseTime += dt * 1000;
        const targetStopDuration = STOP_DURATIONS[stopIndex] || 2400;

        // Subtle realistic vehicle engine idling vibration (0.35px)
        if (idleOscillatorRef.current) {
          const idleY = Math.sin(now * 0.012) * 0.35;
          idleOscillatorRef.current.setAttribute("transform", `translate(0, ${idleY})`);
        }

        if (phaseTime >= targetStopDuration) {
          if (stopIndex === 3) {
            phase = "FADING_OUT";
            phaseTime = 0;
          } else {
            legIndex = stopIndex;
            distance = 0;
            phase = "DRIVING";
            phaseTime = 0;
          }
        }
      } else if (phase === "DRIVING") {
        phaseTime += dt * 1000;
        const activeLength = legLengths[legIndex];

        // Realistic acceleration and deceleration profile
        const accelDist = 35;
        const decelDist = 45;
        const distFromEnd = activeLength - distance;

        let speedFactor = 1.0;
        if (distance < accelDist) {
          speedFactor = Math.max(0.25, distance / accelDist);
        } else if (distFromEnd < decelDist) {
          speedFactor = Math.max(0.2, distFromEnd / decelDist);
        }

        const currentSpeed = CRUISING_SPEED * speedFactor;
        distance += currentSpeed * dt;

        if (distance >= activeLength) {
          distance = activeLength;
          stopIndex = legIndex + 1;
          phase = "STOPPED";
          phaseTime = 0;
        }

        if (idleOscillatorRef.current) {
          idleOscillatorRef.current.setAttribute("transform", "translate(0, 0)");
        }
      } else if (phase === "FADING_OUT") {
        phaseTime += dt * 1000;
        const opacity = Math.max(0, 1 - phaseTime / FADE_DURATION);
        if (carWrapperRef.current) {
          carWrapperRef.current.style.opacity = opacity.toFixed(3);
        }

        if (phaseTime >= FADE_DURATION) {
          legIndex = 0;
          distance = 0;
          stopIndex = 0;
          phase = "FADING_IN";
          phaseTime = 0;
          angleInitialized = false;
        }
      } else if (phase === "FADING_IN") {
        phaseTime += dt * 1000;
        const opacity = Math.min(1, phaseTime / FADE_DURATION);
        if (carWrapperRef.current) {
          carWrapperRef.current.style.opacity = opacity.toFixed(3);
        }

        if (phaseTime >= FADE_DURATION) {
          phase = "STOPPED";
          phaseTime = 0;
        }
      }

      // Determine the exact path and distance to sample based on phase
      let activePath: SVGPathElement;
      let sampleDist: number;
      let activeLength: number;

      if (phase === "STOPPED") {
        if (stopIndex === 0) {
          activePath = paths[0]!;
          sampleDist = 0;
          activeLength = legLengths[0];
        } else if (stopIndex === 1) {
          activePath = paths[0]!;
          sampleDist = legLengths[0];
          activeLength = legLengths[0];
        } else if (stopIndex === 2) {
          activePath = paths[1]!;
          sampleDist = legLengths[1];
          activeLength = legLengths[1];
        } else {
          activePath = paths[2]!;
          sampleDist = legLengths[2];
          activeLength = legLengths[2];
        }
      } else if (phase === "FADING_OUT") {
        activePath = paths[2]!;
        sampleDist = legLengths[2];
        activeLength = legLengths[2];
      } else if (phase === "FADING_IN") {
        activePath = paths[0]!;
        sampleDist = 0;
        activeLength = legLengths[0];
      } else {
        activePath = paths[legIndex]!;
        sampleDist = Math.max(0, Math.min(distance, legLengths[legIndex]));
        activeLength = legLengths[legIndex];
      }

      // Compute exact position and tangent orientation
      let p1: DOMPoint;
      let p2: DOMPoint;

      if (sampleDist >= activeLength) {
        p1 = activePath.getPointAtLength(Math.max(0, activeLength - 3));
        p2 = activePath.getPointAtLength(activeLength);
      } else if (sampleDist <= 0) {
        p1 = activePath.getPointAtLength(0);
        p2 = activePath.getPointAtLength(Math.min(3, activeLength));
      } else {
        p1 = activePath.getPointAtLength(sampleDist);
        p2 = activePath.getPointAtLength(Math.min(sampleDist + 3, activeLength));
      }

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const roadHeading = Math.atan2(dy, dx) * (180 / Math.PI);
      const targetRotation = roadHeading - CAR_SPRITE_NATURAL_ANGLE;

      if (!angleInitialized) {
        smoothedAngle = targetRotation;
        angleInitialized = true;
      } else {
        const diff = normalizeAngleDiff(targetRotation - smoothedAngle);
        smoothedAngle += diff * 0.14;
      }

      const renderX = sampleDist >= activeLength ? p2.x : p1.x;
      const renderY = sampleDist >= activeLength ? p2.y : p1.y;

      // Apply transform directly to SVG DOM node
      if (carGroupRef.current) {
        carGroupRef.current.setAttribute(
          "transform",
          `translate(${renderX.toFixed(2)}, ${renderY.toFixed(2)}) rotate(${smoothedAngle.toFixed(2)})`
        );
      }

      // ----------------------------------------------------
      // REALISTIC WHITE EXHAUST SMOKE PARTICLE SYSTEM
      // ----------------------------------------------------
      const rad = (smoothedAngle * Math.PI) / 180;
      // World position of the rear exhaust pipe
      const exhaustWorldX =
        renderX + LOCAL_EXHAUST_X * Math.cos(rad) - LOCAL_EXHAUST_Y * Math.sin(rad);
      const exhaustWorldY =
        renderY + LOCAL_EXHAUST_X * Math.sin(rad) + LOCAL_EXHAUST_Y * Math.cos(rad);

      // Backwards direction vector opposite of car travel
      const backAngleRad = ((roadHeading + 180) * Math.PI) / 180;
      const backDirX = Math.cos(backAngleRad);
      const backDirY = Math.sin(backAngleRad);

      smokeEmitTimer += dt;
      // Emission interval: active puffs while driving (~55ms), subtle wisps while stopped (~160ms)
      const emitInterval = phase === "DRIVING" ? 0.055 : 0.16;

      if (
        (phase === "DRIVING" || phase === "STOPPED") &&
        smokeEmitTimer >= emitInterval
      ) {
        smokeEmitTimer = 0;

        // Find an inactive particle in the pool
        const particle = particles.find((p) => !p.active);
        if (particle) {
          particle.active = true;
          particle.age = 0;
          particle.x = exhaustWorldX + (Math.random() - 0.5) * 1.5;
          particle.y = exhaustWorldY + (Math.random() - 0.5) * 1.5;

          if (phase === "DRIVING") {
            // Speed of smoke billowing backwards
            const exhaustSpeed = 10 + Math.random() * 8;
            particle.vx = backDirX * exhaustSpeed + (Math.random() - 0.5) * 6;
            particle.vy = backDirY * exhaustSpeed + (Math.random() - 0.5) * 6 - 3; // slight atmospheric thermal rise
            particle.radius = 1.6 + Math.random() * 0.8;
            particle.maxRadius = 7.0 + Math.random() * 3.0;
            particle.initialOpacity = 0.65 + Math.random() * 0.15;
            particle.life = 0.8 + Math.random() * 0.35;
          } else {
            // Idle gentle wisps
            particle.vx = (Math.random() - 0.5) * 3 - 2;
            particle.vy = -5 - Math.random() * 4; // slow rising thermal wisp
            particle.radius = 1.2 + Math.random() * 0.6;
            particle.maxRadius = 5.2 + Math.random() * 1.8;
            particle.initialOpacity = 0.45 + Math.random() * 0.12;
            particle.life = 0.9 + Math.random() * 0.3;
          }
        }
      }

      // Update and render active smoke particles
      for (let i = 0; i < MAX_SMOKE_PARTICLES; i++) {
        const p = particles[i];
        const el = smokeElements[i];
        if (!p || !el) continue;

        if (p.active) {
          p.age += dt;
          if (p.age >= p.life || phase === "FADING_OUT") {
            p.active = false;
            el.setAttribute("display", "none");
          } else {
            // Physics: expand and drift with air buoyancy
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy -= 1.8 * dt; // slow thermal lift

            const progress = p.age / p.life;
            const currentR = p.radius + (p.maxRadius - p.radius) * progress;
            // Soft sine decay for smooth dissipation
            const currentOpacity =
              p.initialOpacity * Math.sin((1 - progress) * Math.PI * 0.5);

            el.setAttribute("cx", p.x.toFixed(2));
            el.setAttribute("cy", p.y.toFixed(2));
            el.setAttribute("r", currentR.toFixed(2));
            el.setAttribute("opacity", currentOpacity.toFixed(3));
            el.setAttribute("display", "inline");
          }
        }
      }

      animFrameId = requestAnimationFrame(updateFrame);
    };

    animFrameId = requestAnimationFrame(updateFrame);
    return () => cancelAnimationFrame(animFrameId);
  }, []);

  return (
    <g className="arena-car-layer" style={{ pointerEvents: "none" }}>
      <defs>
        {/* Soft ground contact shadow for the vehicle chassis */}
        <filter id="car-chassis-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" />
        </filter>

        {/* Headlight volumetric cone gradient (Warm gold fading to asphalt) */}
        <linearGradient id="headlight-beam-grad" x1="0%" y1="0%" x2="100%" y2="80%">
          <stop offset="0%" stopColor="#fff2bf" stopOpacity="0.45" />
          <stop offset="35%" stopColor="#ffd875" stopOpacity="0.22" />
          <stop offset="75%" stopColor="#ffb834" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ff9900" stopOpacity="0" />
        </linearGradient>

        {/* Headlight lens flare glow filter */}
        <filter id="headlight-lens-flare" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Realistic White Smoke Puff Radial Gradient */}
        <radialGradient id="smoke-white-puff" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="35%" stopColor="#f8faff" stopOpacity="0.55" />
          <stop offset="70%" stopColor="#edf2f7" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0" />
        </radialGradient>

        {/* Atmospheric smoke soft blur for organic billowing edges */}
        <filter id="smoke-soft-blur" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>

      {/* Hidden Calibration Paths */}
      <path ref={path1Ref} d={LEG_1_PATH} fill="none" stroke="none" />
      <path ref={path2Ref} d={LEG_2_PATH} fill="none" stroke="none" />
      <path ref={path3Ref} d={LEG_3_PATH} fill="none" stroke="none" />

      {/* Realistic White Smoke Trail Layer (Billows on the road behind vehicle) */}
      <g ref={smokeGroupRef} filter="url(#smoke-soft-blur)" />

      {/* Opacity Wrapper for Seamless Stealth Reset Loop */}
      <g ref={carWrapperRef} style={{ transition: "opacity 0.1s linear" }}>
        {/* Animated Position & Heading Group */}
        <g ref={carGroupRef}>
          {/* Engine Idle Breathing Oscillation Group */}
          <g ref={idleOscillatorRef}>
            {/* 1. Realistic Night Contact Shadow on Asphalt */}
            <ellipse
              cx="0"
              cy="2.5"
              rx="17"
              ry="9.5"
              fill="rgba(0, 0, 0, 0.78)"
              filter="url(#car-chassis-shadow)"
            />

            {/* 2. Volumetric Headlight Beams (Casting warm cones ahead onto the road) */}
            {/* Left headlight beam */}
            <polygon
              points="11,6 38,18 31,34 11,8"
              fill="url(#headlight-beam-grad)"
              style={{ mixBlendMode: "screen" }}
            />
            {/* Right headlight beam */}
            <polygon
              points="14,4 46,14 39,30 14,7"
              fill="url(#headlight-beam-grad)"
              style={{ mixBlendMode: "screen" }}
            />

            {/* 3. The Isometric Car Sprite (/arena/car.png) at realistic road scale */}
            <image
              href="/arena/car.png"
              width="38"
              height="33.34"
              x="-19"
              y="-16.67"
              preserveAspectRatio="xMidYMid meet"
              style={{
                filter: "drop-shadow(0 2px 3px rgba(0, 0, 0, 0.85))",
              }}
            />

            {/* 4. Front Headlight Glow Lens Flares */}
            <circle
              cx="12.6"
              cy="8.2"
              r="1.4"
              fill="#fffbd4"
              filter="url(#headlight-lens-flare)"
            />
            <circle
              cx="15.2"
              cy="6.0"
              r="1.3"
              fill="#fffbd4"
              filter="url(#headlight-lens-flare)"
            />

            {/* 5. Rear Crimson Tail Light Accent */}
            <circle
              cx="-16.2"
              cy="-6.5"
              r="1.1"
              fill="#ff2233"
              opacity="0.85"
              filter="url(#headlight-lens-flare)"
            />
          </g>
        </g>
      </g>
    </g>
  );
}
