"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { usePixelTransition } from "./PixelTransition";

interface AuthGuardProps {
  children: React.ReactNode;
  sectorName: string;
}

export default function AuthGuard({ children, sectorName }: AuthGuardProps) {
  const pathname = usePathname();
  const { isLoggedIn, openLoginModal } = useAuth();
  const { triggerTransition } = usePixelTransition();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // When unauthenticated, prompt the login modal immediately on load
  useEffect(() => {
    if (isMounted && !isLoggedIn) {
      openLoginModal(pathname);
    }
  }, [isMounted, isLoggedIn, pathname, openLoginModal]);

  // Prevent hydration mismatch
  if (!isMounted) {
    return (
      <main className="crt-screen" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div className="font-pixel" style={{ color: "#00f0ff", fontSize: "1.1rem" }}>
          {"// VERIFYING TERMINAL CLEARANCE..."}
        </div>
      </main>
    );
  }

  // If authenticated, render protected page
  if (isLoggedIn) {
    return <>{children}</>;
  }

  // Restricted Access Locked Screen
  return (
    <main className="crt-screen" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <div className="scanlines-overlay" />

      {/* Side Wheels Machinery */}
      <div className="side-wheel-container side-wheel-left" aria-hidden="true">
        <Image
          src="/homepage/wheel.png"
          alt="Vault Wheel Left"
          width={780}
          height={780}
          className="side-wheel-img side-wheel-rotate-cw"
          priority
        />
      </div>
      <div className="side-wheel-container side-wheel-right" aria-hidden="true">
        <Image
          src="/homepage/wheel.png"
          alt="Vault Wheel Right"
          width={780}
          height={780}
          className="side-wheel-img side-wheel-rotate-ccw"
          priority
        />
      </div>

      {/* Locked Content Card */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
          zIndex: 20,
        }}
      >
        <div
          className="cyber-modal-card"
          style={{
            maxWidth: "600px",
            width: "100%",
            textAlign: "center",
            padding: "2.5rem 2rem",
            position: "relative",
          }}
        >
          {/* Corner Brackets */}
          <div className="corner-bracket top-left" />
          <div className="corner-bracket top-right" />
          <div className="corner-bracket bottom-left" />
          <div className="corner-bracket bottom-right" />

          {/* Lock Badge */}
          <div
            className="font-pixel"
            style={{
              display: "inline-block",
              padding: "0.35rem 1rem",
              borderRadius: "4px",
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              border: "1px solid #ef4444",
              color: "#ef4444",
              fontSize: "0.85rem",
              letterSpacing: "2px",
              marginBottom: "1.25rem",
            }}
          >
            [ ACCESS RESTRICTED // CLEARANCE REQUIRED ]
          </div>

          <h1
            className="font-pixel"
            style={{
              fontSize: "1.75rem",
              color: "#ffffff",
              letterSpacing: "2px",
              marginBottom: "0.5rem",
            }}
          >
            RESTRICTED SECTOR
          </h1>

          <div
            className="font-pixel"
            style={{
              color: "#00f0ff",
              fontSize: "0.95rem",
              letterSpacing: "1.5px",
              marginBottom: "1.5rem",
            }}
          >
            {"// "}{sectorName.toUpperCase()}
          </div>

          <p
            className="font-pixel"
            style={{
              color: "#d4d4d8",
              fontSize: "0.9rem",
              lineHeight: 1.6,
              marginBottom: "2rem",
            }}
          >
            THIS TERMINAL NODE REQUIRES ORGANIZER-ISSUED CREDENTIALS.
            <br />
            PLEASE AUTHENTICATE TO ACCESS SQUAD DOSSIER, ARENA MISSIONS, AND COMPETITION LEADERBOARDS.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              maxWidth: "320px",
              margin: "0 auto",
            }}
          >
            <button
              type="button"
              onClick={() => openLoginModal(pathname)}
              className="arena-enter-btn admin-submit-btn"
              style={{ width: "100%", padding: "0.75rem 1.25rem" }}
            >
              <span className="bracket">[</span>
              AUTHENTICATE NOW
              <span className="bracket">]</span>
            </button>

            <Link
              href="/"
              onClick={(e) => {
                e.preventDefault();
                triggerTransition("/", "right-to-left");
              }}
              className="font-pixel"
              style={{
                background: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#a1a1aa",
                padding: "0.6rem 1rem",
                borderRadius: "4px",
                textDecoration: "none",
                fontSize: "0.85rem",
                letterSpacing: "1px",
              }}
            >
              [ RETURN TO HOME ]
            </Link>
          </div>
        </div>
      </div>

      {/* Cyber Marquee Ticker */}
      <div className="cyber-marquee-container" aria-hidden="true">
        <div className="cyber-marquee-content">
          <span>ACCESS DENIED MR.CREW, ACCESS DENIED MRS.CREW // </span>
          <span>AUTHENTICATION REQUIRED // SECTOR SECURED // </span>
          <span>ACCESS DENIED MR.CREW, ACCESS DENIED MRS.CREW // </span>
          <span>AUTHENTICATION REQUIRED // SECTOR SECURED // </span>
        </div>
      </div>
    </main>
  );
}
