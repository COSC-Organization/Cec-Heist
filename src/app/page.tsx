"use client";

import React, { useState } from "react";
import Image from "next/image";

const ScrambleText = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState(text);
  const chars = "!<>-_\\\\/[]{}—=+*^?#_";

  const scramble = () => {
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
    <span onMouseEnter={scramble} style={{ display: 'inline-block' }}>
      {displayText}
    </span>
  );
};

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
              <a href="#about" className="menu-nav-item" onClick={() => setMenuOpen(false)}><ScrambleText text="01. ABOUT HEIST" /></a>
              <a href="#schedule" className="menu-nav-item" onClick={() => setMenuOpen(false)}><ScrambleText text="02. SCHEDULE" /></a>
              <a href="#rules" className="menu-nav-item" onClick={() => setMenuOpen(false)}><ScrambleText text="03. RULES & ACCESS" /></a>
              <a href="#contact" className="menu-nav-item" onClick={() => setMenuOpen(false)}><ScrambleText text="04. CONTACT COSC" /></a>
            </nav>
            
            <img 
              src="/homepage/menu-image.png" 
              alt="Menu Decor" 
              className="menu-decor-image" 
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="content-wrapper">

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
