'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  IconZap,
  IconCode,
  IconPalette,
  IconMegaphone,
  IconSearch,
  IconShield,
  IconSparkles,
  IconTarget,
  IconCoffee,
  IconCrown,
  IconHeart,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconLock,
  IconLogOut,
  IconTrash,
  IconBroom,
  IconRocket,
  IconAward,
  IconArrowRight,
} from './Icons';


// ============================================================================
// TYPES
// ============================================================================
export interface AgentRecord {
  id: string;
  name: string;
  role: 'ceo' | 'manager' | 'researcher' | 'writer' | 'support' | 'designer' | 'developer' | 'data_analyst' | 'cloud_engineer' | 'cyber_sec';
  model: string;
  ai_trio?: {
    tier1: string;
    tier2: string;
    tier3: string;
  } | null;
  status: 'idle' | 'walking' | 'working' | 'talking';
  x: number;
  y: number;
  desk_x: number;
  desk_y: number;
  bubble_text: string;
  current_ticket_id: string | null;
  updated_at: string;
}

export interface TicketRecord {
  id: string;
  from_agent: string;
  to_agent: string;
  task: string;
  status: 'pending' | 'in_progress' | 'awaiting_approval' | 'review' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  payload: Record<string, any>;
  result: Record<string, any>;
  steps_taken: number;
  error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalRecord {
  id: string;
  ticket_id: string;
  agent: string;
  action_type: 'spend_money' | 'send_message' | 'delete_data';
  description: string;
  payload: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  resolved_at?: string | null;
}

export interface ActivityLogRecord {
  id: number;
  timestamp: string;
  agent: string;
  type: 'info' | 'handoff' | 'mistake' | 'error' | 'approval';
  message: string;
}

interface SidePanelProps {
  selectedAgentId?: string | null;
  onSelectAgent?: (id: string | null) => void;
  onOpenActionModal?: (id?: string) => void;
  onLock?: () => void;
}

const AGENT_META: Record<
  string,
  { name: string; title: string; color: string; border: string; bg: string }
> = {
  dylan: {
    name: 'Dylan Ramos',
    title: 'CEO & Founder',
    color: '#ffbe0b',
    border: 'rgba(255, 190, 11, 0.5)',
    bg: 'rgba(255, 190, 11, 0.12)',
  },
  eah: {
    name: 'Eah',
    title: "CEO's Girlfriend & Partner",
    color: '#f43f5e',
    border: 'rgba(244, 63, 94, 0.45)',
    bg: 'rgba(244, 63, 94, 0.12)',
  },
  alex: {
    name: 'Alex',
    title: 'Fullstack Dev & Architect',
    color: '#f97316',
    border: 'rgba(249, 115, 22, 0.45)',
    bg: 'rgba(249, 115, 22, 0.10)',
  },
  maya: {
    name: 'Maya',
    title: 'UI/UX & Product Designer',
    color: '#ec4899',
    border: 'rgba(236, 72, 153, 0.45)',
    bg: 'rgba(236, 72, 153, 0.10)',
  },
  wendy: {
    name: 'Wendy',
    title: 'Marketing Strategist',
    color: '#c084fc',
    border: 'rgba(192, 132, 252, 0.4)',
    bg: 'rgba(192, 132, 252, 0.08)',
  },
  ray: {
    name: 'Ray',
    title: 'AI & Market Researcher',
    color: '#38bdf8',
    border: 'rgba(56, 189, 248, 0.4)',
    bg: 'rgba(56, 189, 248, 0.08)',
  },
  zane: {
    name: 'Zane',
    title: 'Cybersecurity Specialist',
    color: '#22c55e',
    border: 'rgba(34, 197, 94, 0.45)',
    bg: 'rgba(34, 197, 94, 0.10)',
  },
};

export default function SidePanel({
  selectedAgentId,
  onSelectAgent,
  onOpenActionModal,
  onLock,
}: SidePanelProps) {
  // Office State
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [logs, setLogs] = useState<ActivityLogRecord[]>([]);
  const [killSwitch, setKillSwitch] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // UI Navigation & Filters
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTablet, setIsTablet] = useState<boolean>(false);
  const userManuallyToggled = useRef<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      const w = window.innerWidth;
      const mob = w <= 768;
      const tab = w > 768 && w <= 1100;
      setIsMobile(mob);
      setIsTablet(tab);
      if (!userManuallyToggled.current && (mob || tab)) {
        setIsCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const toggleHandler = () => {
      userManuallyToggled.current = true;
      setIsCollapsed((prev) => !prev);
    };
    window.addEventListener('office:toggle:sidebar', toggleHandler);
    return () => window.removeEventListener('office:toggle:sidebar', toggleHandler);
  }, []);

  const [activeTab, setActiveTab] = useState<'board' | 'agents' | 'logs'>('board');
  const [ticketFilter, setTicketFilter] = useState<'all' | 'active' | 'review' | 'completed'>('all');
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [autoScrollLogs, setAutoScrollLogs] = useState<boolean>(true);

  // Command Box State
  const [commandText, setCommandText] = useState<string>('');
  const [commandAgent, setCommandAgent] = useState<string>('alex');
  const [commandPriority, setCommandPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('high');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Sync selectedAgentId with commandAgent
  useEffect(() => {
    if (selectedAgentId && ['alex', 'maya', 'wendy', 'ray', 'zane', 'eah'].includes(selectedAgentId)) {
      setCommandAgent(selectedAgentId);
    }
  }, [selectedAgentId]);

  // 1. Initial State Fetch + SSE Real-Time Sync
  useEffect(() => {
    let isMounted = true;

    // Initial Fetch
    fetch('/api/state')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.agents) setAgents(data.agents);
        if (data.tickets) setTickets(data.tickets);
        if (data.approvals) setApprovals(data.approvals);
        if (data.logs) setLogs(data.logs);
        if (data.killSwitch !== undefined) setKillSwitch(data.killSwitch);
      })
      .catch((err) => console.error('[SidePanel] Initial fetch error:', err));

    // SSE Connection
    const sse = new EventSource('/api/stream');

    sse.onopen = () => {
      if (isMounted) setIsConnected(true);
    };

    sse.onerror = () => {
      if (isMounted) setIsConnected(false);
    };

    sse.addEventListener('office:state', (e: MessageEvent) => {
      if (!isMounted) return;
      try {
        const data = JSON.parse(e.data);
        if (data.agents) setAgents(data.agents);
        if (data.tickets) setTickets(data.tickets);
        if (data.approvals) setApprovals(data.approvals);
        if (data.logs) setLogs(data.logs);
        if (data.killSwitch !== undefined) setKillSwitch(data.killSwitch);
      } catch {}
    });

    sse.addEventListener('agent:status', (e: MessageEvent) => {
      if (!isMounted) return;
      try {
        const update = JSON.parse(e.data);
        setAgents((prev) =>
          prev.map((a) =>
            a.id === update.agentId
              ? {
                  ...a,
                  status: update.status !== undefined ? update.status : a.status,
                  bubble_text: update.bubbleText !== undefined ? update.bubbleText : a.bubble_text,
                  current_ticket_id:
                    update.current_ticket_id !== undefined ? update.current_ticket_id : a.current_ticket_id,
                }
              : a
          )
        );
      } catch {}
    });

    sse.addEventListener('ticket:created', (e: MessageEvent) => {
      if (!isMounted) return;
      try {
        const newTicket = JSON.parse(e.data);
        setTickets((prev) => [newTicket, ...prev.filter((t) => t.id !== newTicket.id)]);
      } catch {}
    });

    sse.addEventListener('ticket:updated', (e: MessageEvent) => {
      if (!isMounted) return;
      try {
        const updatedTicket = JSON.parse(e.data);
        setTickets((prev) =>
          prev.map((t) => (t.id === updatedTicket.id ? { ...t, ...updatedTicket } : t))
        );
      } catch {}
    });

    sse.addEventListener('approval:requested', (e: MessageEvent) => {
      if (!isMounted) return;
      try {
        const newApproval = JSON.parse(e.data);
        setApprovals((prev) => [newApproval, ...prev.filter((a) => a.id !== newApproval.id)]);
      } catch {}
    });

    sse.addEventListener('approval:resolved', (e: MessageEvent) => {
      if (!isMounted) return;
      try {
        const resolved = JSON.parse(e.data);
        setApprovals((prev) => prev.filter((a) => a.id !== resolved.id));
      } catch {}
    });

    sse.addEventListener('activity:log', (e: MessageEvent) => {
      if (!isMounted) return;
      try {
        const log = JSON.parse(e.data);
        setLogs((prev) => [log, ...prev].slice(0, 100));
      } catch {}
    });

    sse.addEventListener('killswitch:state', (e: MessageEvent) => {
      if (!isMounted) return;
      try {
        const ks = JSON.parse(e.data);
        setKillSwitch(ks.active);
      } catch {}
    });

    return () => {
      isMounted = false;
      sse.close();
    };
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (activeTab === 'logs' && autoScrollLogs && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab, autoScrollLogs]);

  // Flash action notification message
  const flashMessage = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3000);
  };

  // 2. Dispatch Directive Command
  const handleSendCommand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commandText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: commandText.trim(),
          to_agent: commandAgent,
          priority: commandPriority,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to dispatch command');
      }

      const data = await res.json();
      setCommandText('');
      flashMessage(`Directive dispatched to ${commandAgent.toUpperCase()}!`);
      if (data.ticket) {
        setTickets((prev) => [data.ticket, ...prev.filter((t) => t.id !== data.ticket.id)]);
      }
    } catch (err: any) {
      flashMessage(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Resolve Human Approval Gateway
  const handleResolveApproval = async (approvalId: string, action: 'approved' | 'rejected') => {
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval_id: approvalId, action }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Approval resolution failed');
      }

      setApprovals((prev) => prev.filter((a) => a.id !== approvalId));
      flashMessage(`Action ${action === 'approved' ? 'APPROVED' : 'REJECTED'}`);
    } catch (err: any) {
      flashMessage(`Approval error: ${err.message}`);
    }
  };

  // 4. Toggle Emergency Killswitch
  const handleToggleKillSwitch = async () => {
    const nextState = !killSwitch;
    try {
      const res = await fetch('/api/killswitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextState }),
      });
      if (!res.ok) throw new Error('Failed to toggle kill switch');
      const data = await res.json();
      setKillSwitch(data.killSwitch);
      flashMessage(`Killswitch ${data.killSwitch ? 'ACTIVATED' : 'DEACTIVATED'}`);
    } catch (err: any) {
      flashMessage(`Killswitch error: ${err.message}`);
    }
  };

  // 5. Delete and Clear Tasks / Logs
  const handleDeleteTicket = async (ticketId: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    flashMessage(`Deleted task ${ticketId.slice(0, 10)}...`);

    try {
      const res = await fetch(`/api/tickets?id=${encodeURIComponent(ticketId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete task');
      }
    } catch (err: any) {
      flashMessage(`Delete error: ${err.message}`);
    }
  };

  const handleClearCompletedTickets = async () => {
    setTickets((prev) => prev.filter((t) => t.status !== 'completed' && t.status !== 'failed'));
    flashMessage('Cleared completed & failed tasks!');

    try {
      const res = await fetch('/api/tickets?scope=completed', {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to clear completed tasks');
      }
    } catch (err: any) {
      flashMessage(`Clear error: ${err.message}`);
    }
  };

  const handleClearAllTickets = async () => {
    if (!window.confirm('Are you sure you want to delete ALL tasks in the office?')) return;
    setTickets([]);
    flashMessage('Cleared all office tasks!');

    try {
      const res = await fetch('/api/tickets?scope=all', {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to clear all tasks');
      }
    } catch (err: any) {
      flashMessage(`Clear error: ${err.message}`);
    }
  };

  const handleDeleteLog = async (logId: number) => {
    setLogs((prev) => prev.filter((l) => l.id !== logId));

    try {
      await fetch(`/api/logs?id=${logId}`, {
        method: 'DELETE',
      });
    } catch (err: any) {
      flashMessage(`Log delete error: ${err.message}`);
    }
  };

  const handleClearAllLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all activity logs?')) return;
    setLogs([]);
    flashMessage('Cleared all activity logs!');

    try {
      const res = await fetch('/api/logs?scope=all', {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to clear all logs');
      }
    } catch (err: any) {
      flashMessage(`Log clear error: ${err.message}`);
    }
  };

  // Pre-configured Test Workflows
  const runPreset = (text: string, toAgent: string, priority: 'urgent' | 'high' | 'medium') => {
    setCommandText(text);
    setCommandAgent(toAgent);
    setCommandPriority(priority);
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    if (ticketFilter === 'active') return t.status === 'in_progress' || t.status === 'pending';
    if (ticketFilter === 'review') return t.status === 'review' || t.status === 'awaiting_approval';
    if (ticketFilter === 'completed') return t.status === 'completed' || t.status === 'failed';
    return true;
  });

  // Pending Approvals Count
  const pendingApprovals = approvals.filter((a) => a.status === 'pending');

  return (
    <>
      {/* Mobile Drawer Backdrop when open */}
      {isMobile && !isCollapsed && (
        <div
          onClick={() => {
            userManuallyToggled.current = true;
            setIsCollapsed(true);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 49,
            transition: 'opacity 0.2s ease',
          }}
        />
      )}

      <aside
        style={{
          width: isCollapsed
            ? isMobile
              ? '0px'
              : '54px'
            : isMobile
            ? 'min(440px, 94vw)'
            : isTablet
            ? 'min(380px, 42vw)'
            : 'min(460px, 32vw)',
          minWidth: isCollapsed ? (isMobile ? '0px' : '54px') : undefined,
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          height: '100%',
          backgroundColor: 'var(--bg-panel)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderLeft: isCollapsed && isMobile ? 'none' : '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: isMobile ? 50 : 30,
          position: isMobile ? 'fixed' : 'relative',
          right: isMobile ? 0 : undefined,
          top: isMobile ? 0 : undefined,
          bottom: isMobile ? 0 : undefined,
          boxShadow: isCollapsed && isMobile ? 'none' : '-8px 0 32px rgba(0, 0, 0, 0.65)',
          overflow: isCollapsed && isMobile ? 'hidden' : 'visible',
          flexShrink: 0,
        }}
      >
      {/* ==================================================================== */}
      {/* PANEL COLLAPSED STRIP                                                */}
      {/* ==================================================================== */}
      {isCollapsed ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '16px 8px',
            gap: '20px',
            height: '100%',
          }}
        >
          <button
            onClick={() => setIsCollapsed(false)}
            title="Expand Control Panel"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-color)',
              color: '#00f0ff',
              borderRadius: '6px',
              width: '38px',
              height: '38px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
            }}
          >
            ◀
          </button>

          {pendingApprovals.length > 0 && (
            <div
              title={`${pendingApprovals.length} Approval Pending!`}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#ffbe0b',
                color: '#000',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                animation: 'pulseGlowAmber 1.5s infinite',
              }}
            >
              !
            </div>
          )}

          <div
            style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '9px',
              color: '#94a3b8',
              letterSpacing: '2px',
              marginTop: 'auto',
              marginBottom: '16px',
            }}
          >
            COMMAND CENTER
          </div>

          {onLock && (
            <button
              onClick={onLock}
              title="Logout (Return to Front Page)"
              style={{
                background: 'rgba(239, 68, 68, 0.18)',
                border: '1.5px solid #ef4444',
                color: '#f87171',
                borderRadius: '6px',
                width: '38px',
                height: '38px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                boxShadow: '0 0 10px rgba(239, 68, 68, 0.3)',
                transition: 'all 0.15s ease',
                marginBottom: '8px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.35)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.18)';
                e.currentTarget.style.color = '#f87171';
              }}
            >
              <IconLogOut size={16} color="currentColor" />
            </button>
          )}
        </div>
      ) : (
        /* ==================================================================== */
        /* EXPANDED FULL SIDE PANEL                                             */
        /* ==================================================================== */
        <>
          {/* 1. TOP HEADER & EMERGENCY CONTROLS */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-color)',
              background: 'rgba(10, 12, 20, 0.65)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: killSwitch ? '#ff3366' : isConnected ? '#00f59b' : '#ffbe0b',
                    boxShadow: killSwitch
                      ? '0 0 8px #ff3366'
                      : isConnected
                      ? '0 0 8px #00f59b'
                      : 'none',
                  }}
                />
                <h1
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '11px',
                    color: '#f8fafc',
                    letterSpacing: '0.5px',
                  }}
                >
                  DYLAN RAMOS HQ
                </h1>
                <span
                  style={{
                    fontSize: '9px',
                    fontFamily: "'Fira Code', monospace",
                    color: isConnected ? '#00f59b' : '#ffbe0b',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  {isConnected ? 'LIVE' : 'CONNECTING'}
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontFamily: "'Fira Code', monospace",
                    color: '#00f59b',
                    background: 'rgba(0, 245, 155, 0.12)',
                    border: '1px solid rgba(0, 245, 155, 0.35)',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    letterSpacing: '0.5px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <IconZap size={11} color="#00f59b" /> 3-AI TIERED PIPELINE
                </span>
              </div>

              <button
                onClick={() => setIsCollapsed(true)}
                title="Collapse Panel"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '4px',
                }}
              >
                ▶
              </button>
            </div>

            {/* Emergency Killswitch & Logout Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleToggleKillSwitch}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: killSwitch ? '1px solid #ff3366' : '1px solid rgba(255, 51, 102, 0.35)',
                  backgroundColor: killSwitch ? 'rgba(255, 51, 102, 0.2)' : 'rgba(255, 51, 102, 0.06)',
                  color: killSwitch ? '#ffffff' : '#ff4d6d',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '9px',
                  cursor: 'pointer',
                  animation: killSwitch ? 'pulseGlowRed 1.2s infinite' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <IconAlertTriangle size={12} color={killSwitch ? '#ffffff' : '#ff4d6d'} />
                {killSwitch ? 'HALTED: RESUME' : 'EMERGENCY STOP'}
              </button>

              {onLock && (
                <button
                  onClick={onLock}
                  title="Logout and Lock Office (Return to Front Page)"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1.5px solid rgba(239, 68, 68, 0.6)',
                    background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.35) 100%)',
                    color: '#fca5a5',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '8.5px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.25)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(180deg, rgba(239, 68, 68, 0.35) 0%, rgba(185, 28, 28, 0.55) 100%)';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(180deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.35) 100%)';
                    e.currentTarget.style.color = '#fca5a5';
                  }}
                >
                  <IconLogOut size={12} color="currentColor" />
                  <span>LOGOUT</span>
                </button>
              )}
            </div>
          </div>

          {/* Flash Notification Toast */}
          {actionMessage && (
            <div
              style={{
                backgroundColor: 'rgba(0, 240, 255, 0.15)',
                borderBottom: '1px solid rgba(0, 240, 255, 0.4)',
                padding: '6px 16px',
                fontSize: '11px',
                fontFamily: "'Fira Code', monospace",
                color: '#00f0ff',
                textAlign: 'center',
              }}
            >
              {actionMessage}
            </div>
          )}

          {/* 2. PENDING HUMAN APPROVALS GATEWAY BANNER */}
          {pendingApprovals.length > 0 && (
            <div
              style={{
                margin: '12px 14px 4px 14px',
                padding: '12px 14px',
                background: 'rgba(255, 190, 11, 0.12)',
                border: '1px solid #ffbe0b',
                borderRadius: '8px',
                animation: 'pulseGlowAmber 2s infinite',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '9px',
                    color: '#ffbe0b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <IconAlertTriangle size={12} color="#ffbe0b" /> HUMAN APPROVAL REQUIRED ({pendingApprovals.length})
                </span>
              </div>

              {pendingApprovals.map((appr) => (
                <div
                  key={appr.id}
                  style={{
                    background: 'rgba(10, 12, 20, 0.85)',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 190, 11, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: AGAGENT_COLOR(appr.agent),
                        fontFamily: "'Fira Code', monospace",
                      }}
                    >
                      @{appr.agent.toUpperCase()}
                    </span>
                    <span
                      style={{
                        fontSize: '9px',
                        background: 'rgba(255, 190, 11, 0.2)',
                        color: '#ffbe0b',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontFamily: "'Press Start 2P', monospace",
                      }}
                    >
                      {appr.action_type.toUpperCase()}
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: '#f1f5f9', lineHeight: '1.4' }}>
                    {appr.description}
                  </p>

                  {/* Payload Details */}
                  {appr.payload && Object.keys(appr.payload).length > 0 && (
                    <div
                      style={{
                        fontSize: '10px',
                        fontFamily: "'Fira Code', monospace",
                        color: '#94a3b8',
                        background: 'rgba(0, 0, 0, 0.4)',
                        padding: '6px',
                        borderRadius: '4px',
                      }}
                    >
                      {Object.entries(appr.payload).map(([k, v]) => (
                        <div key={k}>
                          <span style={{ color: '#ffbe0b' }}>{k}:</span> {String(v)}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Decision Buttons */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button
                      onClick={() => handleResolveApproval(appr.id, 'approved')}
                      style={{
                        flex: 1,
                        background: '#00f59b',
                        color: '#042a1a',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 10px',
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: '9px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <IconCheck size={11} color="#042a1a" />
                      <span>APPROVE</span>
                    </button>
                    <button
                      onClick={() => handleResolveApproval(appr.id, 'rejected')}
                      style={{
                        flex: 1,
                        background: 'rgba(255, 51, 102, 0.2)',
                        color: '#ff3366',
                        border: '1px solid rgba(255, 51, 102, 0.5)',
                        borderRadius: '4px',
                        padding: '6px 10px',
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: '9px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <IconX size={11} color="#ff3366" />
                      <span>REJECT</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. "COMMAND THE OFFICE" DIRECTIVE INPUT */}
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid var(--border-color)',
              background: 'rgba(18, 24, 40, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '9px',
                  color: '#ffbe0b',
                }}
              >
                EXECUTIVE DIRECTIVE (DYLAN RAMOS)
              </span>
              <span style={{ fontSize: '10px', color: '#64748b', fontFamily: "'Fira Code', monospace" }}>
                Enter ↵ to send
              </span>
            </div>

            <form onSubmit={handleSendCommand} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                {/* Agent Selector */}
                <select
                  value={commandAgent}
                  onChange={(e) => setCommandAgent(e.target.value)}
                  style={{
                    flex: 1.2,
                    background: 'rgba(10, 12, 20, 0.8)',
                    border: '1px solid var(--border-color)',
                    color: AGAGENT_COLOR(commandAgent),
                    padding: '6px 8px',
                    borderRadius: '4px',
                    fontFamily: "'Fira Code', monospace",
                    fontSize: '11px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="alex">Alex (Fullstack Developer)</option>
                  <option value="maya">Maya (UI/UX Designer)</option>
                  <option value="wendy">Wendy (Marketing Strategist)</option>
                  <option value="ray">Ray (AI & Market Researcher)</option>
                  <option value="zane">Zane (Cybersecurity)</option>
                </select>

                {/* Priority Selector */}
                <select
                  value={commandPriority}
                  onChange={(e) => setCommandPriority(e.target.value as any)}
                  style={{
                    flex: 0.8,
                    background: 'rgba(10, 12, 20, 0.8)',
                    border: '1px solid var(--border-color)',
                    color:
                      commandPriority === 'urgent'
                        ? '#ff3366'
                        : commandPriority === 'high'
                        ? '#ffbe0b'
                        : '#94a3b8',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    fontFamily: "'Fira Code', monospace",
                    fontSize: '11px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  value={commandText}
                  onChange={(e) => setCommandText(e.target.value)}
                  placeholder={`Command ${commandAgent}... (e.g. Build API endpoint)`}
                  disabled={isSubmitting || killSwitch}
                  style={{
                    flex: 1,
                    background: 'rgba(10, 12, 20, 0.9)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    padding: '8px 10px',
                    color: '#f8fafc',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || killSwitch || !commandText.trim()}
                  style={{
                    background: commandText.trim() && !killSwitch ? '#00f0ff' : 'rgba(99, 115, 178, 0.2)',
                    color: commandText.trim() && !killSwitch ? '#0a0c14' : '#64748b',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0 12px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '10px',
                    fontWeight: 'bold',
                    cursor: commandText.trim() && !killSwitch ? 'pointer' : 'not-allowed',
                    transition: 'background 0.2s',
                  }}
                >
                  {isSubmitting ? '...' : 'SEND'}
                </button>
              </div>

              {/* Real-time Streaming Modal Trigger */}
              <button
                type="button"
                onClick={() => onOpenActionModal?.(commandAgent)}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(0, 240, 255, 0.08)',
                  border: '1px solid rgba(0, 240, 255, 0.35)',
                  color: '#00f0ff',
                  borderRadius: '4px',
                  padding: '7px 10px',
                  fontFamily: "'Fira Code', monospace",
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.18)';
                  e.currentTarget.style.borderColor = '#00f0ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.35)';
                }}
              >
                <IconZap size={13} color="#00f0ff" />
                <span>OPEN REAL-TIME LIVE CONSOLE</span>
              </button>
            </form>

            {/* Quick Test Preset Workflows */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
              <button
                onClick={() =>
                  runPreset(
                    'Implement high-performance Next.js API route with rate limiting and database indexing.',
                    'alex',
                    'high'
                  )
                }
                style={presetBtnStyle}
              >
                <IconCode size={12} color="#f97316" />
                <span>Fullstack Code</span>
              </button>
              <button
                onClick={() =>
                  runPreset(
                    'Design accessible glassmorphic component layout with modern responsive tokens.',
                    'maya',
                    'high'
                  )
                }
                style={presetBtnStyle}
              >
                <IconPalette size={12} color="#ec4899" />
                <span>UI/UX Design</span>
              </button>
              <button
                onClick={() =>
                  runPreset(
                    'Draft high-conversion viral Twitter & LinkedIn marketing campaign for Q4 launch.',
                    'wendy',
                    'high'
                  )
                }
                style={presetBtnStyle}
              >
                <IconRocket size={12} color="#c084fc" />
                <span>Marketing Campaign</span>
              </button>
              <button
                onClick={() =>
                  runPreset(
                    'Research state-of-the-art open source AI models and benchmark inference latencies.',
                    'ray',
                    'medium'
                  )
                }
                style={presetBtnStyle}
              >
                <IconSearch size={12} color="#38bdf8" />
                <span>AI Research</span>
              </button>
              <button
                onClick={() =>
                  runPreset(
                    'Perform vulnerability audit scans and enforce zero-trust endpoint authentication.',
                    'zane',
                    'urgent'
                  )
                }
                style={presetBtnStyle}
              >
                <IconShield size={12} color="#22c55e" />
                <span>Cyber Security</span>
              </button>
            </div>
          </div>

          {/* 4. NAVIGATION TABS */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--border-color)',
              background: 'rgba(10, 12, 20, 0.4)',
            }}
          >
            <button
              onClick={() => setActiveTab('board')}
              style={tabBtnStyle(activeTab === 'board')}
            >
              TASKS ({tickets.length})
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              style={tabBtnStyle(activeTab === 'agents')}
            >
              AGENTS (4)
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              style={tabBtnStyle(activeTab === 'logs')}
            >
              LOGS ({logs.length})
            </button>
          </div>

          {/* 5. TAB CONTENT CONTAINER */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {/* -------------------------------------------------------------- */}
            {/* TAB: TASKS BOARD                                               */}
            {/* -------------------------------------------------------------- */}
            {activeTab === 'board' && (
              <>
                {/* Status subfilters & Task Clear Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(['all', 'active', 'review', 'completed'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setTicketFilter(filter)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '3px',
                          border: 'none',
                          background:
                            ticketFilter === filter ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          color: ticketFilter === filter ? '#00f0ff' : '#94a3b8',
                          fontSize: '10px',
                          fontFamily: "'Fira Code', monospace",
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                        }}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    {tickets.some((t) => t.status === 'completed' || t.status === 'failed') && (
                      <button
                        onClick={handleClearCompletedTickets}
                        title="Delete all completed and failed tasks to free up space"
                        style={{
                          padding: '3px 7px',
                          borderRadius: '3px',
                          border: '1px solid rgba(255, 190, 11, 0.4)',
                          background: 'rgba(255, 190, 11, 0.1)',
                          color: '#ffbe0b',
                          fontSize: '9px',
                          fontFamily: "'Fira Code', monospace",
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <IconBroom size={11} color="currentColor" />
                        <span>Clear Done</span>
                      </button>
                    )}

                    {tickets.length > 0 && (
                      <button
                        onClick={handleClearAllTickets}
                        title="Delete all office tasks"
                        style={{
                          padding: '3px 7px',
                          borderRadius: '3px',
                          border: '1px solid rgba(255, 51, 102, 0.4)',
                          background: 'rgba(255, 51, 102, 0.1)',
                          color: '#ff3366',
                          fontSize: '9px',
                          fontFamily: "'Fira Code', monospace",
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <IconTrash size={11} color="currentColor" />
                        <span>Clear All</span>
                      </button>
                    )}
                  </div>
                </div>

                {filteredTickets.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '30px 10px',
                      color: '#64748b',
                      fontSize: '12px',
                    }}
                  >
                    No tickets in this view.
                  </div>
                ) : (
                  filteredTickets.map((ticket) => {
                    const isExpanded = expandedTicketId === ticket.id;
                    return (
                      <div
                        key={ticket.id}
                        onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          border:
                            ticket.status === 'in_progress'
                              ? '1px solid rgba(0, 240, 255, 0.4)'
                              : ticket.status === 'review'
                              ? '1px solid rgba(255, 190, 11, 0.4)'
                              : '1px solid var(--border-color)',
                          borderRadius: '6px',
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                fontSize: '10px',
                                fontFamily: "'Fira Code', monospace",
                                color: '#94a3b8',
                              }}
                            >
                              {ticket.id.slice(0, 12)}
                            </span>
                            <span
                              style={{
                                fontSize: '9px',
                                color: AGAGENT_COLOR(ticket.to_agent),
                                fontFamily: "'Fira Code', monospace",
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <span>{ticket.from_agent}</span>
                              <IconArrowRight size={10} color="#94a3b8" />
                              <span>{ticket.to_agent}</span>
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <span style={priorityBadgeStyle(ticket.priority)}>
                              {ticket.priority}
                            </span>
                            <span style={statusBadgeStyle(ticket.status)}>
                              {ticket.status.replace('_', ' ')}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTicket(ticket.id);
                              }}
                              title="Delete this task"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                fontSize: '12px',
                                padding: '2px 4px',
                                borderRadius: '3px',
                                lineHeight: '1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.color = '#ff3366';
                                (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255, 51, 102, 0.15)';
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.color = '#94a3b8';
                                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                              }}
                            >
                              <IconTrash size={12} color="currentColor" />
                            </button>
                          </div>
                        </div>

                        <div style={{ fontSize: '12px', color: '#f8fafc', lineHeight: '1.4' }}>
                          {ticket.task}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '10px',
                            color: '#64748b',
                            fontFamily: "'Fira Code', monospace",
                          }}
                        >
                          <span>Steps: {ticket.steps_taken}/8</span>
                          <span>{new Date(ticket.updated_at).toLocaleTimeString()}</span>
                        </div>

                        {/* Accordion Expanded Details */}
                        {isExpanded && (
                          <div
                            style={{
                              marginTop: '6px',
                              paddingTop: '6px',
                              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              fontSize: '11px',
                              fontFamily: "'Fira Code', monospace",
                            }}
                          >
                            {ticket.error && (
                              <div style={{ color: '#ff3366', background: 'rgba(255, 51, 102, 0.1)', padding: '6px', borderRadius: '4px' }}>
                                Error: {ticket.error}
                              </div>
                            )}

                            {ticket.result && Object.keys(ticket.result).length > 0 && (
                              <div>
                                <span style={{ color: '#00f59b' }}>Result:</span>
                                <pre
                                  style={{
                                    marginTop: '2px',
                                    padding: '6px',
                                    borderRadius: '4px',
                                    background: 'rgba(0, 0, 0, 0.5)',
                                    color: '#f1f5f9',
                                    fontSize: '10px',
                                    whiteSpace: 'pre-wrap',
                                    maxHeight: '140px',
                                    overflowY: 'auto',
                                  }}
                                >
                                  {JSON.stringify(ticket.result, null, 2)}
                                </pre>
                              </div>
                            )}

                            {ticket.payload && Object.keys(ticket.payload).length > 0 && (
                              <div>
                                <span style={{ color: '#00f0ff' }}>Payload:</span>
                                <pre
                                  style={{
                                    marginTop: '2px',
                                    padding: '6px',
                                    borderRadius: '4px',
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    color: '#cbd5e1',
                                    fontSize: '10px',
                                    whiteSpace: 'pre-wrap',
                                    maxHeight: '100px',
                                    overflowY: 'auto',
                                  }}
                                >
                                  {JSON.stringify(ticket.payload, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* -------------------------------------------------------------- */}
            {/* TAB: AGENTS SUMMARY                                            */}
            {/* -------------------------------------------------------------- */}
            {activeTab === 'agents' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['dylan', 'eah', 'alex', 'maya', 'wendy', 'ray', 'zane'].map((agentId) => {
                  const meta = AGENT_META[agentId] || { name: agentId, title: 'Team Member', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.4)', bg: 'rgba(56, 189, 248, 0.08)' };
                  const liveAgent = agents.find((a) => a.id === agentId);
                  const isSelected = selectedAgentId === agentId;

                  return (
                    <div
                      key={agentId}
                      onClick={() => onSelectAgent?.(isSelected ? null : agentId)}
                      style={{
                        background: isSelected ? meta.bg : 'var(--bg-card)',
                        border: isSelected ? `2px solid ${meta.color}` : `1px solid ${meta.border}`,
                        borderRadius: '8px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: meta.color,
                              boxShadow: `0 0 8px ${meta.color}`,
                            }}
                          />
                          <span
                            style={{
                              fontFamily: "'Press Start 2P', monospace",
                              fontSize: '10px',
                              color: meta.color,
                            }}
                          >
                            {meta.name}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              color: '#94a3b8',
                              fontFamily: "'Fira Code', monospace",
                            }}
                          >
                            [{meta.title}]
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: '9px',
                            fontFamily: "'Press Start 2P', monospace",
                            color:
                              liveAgent?.status === 'working'
                                ? '#00f59b'
                                : liveAgent?.status === 'talking'
                                ? '#c084fc'
                                : liveAgent?.status === 'walking'
                                ? '#ffbe0b'
                                : '#64748b',
                          }}
                        >
                          {liveAgent?.status?.toUpperCase() || 'IDLE'}
                        </span>
                      </div>

                      {/* Speech Bubble / Thought */}
                      <div
                        style={{
                          background: 'rgba(0, 0, 0, 0.45)',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          borderLeft: `3px solid ${meta.color}`,
                          fontSize: '11px',
                          color: '#e2e8f0',
                          fontStyle: 'italic',
                        }}
                      >
                        &ldquo;{liveAgent?.bubble_text || 'Ready for work.'}&rdquo;
                      </div>

                      {/* 3-AI Tiered Pipeline Display */}
                      {agentId !== 'dylan' && agentId !== 'eah' ? (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '5px',
                            background: 'rgba(0, 0, 0, 0.35)',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255, 255, 255, 0.07)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '9px',
                              fontFamily: "'Press Start 2P', monospace",
                              color: '#94a3b8',
                            }}
                          >
                            <span>DESIGNATED AI + GEMINI 3.8 FLASH:</span>
                            <span style={{ color: '#00f59b', fontFamily: "'Fira Code', monospace" }}>
                              Active
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            <span
                              title="Designated Role-Specific AI Model"
                              style={{
                                fontSize: '9px',
                                fontFamily: "'Fira Code', monospace",
                                color: '#38bdf8',
                                background: 'rgba(56, 189, 248, 0.12)',
                                border: '1px solid rgba(56, 189, 248, 0.35)',
                                padding: '3px 6px',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <IconTarget size={11} color="#38bdf8" />
                              <span>Designated:</span>
                              <strong>{liveAgent?.ai_trio?.tier1 || 'openrouter/free'}</strong>
                            </span>

                            <span
                              title="Universal High-Speed Backup: Gemini 3.8 Flash"
                              style={{
                                fontSize: '9px',
                                fontFamily: "'Fira Code', monospace",
                                color: '#00f59b',
                                background: 'rgba(0, 245, 155, 0.12)',
                                border: '1px solid rgba(0, 245, 155, 0.35)',
                                padding: '3px 6px',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <IconShield size={11} color="#00f59b" />
                              <span>Backup:</span>
                              <strong>{liveAgent?.ai_trio?.tier2 || 'google/gemini-3.8-flash'}</strong>
                            </span>

                            <span
                              title="Tertiary Safety Net Fallback"
                              style={{
                                fontSize: '9px',
                                fontFamily: "'Fira Code', monospace",
                                color: '#f59e0b',
                                background: 'rgba(245, 158, 11, 0.12)',
                                border: '1px solid rgba(245, 158, 11, 0.35)',
                                padding: '3px 6px',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <IconAward size={11} color="#f59e0b" />
                              <span>Safety:</span>
                              <strong>{liveAgent?.ai_trio?.tier3 || 'nvidia/nemotron-3.5-lightning:free'}</strong>
                            </span>
                          </div>
                        </div>
                      ) : agentId === 'eah' ? (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            background: 'rgba(244, 63, 94, 0.1)',
                            border: '1px solid rgba(244, 63, 94, 0.35)',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontFamily: "'Fira Code', monospace",
                            color: '#fb7185',
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <IconHeart size={12} color="#fb7185" />
                            <span>Executive Partner &amp; Dylan&apos;s Girlfriend • CEO Suite</span>
                          </span>
                          <span style={{ fontSize: '9px', color: '#fda4af', display: 'inline-flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                            <IconSparkles size={11} color="#fda4af" />
                            <span>Spoiled with fresh flowers &amp; gourmet meals by Dylan</span>
                            <span>•</span>
                            <IconCoffee size={11} color="#fda4af" />
                            <span>Cooks &amp; brews for Dylan</span>
                          </span>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            background: 'rgba(245, 158, 11, 0.1)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontFamily: "'Fira Code', monospace",
                            color: '#fbbf24',
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <IconCrown size={12} color="#fbbf24" />
                            <span>Executive Command &amp; Decision Maker</span>
                          </span>
                          <span style={{ fontSize: '9px', color: '#fde68a', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <IconSparkles size={11} color="#fde68a" />
                            <span>Gifts flowers &amp; cooks gourmet meals for Eah with love</span>
                            <IconHeart size={11} color="#f43f5e" />
                          </span>
                        </div>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '10px',
                          color: '#64748b',
                          fontFamily: "'Fira Code', monospace",
                          marginTop: '2px',
                        }}
                      >
                        <span>
                          Pos: ({liveAgent ? liveAgent.x.toFixed(1) : 0},{' '}
                          {liveAgent ? liveAgent.y.toFixed(1) : 0})
                        </span>
                        <span>
                          Ticket: {liveAgent?.current_ticket_id ? liveAgent.current_ticket_id.slice(0, 10) : 'None'}
                        </span>
                      </div>

                      {agentId !== 'dylan' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenActionModal?.(agentId);
                          }}
                          style={{
                            marginTop: '4px',
                            backgroundColor: `${meta.color}22`,
                            border: `1px solid ${meta.color}`,
                            color: meta.color,
                            borderRadius: '6px',
                            padding: '6px 10px',
                            fontSize: '9px',
                            fontFamily: "'Press Start 2P', monospace",
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `${meta.color}44`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = `${meta.color}22`;
                          }}
                        >
                          <IconZap size={11} color="currentColor" />
                          <span>ASSIGN TASK (REAL-TIME)</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* -------------------------------------------------------------- */}
            {/* TAB: LIVE ACTIVITY LOGS                                        */}
            {/* -------------------------------------------------------------- */}
            {activeTab === 'logs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px',
                    fontSize: '10px',
                    color: '#64748b',
                    fontFamily: "'Fira Code', monospace",
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={autoScrollLogs}
                      onChange={(e) => setAutoScrollLogs(e.target.checked)}
                    />
                    Auto-scroll
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Showing {logs.length} events</span>
                    {logs.length > 0 && (
                      <button
                        onClick={handleClearAllLogs}
                        title="Delete all activity logs to prevent memory buildup"
                        style={{
                          padding: '3px 7px',
                          borderRadius: '3px',
                          border: '1px solid rgba(255, 51, 102, 0.4)',
                          background: 'rgba(255, 51, 102, 0.1)',
                          color: '#ff3366',
                          fontSize: '9px',
                          fontFamily: "'Fira Code', monospace",
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <IconTrash size={11} color="currentColor" />
                        <span>Clear Logs</span>
                      </button>
                    )}
                  </div>
                </div>

                {logs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b', fontSize: '12px' }}>
                    No activity logs recorded yet.
                  </div>
                ) : (
                  logs.map((log, idx) => (
                    <div
                      key={log.id || idx}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '4px',
                        backgroundColor:
                          log.type === 'mistake' || log.type === 'error'
                            ? 'rgba(255, 51, 102, 0.12)'
                            : log.type === 'approval'
                            ? 'rgba(255, 190, 11, 0.1)'
                            : log.type === 'handoff'
                            ? 'rgba(157, 78, 221, 0.1)'
                            : 'rgba(15, 23, 42, 0.6)',
                        borderLeft: `3px solid ${
                          log.type === 'mistake' || log.type === 'error'
                            ? '#ff3366'
                            : log.type === 'approval'
                            ? '#ffbe0b'
                            : log.type === 'handoff'
                            ? '#9d4edd'
                            : '#38bdf8'
                        }`,
                        fontSize: '11px',
                        fontFamily: "'Fira Code', monospace",
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: AGAGENT_COLOR(log.agent), fontWeight: 600 }}>
                            @{log.agent}
                          </span>
                          {(log.type === 'mistake' || log.type === 'error') && (
                            <span
                              style={{
                                background: '#ff3366',
                                color: '#fff',
                                padding: '1px 4px',
                                borderRadius: '2px',
                                fontSize: '8px',
                              }}
                            >
                              [{log.type.toUpperCase()}]
                            </span>
                          )}
                          {log.type === 'handoff' && (
                            <span
                              style={{
                                background: '#9d4edd',
                                color: '#fff',
                                padding: '1px 4px',
                                borderRadius: '2px',
                                fontSize: '8px',
                              }}
                            >
                              [HANDOFF]
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#475569', fontSize: '9px' }}>
                            {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                          </span>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            title="Delete this log entry"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#64748b',
                              cursor: 'pointer',
                              padding: '2px 3px',
                              borderRadius: '2px',
                              lineHeight: '1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.color = '#ff3366';
                              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255, 51, 102, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.color = '#64748b';
                              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                            }}
                          >
                            <IconX size={10} color="currentColor" />
                          </button>
                        </div>
                      </div>
                      <div style={{ color: '#e2e8f0', wordBreak: 'break-word', lineHeight: '1.3' }}>
                        {log.message}
                      </div>
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>

          {/* 6. BOTTOM STICKY FOOTER: LOGOUT & CLEARANCE BAR */}
          {onLock && (
            <div
              style={{
                marginTop: 'auto',
                padding: '12px 16px',
                borderTop: '1px solid var(--border-color)',
                background: 'rgba(10, 12, 20, 0.95)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                flexShrink: 0,
              }}
            >
              <button
                onClick={onLock}
                title="Logout and Return to Front Page"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #ef4444',
                  background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.45) 100%)',
                  color: '#ffffff',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '9.5px',
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(180deg, rgba(239, 68, 68, 0.45) 0%, rgba(185, 28, 28, 0.65) 100%)';
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(239, 68, 68, 0.45)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(180deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.45) 100%)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(239, 68, 68, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <IconLogOut size={13} color="currentColor" />
                <span>LOGOUT • LOCK HQ</span>
              </button>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '8px',
                  color: '#94a3b8',
                  fontFamily: "'Press Start 2P', monospace",
                  padding: '0 2px',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <IconLock size={10} color="#94a3b8" />
                  <span>RETURN TO FRONT PAGE</span>
                </span>
                <span style={{ color: '#00f0ff' }}>AVERO HQ</span>
              </div>
            </div>
          )}
        </>
      )}
    </aside>
    </>
  );
}

// Helpers
function AGAGENT_COLOR(agentId?: string): string {
  if (!agentId) return '#94a3b8';
  return AGENT_META[agentId.toLowerCase()]?.color || '#38bdf8';
}

const presetBtnStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(99, 115, 178, 0.3)',
  color: '#cbd5e1',
  padding: '5px 8px',
  borderRadius: '4px',
  fontSize: '10px',
  fontFamily: "'Fira Code', monospace",
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
};

const tabBtnStyle = (isActive: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '10px 4px',
  background: isActive ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
  border: 'none',
  borderBottom: isActive ? '2px solid #00f0ff' : '2px solid transparent',
  color: isActive ? '#00f0ff' : '#94a3b8',
  fontFamily: "'Press Start 2P', monospace",
  fontSize: '9px',
  cursor: 'pointer',
  transition: 'all 0.15s',
});

const statusBadgeStyle = (status: string): React.CSSProperties => {
  const map: Record<string, { bg: string; color: string }> = {
    pending: { bg: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8' },
    in_progress: { bg: 'rgba(0, 240, 255, 0.2)', color: '#00f0ff' },
    awaiting_approval: { bg: 'rgba(255, 190, 11, 0.2)', color: '#ffbe0b' },
    review: { bg: 'rgba(192, 132, 252, 0.2)', color: '#c084fc' },
    completed: { bg: 'rgba(0, 245, 155, 0.2)', color: '#00f59b' },
    failed: { bg: 'rgba(255, 51, 102, 0.2)', color: '#ff3366' },
  };
  const style = map[status] || { bg: 'rgba(255,255,255,0.1)', color: '#fff' };
  return {
    backgroundColor: style.bg,
    color: style.color,
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '9px',
    fontFamily: "'Press Start 2P', monospace",
    textTransform: 'uppercase',
  };
};

const priorityBadgeStyle = (priority: string): React.CSSProperties => {
  const colors: Record<string, string> = {
    urgent: '#ff3366',
    high: '#ffbe0b',
    medium: '#38bdf8',
    low: '#94a3b8',
  };
  const color = colors[priority] || '#94a3b8';
  return {
    color,
    border: `1px solid ${color}40`,
    padding: '2px 4px',
    borderRadius: '3px',
    fontSize: '8px',
    fontFamily: "'Press Start 2P', monospace",
    textTransform: 'uppercase',
  };
};
