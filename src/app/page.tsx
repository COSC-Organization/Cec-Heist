"use client";

import React, { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="crt-screen">
      <div className="scanlines-overlay" />

      {/* Header Pill */}
      <header className="header-wrapper">
        <div className="header-pill">
          <div className="header-brand">
            <Image
              src="/cosc%20logo.png"
              alt="COSC Logo"
              width={26}
              height={26}
              className="header-logo"
            />
            <span className="header-title">CEC HEIST</span>
          </div>

          <button
            className="menu-toggle-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect y="1" width="22" height="2.5" fill="currentColor" rx="1" />
              <rect y="10.5" width="22" height="2.5" fill="currentColor" rx="1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="content-wrapper">
        <h1 className="heist-text">CEC HEIST 2026</h1>
      </div>

      {/* Menu Modal */}
      {menuOpen && (
        <div className="menu-modal-backdrop" onClick={() => setMenuOpen(false)}>
          <div className="menu-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="menu-close-btn" onClick={() => setMenuOpen(false)}>✕</button>
            <div className="menu-modal-header">// CEC HEIST 2026 INDEX</div>
            <nav className="menu-nav-list">
              <a href="#about" className="menu-nav-item" onClick={() => setMenuOpen(false)}>01. ABOUT HEIST</a>
              <a href="#schedule" className="menu-nav-item" onClick={() => setMenuOpen(false)}>02. SCHEDULE</a>
              <a href="#rules" className="menu-nav-item" onClick={() => setMenuOpen(false)}>03. RULES & ACCESS</a>
              <a href="#contact" className="menu-nav-item" onClick={() => setMenuOpen(false)}>04. CONTACT COSC</a>
            </nav>
          </div>
        </div>
      )}
    </main>
  );
}
