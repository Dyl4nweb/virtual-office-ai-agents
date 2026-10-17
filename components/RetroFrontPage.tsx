'use client';

import React, { useState, useEffect, useRef } from 'react';
import { IconLock, IconCrown, IconSparkles, IconCheck, IconAlertTriangle } from '@/components/Icons';
import { AGENT_ROSTER_INFO } from '@/lib/roster';
import PixelTechFrontScenery from '@/components/PixelTechFrontScenery';
import {
  playArcadeSfx,
  startArcadeBgm,
  stopArcadeBgm,
  isArcadeBgmPlaying,
  ArcadeSfxType,
} from '@/lib/arcadeSound';

interface RetroFrontPageProps {
  onEnter: (remember?: boolean, token?: string) => void;
}

export default function RetroFrontPage({ onEnter }: RetroFrontPageProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bgmPlaying, setBgmPlaying] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Password Input state
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const soundSfx = (type: ArcadeSfxType) => {
    if (soundEnabled) playArcadeSfx(type);
  };

  // Auto-start authentic 8-bit arcade BGM upon first user interaction (click/touch/key)
  useEffect(() => {
    const handleFirstGesture = () => {
      if (soundEnabled && !isArcadeBgmPlaying()) {
        const ok = startArcadeBgm(0.12);
        if (ok) setBgmPlaying(true);
      }
    };

    window.addEventListener('pointerdown', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      stopArcadeBgm();
    };
  }, [soundEnabled]);

  useEffect(() => {
    if (showPasswordModal) {
      const timer = setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showPasswordModal]);

  const handleOpenPasswordModal = () => {
    soundSfx('open');
    setErrorMsg('');
    setIsSuccess(false);
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting || isSuccess) return;

    const clean = password.trim();
    if (!clean) {
      soundSfx('error');
      setShake(true);
      setErrorMsg('ENTER PASSCODE');
      setTimeout(() => setShake(false), 500);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: clean }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        soundSfx('success');
        setIsSuccess(true);
        setErrorMsg('');
        stopArcadeBgm();
        setTimeout(() => {
          onEnter(rememberMe, data.token);
        }, 700);
      } else {
        soundSfx('error');
        setShake(true);
        setErrorMsg(data.error || 'ACCESS DENIED: INVALID EXECUTIVE PASSCODE');
        setTimeout(() => setShake(false), 500);
      }
    } catch {
      soundSfx('error');
      setShake(true);
      setErrorMsg('CONNECTION ERROR. RETRY.');
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: "'Press Start 2P', monospace",
        background: 'linear-gradient(180deg, #60a5fa 0%, #93c5fd 40%, #bae6fd 70%, #e0f2fe 100%)',
      }}
    >
      {/* =========================================================================
          1. 100% AUTHENTIC PIXEL ART SCENERY (Tech Skyline, Clouds, Garden & Tech Workers)
          ========================================================================= */}
      <PixelTechFrontScenery onPlaySound={soundSfx} />

      {/* =========================================================================
          2. TOP RETRO CONTROLS BAR (Sound Toggle & Founder Tag)
          ========================================================================= */}
      <header
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '1200px',
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pointerEvents: 'none',
        }}
      >
        {/* Left Founder Clearance Chip */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(15, 23, 42, 0.92)',
            border: '2px solid #00f0ff',
            padding: '8px 16px',
            borderRadius: '8px',
            boxShadow: '0 4px 14px rgba(0, 240, 255, 0.35)',
            fontSize: '9px',
            fontWeight: 400,
            color: '#00f0ff',
            letterSpacing: '0.5px',
            pointerEvents: 'auto',
          }}
        >
          <IconCrown size={14} color="#ffbe0b" />
          <span>AVERO TECHNOLOGIES • DYLAN RAMOS HQ</span>
        </div>

        {/* Right Retro Audio Speaker & BGM Controller */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
          <button
            onClick={() => {
              if (bgmPlaying) {
                stopArcadeBgm();
                setBgmPlaying(false);
              } else {
                startArcadeBgm(0.14);
                setBgmPlaying(true);
                playArcadeSfx('chime');
              }
            }}
            onMouseEnter={() => playArcadeSfx('hover', 0.08)}
            title={bgmPlaying ? 'Mute 8-Bit Game Music' : 'Play 8-Bit Game Music'}
            style={{
              background: bgmPlaying
                ? 'linear-gradient(180deg, #ecfdf5 0%, #a7f3d0 100%)'
                : 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
              border: bgmPlaying ? '2.5px solid #10b981' : '2.5px solid #475569',
              borderRadius: '999px',
              padding: '8px 14px',
              cursor: 'pointer',
              boxShadow: bgmPlaying
                ? '0 3px 0 #047857, 0 0 12px rgba(16, 185, 129, 0.4)'
                : '0 3px 0 #0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: bgmPlaying ? '#065f46' : '#94a3b8',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '8px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              transition: 'all 0.12s ease',
            }}
          >
            {/* Animated dancing equalizer bars */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '11px' }}>
              <span className={bgmPlaying ? 'eq-bar eq-bar-1' : 'eq-bar eq-bar-static'} />
              <span className={bgmPlaying ? 'eq-bar eq-bar-2' : 'eq-bar eq-bar-static'} />
              <span className={bgmPlaying ? 'eq-bar eq-bar-3' : 'eq-bar eq-bar-static'} />
              <span className={bgmPlaying ? 'eq-bar eq-bar-4' : 'eq-bar eq-bar-static'} />
            </div>
            <span>{bgmPlaying ? '8-BIT BGM: ON' : '8-BIT BGM: OFF'}</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          3. CENTER HERO LOGO & TECH COMPANY TEAM (Workers + Pets Peeking Over Logo)
          ========================================================================= */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '-10px',
          pointerEvents: 'none',
        }}
      >
        {/* Tech Company Team Peeking Over Title Banner (Dylan, Eah, Alex, Maya, Snowy & Mochi) */}
        <div
          style={{
            marginBottom: '-16px',
            zIndex: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto',
          }}
        >
          <svg width="430" height="96" viewBox="0 0 430 96">
            {/* --- 1. ALEX RIVERA (Senior Engineer) --- */}
            <g
              id="alex-dev"
              onClick={() => soundSfx('click')}
              style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
              className="hover:opacity-90"
            >
              <title>Alex Rivera (Senior Engineer) - "Shipping low-latency microservices!"</title>
              {/* Headphones Band */}
              <path d="M 32 38 Q 48 18 64 38" fill="none" stroke="#0f172a" strokeWidth="4" />
              <rect x="28" y="34" width="8" height="14" rx="3" fill="#00f0ff" stroke="#0f172a" strokeWidth="2.5" />
              <rect x="60" y="34" width="8" height="14" rx="3" fill="#00f0ff" stroke="#0f172a" strokeWidth="2.5" />
              {/* Head & Hair */}
              <circle cx="48" cy="46" r="18" fill="#fed7aa" stroke="#0f172a" strokeWidth="3" />
              <path d="M 30 42 Q 48 24 66 42 Z" fill="#1e293b" />
              {/* Dev Eyeglasses */}
              <rect x="37" y="44" width="9" height="7" rx="2" fill="none" stroke="#00f0ff" strokeWidth="2" />
              <rect x="49" y="44" width="9" height="7" rx="2" fill="none" stroke="#00f0ff" strokeWidth="2" />
              <line x1="46" y1="47" x2="49" y2="47" stroke="#00f0ff" strokeWidth="2" />
              {/* Orange Hoodie Shoulders */}
              <path d="M 32 64 Q 48 58 64 64 L 66 84 L 30 84 Z" fill="#ea580c" stroke="#0f172a" strokeWidth="3" />
              {/* Hands resting on title */}
              <circle cx="36" cy="84" r="5.5" fill="#fed7aa" stroke="#0f172a" strokeWidth="2.5" />
              <circle cx="60" cy="84" r="5.5" fill="#fed7aa" stroke="#0f172a" strokeWidth="2.5" />
            </g>

            {/* --- 2. SNOWY THE WHITE CAT --- */}
            <g
              id="snowy-white-cat"
              onClick={() => soundSfx('meow')}
              style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
              className="hover:opacity-90"
            >
              <title>Snowy the White Cat - Executive Purr Officer! *meow~*</title>
              {/* Ears */}
              <polygon points="98,22 88,44 108,44" fill="#ffffff" stroke="#0f172a" strokeWidth="3" />
              <polygon points="97,28 92,42 104,42" fill="#fb7185" />
              <polygon points="124,22 114,44 134,44" fill="#ffffff" stroke="#0f172a" strokeWidth="3" />
              <polygon points="125,28 120,42 130,42" fill="#fb7185" />
              {/* Cat Head */}
              <circle cx="111" cy="52" r="20" fill="#ffffff" stroke="#0f172a" strokeWidth="3" />
              {/* Emerald Eyes */}
              <circle cx="103" cy="52" r="4.5" fill="#10b981" stroke="#0f172a" strokeWidth="1" />
              <circle cx="104" cy="51" r="1.5" fill="#ffffff" />
              <circle cx="119" cy="52" r="4.5" fill="#10b981" stroke="#0f172a" strokeWidth="1" />
              <circle cx="120" cy="51" r="1.5" fill="#ffffff" />
              {/* Pink Nose */}
              <polygon points="111,57 109,55 113,55" fill="#fb7185" />
              {/* Sky Blue Collar & Bell */}
              <rect x="99" y="68" width="24" height="4.5" rx="2" fill="#38bdf8" />
              <circle cx="111" cy="73" r="3.5" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.5" />
              {/* Paws on title */}
              <rect x="94" y="80" width="13" height="9" rx="4" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
              <rect x="116" y="80" width="13" height="9" rx="4" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
            </g>

            {/* --- 3. DYLAN RAMOS (Founder & CEO - CENTER) --- */}
            <g
              id="dylan-ceo"
              onClick={() => soundSfx('coin')}
              style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
              className="hover:opacity-90"
            >
              <title>Dylan Ramos (Founder & CEO) - "Scaling Avero Virtual Office to the world!"</title>
              {/* Golden Crown */}
              <polygon points="190,14 195,26 205,20 215,26 220,14 220,30 190,30" fill="#ffbe0b" stroke="#0f172a" strokeWidth="3" />
              <circle cx="190" cy="14" r="3" fill="#ef4444" />
              <circle cx="205" cy="20" r="3" fill="#38bdf8" />
              <circle cx="220" cy="14" r="3" fill="#ef4444" />
              {/* Head & Hair */}
              <circle cx="205" cy="46" r="20" fill="#fed7aa" stroke="#0f172a" strokeWidth="3" />
              <path d="M 185,42 Q 205,24 225,42 Z" fill="#0f172a" />
              {/* Eyes & Friendly Smile */}
              <circle cx="197" cy="47" r="3.5" fill="#0f172a" />
              <circle cx="198" cy="46" r="1.2" fill="#ffffff" />
              <circle cx="213" cy="47" r="3.5" fill="#0f172a" />
              <circle cx="214" cy="46" r="1.2" fill="#ffffff" />
              <path d="M 200 54 Q 205 58 210 54" fill="none" stroke="#0f172a" strokeWidth="2.5" />
              {/* Navy Tech Blazer & Gold Tie */}
              <path d="M 185 64 Q 205 58 225 64 L 228 84 L 182 84 Z" fill="#1e3a8a" stroke="#0f172a" strokeWidth="3" />
              <polygon points="204,63 206,63 207,76 205,79 203,76" fill="#ffbe0b" />
              {/* Hands on title */}
              <circle cx="187" cy="83" r="6.5" fill="#fed7aa" stroke="#0f172a" strokeWidth="2.5" />
              <circle cx="223" cy="83" r="6.5" fill="#fed7aa" stroke="#0f172a" strokeWidth="2.5" />
            </g>

            {/* --- 4. EAH (Executive Partner) --- */}
            <g
              id="eah-partner"
              onClick={() => soundSfx('chime')}
              style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
              className="hover:opacity-90"
            >
              <title>Eah (Executive Partner) - "Welcome Dylan & team to Avero HQ!"</title>
              {/* Brunette Wavy Hair */}
              <circle cx="275" cy="48" r="22" fill="#451a03" />
              {/* Head */}
              <circle cx="275" cy="48" r="18" fill="#fed7aa" stroke="#0f172a" strokeWidth="3" />
              {/* Bangs */}
              <path d="M 259 44 Q 275 30 291 44 Z" fill="#451a03" />
              {/* Eyes & Smile */}
              <circle cx="268" cy="48" r="3.5" fill="#0f172a" />
              <circle cx="269" cy="47" r="1.2" fill="#ffffff" />
              <circle cx="282" cy="48" r="3.5" fill="#0f172a" />
              <circle cx="283" cy="47" r="1.2" fill="#ffffff" />
              <path d="M 272 55 Q 275 58 278 55" fill="none" stroke="#0f172a" strokeWidth="2" />
              {/* Rose-Pink Blazer */}
              <path d="M 258 65 Q 275 60 292 65 L 294 84 L 256 84 Z" fill="#f43f5e" stroke="#0f172a" strokeWidth="3" />
              {/* Warm Coffee Mug in hand */}
              <rect x="286" y="74" width="10" height="9" rx="2" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
              <path d="M 296 76 Q 300 78 296 81" fill="none" stroke="#0f172a" strokeWidth="2" />
              {/* Hands on title */}
              <circle cx="262" cy="83" r="5.5" fill="#fed7aa" stroke="#0f172a" strokeWidth="2.5" />
            </g>

            {/* --- 5. MOCHI THE PUPPY --- */}
            <g
              id="mochi-puppy"
              onClick={() => soundSfx('bark')}
              style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
              className="hover:opacity-90"
            >
              <title>Mochi the Puppy - Chief Morale Officer! *woof!*</title>
              {/* Floppy Ears */}
              <ellipse cx="320" cy="40" rx="8" ry="16" transform="rotate(-15 320 40)" fill="#b45309" stroke="#0f172a" strokeWidth="2.5" />
              <ellipse cx="352" cy="40" rx="8" ry="16" transform="rotate(15 352 40)" fill="#b45309" stroke="#0f172a" strokeWidth="2.5" />
              {/* Head */}
              <circle cx="336" cy="50" r="18" fill="#d97706" stroke="#0f172a" strokeWidth="3" />
              <ellipse cx="336" cy="58" rx="9" ry="7" fill="#f8fafc" />
              {/* Eyes & Nose */}
              <circle cx="329" cy="48" r="3.5" fill="#0f172a" />
              <circle cx="330" cy="47" r="1.2" fill="#ffffff" />
              <circle cx="343" cy="48" r="3.5" fill="#0f172a" />
              <circle cx="344" cy="47" r="1.2" fill="#ffffff" />
              <ellipse cx="336" cy="55" rx="3.5" ry="2.5" fill="#0f172a" />
              {/* Pink Tongue */}
              <path d="M 335 59 Q 336 66 338 65 Q 339 59 337 59 Z" fill="#f43f5e" stroke="#0f172a" strokeWidth="1" />
              {/* Paws on title */}
              <rect x="322" y="80" width="12" height="9" rx="4" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
              <rect x="341" y="80" width="12" height="9" rx="4" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
            </g>

            {/* --- 6. MAYA LIN (Principal UI/UX Designer) --- */}
            <g
              id="maya-designer"
              onClick={() => soundSfx('chime')}
              style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
              className="hover:opacity-90"
            >
              <title>Maya Lin (UI/UX Lead) - "Designing 16-bit pixel perfection!"</title>
              {/* Dark Bun & Cyan Pin */}
              <circle cx="388" cy="36" r="10" fill="#020617" />
              <circle cx="382" cy="34" r="3.5" fill="#00f0ff" />
              {/* Head */}
              <circle cx="388" cy="48" r="17" fill="#fed7aa" stroke="#0f172a" strokeWidth="3" />
              <path d="M 374 44 Q 388 32 402 44 Z" fill="#020617" />
              {/* Eyes */}
              <circle cx="382" cy="48" r="3" fill="#0f172a" />
              <circle cx="394" cy="48" r="3" fill="#0f172a" />
              <path d="M 385 55 Q 388 57 391 55" fill="none" stroke="#0f172a" strokeWidth="2" />
              {/* Purple Designer Top */}
              <path d="M 374 65 Q 388 60 402 65 L 404 84 L 372 84 Z" fill="#db2777" stroke="#0f172a" strokeWidth="3" />
              {/* Hands resting on title */}
              <circle cx="378" cy="83" r="5.5" fill="#fed7aa" stroke="#0f172a" strokeWidth="2.5" />
              <circle cx="398" cy="83" r="5.5" fill="#fed7aa" stroke="#0f172a" strokeWidth="2.5" />
            </g>
          </svg>
        </div>

        {/* Clean, Crisp 3D Pixel Art Logo Title (Readable, High Contrast) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            filter: 'drop-shadow(0 8px 16px rgba(15, 23, 42, 0.45))',
          }}
        >
          {/* Main "AVERO" Title */}
          <h1
            style={{
              fontSize: 'clamp(42px, 6.8vw, 70px)',
              fontWeight: 700,
              margin: 0,
              padding: 0,
              letterSpacing: '3px',
              color: '#38bdf8',
              WebkitTextStroke: '2px #0f172a',
              textShadow: `
                0 4px 0 #0284c7,
                0 8px 0 #0f172a,
                2px 2px 0 #0f172a,
                -2px -2px 0 #0f172a,
                2px -2px 0 #0f172a,
                -2px 2px 0 #0f172a
              `,
              textAlign: 'center',
              lineHeight: 1.1,
            }}
          >
            AVERO
          </h1>

          {/* Subtitle "AI VIRTUAL OFFICE" - Bright, High-Contrast Golden Yellow */}
          <div
            style={{
              fontSize: 'clamp(14px, 2.2vw, 20px)',
              fontWeight: 700,
              letterSpacing: '3px',
              color: '#fef08a',
              WebkitTextStroke: '1px #0f172a',
              textShadow: `
                0 3px 0 #d97706,
                0 5px 0 #0f172a,
                1px 1px 0 #0f172a,
                -1px -1px 0 #0f172a
              `,
              textAlign: 'center',
              marginTop: '8px',
            }}
          >
            AI VIRTUAL OFFICE
          </div>
        </div>

        {/* Subtitle Pill Banner */}
        <div
          style={{
            marginTop: '16px',
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(8px)',
            border: '2px solid #00f0ff',
            borderRadius: '999px',
            padding: '8px 22px',
            boxShadow: '0 4px 14px rgba(0, 240, 255, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
            fontWeight: 400,
            color: '#00f0ff',
            letterSpacing: '0.5px',
            pointerEvents: 'auto',
          }}
        >
          <span>AUTONOMOUS TECH WORKFORCE • DYLAN RAMOS HQ</span>
        </div>

        {/* 8-Bit Retro Audio Prompt & Live Equalizer Badge */}
        <div
          onClick={() => {
            if (!bgmPlaying) {
              startArcadeBgm(0.14);
              setBgmPlaying(true);
              playArcadeSfx('coin');
            } else {
              playArcadeSfx('coin');
            }
          }}
          onMouseEnter={() => playArcadeSfx('hover', 0.08)}
          style={{
            marginTop: '10px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '8px',
            color: bgmPlaying ? '#34d399' : '#fef08a',
            background: 'rgba(15, 23, 42, 0.88)',
            border: '1.5px solid',
            borderColor: bgmPlaying ? 'rgba(52, 211, 153, 0.5)' : 'rgba(254, 240, 138, 0.5)',
            borderRadius: '999px',
            padding: '6px 14px',
            letterSpacing: '0.5px',
            pointerEvents: 'auto',
            boxShadow: bgmPlaying ? '0 0 10px rgba(52, 211, 153, 0.25)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '9px' }}>
            <span className={bgmPlaying ? 'eq-bar eq-bar-1' : 'eq-bar eq-bar-static'} />
            <span className={bgmPlaying ? 'eq-bar eq-bar-2' : 'eq-bar eq-bar-static'} />
            <span className={bgmPlaying ? 'eq-bar eq-bar-3' : 'eq-bar eq-bar-static'} />
          </div>
          <span>{bgmPlaying ? 'CHIPTUNE BGM PLAYING' : 'CLICK ANYWHERE FOR 8-BIT GAME SOUND'}</span>
        </div>

        {/* =========================================================================
            4. ACTION BUTTONS (PLAY, Roster, Stats)
            ========================================================================= */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            marginTop: '22px',
            pointerEvents: 'auto',
          }}
        >
          {/* Primary Golden "▶ ENTER HQ" Button */}
          <button
            onClick={handleOpenPasswordModal}
            style={{
              background: 'linear-gradient(180deg, #fef08a 0%, #facc15 50%, #eab308 100%)',
              border: '4px solid #0f172a',
              borderRadius: '16px',
              padding: '16px 52px',
              fontSize: 'clamp(14px, 2.2vw, 22px)',
              fontWeight: 700,
              fontFamily: "'Press Start 2P', monospace",
              color: '#0f172a',
              cursor: 'pointer',
              letterSpacing: '2px',
              boxShadow: '0 6px 0 #854d0e, 0 10px 20px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transform: 'translateY(0)',
              transition: 'transform 0.08s ease, box-shadow 0.08s ease',
            }}
            onMouseEnter={(e) => {
              playArcadeSfx('hover', 0.1);
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 0 #854d0e, 0 14px 24px rgba(0, 0, 0, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 6px 0 #854d0e, 0 10px 20px rgba(0, 0, 0, 0.35)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(3px)';
              e.currentTarget.style.boxShadow = '0 2px 0 #854d0e, 0 4px 10px rgba(0, 0, 0, 0.2)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
          >
            <span style={{ fontSize: '1.1em' }}>▶</span>
            <span>ENTER HQ</span>
          </button>

          {/* Secondary Buttons Row: [TECH ROSTER] & [TECH STATS] */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* Pink Button: Tech Roster */}
            <button
              onClick={() => {
                soundSfx('open');
                setShowRosterModal(true);
              }}
              onMouseEnter={() => playArcadeSfx('hover', 0.08)}
              style={{
                background: 'linear-gradient(180deg, #fbcfe8 0%, #f472b6 60%, #ec4899 100%)',
                border: '3px solid #0f172a',
                borderRadius: '12px',
                padding: '11px 22px',
                fontSize: 'clamp(9px, 1.2vw, 11px)',
                fontWeight: 700,
                fontFamily: "'Press Start 2P', monospace",
                color: '#0f172a',
                cursor: 'pointer',
                letterSpacing: '0.8px',
                boxShadow: '0 4px 0 #9d174d, 0 6px 14px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'translateY(0)',
                transition: 'transform 0.08s ease',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(2px)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <span>TECH ROSTER</span>
            </button>

            {/* Cyan Button: Tech Stats */}
            <button
              onClick={() => {
                soundSfx('open');
                setShowStatusModal(true);
              }}
              onMouseEnter={() => playArcadeSfx('hover', 0.08)}
              style={{
                background: 'linear-gradient(180deg, #bae6fd 0%, #38bdf8 60%, #0284c7 100%)',
                border: '3px solid #0f172a',
                borderRadius: '12px',
                padding: '11px 22px',
                fontSize: 'clamp(9px, 1.2vw, 11px)',
                fontWeight: 700,
                fontFamily: "'Press Start 2P', monospace",
                color: '#0f172a',
                cursor: 'pointer',
                letterSpacing: '0.8px',
                boxShadow: '0 4px 0 #0369a1, 0 6px 14px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'translateY(0)',
                transition: 'transform 0.08s ease',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(2px)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <span>TECH STATS</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          5. FOOTER CREDITS (Matching Reference Bottom Credits)
          ========================================================================= */}
      <footer
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '14px 24px',
          textAlign: 'center',
          fontSize: '9px',
          fontWeight: 800,
          color: '#ffffff',
          letterSpacing: '0.8px',
          textShadow: '0 2px 4px rgba(15, 23, 42, 0.95), 1px 0 0 #0f172a, -1px 0 0 #0f172a, 0 1px 0 #0f172a, 0 -1px 0 #0f172a',
          marginBottom: '6px',
        }}
      >
        AVERO TECHNOLOGIES INC. • FOUNDED BY DYLAN RAMOS • AUTONOMOUS AI AGENT HQ
      </footer>

      {/* =========================================================================
          6. MODAL 1: PASSWORD & CLEARANCE GATE TERMINAL
          ========================================================================= */}
      {showPasswordModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(10, 15, 29, 0.82)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSuccess) {
              soundSfx('click');
              setShowPasswordModal(false);
            }
          }}
        >
          <div
            className={shake ? 'retro-shake-anim' : ''}
            style={{
              background: '#0f172a',
              border: isSuccess ? '3.5px solid #10b981' : errorMsg ? '3.5px solid #ef4444' : '3.5px solid #00f0ff',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '460px',
              width: '100%',
              boxShadow: isSuccess
                ? '0 0 32px rgba(16, 185, 129, 0.6), inset 0 0 16px rgba(16, 185, 129, 0.2)'
                : '0 16px 40px rgba(0, 0, 0, 0.7), 0 0 24px rgba(0, 240, 255, 0.35)',
              color: '#f8fafc',
              position: 'relative',
            }}
          >
            {/* Header Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f0ff', fontSize: '11px' }}>
                <IconLock size={16} color="#00f0ff" />
                <span>AVERO CLEARANCE</span>
              </div>
              <button
                onClick={() => {
                  soundSfx('click');
                  setShowPasswordModal(false);
                }}
                disabled={isSuccess}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '12px',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '9px', lineHeight: 1.7, color: '#cbd5e1', marginBottom: '20px' }}>
              Restricted workspace for <strong style={{ color: '#ffbe0b' }}>AVERO & Dylan Ramos</strong>. Enter passcode to access the 3D Virtual Office.
            </p>

            <form onSubmit={handlePasswordSubmit}>
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  onKeyDown={() => {
                    if (soundEnabled) playArcadeSfx('key', 0.08);
                  }}
                  placeholder="ENTER PASSCODE..."
                  disabled={isSuccess}
                  style={{
                    width: '100%',
                    background: '#020617',
                    border: '2px solid #334155',
                    borderRadius: '8px',
                    padding: '14px 44px 14px 14px',
                    fontSize: '11px',
                    fontFamily: "'Press Start 2P', monospace",
                    color: '#f8fafc',
                    outline: 'none',
                    letterSpacing: '1px',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#00f0ff')}
                  onBlur={(e) => (e.target.style.borderColor = '#334155')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '4px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '8px',
                    fontFamily: "'Press Start 2P', monospace",
                    padding: '4px 6px',
                  }}
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>

              {/* Error or Success notification */}
              {errorMsg && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#f87171',
                    fontSize: '8px',
                    marginBottom: '14px',
                    lineHeight: 1.5,
                  }}
                >
                  <IconAlertTriangle size={14} color="#f87171" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {isSuccess && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#34d399',
                    fontSize: '8px',
                    marginBottom: '14px',
                    lineHeight: 1.5,
                  }}
                >
                  <IconCheck size={14} color="#34d399" />
                  <span>CLEARANCE GRANTED! WELCOME BACK DYLAN RAMOS!</span>
                </div>
              )}

              {/* Remember Me Option */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '8px',
                  color: '#94a3b8',
                  marginBottom: '20px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#00f0ff', cursor: 'pointer' }}
                />
                <span>Remember access on this browser</span>
              </label>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={isSubmitting || isSuccess}
                  style={{
                    width: '100%',
                    background: isSuccess ? '#10b981' : isSubmitting ? '#94a3b8' : '#facc15',
                    border: '3px solid #0f172a',
                    borderRadius: '10px',
                    padding: '14px',
                    fontSize: '11px',
                    fontFamily: "'Press Start 2P', monospace",
                    color: '#0f172a',
                    cursor: isSubmitting || isSuccess ? 'default' : 'pointer',
                    boxShadow: '0 4px 0 #78350f',
                    letterSpacing: '1px',
                    opacity: isSubmitting ? 0.75 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isSubmitting
                    ? 'VERIFYING PASSCODE...'
                    : isSuccess
                    ? 'CLEARANCE CONFIRMED ▶'
                    : 'UNLOCK OFFICE ▶'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. MODAL 2: TEAM ROSTER MODAL
          ========================================================================= */}
      {showRosterModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(10, 15, 29, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              soundSfx('click');
              setShowRosterModal(false);
            }
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '3.5px solid #f472b6',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7), 0 0 24px rgba(244, 114, 182, 0.35)',
              color: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f472b6', fontSize: '11px' }}>
                <span>AVERO HQ TEAM ROSTER</span>
              </div>
              <button
                onClick={() => {
                  soundSfx('click');
                  setShowRosterModal(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {/* Dylan */}
              <div style={{ background: '#1e293b', border: '1.5px solid #ffbe0b', borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ padding: '3px 6px', background: '#3b2f05', border: '1px solid #ffbe0b', borderRadius: '4px', color: '#ffbe0b', fontSize: '8px' }}>CEO</span>
                  <div>
                    <div style={{ color: '#ffbe0b', fontSize: '10px' }}>Dylan Ramos</div>
                    <div style={{ color: '#94a3b8', fontSize: '7.5px' }}>Founder & CEO</div>
                  </div>
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '7.5px', lineHeight: 1.5 }}>
                  Visionary leadership, roadmap, sprint directives & CEO Suite executive command.
                </div>
              </div>

              {/* Eah */}
              <div style={{ background: '#1e293b', border: '1.5px solid #f43f5e', borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ padding: '3px 6px', background: '#3b0b1f', border: '1px solid #f43f5e', borderRadius: '4px', color: '#fb7185', fontSize: '8px' }}>VP</span>
                  <div>
                    <div style={{ color: '#fb7185', fontSize: '10px' }}>Eah</div>
                    <div style={{ color: '#94a3b8', fontSize: '7.5px' }}>Executive Partner & Host</div>
                  </div>
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '7.5px', lineHeight: 1.5 }}>
                  Executive briefings, team morale, iPad nook beside Dylan & gourmet breakfast chef.
                </div>
              </div>

              {/* Alex */}
              <div style={{ background: '#1e293b', border: '1.5px solid #f97316', borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ padding: '3px 6px', background: '#3b1805', border: '1px solid #ea580c', borderRadius: '4px', color: '#fb923c', fontSize: '8px' }}>DEV</span>
                  <div>
                    <div style={{ color: '#fb923c', fontSize: '10px' }}>Alex Rivera</div>
                    <div style={{ color: '#94a3b8', fontSize: '7.5px' }}>Senior Fullstack Dev</div>
                  </div>
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '7.5px', lineHeight: 1.5 }}>
                  Next.js 15, TypeScript architecture, API routes & database schemas.
                </div>
              </div>

              {/* Maya */}
              <div style={{ background: '#1e293b', border: '1.5px solid #ec4899', borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ padding: '3px 6px', background: '#3b0d2b', border: '1px solid #ec4899', borderRadius: '4px', color: '#f472b6', fontSize: '8px' }}>UX</span>
                  <div>
                    <div style={{ color: '#f472b6', fontSize: '10px' }}>Maya Lin</div>
                    <div style={{ color: '#94a3b8', fontSize: '7.5px' }}>Principal UI/UX Designer</div>
                  </div>
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '7.5px', lineHeight: 1.5 }}>
                  Pixel-perfect UI design, modern color palettes, wireframes & Figma prototypes.
                </div>
              </div>

              {/* Wendy */}
              <div style={{ background: '#1e293b', border: '1.5px solid #c084fc', borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ padding: '3px 6px', background: '#29104d', border: '1px solid #c084fc', borderRadius: '4px', color: '#c084fc', fontSize: '8px' }}>MKT</span>
                  <div>
                    <div style={{ color: '#c084fc', fontSize: '10px' }}>Wendy Cruz</div>
                    <div style={{ color: '#94a3b8', fontSize: '7.5px' }}>Marketing Strategist</div>
                  </div>
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '7.5px', lineHeight: 1.5 }}>
                  Viral product launches, brand voice, content campaigns & socials.
                </div>
              </div>

              {/* Ray */}
              <div style={{ background: '#1e293b', border: '1.5px solid #38bdf8', borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ padding: '3px 6px', background: '#082f49', border: '1px solid #38bdf8', borderRadius: '4px', color: '#38bdf8', fontSize: '8px' }}>AI</span>
                  <div>
                    <div style={{ color: '#38bdf8', fontSize: '10px' }}>Ray Chen</div>
                    <div style={{ color: '#94a3b8', fontSize: '7.5px' }}>Senior AI Researcher</div>
                  </div>
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '7.5px', lineHeight: 1.5 }}>
                  LLM benchmarks, RAG architectures, model evaluations & tech intelligence.
                </div>
              </div>

              {/* Zane */}
              <div style={{ background: '#1e293b', border: '1.5px solid #22c55e', borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ padding: '3px 6px', background: '#052e16', border: '1px solid #22c55e', borderRadius: '4px', color: '#4ade80', fontSize: '8px' }}>SEC</span>
                  <div>
                    <div style={{ color: '#4ade80', fontSize: '10px' }}>Zane Thorne</div>
                    <div style={{ color: '#94a3b8', fontSize: '7.5px' }}>Lead Cybersecurity</div>
                  </div>
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '7.5px', lineHeight: 1.5 }}>
                  Zero-Trust vault security, penetration audits, DDoS protection & server telemetry.
                </div>
              </div>

              {/* Mochi */}
              <div style={{ background: '#1e293b', border: '1.5px solid #f59e0b', borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ padding: '3px 6px', background: '#451a03', border: '1px solid #f59e0b', borderRadius: '4px', color: '#fbbf24', fontSize: '8px' }}>PET</span>
                  <div>
                    <div style={{ color: '#fbbf24', fontSize: '10px' }}>Mochi</div>
                    <div style={{ color: '#94a3b8', fontSize: '7.5px' }}>Chief Morale Officer</div>
                  </div>
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '7.5px', lineHeight: 1.5 }}>
                  Lounge circuit patrol, tail wagging, puppy kisses & happiness ambassador.
                </div>
              </div>

              {/* Snowy */}
              <div style={{ background: '#1e293b', border: '1.5px solid #38bdf8', borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ padding: '3px 6px', background: '#082f49', border: '1px solid #38bdf8', borderRadius: '4px', color: '#38bdf8', fontSize: '8px' }}>PET</span>
                  <div>
                    <div style={{ color: '#38bdf8', fontSize: '10px' }}>Snowy</div>
                    <div style={{ color: '#94a3b8', fontSize: '7.5px' }}>Executive Purr Officer</div>
                  </div>
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '7.5px', lineHeight: 1.5 }}>
                  Pure white fur, velvet basket naps, sisal scratching perch, soft headbonks & cozy purrs.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          8. MODAL 3: HQ TELEMETRY / STATUS MODAL
          ========================================================================= */}
      {showStatusModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(10, 15, 29, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              soundSfx('click');
              setShowStatusModal(false);
            }
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '3.5px solid #38bdf8',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7), 0 0 24px rgba(56, 189, 248, 0.35)',
              color: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '11px' }}>
                <span>AVERO HQ SYSTEM TELEMETRY</span>
              </div>
              <button
                onClick={() => {
                  soundSfx('click');
                  setShowStatusModal(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#1e293b', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>SYSTEM CORE</span>
                <span style={{ color: '#34d399' }}>● 100% OPERATIONAL</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#1e293b', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>AI ENGINE</span>
                <span style={{ color: '#38bdf8' }}>GEMINI 2.0 MULTI-AGENT</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#1e293b', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>ACTIVE SQUAD</span>
                <span style={{ color: '#facc15' }}>8 SPECIALISTS ONLINE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#1e293b', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>MEETING ROOM PRIVACY</span>
                <span style={{ color: '#a78bfa' }}>100% SOLID ACOUSTIC WALLS</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#1e293b', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>OFFICE ZONES</span>
                <span style={{ color: '#38bdf8' }}>6 SPECIALIZED SUITES</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#1e293b', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>OFFICE PETS</span>
                <span style={{ color: '#38bdf8' }}>2 PETS ON DUTY (MOCHI & SNOWY)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#1e293b', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>CLEARANCE LEVEL</span>
                <span style={{ color: '#fb7185' }}>FOUNDER (DYLAN RAMOS)</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowStatusModal(false);
                handleOpenPasswordModal();
              }}
              style={{
                width: '100%',
                marginTop: '18px',
                background: '#38bdf8',
                border: '2px solid #0f172a',
                borderRadius: '8px',
                padding: '12px',
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '9px',
                color: '#0f172a',
                cursor: 'pointer',
              }}
            >
              PROCEED TO CLEARANCE ▶
            </button>
          </div>
        </div>
      )}

      {/* CSS Keyframes Animation Styles for Clouds and Shake */}
      <style jsx>{`
        @keyframes cloudFloat1 {
          0% {
            transform: translateX(-15%);
          }
          100% {
            transform: translateX(115%);
          }
        }
        @keyframes cloudFloat2 {
          0% {
            transform: translateX(-25%);
          }
          100% {
            transform: translateX(120%);
          }
        }
        @keyframes cloudFloat3 {
          0% {
            transform: translateX(-20%);
          }
          100% {
            transform: translateX(110%);
          }
        }
        .pixel-cloud-1 {
          animation: cloudFloat1 68s linear infinite;
        }
        .pixel-cloud-2 {
          animation: cloudFloat2 92s linear infinite;
        }
        .pixel-cloud-3 {
          animation: cloudFloat3 80s linear infinite;
        }
        @keyframes shakeError {
          0%,
          100% {
            transform: translateX(0);
          }
          20%,
          60% {
            transform: translateX(-10px);
          }
          40%,
          80% {
            transform: translateX(10px);
          }
        }
        .retro-shake-anim {
          animation: shakeError 0.4s ease-in-out;
        }

        /* Equalizer Bouncing Bars for 8-Bit BGM */
        .eq-bar {
          display: inline-block;
          width: 2.5px;
          background: currentColor;
          border-radius: 1px;
        }
        .eq-bar-static {
          height: 3px;
          opacity: 0.5;
        }
        @keyframes eqBounce1 {
          0%, 100% { height: 3px; }
          50% { height: 11px; }
        }
        @keyframes eqBounce2 {
          0%, 100% { height: 9px; }
          50% { height: 4px; }
        }
        @keyframes eqBounce3 {
          0%, 100% { height: 5px; }
          50% { height: 12px; }
        }
        @keyframes eqBounce4 {
          0%, 100% { height: 11px; }
          50% { height: 3px; }
        }
        .eq-bar-1 { animation: eqBounce1 0.35s ease-in-out infinite; }
        .eq-bar-2 { animation: eqBounce2 0.28s ease-in-out infinite; }
        .eq-bar-3 { animation: eqBounce3 0.42s ease-in-out infinite; }
        .eq-bar-4 { animation: eqBounce4 0.32s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
