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
        <div className={`header-pill ${menuOpen ? "expanded" : ""}`}>
          <div className="header-content-top" style={{ position: 'relative' }}>
            <div className="header-brand">
              <Image
                src="/cosc%20logo.png"
                alt="COSC Logo"
                width={56}
                height={56}
                className="header-logo"
              />
            </div>

            <img
              src="/homepage/menu.png?v=2"
              alt="Menu"
              width={100}
              height={24}
              style={{ objectFit: 'contain', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}
            />

            <button
              className={`menu-toggle-btn ${menuOpen ? "open" : ""}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <div className="hamburger-icon">
                <span className="line top"></span>
                <span className="line bottom"></span>
              </div>
            </button>
          </div>
          
          <div className="header-menu-content">
            <div className="menu-modal-header">// CEC HEIST 2K26 INDEX</div>
            <nav className="menu-nav-list">
              <a href="#about" className="menu-nav-item" onClick={() => setMenuOpen(false)}>01. ABOUT HEIST</a>
              <a href="#schedule" className="menu-nav-item" onClick={() => setMenuOpen(false)}>02. SCHEDULE</a>
              <a href="#rules" className="menu-nav-item" onClick={() => setMenuOpen(false)}>03. RULES & ACCESS</a>
              <a href="#contact" className="menu-nav-item" onClick={() => setMenuOpen(false)}>04. CONTACT COSC</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="content-wrapper">
        <h1 className="heist-text">
          <div>CEC HEIST</div>
          <div>2K26</div>
        </h1>
      </div>

      {/* Cyber Crime Banner */}
      <div className="cyber-marquee-container">
        <div className="cyber-marquee-content">
          <span>ACCESS DENIED MR.CREW, ACCESS DENIED MRS.CREW // </span>
          <span>ACCESS DENIED MR.CREW, ACCESS DENIED MRS.CREW // </span>
          <span>ACCESS DENIED MR.CREW, ACCESS DENIED MRS.CREW // </span>
          <span>ACCESS DENIED MR.CREW, ACCESS DENIED MRS.CREW // </span>
        </div>
      </div>
    </main>
  );
}
