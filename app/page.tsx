'use client';

import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import SidePanel from '@/components/SidePanel';
import WorkerActionModal from '@/components/WorkerActionModal';
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
      <div style={{ flex: 1, height: '100%', position: 'relative' }}>
        {/* Dedicated Pure 3D Voxel Office Canvas with Master Executive HUD Header */}
        <Office3D
          selectedAgentId={selectedAgentId}
          onSelectAgent={handleSelectAgent}
          onOpenActionModal={handleOpenActionModal}
        />
      </div>

      {/* Control Panel / Live HUD Sidebar for Dylan Ramos */}
      <SidePanel
        selectedAgentId={selectedAgentId}
        onSelectAgent={handleSelectAgent}
        onOpenActionModal={handleOpenActionModal}
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
