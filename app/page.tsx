'use client';

import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import SidePanel from '@/components/SidePanel';
import PixelOffice from '@/components/PixelOffice';

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
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'pixel' | 'voxel'>('pixel');

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
        {/* Top-Right Mode Toggle */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '20px',
            zIndex: 25,
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(99, 115, 178, 0.3)',
            borderRadius: '8px',
            padding: '4px',
            display: 'flex',
            gap: '4px',
          }}
        >
          <button
            onClick={() => setViewMode('pixel')}
            style={{
              background: viewMode === 'pixel' ? '#00f0ff' : 'transparent',
              color: viewMode === 'pixel' ? '#0a0c14' : '#94a3b8',
              border: 'none',
              borderRadius: '5px',
              padding: '6px 10px',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '9px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            🕹️ PIXEL VIEW
          </button>
          <button
            onClick={() => setViewMode('voxel')}
            style={{
              background: viewMode === 'voxel' ? '#00f0ff' : 'transparent',
              color: viewMode === 'voxel' ? '#0a0c14' : '#94a3b8',
              border: 'none',
              borderRadius: '5px',
              padding: '6px 10px',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '9px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            🧊 3D VOXEL
          </button>
        </div>

        {/* View Switcher: Pixel Office (Default, matches image) vs 3D Voxel View */}
        {viewMode === 'pixel' ? (
          <PixelOffice
            selectedAgentId={selectedAgentId}
            onSelectAgent={(agentId) => setSelectedAgentId(agentId)}
          />
        ) : (
          <Office3D
            selectedAgentId={selectedAgentId}
            onSelectAgent={(agentId) => setSelectedAgentId(agentId)}
          />
        )}
      </div>

      {/* Control Panel / Live HUD Sidebar for Dylan Ramos */}
      <SidePanel
        selectedAgentId={selectedAgentId}
        onSelectAgent={(agentId) => setSelectedAgentId(agentId)}
      />
    </main>
  );
}
