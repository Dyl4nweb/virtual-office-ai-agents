'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  IconServer,
  IconShield,
  IconZap,
  IconActivity,
  IconDatabase,
  IconCpu,
  IconTerminal,
  IconLock,
  IconCheckCircle,
  IconAlertTriangle,
  IconRefreshCw,
  IconX,
  IconFlame,
} from '@/components/Icons';

export interface ServerRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuditFinished?: (report: string) => void;
}

interface RackStatus {
  id: string;
  name: string;
  role: string;
  uptime: string;
  load: number;
  temp: number;
  status: 'ONLINE' | 'ACTIVE' | 'SECURE';
  specs: string;
}

export default function ServerRoomModal({
  isOpen,
  onClose,
  onAuditFinished,
}: ServerRoomModalProps) {
  const [isAuditing, setIsAuditing] = useState(false);
  const [isOverclocked, setIsOverclocked] = useState(false);
  const [auditStep, setAuditStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([
    '[INIT] Mainframe OS v4.2.0-STABLE booted successfully.',
    '[NET] 100Gbps InfiniBand switch active across 4 server cabinets.',
    '[SEC] Zane Zero-Trust IDS active • 0 unauthenticated packets.',
    '[GPU] 16x RTX 4090 blades synced with Gemini AI inference pipelines.',
    '[READY] System running at 99.99% efficiency. Ready for commands.',
  ]);
  const [racks, setRacks] = useState<RackStatus[]>([
    {
      id: 'rack-1',
      name: 'PROD-DB-CLUSTER',
      role: 'PostgreSQL 16 HA & Redis Caching',
      uptime: '99.99%',
      load: 34,
      temp: 18.2,
      status: 'ONLINE',
      specs: '128 Cores • 1TB ECC RAM • NVMe RAID-10',
    },
    {
      id: 'rack-2',
      name: 'AI-GPU-MAINFRAME-A',
      role: 'Alex & Maya Neural Code Synthesis',
      uptime: '99.98%',
      load: 72,
      temp: 24.5,
      status: 'ACTIVE',
      specs: '8x RTX 4090 • 192GB VRAM • 3,450 tok/s',
    },
    {
      id: 'rack-3',
      name: 'AI-GPU-MAINFRAME-B',
      role: 'Wendy & Ray Live RAG & Content Matrix',
      uptime: '99.97%',
      load: 68,
      temp: 23.8,
      status: 'ACTIVE',
      specs: '8x RTX 4090 • 192GB VRAM • 4,120 tok/s',
    },
    {
      id: 'rack-4',
      name: 'ZERO-TRUST-SECURITY-VAULT',
      role: "Zane's Threat Detection & Encryption Engine",
      uptime: '100.0%',
      load: 21,
      temp: 16.9,
      status: 'SECURE',
      specs: 'Hardware HSM • SHA-256 Zero-Trust Gateway',
    },
  ]);

  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollTop = terminalBottomRef.current.scrollHeight;
    }
  }, [logs]);

  // Audio synthesis for sci-fi cyber sound effects
  const playCyberSfx = (type: 'beep' | 'scan' | 'turbo' | 'success') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'beep') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.08);
      } else if (type === 'scan') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(960, now + 0.18);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.22);
      } else if (type === 'turbo') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.4);
      } else if (type === 'success') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.09);
        osc.frequency.setValueAtTime(783.99, now + 0.18);
        osc.frequency.setValueAtTime(1046.5, now + 0.27);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.5);
      }
    } catch {}
  };

  // Perform Deep Security Audit
  const handleRunAudit = () => {
    if (isAuditing) return;
    setIsAuditing(true);
    setAuditStep(1);
    playCyberSfx('scan');

    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] [AUDIT_START] Initiating Zero-Trust Security Audit across all 4 cabinets...`]);

    setTimeout(() => {
      setAuditStep(2);
      playCyberSfx('scan');
      setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] [RACK_1] Verifying Postgres WAL replica & TLS certs: 100% OK.`]);
    }, 800);

    setTimeout(() => {
      setAuditStep(3);
      playCyberSfx('scan');
      setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] [RACK_2/3] Checking 16x RTX 4090 tensor weights integrity: UNTAMPERED.`]);
    }, 1600);

    setTimeout(() => {
      setAuditStep(4);
      playCyberSfx('scan');
      setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] [RACK_4] Zane Threat Firewall active. Intrusions detected: 0. IP tables refreshed.`]);
    }, 2400);

    setTimeout(() => {
      setIsAuditing(false);
      setAuditStep(0);
      playCyberSfx('success');
      const completionMsg = `[${new Date().toLocaleTimeString()}] [AUDIT_COMPLETE] ALL 4 RACKS CERTIFIED SECURE. Enterprise SOC-2 Grade Achieved!`;
      setLogs((prev) => [...prev, completionMsg]);
      if (onAuditFinished) {
        onAuditFinished(completionMsg);
      }
    }, 3200);
  };

  // Toggle Overclock Turbo Mode
  const handleToggleOverclock = () => {
    const nextState = !isOverclocked;
    setIsOverclocked(nextState);
    playCyberSfx('turbo');

    if (nextState) {
      setRacks((prev) =>
        prev.map((r) =>
          r.id.includes('gpu')
            ? { ...r, load: Math.min(98, r.load + 22), temp: +(r.temp + 5.2).toFixed(1) }
            : r
        )
      );
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [TURBO_ENGAGED] GPU AI Mainframe overclocked to 2.85GHz! Token throughput +38%.`,
      ]);
    } else {
      setRacks((prev) =>
        prev.map((r) =>
          r.id.includes('gpu')
            ? { ...r, load: Math.max(50, r.load - 22), temp: +(r.temp - 5.2).toFixed(1) }
            : r
        )
      );
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [TURBO_NORMAL] Clock speeds reverted to baseline power-efficient curves.`,
      ]);
    }
  };

  // Flush VRAM & Buffer
  const handleFlushCache = () => {
    playCyberSfx('beep');
    setRacks((prev) =>
      prev.map((r) => ({
        ...r,
        load: Math.max(15, Math.floor(r.load * 0.6)),
      }))
    );
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] [CACHE_FLUSH] Purged 24.6GB inactive tensor buffers. Query latency dropped to 0.18ms!`,
    ]);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(9, 14, 28, 0.98))',
          border: '1px solid rgba(0, 245, 155, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 245, 155, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f8fafc',
          fontFamily: "'Fira Code', monospace",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header Bar */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(0, 245, 155, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 245, 155, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(0, 245, 155, 0.15)',
                border: '1px solid #00f59b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00f59b',
              }}
            >
              <IconServer size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    color: '#f1f5f9',
                  }}
                >
                  HIGH-TECH CYBER SECURITY & MAINFRAME VAULT
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'rgba(0, 245, 155, 0.18)',
                    color: '#00f59b',
                    border: '1px solid rgba(0, 245, 155, 0.4)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <IconShield size={10} /> ZERO-TRUST ACTIVE
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Zone 6 • Supervised by Zane & Alex • 42U Enterprise Infrastructure
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Metrics Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
            }}
          >
            {racks.map((rack, idx) => {
              const isTargeted = isAuditing && auditStep === idx + 1;
              return (
                <div
                  key={rack.id}
                  style={{
                    background: isTargeted
                      ? 'rgba(0, 245, 155, 0.14)'
                      : 'rgba(15, 23, 42, 0.7)',
                    border: isTargeted
                      ? '1px solid #00f59b'
                      : '1px solid rgba(148, 163, 184, 0.18)',
                    borderRadius: '12px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    position: 'relative',
                    transition: 'all 0.25s ease',
                    boxShadow: isTargeted ? '0 0 16px rgba(0, 245, 155, 0.3)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                        {rack.name}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                        {rack.role}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background:
                          rack.status === 'SECURE'
                            ? 'rgba(56, 189, 248, 0.2)'
                            : 'rgba(34, 197, 94, 0.2)',
                        color: rack.status === 'SECURE' ? '#38bdf8' : '#4ade80',
                        border: `1px solid ${rack.status === 'SECURE' ? '#38bdf8' : '#22c55e'}`,
                        fontWeight: 700,
                      }}
                    >
                      {rack.status}
                    </span>
                  </div>

                  {/* Load progress bar */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '10px',
                        color: '#64748b',
                        marginBottom: '4px',
                      }}
                    >
                      <span>VRAM / Core Load</span>
                      <span style={{ color: rack.load > 80 ? '#fb7185' : '#00f59b', fontWeight: 600 }}>
                        {rack.load}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: '6px',
                        borderRadius: '999px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${rack.load}%`,
                          background:
                            rack.load > 80
                              ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                              : 'linear-gradient(90deg, #38bdf8, #00f59b)',
                          borderRadius: '999px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      color: '#94a3b8',
                      paddingTop: '6px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <span>Uptime: <strong style={{ color: '#e2e8f0' }}>{rack.uptime}</strong></span>
                    <span>Temp: <strong style={{ color: '#e2e8f0' }}>{rack.temp}°C</strong></span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Action Control Toolbar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
              padding: '14px',
              borderRadius: '12px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: isAuditing
                  ? 'rgba(0, 245, 155, 0.2)'
                  : 'linear-gradient(135deg, #00f59b, #059669)',
                color: isAuditing ? '#00f59b' : '#030712',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 18px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: isAuditing ? 'not-allowed' : 'pointer',
                boxShadow: isAuditing ? 'none' : '0 4px 14px rgba(0, 245, 155, 0.4)',
                transition: 'all 0.15s ease',
              }}
            >
              <IconShield size={16} />
              {isAuditing ? `AUDITING CABINETS [${auditStep}/4]...` : 'RUN ZERO-TRUST AUDIT'}
            </button>

            <button
              onClick={handleToggleOverclock}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: isOverclocked
                  ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                  : 'rgba(255, 255, 255, 0.06)',
                color: isOverclocked ? '#fff' : '#cbd5e1',
                border: isOverclocked ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '10px 18px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: isOverclocked ? '0 4px 14px rgba(245, 158, 11, 0.4)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <IconFlame size={16} />
              {isOverclocked ? 'GPU OVERCLOCK: 2.85GHz (ACTIVE)' : 'OVERCLOCK GPU CLUSTER'}
            </button>

            <button
              onClick={handleFlushCache}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#cbd5e1',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '10px 18px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <IconRefreshCw size={15} />
              FLUSH VRAM & CACHE
            </button>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#00f59b',
                  display: 'inline-block',
                  boxShadow: '0 0 8px #00f59b',
                }}
              />
              InfiniBand 100G Sync
            </div>
          </div>

          {/* Real-Time Cyber Terminal Console Log */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#94a3b8',
                marginBottom: '8px',
              }}
            >
              <IconTerminal size={14} color="#00f59b" />
              LIVE TELEMETRY & COMMAND EXECUTION LOG
            </div>
            <div
              ref={terminalBottomRef}
              style={{
                background: 'rgba(2, 6, 23, 0.85)',
                border: '1px solid rgba(0, 245, 155, 0.25)',
                borderRadius: '10px',
                padding: '14px 16px',
                height: '180px',
                overflowY: 'auto',
                fontSize: '11px',
                lineHeight: 1.6,
                color: '#38bdf8',
                fontFamily: "'Fira Code', 'Courier New', monospace",
                boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.8)',
              }}
            >
              {logs.map((log, lIdx) => (
                <div
                  key={lIdx}
                  style={{
                    color: log.includes('COMPLETE') || log.includes('OK') || log.includes('STABLE')
                      ? '#4ade80'
                      : log.includes('START') || log.includes('TURBO')
                      ? '#fbbf24'
                      : '#93c5fd',
                  }}
                >
                  {log}
                </div>
              ))}
              {isAuditing && (
                <div style={{ color: '#00f59b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>&gt; Processing neural checksums...</span>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '6px',
                      height: '12px',
                      background: '#00f59b',
                      animation: 'pulse 0.8s infinite',
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.3)',
            fontSize: '11px',
            color: '#64748b',
          }}
        >
          <div>
            Dylan Ramos Cyber Command • SOC-2 Level Compliant
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              borderRadius: '6px',
              padding: '6px 16px',
              fontSize: '11px',
              fontFamily: "'Press Start 2P', monospace",
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            DISMISS [ESC]
          </button>
        </div>
      </div>
    </div>
  );
}
