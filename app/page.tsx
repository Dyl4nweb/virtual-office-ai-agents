'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import SidePanel from '@/components/SidePanel';
import WorkerActionModal from '@/components/WorkerActionModal';
import RetroFrontPage from '@/components/RetroFrontPage';
import { AGENT_ROSTER_INFO } from '@/lib/roster';

// Dynamically load Three.js 3D Voxel Scene on client-side only (no SSR)
const Office3D = dynamic(() => import('@/components/Office3D'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#00f0ff',
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '12px',
        backgroundColor: '#0a0c14',
      }}
    >
      LOADING 3D VOXEL OFFICE...
    </div>
  ),
});

export default function HomePage() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>('alex');
  const [isActionModalOpen, setIsActionModalOpen] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // Check stored security clearance on mount using secure server verification
  useEffect(() => {
    let isMounted = true;
    const verifyStoredAuth = async () => {
      try {
        // Clear old legacy unverified bypass keys
        localStorage.removeItem('avero_hq_clearance');

        // Check for secure signed clearance token
        const token =
          localStorage.getItem('avero_hq_clearance_token') ||
          sessionStorage.getItem('avero_hq_session_token');

        if (token) {
          const res = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.valid && isMounted) {
              setIsAuthenticated(true);
            } else if (isMounted) {
              localStorage.removeItem('avero_hq_clearance_token');
              sessionStorage.removeItem('avero_hq_session_token');
              setIsAuthenticated(false);
            }
          } else if (isMounted) {
            localStorage.removeItem('avero_hq_clearance_token');
            sessionStorage.removeItem('avero_hq_session_token');
            setIsAuthenticated(false);
          }
        }
      } catch {
        if (isMounted) setIsAuthenticated(false);
      } finally {
        if (isMounted) setIsCheckingAuth(false);
      }
    };

    verifyStoredAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleEnterOffice = (remember = true, token?: string) => {
    if (token) {
      if (remember) {
        try {
          localStorage.setItem('avero_hq_clearance_token', token);
        } catch {}
      } else {
        try {
          sessionStorage.setItem('avero_hq_session_token', token);
        } catch {}
      }
    }
    setIsAuthenticated(true);
  };

  const handleLockOffice = () => {
    try {
      localStorage.removeItem('avero_hq_clearance_token');
      localStorage.removeItem('avero_hq_clearance');
      sessionStorage.removeItem('avero_hq_session_token');
    } catch {}
    setIsAuthenticated(false);
  };

  // Triggered when an agent is clicked in 3D or HUD
  const handleSelectAgent = (agentId: string | null) => {
    setSelectedAgentId(agentId);
    if (agentId && ['alex', 'maya', 'wendy', 'ray', 'zane', 'eah'].includes(agentId)) {
      setIsActionModalOpen(true);
    }
  };

  const handleOpenActionModal = (agentId?: string) => {
    if (agentId) setSelectedAgentId(agentId);
    setIsActionModalOpen(true);
  };

  // Brief initial auth check hydration
  if (isCheckingAuth) {
    return <div style={{ width: '100vw', height: '100vh', backgroundColor: '#0a0c14' }} />;
  }

  // If locked or unauthorized, render the retro arcade front page
  if (!isAuthenticated) {
    return <RetroFrontPage onEnter={handleEnterOffice} />;
  }

  return (
    <main
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0a0c14',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Viewport Container */}
      <div style={{ flex: 1, minWidth: 0, height: '100%', position: 'relative', overflow: 'hidden' }}>
        {/* Dedicated Pure 3D Voxel Office Canvas with Master Executive HUD Header */}
        <Office3D
          selectedAgentId={selectedAgentId}
          onSelectAgent={handleSelectAgent}
          onOpenActionModal={handleOpenActionModal}
          onLock={handleLockOffice}
        />
      </div>

      {/* Control Panel / Live HUD Sidebar for Dylan Ramos */}
      <SidePanel
        selectedAgentId={selectedAgentId}
        onSelectAgent={handleSelectAgent}
        onOpenActionModal={handleOpenActionModal}
        onLock={handleLockOffice}
      />

      {/* Interactive Real-Time AI Task Assignment Modal */}
      <WorkerActionModal
        agentId={selectedAgentId}
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        onSelectAgent={(agentId) => setSelectedAgentId(agentId)}
      />
    </main>
  );
}
