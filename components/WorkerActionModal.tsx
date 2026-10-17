'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AGENT_ROSTER_INFO } from '@/lib/roster';
import {
  IconZap,
  IconSparkles,
  IconTarget,
  IconUsers,
  IconFlame,
  IconSettings,
  IconMessageSquare,
  IconAlertTriangle,
  IconFolder,
  IconCopy,
  IconDownload,
  IconCheck,
  IconPalette,
  IconMegaphone,
  IconShield,
  IconX,
  getAgentIcon,
} from '@/components/Icons';

export interface WorkerActionModalProps {
  agentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectAgent: (agentId: string) => void;
}

interface StreamingState {
  isStreaming: boolean;
  statusText: string;
  speechText: string;
  activeTool: string | null;
  streamedText: string;
  ticketId: string | null;
  completedResult: any | null;
  error: string | null;
}

export default function WorkerActionModal({
  agentId,
  isOpen,
  onClose,
  onSelectAgent,
}: WorkerActionModalProps) {
  const currentAgentId = agentId || 'alex';
  const info = AGENT_ROSTER_INFO[currentAgentId] || AGENT_ROSTER_INFO.alex;

  const [promptText, setPromptText] = useState('');
  const [priority, setPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('high');
  const [withMeeting, setWithMeeting] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'assign' | 'history'>('assign');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [historyTickets, setHistoryTickets] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Streaming State
  const [streamState, setStreamState] = useState<StreamingState>({
    isStreaming: false,
    statusText: '',
    speechText: '',
    activeTool: null,
    streamedText: '',
    ticketId: null,
    completedResult: null,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const streamEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !streamState.isStreaming) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, streamState.isStreaming, onClose]);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen && activeTab === 'assign' && !streamState.isStreaming) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, currentAgentId, activeTab, streamState.isStreaming]);

  // Fetch recent history when agent changes or history tab opens
  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      setIsLoadingHistory(true);
      fetch('/api/state')
        .then((res) => res.json())
        .then((data) => {
          const agentTickets = (data.tickets || []).filter(
            (t: any) => t.to_agent === currentAgentId
          );
          setHistoryTickets(agentTickets);
        })
        .catch(() => {})
        .finally(() => setIsLoadingHistory(false));
    }
  }, [isOpen, currentAgentId, activeTab]);

  // Auto-scroll streaming console
  useEffect(() => {
    if (streamState.isStreaming && streamEndRef.current) {
      streamEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamState.streamedText, streamState.speechText, streamState.activeTool]);

  if (!isOpen) return null;

  // Handle Preset Selection
  const handleSelectPreset = (presetPrompt: string) => {
    setPromptText(presetPrompt);
    textareaRef.current?.focus();
  };

  // Copy to Clipboard Helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Download Code Artifact
  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.split('/').pop() || 'artifact.ts';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Execute Real-Time Streaming Task
  const handleExecuteTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptText.trim() || streamState.isStreaming) return;

    const taskToSend = promptText.trim();

    setStreamState({
      isStreaming: true,
      statusText: `Initializing ${info.name}...`,
      speechText: `On it Dylan! Starting work...`,
      activeTool: null,
      streamedText: '',
      ticketId: null,
      completedResult: null,
      error: null,
    });

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/agent/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: currentAgentId,
          task: taskToSend,
          priority,
          withMeeting,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          if (!block.trim()) continue;

          let eventName = 'message';
          let eventData = '';

          const blockLines = block.split('\n');
          for (const line of blockLines) {
            if (line.startsWith('event: ')) {
              eventName = line.replace('event: ', '').trim();
            } else if (line.startsWith('data: ')) {
              eventData = line.replace('data: ', '').trim();
            }
          }

          if (!eventData) continue;

          try {
            const data = JSON.parse(eventData);

            if (eventName === 'meeting') {
              setStreamState((prev) => ({
                ...prev,
                statusText: data.message || 'Sprint meeting in Executive Boardroom...',
                speechText:
                  data.phase === 'start'
                    ? 'Team assembled in Executive Boardroom for sprint alignment!'
                    : 'Sprint aligned! Returning to station to deliver...',
              }));
            } else if (eventName === 'start') {
              setStreamState((prev) => ({
                ...prev,
                ticketId: data.ticketId,
                statusText: `Real-time task started (#${data.ticketId.slice(-6)})`,
              }));
            } else if (eventName === 'speech') {
              setStreamState((prev) => ({
                ...prev,
                speechText: data.speech,
              }));
            } else if (eventName === 'chunk') {
              setStreamState((prev) => ({
                ...prev,
                streamedText: prev.streamedText + (data.delta || ''),
              }));
            } else if (eventName === 'done') {
              setStreamState((prev) => ({
                ...prev,
                isStreaming: false,
                statusText: 'Completed successfully!',
                speechText: 'Task finished! Delivered artifact.',
                completedResult: data,
                streamedText: data.text || prev.streamedText,
              }));
            } else if (eventName === 'error') {
              setStreamState((prev) => ({
                ...prev,
                isStreaming: false,
                error: data.error,
                statusText: 'Task execution error',
              }));
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setStreamState((prev) => ({
          ...prev,
          isStreaming: false,
          error: err.message,
          statusText: 'Execution interrupted',
        }));
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  // Extract artifacts from completed result
  const toolCalls = streamState.completedResult?.toolCalls || [];
  const codeArtifact = toolCalls.find((tc: any) => tc.name === 'write_code_artifact')?.result;
  const designSpec = toolCalls.find((tc: any) => tc.name === 'generate_design_spec')?.result;
  const marketingDraft = toolCalls.find((tc: any) => tc.name === 'draft_marketing_content')?.result;
  const securityAudit = toolCalls.find((tc: any) => tc.name === 'audit_security_posture')?.result;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(5, 7, 13, 0.78)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !streamState.isStreaming) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          backgroundColor: '#0c0f1d',
          border: `1.5px solid ${info.color}`,
          borderRadius: '14px',
          boxShadow: `0 0 35px rgba(0, 0, 0, 0.8), 0 0 20px ${info.color}33`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* ================================================================== */}
        {/* TOP MODAL HEADER: Worker Identity, Engine Badge & Close Button     */}
        {/* ================================================================== */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: 'rgba(18, 24, 42, 0.85)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '10px',
                backgroundColor: `${info.color}22`,
                border: `2px solid ${info.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 12px ${info.color}44`,
              }}
            >
              {getAgentIcon(currentAgentId, 24, info.color)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2
                  style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: '18px',
                    fontWeight: 800,
                    color: '#f8fafc',
                    margin: 0,
                    letterSpacing: '0.3px',
                  }}
                >
                  {info.name.toUpperCase()}
                </h2>

                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: "'Fira Code', monospace",
                    padding: '3px 9px',
                    borderRadius: '5px',
                    backgroundColor: streamState.isStreaming ? 'rgba(0, 240, 255, 0.18)' : 'rgba(34, 197, 94, 0.18)',
                    color: streamState.isStreaming ? '#00f0ff' : '#22c55e',
                    border: `1px solid ${streamState.isStreaming ? '#00f0ff55' : '#22c55e55'}`,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  {streamState.isStreaming ? (
                    <>
                      <IconZap size={12} color="#00f0ff" />
                      <span>EXECUTING NOW</span>
                    </>
                  ) : (
                    <>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
                      <span>READY FOR DIRECTIVE</span>
                    </>
                  )}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: info.color, fontWeight: 600 }}>
                  {info.title}
                </span>
                <span style={{ color: '#475569', fontSize: '12px' }}>•</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: "'Fira Code', monospace",
                    color: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <IconSparkles size={11} color="#38bdf8" />
                  <span>Gemini 3.5 Flash Active</span>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            title="Close (Esc)"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#94a3b8',
              cursor: 'pointer',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ff3366';
              e.currentTarget.style.backgroundColor = 'rgba(255, 51, 102, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
            }}
          >
            <IconX size={18} color="currentColor" />
          </button>
        </div>

        {/* ================================================================== */}
        {/* QUICK AGENT SWITCHER BAR                                           */}
        {/* ================================================================== */}
        <div
          style={{
            padding: '10px 20px',
            backgroundColor: 'rgba(10, 14, 26, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 700,
              color: '#94a3b8',
              marginRight: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            SWITCH WORKER:
          </span>

          {Object.entries(AGENT_ROSTER_INFO).map(([id, meta]) => {
            if (id === 'dylan') return null; // Dylan is Founder/User
            const isSelected = id === currentAgentId;
            return (
              <button
                key={id}
                onClick={() => {
                  if (!streamState.isStreaming) {
                    onSelectAgent(id);
                    setPromptText('');
                    setStreamState({
                      isStreaming: false,
                      statusText: '',
                      speechText: '',
                      activeTool: null,
                      streamedText: '',
                      ticketId: null,
                      completedResult: null,
                      error: null,
                    });
                  }
                }}
                disabled={streamState.isStreaming}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '7px 13px',
                  borderRadius: '7px',
                  backgroundColor: isSelected ? `${meta.color}25` : 'rgba(255, 255, 255, 0.04)',
                  border: isSelected ? `1.5px solid ${meta.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  color: isSelected ? '#f8fafc' : '#94a3b8',
                  fontSize: '13px',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: isSelected ? 700 : 500,
                  cursor: streamState.isStreaming ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {getAgentIcon(id, 16, isSelected ? meta.color : '#94a3b8')}
                <span>{meta.name}</span>
              </button>
            );
          })}

          {/* Mode Switcher: Assign vs History */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setActiveTab('assign')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'assign' ? 'rgba(0, 240, 255, 0.22)' : 'transparent',
                color: activeTab === 'assign' ? '#00f0ff' : '#64748b',
                fontSize: '12px',
                fontFamily: "'Inter', system-ui, sans-serif",
                cursor: 'pointer',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <IconZap size={13} color={activeTab === 'assign' ? '#00f0ff' : '#64748b'} />
              <span>DIRECTIVE</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'history' ? 'rgba(0, 240, 255, 0.22)' : 'transparent',
                color: activeTab === 'history' ? '#00f0ff' : '#64748b',
                fontSize: '12px',
                fontFamily: "'Inter', system-ui, sans-serif",
                cursor: 'pointer',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <IconFolder size={13} color={activeTab === 'history' ? '#00f0ff' : '#64748b'} />
              <span>ARTIFACTS</span>
            </button>
          </div>
        </div>

        {/* ================================================================== */}
        {/* TAB 1: DIRECTIVE ASSIGNMENT & REAL-TIME STREAMING CONSOLE          */}
        {/* ================================================================== */}
        {activeTab === 'assign' && (
          <div
            style={{
              padding: '20px 24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            {/* Specialty Description */}
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                fontSize: '13px',
                lineHeight: '1.5',
                color: '#cbd5e1',
              }}
            >
              <IconTarget size={18} color={info.color} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: info.color }}>Specialty Focus:</strong>{' '}
                {info.specialty}
              </div>
            </div>

            {/* Quick 1-Click Task Presets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  fontSize: '12px',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: 700,
                  color: '#94a3b8',
                  letterSpacing: '0.4px',
                }}
              >
                1-CLICK QUICK PRESETS:
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {info.presets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectPreset(preset.prompt)}
                    disabled={streamState.isStreaming}
                    style={{
                      padding: '9px 15px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '7px',
                      color: '#e2e8f0',
                      fontSize: '13px',
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontWeight: 500,
                      cursor: streamState.isStreaming ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!streamState.isStreaming) {
                        e.currentTarget.style.borderColor = info.color;
                        e.currentTarget.style.backgroundColor = `${info.color}15`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!streamState.isStreaming) {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                      }
                    }}
                  >
                    <span style={{ fontSize: '15px' }}>{preset.icon}</span>
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Directive Input Form */}
            <form onSubmit={handleExecuteTask} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label
                  style={{
                    fontSize: '13px',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontWeight: 800,
                    color: '#ffbe0b',
                    letterSpacing: '0.3px',
                  }}
                >
                  DIRECTIVE TO {info.name.toUpperCase()}:
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: "'Inter', sans-serif" }}>
                    Priority:
                  </span>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    disabled={streamState.isStreaming}
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color:
                        priority === 'urgent'
                          ? '#ff3366'
                          : priority === 'high'
                          ? '#ffbe0b'
                          : priority === 'medium'
                          ? '#38bdf8'
                          : '#94a3b8',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
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
              </div>

              <textarea
                ref={textareaRef}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder={`What task do you want to assign to ${info.name}? (e.g. 'Build a high-performance API route using TypeScript', 'Design layout spec for landing page')...`}
                disabled={streamState.isStreaming}
                rows={4}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(10, 14, 26, 0.85)',
                  border: `1.5px solid ${promptText.trim() ? info.color : 'rgba(255, 255, 255, 0.12)'}`,
                  borderRadius: '8px',
                  padding: '14px 16px',
                  color: '#f8fafc',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  lineHeight: '1.5',
                  outline: 'none',
                  resize: 'vertical',
                  boxShadow: promptText.trim() ? `0 0 15px ${info.color}22` : 'none',
                  transition: 'border 0.2s ease',
                }}
              />

              {/* Astig Boardroom Meeting Toggle + Submit Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: streamState.isStreaming ? 'default' : 'pointer',
                    fontSize: '13px',
                    color: withMeeting ? '#00f0ff' : '#94a3b8',
                    fontFamily: "'Inter', sans-serif",
                    userSelect: 'none',
                    fontWeight: withMeeting ? 600 : 400,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={withMeeting}
                    onChange={(e) => setWithMeeting(e.target.checked)}
                    disabled={streamState.isStreaming}
                    style={{ accentColor: '#00f0ff', width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <IconUsers size={15} color="#00f0ff" />
                    <span>Hold executive meeting in Boardroom first</span>
                  </span>
                  <span
                    style={{
                      backgroundColor: 'rgba(255, 190, 11, 0.25)',
                      border: '1px solid rgba(255, 190, 11, 0.6)',
                      color: '#ffbe0b',
                      padding: '3px 8px',
                      borderRadius: '5px',
                      fontSize: '10px',
                      fontWeight: 800,
                      fontFamily: "'Inter', sans-serif",
                      boxShadow: '0 0 8px rgba(255, 190, 11, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>PRO</span>
                    <IconFlame size={12} color="#ffbe0b" />
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!promptText.trim() || streamState.isStreaming}
                  style={{
                    backgroundColor: promptText.trim() && !streamState.isStreaming ? info.color : 'rgba(255, 255, 255, 0.08)',
                    color: promptText.trim() && !streamState.isStreaming ? '#05070e' : '#64748b',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 26px',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: '14px',
                    fontWeight: 800,
                    letterSpacing: '0.4px',
                    height: '46px',
                    cursor: promptText.trim() && !streamState.isStreaming ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: promptText.trim() && !streamState.isStreaming ? `0 0 18px ${info.color}66` : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {streamState.isStreaming ? (
                    <>
                      <span className="spinner" style={{ display: 'inline-flex', animation: 'spin 1s linear infinite' }}>
                        <IconSettings size={16} />
                      </span>
                      <span>EXECUTING...</span>
                    </>
                  ) : (
                    <>
                      <IconZap size={16} color="#05070e" />
                      <span>ASSIGN & EXECUTE</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* ============================================================== */}
            {/* REAL-TIME STREAMING CONSOLE & DELIVERABLES VIEWER              */}
            {/* ============================================================== */}
            {(streamState.isStreaming || streamState.completedResult || streamState.error || streamState.streamedText) && (
              <div
                style={{
                  marginTop: '10px',
                  backgroundColor: 'rgba(5, 7, 14, 0.95)',
                  border: `1px solid ${streamState.error ? '#ff3366' : streamState.isStreaming ? '#00f0ff' : '#22c55e'}`,
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 0 20px rgba(0, 0, 0, 0.6)',
                }}
              >
                {/* Console Header Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        backgroundColor: streamState.error ? '#ff3366' : streamState.isStreaming ? '#00f0ff' : '#22c55e',
                        boxShadow: `0 0 8px ${streamState.error ? '#ff3366' : streamState.isStreaming ? '#00f0ff' : '#22c55e'}`,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontSize: '13px',
                        fontWeight: 800,
                        letterSpacing: '0.4px',
                        color: streamState.error ? '#ff3366' : streamState.isStreaming ? '#00f0ff' : '#22c55e',
                      }}
                    >
                      {streamState.error
                        ? 'EXECUTION ERROR'
                        : streamState.isStreaming
                        ? 'LIVE STREAMING CONSOLE'
                        : 'DIRECTIVE DELIVERABLE READY'}
                    </span>
                  </div>

                  {streamState.ticketId && (
                    <span style={{ fontSize: '10px', fontFamily: "'Fira Code', monospace", color: '#64748b' }}>
                      Ticket #{streamState.ticketId.slice(-8)}
                    </span>
                  )}
                </div>

                {/* Speech Bubble / Status Log */}
                {streamState.speechText && (
                  <div
                    style={{
                      padding: '8px 12px',
                      backgroundColor: `${info.color}15`,
                      border: `1px solid ${info.color}44`,
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      fontFamily: "'Fira Code', monospace",
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <IconMessageSquare size={14} color={info.color} />
                    <span>
                      <strong style={{ color: info.color }}>{info.name}:</strong> &quot;{streamState.speechText}&quot;
                    </span>
                  </div>
                )}

                {/* Error Banner */}
                {streamState.error && (
                  <div
                    style={{
                      padding: '10px 14px',
                      backgroundColor: 'rgba(255, 51, 102, 0.15)',
                      border: '1px solid #ff3366',
                      borderRadius: '6px',
                      color: '#ff4d6d',
                      fontSize: '12px',
                      fontFamily: "'Fira Code', monospace",
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <IconAlertTriangle size={15} color="#ff4d6d" />
                      <span>{streamState.error}</span>
                    </span>
                  </div>
                )}

                {/* DELIVERABLE 1: Code Artifact (Alex) */}
                {codeArtifact && (
                  <div
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(249, 115, 22, 0.4)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        padding: '8px 14px',
                        backgroundColor: 'rgba(249, 115, 22, 0.12)',
                        borderBottom: '1px solid rgba(249, 115, 22, 0.25)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IconFolder size={14} color="#f97316" />
                        <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#f97316', fontWeight: 600 }}>
                          {codeArtifact.filename || 'components/Artifact.tsx'}
                        </span>
                        <span style={{ fontSize: '9px', color: '#94a3b8', background: 'rgba(0, 0, 0, 0.3)', padding: '2px 6px', borderRadius: '4px' }}>
                          {codeArtifact.language || 'typescript'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleCopy(codeArtifact.code_content || codeArtifact.code || '', 'code')}
                          style={{
                            backgroundColor: copiedKey === 'code' ? '#00f59b' : 'rgba(255, 255, 255, 0.08)',
                            color: copiedKey === 'code' ? '#042a1a' : '#f8fafc',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '10px',
                            fontFamily: "'Fira Code', monospace",
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          {copiedKey === 'code' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <IconCheck size={12} color="#042a1a" />
                              <span>COPIED!</span>
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <IconCopy size={12} color="#f8fafc" />
                              <span>COPY CODE</span>
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => handleDownload(codeArtifact.filename || 'code.ts', codeArtifact.code_content || codeArtifact.code || '')}
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            color: '#f8fafc',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '10px',
                            fontFamily: "'Fira Code', monospace",
                            cursor: 'pointer',
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <IconDownload size={12} color="#f8fafc" />
                            <span>DOWNLOAD</span>
                          </span>
                        </button>
                      </div>
                    </div>

                    {codeArtifact.code_content && (
                      <pre
                        style={{
                          margin: 0,
                          padding: '12px 16px',
                          maxHeight: '300px',
                          overflowY: 'auto',
                          fontFamily: "'Fira Code', monospace",
                          fontSize: '12px',
                          lineHeight: '1.5',
                          color: '#f1f5f9',
                          backgroundColor: '#0a0d17',
                        }}
                      >
                        <code>{codeArtifact.code_content}</code>
                      </pre>
                    )}
                  </div>
                )}

                {/* DELIVERABLE 2: Design Spec (Maya) */}
                {designSpec && (
                  <div
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(236, 72, 153, 0.4)',
                      borderRadius: '8px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '12px', color: '#ec4899', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <IconPalette size={14} color="#ec4899" />
                        <span>Design Specification: {designSpec.component_name}</span>
                      </span>
                      <button
                        onClick={() => handleCopy(JSON.stringify(designSpec, null, 2), 'spec')}
                        style={{
                          backgroundColor: copiedKey === 'spec' ? '#00f59b' : 'rgba(255, 255, 255, 0.08)',
                          color: copiedKey === 'spec' ? '#042a1a' : '#f8fafc',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '10px',
                          fontFamily: "'Fira Code', monospace",
                          cursor: 'pointer',
                        }}
                      >
                        {copiedKey === 'spec' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <IconCheck size={12} color="#042a1a" />
                            <span>COPIED!</span>
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <IconCopy size={12} color="#f8fafc" />
                            <span>COPY SPEC</span>
                          </span>
                        )}
                      </button>
                    </div>

                    {designSpec.design_tokens && typeof designSpec.design_tokens === 'object' && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {Object.entries(designSpec.design_tokens).map(([k, val]: [string, any]) => (
                          <div
                            key={k}
                            style={{
                              backgroundColor: 'rgba(0, 0, 0, 0.4)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '11px',
                              fontFamily: "'Fira Code', monospace",
                            }}
                          >
                            {typeof val === 'string' && val.startsWith('#') && (
                              <span
                                style={{
                                  width: '12px',
                                  height: '12px',
                                  borderRadius: '3px',
                                  backgroundColor: val,
                                  boxShadow: `0 0 6px ${val}`,
                                }}
                              />
                            )}
                            <span style={{ color: '#94a3b8' }}>{k}:</span>
                            <span style={{ color: '#f8fafc', fontWeight: 600 }}>{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {designSpec.layout_structure && (
                      <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.4' }}>
                        <strong style={{ color: '#ec4899' }}>Layout:</strong> {designSpec.layout_structure}
                      </div>
                    )}
                  </div>
                )}

                {/* DELIVERABLE 3: Marketing Copy (Wendy) */}
                {marketingDraft && (
                  <div
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(192, 132, 252, 0.4)',
                      borderRadius: '8px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '12px', color: '#c084fc', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <IconMegaphone size={14} color="#c084fc" />
                        <span>Copy Platform: {marketingDraft.platform || 'Campaign'}</span>
                      </span>
                      <button
                        onClick={() => handleCopy(marketingDraft.content || '', 'mktg')}
                        style={{
                          backgroundColor: copiedKey === 'mktg' ? '#00f59b' : 'rgba(255, 255, 255, 0.08)',
                          color: copiedKey === 'mktg' ? '#042a1a' : '#f8fafc',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '10px',
                          fontFamily: "'Fira Code', monospace",
                          cursor: 'pointer',
                        }}
                      >
                        {copiedKey === 'mktg' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <IconCheck size={12} color="#042a1a" />
                            <span>COPIED!</span>
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <IconCopy size={12} color="#f8fafc" />
                            <span>COPY COPY</span>
                          </span>
                        )}
                      </button>
                    </div>

                    {marketingDraft.title && (
                      <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '13px' }}>{marketingDraft.title}</h4>
                    )}

                    <div
                      style={{
                        padding: '10px 12px',
                        backgroundColor: '#0a0d17',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#e2e8f0',
                        whiteSpace: 'pre-wrap',
                        lineHeight: '1.5',
                      }}
                    >
                      {marketingDraft.content}
                    </div>
                  </div>
                )}

                {/* DELIVERABLE 4: Security Audit (Zane) */}
                {securityAudit && (
                  <div
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(34, 197, 94, 0.4)',
                      borderRadius: '8px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '12px', color: '#22c55e', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <IconShield size={14} color="#22c55e" />
                        <span>Security Posture Assessment: {securityAudit.target_system || 'Office Cloud'}</span>
                      </span>
                      <span
                        style={{
                          backgroundColor: 'rgba(34, 197, 94, 0.2)',
                          color: '#22c55e',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontFamily: "'Fira Code', monospace",
                        }}
                      >
                        {securityAudit.zero_trust_status || 'Audited'}
                      </span>
                    </div>

                    {securityAudit.findings && (
                      <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                        <strong style={{ color: '#22c55e' }}>Findings:</strong> {securityAudit.findings}
                      </div>
                    )}
                  </div>
                )}

                {/* Full Streamed Text Output / Agent Explanation */}
                {streamState.streamedText && (
                  <div
                    style={{
                      maxHeight: '260px',
                      overflowY: 'auto',
                      backgroundColor: '#080a14',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      padding: '12px 14px',
                      color: '#cbd5e1',
                      fontSize: '12px',
                      fontFamily: "'Fira Code', monospace",
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {streamState.streamedText}
                    {streamState.isStreaming && (
                      <span
                        style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '14px',
                          backgroundColor: '#00f0ff',
                          marginLeft: '4px',
                          animation: 'blink 0.8s infinite',
                        }}
                      />
                    )}
                    <div ref={streamEndRef} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 2: WORKER ARTIFACTS & COMPLETED HISTORY                       */}
        {/* ================================================================== */}
        {activeTab === 'history' && (
          <div
            style={{
              padding: '18px 22px',
              overflowY: 'auto',
              maxHeight: '65vh',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '9px',
                  color: info.color,
                }}
              >
                COMPLETED DELIVERABLES BY {info.name.toUpperCase()} ({historyTickets.length})
              </span>
            </div>

            {isLoadingHistory ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '12px' }}>
                Loading artifacts...
              </div>
            ) : historyTickets.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#64748b',
                  fontSize: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  border: '1px dashed rgba(255, 255, 255, 0.08)',
                }}
              >
                No deliverables recorded for {info.name} yet. Assign a task in the Directive tab!
              </div>
            ) : (
              historyTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: "'Fira Code', monospace" }}>
                      {ticket.id.slice(0, 14)} • {new Date(ticket.created_at).toLocaleString()}
                    </span>
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        backgroundColor: ticket.status === 'completed' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 190, 11, 0.15)',
                        color: ticket.status === 'completed' ? '#22c55e' : '#ffbe0b',
                        fontFamily: "'Press Start 2P', monospace",
                      }}
                    >
                      {ticket.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', color: '#f8fafc', fontWeight: 500 }}>
                    {ticket.task}
                  </div>

                  {ticket.result?.full_text && (
                    <div
                      style={{
                        padding: '8px 10px',
                        backgroundColor: '#0a0d17',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: '#94a3b8',
                        fontFamily: "'Fira Code', monospace",
                        maxHeight: '120px',
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {ticket.result.full_text}
                    </div>
                  )}

                  {ticket.result?.full_text && (
                    <button
                      onClick={() => handleCopy(ticket.result.full_text, ticket.id)}
                      style={{
                        alignSelf: 'flex-start',
                        backgroundColor: copiedKey === ticket.id ? '#00f59b' : 'rgba(255, 255, 255, 0.06)',
                        color: copiedKey === ticket.id ? '#042a1a' : '#f8fafc',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '10px',
                        fontFamily: "'Fira Code', monospace",
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {copiedKey === ticket.id ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <IconCheck size={12} color="#042a1a" />
                          <span>COPIED!</span>
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <IconCopy size={12} color="#f8fafc" />
                          <span>COPY DELIVERABLE</span>
                        </span>
                      )}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px) scale(0.97); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
