"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { usePixelTransition } from "../components/PixelTransition";
import { useAuth } from "../context/AuthContext";
import MouseTrail from "../components/MouseTrail";

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
  const router = useRouter();
  const pathname = usePathname();
  const { triggerTransition } = usePixelTransition();
  const { isLoggedIn, openLoginModal } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    playCyberClick();

    if (href.startsWith("#") || href.startsWith("/#")) {
      setMenuOpen(false);
      const hash = href.includes("#") ? href.substring(href.indexOf("#") + 1) : "";
      if (pathname === "/" || pathname === "") {
        const elem = document.getElementById(hash);
        if (elem) elem.scrollIntoView({ behavior: "smooth" });
      } else {
        setTimeout(() => {
          router.push(href);
        }, 580);
      }
      return;
    }

    if (pathname === href) {
      setMenuOpen(false);
      return;
    }

    if (href === "/arena") {
      setMenuOpen(false);
      if (!isLoggedIn) {
        openLoginModal("/arena");
        return;
      }
      triggerTransition("/arena", "left-to-right");
      return;
    }

    if (href === "/leaderboard") {
      setMenuOpen(false);
      if (!isLoggedIn) {
        openLoginModal("/leaderboard");
        return;
      }
      triggerTransition("/leaderboard", "left-to-right");
      return;
    }

    if (href === "/profile") {
      setMenuOpen(false);
      if (!isLoggedIn) {
        openLoginModal("/profile");
        return;
      }
      triggerTransition("/profile", "left-to-right");
      return;
    }

    router.prefetch(href);
    setMenuOpen(false);

    setTimeout(() => {
      router.push(href);
    }, 580);
  };

  const handleEnterArena = (e: React.MouseEvent) => {
    e.preventDefault();
    playCyberClick();
    if (!isLoggedIn) {
      openLoginModal("/arena");
      return;
    }
    triggerTransition("/arena", "left-to-right");
  };

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
      <MouseTrail />
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
              <Link href="/" className="menu-nav-item" onClick={(e) => handleNavClick(e, "/")}><ScrambleText text="01. HOME" /></Link>
              <Link href="/arena" className="menu-nav-item" onClick={(e) => handleNavClick(e, "/arena")}><ScrambleText text="02. ARENA" /></Link>
              <Link href="/leaderboard" className="menu-nav-item" onClick={(e) => handleNavClick(e, "/leaderboard")}><ScrambleText text="03. LEADERBOARD" /></Link>
              
              <Link href="/profile" className="menu-nav-item" onClick={(e) => handleNavClick(e, "/profile")}><ScrambleText text="04. PROFILE" /></Link>
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
          draggable={false}
        />
      </div>
      <div className="side-wheel-container side-wheel-right">
        <img
          src="/homepage/wheel.png"
          alt="Vault Wheel Right"
          className="side-wheel-img side-wheel-rotate-ccw"
          draggable={false}
        />
      </div>

      {/* Main Content */}
      <div className="content-wrapper">
        <div className="hero-images-container">
          <img
            src="/homepage/cosc.png"
            alt="COSC"
            className="hero-img hero-img-cosc"
            draggable={false}
          />
          <img
            src="/homepage/presents.png"
            alt="Presents"
            className="hero-img hero-img-presents"
            draggable={false}
          />
          <img
            src="/homepage/cec-heist.png"
            alt="CEC Heist"
            className="hero-img hero-img-cec-heist"
            draggable={false}
          />
          <img
            src="/homepage/2026.png"
            alt="2026"
            className="hero-img hero-img-2026"
            draggable={false}
          />
          <img
            src="/homepage/tagline.png"
            alt="Tagline"
            className="hero-img hero-img-tagline"
            draggable={false}
          />

          {/* Enter The Arena Gooey Button */}
          <button 
            type="button"
            className="arena-enter-btn gooey-button"
            onClick={handleEnterArena}
            onPointerMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left + 12}px`);
              e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top + 12}px`);
            }}
          >
            <span className="gooey-bg" aria-hidden="true">
              <span className="gooey-base" />
              <span className="gooey-blob" />
              <span className="gooey-bubble b1" />
              <span className="gooey-bubble b2" />
              <span className="gooey-bubble b3" />
            </span>
            <span className="arena-btn-content">
              <span className="bracket">[</span>
              <ScrambleText text="ENTER THE ARENA" />
              <span className="bracket">]</span>
            </span>
          </button>
        </div>
      </div>

      {/* SVG Gooey Filter */}
      <svg width="0" height="0" style={{ position: "absolute", pointerEvents: "none" }}>
        <filter id="goo" x="-50%" y="-50%" width="200%" height="200%">
          <feComponentTransfer>
            <feFuncA type="discrete" tableValues="0 1" />
          </feComponentTransfer>
          <feGaussianBlur stdDeviation="5" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="-5 11" />
          </feComponentTransfer>
        </filter>
      </svg>

      {/* Cyber Crime Banner */}
      <div className="cyber-marquee-container" aria-hidden="true">
        <div className="cyber-marquee-track cyber-marquee-content">
          <div className="cyber-marquee-group">
            {[...Array(8)].map((_, i) => (
              <span key={`ticker-a-${i}`}>
                ACCESS DENIED MR.CREW, ACCESS DENIED MRS.CREW //{" "}
              </span>
            ))}
          </div>
          <div className="cyber-marquee-group" aria-hidden="true">
            {[...Array(8)].map((_, i) => (
              <span key={`ticker-b-${i}`}>
                ACCESS DENIED MR.CREW, ACCESS DENIED MRS.CREW //{" "}
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
