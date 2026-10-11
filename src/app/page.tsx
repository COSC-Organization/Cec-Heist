"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";

// Web Audio API Sound Generators
const playCyberHover = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') return;
    
    // Subtle low thump for hover
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
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
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Mechanical static/click noise
    const bufferSize = ctx.sampleRate * 0.05; // 50ms of noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    // filter to make it sound mechanical
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
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
    <span onMouseEnter={scramble} style={{ display: 'inline-block' }}>
      {displayText}
    </span>
  );
};

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const handleFirstClick = () => {
      if (audioRef.current) {
        audioRef.current.volume = 0.1;
        audioRef.current.play().catch(e => console.log('Audio blocked', e));
      }
      document.removeEventListener('click', handleFirstClick);
    };
    document.addEventListener('click', handleFirstClick);
    return () => document.removeEventListener('click', handleFirstClick);
  }, []);

  return (
    <main className="crt-screen">
      <audio ref={audioRef} src="/music/background%20music.mpeg" loop />
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
              <a href="#about" className="menu-nav-item" onClick={() => { setMenuOpen(false); playCyberClick(); }}><ScrambleText text="01. ABOUT HEIST" /></a>
              <a href="#schedule" className="menu-nav-item" onClick={() => { setMenuOpen(false); playCyberClick(); }}><ScrambleText text="02. SCHEDULE" /></a>
              <a href="#rules" className="menu-nav-item" onClick={() => { setMenuOpen(false); playCyberClick(); }}><ScrambleText text="03. RULES & ACCESS" /></a>
              <a href="#contact" className="menu-nav-item" onClick={() => { setMenuOpen(false); playCyberClick(); }}><ScrambleText text="04. CONTACT COSC" /></a>
            </nav>
            
            <img 
              src="/homepage/menu-image.png" 
              alt="Menu Decor" 
              className="menu-decor-image" 
            />
          </div>
        </div>
      </header>

      {/* Vault Wheel Machinery on Left & Right Borders */}
      <div className="side-wheel-container side-wheel-left">
        <img
          src="/homepage/wheel.png"
          alt="Vault Wheel Left"
          className="side-wheel-img side-wheel-rotate-cw"
        />
      </div>
      <div className="side-wheel-container side-wheel-right">
        <img
          src="/homepage/wheel.png"
          alt="Vault Wheel Right"
          className="side-wheel-img side-wheel-rotate-ccw"
        />
      </div>

      {/* Main Content */}
      <div className="content-wrapper">
        <div className="hero-images-container">
          <img
            src="/homepage/cosc.png"
            alt="COSC"
            className="hero-img hero-img-cosc"
          />
          <img
            src="/homepage/presents.png"
            alt="Presents"
            className="hero-img hero-img-presents"
          />
          <img
            src="/homepage/cec-heist.png"
            alt="CEC Heist"
            className="hero-img hero-img-cec-heist"
          />
          <img
            src="/homepage/2026.png"
            alt="2026"
            className="hero-img hero-img-2026"
          />
          <img
            src="/homepage/tagline.png"
            alt="Tagline"
            className="hero-img hero-img-tagline"
          />
        </div>
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
