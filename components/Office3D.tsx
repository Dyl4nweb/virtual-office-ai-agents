'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MEETING_SCRIPT, CASUAL_CONVERSATIONS } from './PixelOffice';
import { AGENT_ROSTER_INFO } from '@/lib/roster';
import {
  IconZap,
  IconUserCheck,
  IconArmchair,
  IconFootprints,
  IconActivity,
  IconLaptop,
  IconBriefcase,
  IconCoffee,
  IconTrees,
  IconUsers,
  IconMonitor,
  IconGamepad,
  IconCompass,
  IconBox,
  IconGrid,
  IconLayers,
  IconCheckCircle,
  IconRotateCw,
  IconTarget,
  IconServer,
  IconRotateCcw,
  IconVolume2,
  IconVolumeX,
  IconSparkles,
  IconFlame,
  IconHeart,
  IconShield,
  IconSidebar,
  IconChevronDown,
  IconChevronUp,
  IconLock,
  IconBuilding,
  getAgentIcon,
} from './Icons';
import ServerRoomModal from './ServerRoomModal';

// ============================================================================
// SHARED 3D OFFICE LAYOUT CONTRACT (MATCHES PIXEL VIEW 1:1)
// ============================================================================
export const OFFICE_3D_LAYOUT = {
  GRID_WIDTH: 39,
  GRID_HEIGHT: 22,

  // 1. CEO Executive Suite (Zone 1, Top-Left) - Desk & Chair Face Sliding Door (+z)
  CEO: {
    desk: { x: 5.0, z: 4.6 },
    chair: { x: 5.0, z: 3.2 },
    bookshelf: { x: 1.2, z: 2.5 },
    eahSeat: { x: 2.2, z: 6.6 },
    sofa: { x: 2.8, z: 9.5 },
    coffeeTable: { x: 6.0, z: 9.5 },
    plant: { x: 8.5, z: 2.2 },
    doorway: { x: 10.0, z: 8.5 },
  },

  // 2. Team Open Bullpen (Zone 2, Top-Right) - 2x3 Specialized Grid
  DESKS: {
    dylan: { x: 5.0, z: 4.6, chair: { x: 5.0, z: 3.2 } },
    // Row 1 (AI Researcher, Designer)
    ray: { x: 14.5, z: 3.6, chair: { x: 14.5, z: 4.8 } },
    maya: { x: 21.5, z: 3.6, chair: { x: 21.5, z: 4.8 } },
    // Row 2 (Marketing Strategist - aligned with Ray in Column 1, keeping Lounge doorway corridor x=17..20 completely clear!)
    wendy: { x: 14.5, z: 7.8, chair: { x: 14.5, z: 9.0 } },
    // Zone 6: High-Tech Cyber Security & Server Vault Tech Hub (Fullstack + Cyber Sec Together!)
    alex: { x: 28.8, z: 7.2, chair: { x: 28.8, z: 8.5 } },
    zane: { x: 33.8, z: 7.2, chair: { x: 33.8, z: 8.5 } },
  },

  // 6. High-Tech Cyber Security & Server Vault (Zone 6, East Wing: x: 26.0..38.0, z: 0.5..11.0 - Expansive 12m Tech Hub!)
  SERVER_ROOM: {
    doorway: { x: 26.0, z: 6.5 },
    racks: [
      { id: 'rack1', name: 'PROD-DB-CLUSTER', x: 27.8, z: 2.0 },
      { id: 'rack2', name: 'AI-GPU-MAINFRAME', x: 30.4, z: 2.0 },
      { id: 'rack3', name: 'EDGE-FIREWALL', x: 33.0, z: 2.0 },
      { id: 'rack4', name: 'ZERO-TRUST-VAULT', x: 35.6, z: 2.0 },
    ],
    threatMap: { x: 32.0, z: 0.8 },
    alexDesk: { x: 28.8, z: 7.2 },
    alexChair: { x: 28.8, z: 8.5 },
    zaneDesk: { x: 33.8, z: 7.2 },
    zaneChair: { x: 33.8, z: 8.5 },
    crashCart: { x: 27.2, z: 4.5 },
  },

  AMENITIES: {
    waterCooler: { x: 24.2, z: 4.2 },
    miniFridge: { x: 12.8, z: 8.5 },
    serverDiagnostic: { x: 31.3, z: 3.2 },
  },

  // 3. Team Relaxation & Coffee Lounge (Zone 3, Bottom-Center: x: 8..21, z: 11..21)
  REST_AREA: {
    rug: { x: 14.5, z: 16.5, width: 11.0, depth: 8.0 },
    topBooth: { x: 14.5, z: 13.3 },
    topTable: { x: 14.5, z: 14.75 },
    bottomBooth: { x: 16.8, z: 19.7 },
    bottomTable: { x: 16.8, z: 18.25 },
    dogBed: { x: 19.2, z: 13.8 },
    catBed: { x: 18.2, z: 18.8 },
    espressoBar: { x: 10.2, z: 18.6, width: 1.6, depth: 2.4 },
    framedHeartPhoto: { x: 11.2, z: 19.5 },
    plant: { x: 19.5, z: 19.5 },
    arcadeCabinet: { x: 10.2, z: 13.6, width: 1.2, depth: 1.2 },
    seats: {
      dylan: { x: 11.4, z: 18.2 }, // Espresso bar swivel stool (faces West)
      ray: { x: 13.8, z: 13.85 },  // Top leather booth cushion (faces South)
      maya: { x: 15.2, z: 13.85 }, // Top leather booth cushion (faces South)
      alex: { x: 15.8, z: 19.15 }, // Bottom leather booth cushion (faces North)
      wendy: { x: 17.6, z: 19.15 },// Bottom leather booth cushion (faces North)
      zane: { x: 10.2, z: 14.65 }, // Standing in front of Retro Arcade (faces North into controls & screen!)
    },
    // Backwards compatibility aliases
    sofa: { x: 14.5, z: 13.8, width: 4.8, depth: 1.2 },
    coffeeTable: { x: 14.5, z: 14.8, width: 2.8, depth: 1.4 },
    workBench: { x: 16.8, z: 18.6, width: 3.8, depth: 1.0 },
  },

  // 4. Grand Executive Boardroom & Meeting Suite (Zone 4, Bottom-Right: x: 21..38, z: 11..21 - Extra Spacious!)
  BOARDROOM: {
    table: { x: 29.5, z: 16.2, width: 7.2, depth: 2.2 },
    screen: { x: 29.5, z: 11.15 },
    doors: { x: 21.0, z: 15.0 },
    waterDispenser: { x: 22.4, z: 11.8 },
    seats: {
      dylan: { x: 25.2, z: 16.2 }, // Head of table (CEO Dylan Ramos)
      // North side (3 specialists, ample legroom)
      ray: { x: 27.5, z: 14.7 },
      maya: { x: 29.5, z: 14.7 },
      alex: { x: 31.5, z: 14.7 },
      // South side (2 specialists, ample legroom)
      wendy: { x: 28.2, z: 17.7 },
      zane: { x: 30.8, z: 17.7 },
    },
  },

  // 5A. Gourmet Pantry & Kitchen Suite (Zone 5A, Indoor: x: 1..8, z: 11..16)
  KITCHEN: {
    counter: { x: 4.5, z: 11.6, width: 6.4, depth: 0.9 },
    island: { x: 4.5, z: 13.8, width: 4.4, depth: 1.2 },
    seats: {
      left: { x: 3.5, z: 14.8 },
      right: { x: 5.5, z: 14.8 },
    },
    fridge: { x: 1.6, z: 11.6 },
  },

  // 5B. Outdoor Zen Garden & Patio Terrace (Zone 5B, Outdoor: x: 1..8, z: 16..21)
  GARDEN: {
    deck: { x: 4.5, z: 18.5, width: 5.8, depth: 4.6 },
    table: { x: 4.5, z: 18.5, width: 2.6, depth: 1.4 },
    umbrella: { x: 4.5, z: 18.5, radius: 1.5 },
    seats: {
      left: { x: 3.4, z: 18.5 },
      right: { x: 5.6, z: 18.5 },
    },
    fountain: { x: 1.8, z: 17.5 },
  },

  // Backwards compatibility alias
  RECREATION: {
    playerSpot: { x: 4.5, z: 14.8 },
    billiardsTable: { x: 4.5, z: 13.8, width: 4.4, depth: 1.2 },
    cueRack: { x: 1.2, z: 13.8 },
  },
};

// Collision detection for 3D navigation
export function isTileBlocked3D(x: number, z: number): boolean {
  // Outer perimeter (expanded office to x = 38.0)
  if (x < 1.0 || x > 38.0 || z < 1.0 || z > 20.8) return true;

  // Glass Wall between CEO & Bullpen (x = 10, ONLY in z in [1, 11]!)
  // Doorway is at z in [7.2, 10.2]
  if (x >= 9.6 && x <= 10.4 && z <= 11.0) {
    if (z < 7.2 || z > 10.2) return true;
  }

  // Security Glass Divider between Bullpen & Server Room (x = 26.0, z in [0, 11.5])
  // Doorway is at z in [5.2, 7.8]
  if (x >= 25.6 && x <= 26.4 && z <= 11.5) {
    if (z < 5.2 || z > 7.8) return true;
  }

  // Server Room Server Racks (x: 26.8..36.6, z: 1.4..2.6)
  if (x >= 26.8 && x <= 36.6 && z >= 1.4 && z <= 2.6) return true;

  // Server Room Command Desks (Alex: x: 27.6..30.0, Zane: x: 32.6..35.0, Central Bridge: x: 30.5..32.1, z: 6.4..8.0)
  const isAlexDesk = (x >= 27.6 && x <= 30.0 && z >= 6.4 && z <= 8.0);
  const isZaneDesk = (x >= 32.6 && x <= 35.0 && z >= 6.4 && z <= 8.0);
  const isConsoleBridge = (x >= 30.5 && x <= 32.1 && z >= 6.6 && z <= 7.8);
  if (isAlexDesk || isZaneDesk || isConsoleBridge) return true;

  // Server Room Diagnostic Cart (x: 26.6..27.8, z: 4.0..5.0)
  if (x >= 26.6 && x <= 27.8 && z >= 4.0 && z <= 5.0) return true;

  // Horizontal Dividing Wall along z = 11 (Bullpen & Server Room vs Lounge & Boardroom: x in [1.0, 38.5])
  // Double sliding doors into Lounge at x in [16.5, 20.5]
  if (z >= 10.6 && z <= 11.4 && x >= 1.0 && x <= 38.5) {
    const isLoungeDoor = x >= 16.5 && x <= 20.5;
    if (!isLoungeDoor) return true;
  }

  // Vertical Glass Divider between Zone 5 (Kitchen & Garden) & Lounge (x = 8, z in [11, 21])
  // Doorway is at z in [12.5, 15.5]
  if (x >= 7.6 && x <= 8.4 && z >= 11.0 && z <= 21.0) {
    if (z < 12.5 || z > 15.5) return true;
  }

  // Dividing Wall & Sliding Patio Glass Door between Kitchen & Outdoor Garden (z = 16, x in [1, 8])
  // Sliding Patio Doorway is at x in [3.4, 5.6]
  if (z >= 15.6 && z <= 16.4 && x >= 1.0 && x <= 8.0) {
    if (x < 3.4 || x > 5.6) return true;
  }

  // Solid Acoustic Dividing Wall between Lounge & Boardroom (x = 21, z in [11, 21])
  // Doorway is centered at z = 16.075 (clearance z in [14.6, 17.5])
  if (x >= 20.6 && x <= 21.4 && z >= 11.0 && z <= 21.0) {
    if (z < 14.6 || z > 17.5) return true;
  }

  // Modern Wood Slat Acoustic Accent Wall along East Perimeter (x: 37.6..38.0, z: 13.5..19.5)
  if (x >= 37.6 && z >= 13.5 && z <= 19.5) return true;

  // Kitchen Counters & Waterfall Island (Zone 5A)
  if (x >= 1.2 && x <= 7.4 && z >= 11.1 && z <= 12.1) return true; // Back counter & fridge
  if (x >= 2.2 && x <= 6.8 && z >= 13.2 && z <= 14.4) return true; // Waterfall Quartz Island

  // Outdoor Zen Garden Patio (Zone 5B)
  if (x >= 3.4 && x <= 5.6 && z >= 17.8 && z <= 19.2) return true; // Slatted Teak Table
  if (x >= 1.2 && x <= 2.5 && z >= 16.8 && z <= 18.2) return true; // Zen Stone Fountain

  // CEO Furniture (Executive Desk facing Door at z = 4.6)
  if (x >= 3.2 && x <= 6.8 && z >= 3.8 && z <= 5.5) return true; // CEO Desk
  if (x >= 0.8 && x <= 1.8 && z >= 1.5 && z <= 3.5) return true; // Bookshelf
  if (x >= 1.5 && x <= 2.9 && z >= 6.0 && z <= 7.2) return true; // Eah's Luxury Velvet Armchair
  if (x >= 2.4 && x <= 4.8 && z >= 8.8 && z <= 10.2) return true; // Sofa

  // Bullpen Workstation Desks Grid (Row 1 at z=3.6, Row 2 at z=7.8)
  const isRow1Desk = (z >= 2.8 && z <= 4.4) && ((x >= 13.0 && x <= 16.0) || (x >= 20.0 && x <= 23.0));
  const isRow2Desk = (z >= 7.0 && z <= 8.6) && (x >= 13.0 && x <= 16.0);
  const isWaterCooler = (x >= 23.6 && x <= 24.8 && z >= 3.6 && z <= 4.8);
  if (isRow1Desk || isRow2Desk || isWaterCooler) return true;

  // Boardroom Conference Table (Zone 4: table surface is x: 25.8..33.2, z: 15.0..17.4)
  // Generous margin around all edges so characters can walk around freely:
  if (x >= 25.8 && x <= 33.2 && z >= 15.0 && z <= 17.4) return true;

  // Boardroom Executive Water Dispenser (Zone 4: x: 22.0..22.8, z: 11.4..12.3)
  if (x >= 22.0 && x <= 22.8 && z >= 11.4 && z <= 12.3) return true;

  // Rest Area Lounge Furniture (Zone 3: x: 8..21, z: 13..21)
  if (x >= 9.4 && x <= 11.2 && z >= 17.4 && z <= 20.0) return true; // Espresso counter
  if (x >= 9.6 && x <= 10.8 && z >= 13.0 && z <= 14.2) return true; // Arcade cabinet (z=14.8 is clear!)
  if (x >= 12.4 && x <= 16.6 && z >= 12.8 && z <= 13.5) return true; // Top booth back (z=13.85 cushion is clear!)
  if (x >= 13.4 && x <= 15.6 && z >= 14.3 && z <= 15.2) return true; // Top caramel coffee table
  if (x >= 14.8 && x <= 18.8 && z >= 19.5 && z <= 20.2) return true; // Bottom booth back (z=19.15 cushion is clear!)
  if (x >= 15.7 && x <= 17.9 && z >= 17.8 && z <= 18.7) return true; // Bottom caramel coffee table
  if (x >= 18.5 && x <= 19.8 && z >= 13.2 && z <= 14.4) return true; // Puppy donut bed sanctuary
  if (x >= 17.6 && x <= 18.8 && z >= 18.2 && z <= 19.4) return true; // White cat velvet basket & scratching tree

  return false;
}

// Smart 3D Path Routing through Real Doorways & Obstacle Bypass
export function findPath3D(
  startX: number,
  startZ: number,
  targetX: number,
  targetZ: number
): Array<{ x: number; z: number }> {
  const getZone = (x: number, z: number) => {
    if (x <= 10.0 && z <= 11.0) return 'ceo';
    if (x > 26.0 && z <= 12.0) return 'server';
    if (x > 10.0 && z <= 11.0) return 'bullpen';
    if (x < 8.0 && z > 11.0 && z <= 16.0) return 'kitchen';
    if (x < 8.0 && z > 16.0) return 'garden';
    if (x > 21.0 && z > 11.0) return 'boardroom';
    return 'lounge';
  };

  const sZone = getZone(startX, startZ);
  const tZone = getZone(targetX, targetZ);

  // 1. Same-zone navigation with obstacle avoidance
  if (sZone === tZone) {
    if (sZone === 'boardroom') {
      // Boardroom conference table avoidance (table: x: 25.8..33.2, z: 15.0..17.4)
      const crossesTableZ = (startZ < 15.0 && targetZ > 17.4) || (startZ > 17.4 && targetZ < 15.0);
      const crossesTableX = (startX < 25.8 && targetX > 25.8) || (startX > 33.2 && targetX < 33.2);
      if (crossesTableZ || (crossesTableX && startZ >= 14.5 && startZ <= 18.0)) {
        const detourZ = (startZ + targetZ) / 2 < 16.2 ? 13.5 : 19.0;
        return [
          { x: startX, z: detourZ },
          { x: targetX, z: detourZ },
          { x: targetX, z: targetZ },
        ];
      }
    }
    if (sZone === 'server') {
      // Server Room command desks & racks avoidance: use clear center aisle at z = 5.2
      const isDeskZone = (z: number) => z > 6.4;
      if (isDeskZone(startZ) || isDeskZone(targetZ)) {
        return [
          { x: startX, z: 5.2 },
          { x: targetX, z: 5.2 },
          { x: targetX, z: targetZ },
        ];
      }
    }
    if (sZone === 'ceo') {
      if ((startZ < 4.0 && targetZ > 5.5) || (startZ > 5.5 && targetZ < 4.0)) {
        return [
          { x: 8.5, z: startZ },
          { x: 8.5, z: targetZ },
          { x: targetX, z: targetZ },
        ];
      }
    }
    if (sZone === 'bullpen') {
      const midZ = 6.4;
      if ((startZ < 5.0 && targetZ > 7.0) || (startZ > 7.0 && targetZ < 5.0)) {
        return [
          { x: startX, z: midZ },
          { x: targetX, z: midZ },
          { x: targetX, z: targetZ },
        ];
      }
    }
    if (sZone === 'lounge') {
      // Lounge sofa / coffee table avoidance (concourse at z = 14.0)
      const inDeepLounge = targetZ > 16.0 || startZ > 16.0;
      if (inDeepLounge && Math.abs(startX - targetX) > 2.0) {
        return [
          { x: startX, z: 14.0 },
          { x: targetX, z: 14.0 },
          { x: targetX, z: targetZ },
        ];
      }
    }
    return [{ x: targetX, z: targetZ }];
  }

  // 2. Real Doorways & Portals
  const ceoDoor = { x: 10.0, z: 8.6 };
  const serverDoor = { x: 26.0, z: 6.5 };
  const loungeDoors = { x: 18.5, z: 11.0 };
  const boardDoor = { x: 21.0, z: 16.075 };
  const recDoor = { x: 8.0, z: 14.0 };
  const patioDoor = { x: 4.5, z: 16.0 };

  const path: Array<{ x: number; z: number }> = [];

  // Direct transit between Kitchen & Outdoor Garden
  if (sZone === 'kitchen' && tZone === 'garden') {
    path.push({ x: 4.5, z: 14.8 });
    path.push(patioDoor);
    path.push({ x: targetX, z: targetZ });
    return path;
  }
  if (sZone === 'garden' && tZone === 'kitchen') {
    path.push({ x: 4.5, z: 17.5 });
    path.push(patioDoor);
    path.push({ x: 4.5, z: 14.8 });
    path.push({ x: targetX, z: targetZ });
    return path;
  }

  // --- PHASE A: Exit starting zone into respective wing transit highway ---
  // North Wing Highway: Bullpen central aisle at z = 6.4
  // South Wing Highway: Lounge concourse at z = 14.0

  if (sZone === 'ceo') {
    if (startZ < 4.5) path.push({ x: 8.5, z: startZ });
    path.push({ x: 8.5, z: 8.6 });
    path.push(ceoDoor); // (10.0, 8.6)
    path.push({ x: 12.0, z: 8.6 });
    path.push({ x: 12.0, z: 6.4 }); // Reach Bullpen aisle
  } else if (sZone === 'server') {
    path.push({ x: startX, z: 5.2 }); // Clear server aisle
    path.push({ x: 27.5, z: 5.2 });
    path.push(serverDoor); // (26.0, 6.5)
    path.push({ x: 24.2, z: 6.4 }); // Reach Bullpen aisle
  } else if (sZone === 'bullpen') {
    if (Math.abs(startZ - 6.4) > 0.4) {
      path.push({ x: startX, z: 6.4 });
    }
  } else if (sZone === 'kitchen') {
    path.push({ x: 5.5, z: 14.0 });
    path.push(recDoor); // (8.0, 14.0)
    path.push({ x: 10.5, z: 14.0 }); // Reach Lounge concourse
  } else if (sZone === 'garden') {
    path.push({ x: 4.5, z: 17.5 });
    path.push(patioDoor); // (4.5, 16.0)
    path.push({ x: 4.5, z: 14.0 });
    path.push(recDoor); // (8.0, 14.0)
    path.push({ x: 10.5, z: 14.0 }); // Reach Lounge concourse
  } else if (sZone === 'boardroom') {
    // Avoid table when exiting Boardroom
    if (startZ > 17.5) {
      path.push({ x: startX, z: 19.0 });
      path.push({ x: 23.5, z: 19.0 });
    } else if (startZ < 14.5) {
      path.push({ x: startX, z: 13.5 });
      path.push({ x: 23.5, z: 13.5 });
    } else {
      path.push({ x: 23.5, z: 16.075 });
    }
    path.push({ x: 23.5, z: 16.075 });
    path.push(boardDoor); // (21.0, 16.075)
    path.push({ x: 18.5, z: 16.075 }); // Reach Lounge concourse
    path.push({ x: 18.5, z: 14.0 });
  } else if (sZone === 'lounge') {
    if (Math.abs(startZ - 14.0) > 0.5) {
      path.push({ x: startX, z: 14.0 });
    }
  }

  // --- PHASE B: Cross dividing wall (z = 11.0) strictly via loungeDoors (18.5, 11.0) ---
  const isNorth = (z: string) => z === 'ceo' || z === 'bullpen' || z === 'server';
  const isSouth = (z: string) => z === 'kitchen' || z === 'garden' || z === 'lounge' || z === 'boardroom';

  if (isNorth(sZone) && isSouth(tZone)) {
    // Walking North -> South through French Sliding Glass Doors:
    path.push({ x: 18.5, z: 6.4 });
    path.push({ x: 18.5, z: 9.5 });
    path.push(loungeDoors); // (18.5, 11.0)
    path.push({ x: 18.5, z: 12.5 });
    path.push({ x: 18.5, z: 14.0 }); // At South Wing Concourse
  } else if (isSouth(sZone) && isNorth(tZone)) {
    // Walking South -> North through French Sliding Glass Doors:
    path.push({ x: 18.5, z: 14.0 });
    path.push({ x: 18.5, z: 12.5 });
    path.push(loungeDoors); // (18.5, 11.0)
    path.push({ x: 18.5, z: 9.5 });
    path.push({ x: 18.5, z: 6.4 }); // At North Wing Bullpen Aisle
  }

  // --- PHASE C: Enter destination zone from respective wing highway ---
  if (tZone === 'ceo') {
    path.push({ x: 12.0, z: 6.4 });
    path.push({ x: 12.0, z: 8.6 });
    path.push(ceoDoor); // (10.0, 8.6)
    path.push({ x: 8.5, z: 8.6 });
    if (targetZ < 4.5) path.push({ x: 8.5, z: targetZ });
    path.push({ x: targetX, z: targetZ });
  } else if (tZone === 'server') {
    path.push({ x: 24.2, z: 6.4 });
    path.push(serverDoor); // (26.0, 6.5)
    path.push({ x: 27.5, z: 5.2 }); // Enter clear server aisle
    path.push({ x: targetX, z: 5.2 });
    path.push({ x: targetX, z: targetZ });
  } else if (tZone === 'bullpen') {
    path.push({ x: targetX, z: 6.4 });
    path.push({ x: targetX, z: targetZ });
  } else if (tZone === 'kitchen') {
    path.push({ x: 10.5, z: 14.0 });
    path.push(recDoor); // (8.0, 14.0)
    path.push({ x: 5.5, z: 14.0 });
    path.push({ x: targetX, z: targetZ });
  } else if (tZone === 'garden') {
    path.push({ x: 10.5, z: 14.0 });
    path.push(recDoor); // (8.0, 14.0)
    path.push({ x: 4.5, z: 14.0 });
    path.push(patioDoor); // (4.5, 16.0)
    path.push({ x: 4.5, z: 17.5 });
    path.push({ x: targetX, z: targetZ });
  } else if (tZone === 'boardroom') {
    path.push({ x: 18.5, z: 14.0 });
    path.push({ x: 18.5, z: 16.075 });
    path.push(boardDoor); // (21.0, 16.075)
    path.push({ x: 23.5, z: 16.075 }); // Inside Boardroom West Aisle
    // Navigate around conference table to target seat:
    if (targetZ > 17.5) {
      path.push({ x: 23.5, z: 19.0 }); // South aisle around table
      path.push({ x: targetX, z: 19.0 });
    } else if (targetZ < 14.5) {
      path.push({ x: 23.5, z: 13.5 }); // North aisle around table
      path.push({ x: targetX, z: 13.5 });
    } else {
      path.push({ x: 23.5, z: 16.2 }); // Head of table (Dylan)
    }
    path.push({ x: targetX, z: targetZ });
  } else if (tZone === 'lounge') {
    // Reaching lounge destination from concourse at z = 14.0
    if (targetZ > 16.0 && targetX < 13.0) {
      // Espresso bar aisle
      path.push({ x: 11.4, z: 14.0 });
      path.push({ x: 11.4, z: targetZ });
    } else if (targetZ > 17.0 && targetX > 15.0) {
      // Bottom booth approach
      path.push({ x: 18.5, z: 14.0 });
      path.push({ x: 18.5, z: 18.5 });
    } else {
      path.push({ x: targetX, z: 14.0 });
    }
    path.push({ x: targetX, z: targetZ });
  }

  // Optimization: filter out duplicate or near-identical adjacent waypoints
  const cleanPath: Array<{ x: number; z: number }> = [];
  for (const pt of path) {
    if (cleanPath.length === 0) {
      cleanPath.push(pt);
    } else {
      const last = cleanPath[cleanPath.length - 1];
      if (Math.hypot(last.x - pt.x, last.z - pt.z) > 0.2) {
        cleanPath.push(pt);
      }
    }
  }

  return cleanPath;
}


// ============================================================================
// HIGH-DEFINITION CRISP HTML SPEECH BUBBLE CONFIGURATION
// ============================================================================
export interface AgentBubbleMeta {
  id: string;
  name: string;
  role: string;
  badge: string;
  borderColor: string;
  badgeBg: string;
  badgeColor: string;
  glowColor: string;
  icon: string;
}

export const AGENT_BUBBLE_CONFIG: Record<string, AgentBubbleMeta> = {
  dylan: {
    id: 'dylan',
    name: 'Dylan Ramos',
    role: 'CEO & Founder',
    badge: '👑 FOUNDER & CEO',
    borderColor: '#ffbe0b',
    badgeBg: 'rgba(255, 190, 11, 0.2)',
    badgeColor: '#ffbe0b',
    glowColor: 'rgba(255, 190, 11, 0.45)',
    icon: '👑',
  },
  ray: {
    id: 'ray',
    name: 'Ray',
    role: 'Lead AI Researcher',
    badge: '🔬 AI RESEARCH',
    borderColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.2)',
    badgeColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    icon: '🔬',
  },
  maya: {
    id: 'maya',
    name: 'Maya',
    role: 'UI/UX & Product Designer',
    badge: '🎨 UI/UX DESIGN',
    borderColor: '#ec4899',
    badgeBg: 'rgba(236, 72, 153, 0.2)',
    badgeColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.45)',
    icon: '🎨',
  },
  alex: {
    id: 'alex',
    name: 'Alex',
    role: 'Lead Fullstack Developer',
    badge: '💻 FULLSTACK DEV',
    borderColor: '#f97316',
    badgeBg: 'rgba(249, 115, 22, 0.2)',
    badgeColor: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.45)',
    icon: '💻',
  },

  wendy: {
    id: 'wendy',
    name: 'Wendy',
    role: 'Marketing Strategist & Copywriter',
    badge: '📢 MARKETING',
    borderColor: '#34d399',
    badgeBg: 'rgba(52, 211, 153, 0.2)',
    badgeColor: '#34d399',
    glowColor: 'rgba(52, 211, 153, 0.45)',
    icon: '📢',
  },
  zane: {
    id: 'zane',
    name: 'Zane',
    role: 'Cybersecurity Specialist',
    badge: '🛡️ CYBER SECURITY',
    borderColor: '#22c55e',
    badgeBg: 'rgba(34, 197, 94, 0.2)',
    badgeColor: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.45)',
    icon: '🛡️',
  },
  eah: {
    id: 'eah',
    name: 'Eah Ilagan',
    role: "Executive Partner",
    badge: '✨ EXECUTIVE PARTNER',
    borderColor: '#fb7185',
    badgeBg: 'rgba(251, 113, 133, 0.2)',
    badgeColor: '#fb7185',
    glowColor: 'rgba(251, 113, 133, 0.45)',
    icon: '✨',
  },
  puppy: {
    id: 'puppy',
    name: 'Mochi (Puppy)',
    role: 'Chief Happiness Officer',
    badge: '🐶 FLUFFY PUPPY',
    borderColor: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.2)',
    badgeColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    icon: '🐶',
  },
  cat: {
    id: 'cat',
    name: 'Snowy (White Cat)',
    role: 'Executive Purr Officer',
    badge: '🐱 WHITE KITTY',
    borderColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.2)',
    badgeColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    icon: '🐱',
  },
};

// ============================================================================
// 8-BIT RETRO GAME AUDIO SYNTHESIZER (Pure Web Audio, Zero Dependencies)
// ============================================================================
export function play8BitGameSound(type: 'quest' | 'heart' | 'coin' | 'bark' | 'meow' | 'purr' | 'step' | 'click') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'heart') {
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.08);
        gain.gain.setValueAtTime(0.08, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.22);
      });
    } else if (type === 'quest') {
      const freqs = [392.0, 523.25, 659.25, 783.99];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, now + idx * 0.09);
        gain.gain.setValueAtTime(0.06, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.28);
      });
    } else if (type === 'coin') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    } else if (type === 'bark') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.12);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } else if (type === 'meow') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(940, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.28);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === 'purr') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(75, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch {}
}


// ============================================================================
// LIVING ANIMATED VOXEL PUPPY (MOCHI) - AUTONOMOUS LOUNGE PATROL CIRCUIT
// ============================================================================
export const PUPPY_LOUNGE_CIRCUIT = [
  // 1. Puppy Donut Bed Sanctuary Corner (Resting & drinking water)
  { x: 19.2, z: 14.8, wait: 5.5, activity: 'bed_rest' as const, speech: 'Woof! Mochi is resting by his donut bed 🐾' },
  // 2. Sniffing walkway near Boardroom Glass Partition
  { x: 19.5, z: 16.5, wait: 3.5, activity: 'sniffing' as const, speech: '*Sniff sniff* 🐾 Exploring the warm wooden floor border!' },
  // 3. Strolling past bottom booth towards the caramel table
  { x: 17.2, z: 17.5, wait: 4.0, activity: 'sitting' as const, speech: 'Arf! Happy tail wags by the coffee booth ☕🐶' },
  // 4. Center of the plush teal lounge rug
  { x: 14.5, z: 16.5, wait: 5.0, activity: 'sitting' as const, speech: 'Woof woof! Sitting proudly on the executive rug ✨' },
  // 5. In front of the Espresso Bar counter
  { x: 12.2, z: 17.5, wait: 3.5, activity: 'sniffing' as const, speech: '*Sniffing delicious coffee aroma* Any puppy cookies? 🍪🐾' },
  // 6. Beside the Retro Arcade Machine
  { x: 11.8, z: 15.0, wait: 4.0, activity: 'happy_bark' as const, speech: 'Yip yip! Watching the colorful arcade screen! 🕹️🐶' },
  // 7. North aisle in front of Top Booth
  { x: 13.5, z: 15.8, wait: 3.5, activity: 'sniffing' as const, speech: '*Curious sniffs* Checking out the team lounge 🐾' },
  // 8. Lounging near central sliding glass doors
  { x: 16.8, z: 13.0, wait: 4.0, activity: 'sitting' as const, speech: 'Watching team members come in through the sliding door 🚪🐕' },
  // 9. Back towards the puppy sanctuary bowls
  { x: 18.6, z: 14.0, wait: 4.5, activity: 'sniffing' as const, speech: 'Drinking cool fresh water from his silver bowl! 💧🐶' },
];

export class VoxelPuppy3D {
  public group: THREE.Group;
  public bodyGroup: THREE.Group;
  public tail: THREE.Mesh;
  public headGroup: THREE.Group;
  public earsGroup: THREE.Group;
  public tongue: THREE.Mesh;

  // 4 Articulated Puppy Legs with White Paw Socks
  public legFL: THREE.Group;
  public legFR: THREE.Group;
  public legBL: THREE.Group;
  public legBR: THREE.Group;

  public currentX: number;
  public currentZ: number;
  public isWalking = false;
  public walkCycle = 0;
  public walkSpeed = 1.35; // Energetic, bouncy puppy trotting speed
  public currentActivity: 'patrol' | 'sniffing' | 'sitting' | 'happy_bark' | 'bed_rest' | 'being_pet' = 'bed_rest';
  public waitTimer = 4.0;
  public circuitIndex = 0;
  public pathQueue: Array<{ x: number; z: number }> = [];
  public speechText = '';
  public speechTimer = 0;

  private animTimer = 0;

  constructor(x: number, z: number) {
    this.currentX = x;
    this.currentZ = z;
    this.group = new THREE.Group();
    this.group.position.set(x, 0.02, z);

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const furBlackMat = new THREE.MeshLambertMaterial({ color: 0x18181b });
    const furWhiteMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
    const pinkMat = new THREE.MeshLambertMaterial({ color: 0xf43f5e, emissive: 0xf43f5e, emissiveIntensity: 0.35 });
    const noseMat = new THREE.MeshLambertMaterial({ color: 0x090d16 });
    const collarRedMat = new THREE.MeshLambertMaterial({ color: 0xdc2626 });
    const goldBellMat = new THREE.MeshLambertMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.6 });

    // 1. Articulated Legs (Pivot at hip/shoulder y = 0.22)
    const createLeg = (lx: number, lz: number) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(lx, 0.22, lz);

      // Black leg upper
      const leg = new THREE.Mesh(boxGeo, furBlackMat);
      leg.scale.set(0.11, 0.16, 0.11);
      leg.position.set(0, -0.07, 0);
      leg.castShadow = true;
      legGroup.add(leg);

      // Cute white paw sock
      const paw = new THREE.Mesh(boxGeo, furWhiteMat);
      paw.scale.set(0.12, 0.07, 0.13);
      paw.position.set(0, -0.18, 0.01);
      paw.castShadow = true;
      legGroup.add(paw);

      this.group.add(legGroup);
      return legGroup;
    };

    this.legFL = createLeg(-0.16, -0.14);
    this.legFR = createLeg(0.16, -0.14);
    this.legBL = createLeg(-0.16, 0.14);
    this.legBR = createLeg(0.16, 0.14);

    // 2. Main Body Group (Articulated vertically for playful trotting bounce)
    this.bodyGroup = new THREE.Group();
    this.bodyGroup.position.set(0, 0, 0);
    this.group.add(this.bodyGroup);

    // Puppy Torso
    const body = new THREE.Mesh(boxGeo, furBlackMat);
    body.scale.set(0.54, 0.26, 0.42);
    body.position.set(0, 0.36, 0);
    body.castShadow = true;
    this.bodyGroup.add(body);

    // Fluffy White Chest
    const chest = new THREE.Mesh(boxGeo, furWhiteMat);
    chest.scale.set(0.36, 0.22, 0.14);
    chest.position.set(0, 0.36, -0.18);
    chest.castShadow = true;
    this.bodyGroup.add(chest);

    // Red Collar with Golden Jingle Bell
    const collar = new THREE.Mesh(boxGeo, collarRedMat);
    collar.scale.set(0.38, 0.06, 0.18);
    collar.position.set(0, 0.45, -0.17);
    this.bodyGroup.add(collar);

    const bell = new THREE.Mesh(boxGeo, goldBellMat);
    bell.scale.set(0.07, 0.07, 0.07);
    bell.position.set(0, 0.43, -0.27);
    this.bodyGroup.add(bell);

    // Tail (Articulated at rear)
    this.tail = new THREE.Mesh(boxGeo, furBlackMat);
    this.tail.scale.set(0.11, 0.24, 0.11);
    this.tail.position.set(0, 0.46, 0.22);
    this.tail.rotation.x = 0.55;
    this.tail.castShadow = true;
    this.bodyGroup.add(this.tail);

    // White tip on tail
    const tailTip = new THREE.Mesh(boxGeo, furWhiteMat);
    tailTip.scale.set(0.115, 0.08, 0.115);
    tailTip.position.set(0, 0.10, 0);
    this.tail.add(tailTip);

    // 3. Head Group
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.56, -0.20);
    this.bodyGroup.add(this.headGroup);

    const headMesh = new THREE.Mesh(boxGeo, furBlackMat);
    headMesh.scale.set(0.42, 0.34, 0.36);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Muzzle & Wet Black Nose
    const muzzle = new THREE.Mesh(boxGeo, furWhiteMat);
    muzzle.scale.set(0.24, 0.16, 0.16);
    muzzle.position.set(0, -0.06, -0.20);
    this.headGroup.add(muzzle);

    const nose = new THREE.Mesh(boxGeo, noseMat);
    nose.scale.set(0.08, 0.06, 0.06);
    nose.position.set(0, -0.02, -0.29);
    this.headGroup.add(nose);

    // Cute Anime Puppy Eyes with Sparkling Glint
    [-0.12, 0.12].forEach((ex) => {
      const eye = new THREE.Mesh(boxGeo, noseMat);
      eye.scale.set(0.07, 0.07, 0.04);
      eye.position.set(ex, 0.04, -0.17);
      this.headGroup.add(eye);

      const glint = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
      glint.scale.set(0.025, 0.025, 0.045);
      glint.position.set(ex + 0.02, 0.06, -0.17);
      this.headGroup.add(glint);
    });

    // Rosy Puppy Cheek Blush
    [-0.18, 0.18].forEach((bx) => {
      const blush = new THREE.Mesh(boxGeo, pinkMat);
      blush.scale.set(0.08, 0.04, 0.03);
      blush.position.set(bx, -0.04, -0.16);
      this.headGroup.add(blush);
    });

    // Pink Panting Tongue
    this.tongue = new THREE.Mesh(boxGeo, pinkMat);
    this.tongue.scale.set(0.10, 0.04, 0.08);
    this.tongue.position.set(0, -0.12, -0.24);
    this.headGroup.add(this.tongue);

    // Floppy Puppy Ears with Pink Fluff Inlay
    this.earsGroup = new THREE.Group();
    [-0.16, 0.16].forEach((ex) => {
      const ear = new THREE.Mesh(boxGeo, furBlackMat);
      ear.scale.set(0.10, 0.16, 0.10);
      ear.position.set(ex, 0.20, 0);
      this.earsGroup.add(ear);

      const earFluff = new THREE.Mesh(boxGeo, pinkMat);
      earFluff.scale.set(0.06, 0.12, 0.03);
      earFluff.position.set(ex, 0.19, -0.04);
      this.earsGroup.add(earFluff);
    });
    this.headGroup.add(this.earsGroup);

    // Tag for 3D raycasting and click interaction
    this.group.traverse((obj) => {
      (obj as any).agentId = 'puppy';
    });
  }

  public walkTo(targetX: number, targetZ: number) {
    this.pathQueue = [{ x: targetX, z: targetZ }];
    this.isWalking = true;
  }

  public update(delta: number, isBeingPet = false, onSpeechUpdate?: (text: string, timer: number) => void) {
    this.animTimer += delta;

    if (this.speechTimer > 0) {
      this.speechTimer -= delta;
    }

    // 1. Being Pet Mode: Stop in tracks, face player, enthusiastic tail wag & happy hops
    if (isBeingPet) {
      this.currentActivity = 'being_pet';
      this.isWalking = false;
      this.waitTimer = Math.max(this.waitTimer, 3.5);

      const wagSpeed = 26;
      this.tail.rotation.y = Math.sin(this.animTimer * wagSpeed) * 0.82;
      this.earsGroup.rotation.z = Math.sin(this.animTimer * 10) * 0.14;
      this.headGroup.rotation.y = Math.sin(this.animTimer * 3) * 0.12;
      this.bodyGroup.position.y = Math.abs(Math.sin(this.animTimer * 12)) * 0.06;
      this.tongue.scale.z = 1.35;

      this.legFL.rotation.x *= 0.8;
      this.legFR.rotation.x *= 0.8;
      this.legBL.rotation.x *= 0.8;
      this.legBR.rotation.x *= 0.8;
      return;
    }

    // 2. Moving along Lounge Circuit
    if (this.pathQueue.length > 0) {
      this.isWalking = true;
      const target = this.pathQueue[0];
      const dx = target.x - this.group.position.x;
      const dz = target.z - this.group.position.z;
      const dist = Math.hypot(dx, dz);
      const step = this.walkSpeed * delta;

      // Smooth heading rotation towards walking direction
      const heading = Math.atan2(dx, dz) + Math.PI;
      let diff = heading - this.group.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.group.rotation.y += diff * Math.min(1, delta * 7);

      if (dist <= step) {
        // Reached destination waypoint!
        this.group.position.x = target.x;
        this.group.position.z = target.z;
        this.currentX = target.x;
        this.currentZ = target.z;
        this.pathQueue.shift();

        if (this.pathQueue.length === 0) {
          this.isWalking = false;
          const currentPoint = PUPPY_LOUNGE_CIRCUIT[this.circuitIndex];
          this.currentActivity = currentPoint.activity;
          this.waitTimer = currentPoint.wait;
          this.speechText = currentPoint.speech;
          this.speechTimer = 4.0;
          if (onSpeechUpdate) {
            onSpeechUpdate(currentPoint.speech, 4.0);
          }
        }
      } else {
        this.group.position.x += (dx / dist) * step;
        this.group.position.z += (dz / dist) * step;
        this.currentX = this.group.position.x;
        this.currentZ = this.group.position.z;

        // Energetic 4-Leg Trotting Gait (FL/BR match, FR/BL match)
        this.walkCycle += delta * 12;
        this.legFL.rotation.x = Math.sin(this.walkCycle) * 0.65;
        this.legBR.rotation.x = Math.sin(this.walkCycle) * 0.65;
        this.legFR.rotation.x = -Math.sin(this.walkCycle) * 0.65;
        this.legBL.rotation.x = -Math.sin(this.walkCycle) * 0.65;

        // Playful puppy bounce and lively ear/tail bobbing
        this.bodyGroup.position.y = Math.abs(Math.sin(this.walkCycle)) * 0.035;
        this.bodyGroup.rotation.x = Math.sin(this.walkCycle) * 0.04;
        this.tail.rotation.y = Math.sin(this.walkCycle * 1.5) * 0.55;
        this.earsGroup.rotation.z = Math.sin(this.walkCycle) * 0.10;
        this.headGroup.position.y = 0.56 + Math.sin(this.walkCycle) * 0.02;
        this.headGroup.rotation.x = 0;
        this.tongue.scale.z = 1.0 + Math.sin(this.walkCycle * 2) * 0.2;
      }
    } else {
      // 3. Resting / Idling / Sniffing at Current Lounge Waypoint
      this.isWalking = false;
      this.legFL.rotation.x *= 0.85;
      this.legFR.rotation.x *= 0.85;
      this.legBL.rotation.x *= 0.85;
      this.legBR.rotation.x *= 0.85;
      this.bodyGroup.position.y *= 0.85;

      const wagSpeed = 12;
      this.tail.rotation.y = Math.sin(this.animTimer * wagSpeed) * 0.42;
      this.earsGroup.rotation.z = Math.sin(this.animTimer * 5) * 0.07;
      this.tongue.scale.z = 1.0 + Math.sin(this.animTimer * 10) * 0.20;

      if (this.currentActivity === 'sniffing') {
        // Head down, sniffing ground curiously
        this.headGroup.position.y = 0.46;
        this.headGroup.rotation.x = 0.28 + Math.sin(this.animTimer * 8) * 0.05;
        this.headGroup.rotation.y = Math.sin(this.animTimer * 4) * 0.14;
        this.bodyGroup.rotation.x = 0.06;
      } else if (this.currentActivity === 'sitting') {
        // Sitting posture: hind legs back, head tilted upwards
        this.bodyGroup.rotation.x = -0.16;
        this.bodyGroup.position.y = -0.04;
        this.headGroup.position.y = 0.52;
        this.headGroup.rotation.x = -0.10;
        this.headGroup.rotation.y = Math.sin(this.animTimer * 2) * 0.10;
      } else if (this.currentActivity === 'happy_bark') {
        // Happy head bob and lively yip
        this.headGroup.position.y = 0.58;
        this.headGroup.rotation.x = -0.22 + Math.sin(this.animTimer * 12) * 0.08;
        this.headGroup.rotation.y = Math.sin(this.animTimer * 3) * 0.10;
        this.bodyGroup.rotation.x = 0;
      } else {
        // Normal peaceful idling
        this.headGroup.position.y = 0.56;
        this.headGroup.rotation.x = 0;
        this.headGroup.rotation.y = Math.sin(this.animTimer * 2) * 0.10;
        this.bodyGroup.rotation.x = 0;
      }

      this.waitTimer -= delta;
      if (this.waitTimer <= 0) {
        // Step to next patrol point in the circuit!
        this.circuitIndex = (this.circuitIndex + 1) % PUPPY_LOUNGE_CIRCUIT.length;
        const nextPoint = PUPPY_LOUNGE_CIRCUIT[this.circuitIndex];
        this.walkTo(nextPoint.x, nextPoint.z);
      }
    }
  }
}

// ============================================================================
// LIVING ANIMATED VOXEL WHITE CAT (SNOWY) - AUTONOMOUS EXPLORATION CIRCUIT
// ============================================================================
export const CAT_LOUNGE_CIRCUIT = [
  // 1. Cozy plush cat cushion under the leafy ficus tree
  { x: 18.2, z: 18.8, wait: 6.0, activity: 'napping' as const, speech: 'Purrrrr... Snowy is curled up peacefully in her plush cat basket 💤🤍' },
  // 2. Center of plush teal lounge rug - grooming paws
  { x: 15.5, z: 16.5, wait: 4.5, activity: 'grooming' as const, speech: '*Grooms white paws with pink tongue* Grooming time! 🐱🐾' },
  // 3. Beside espresso bar - stretching
  { x: 12.0, z: 18.0, wait: 4.0, activity: 'stretching' as const, speech: '*Big arching cat stretch* Mew! Smells like fresh espresso beans ☕✨' },
  // 4. Sunbathing near the garden glass door
  { x: 8.5, z: 16.0, wait: 5.0, activity: 'curious' as const, speech: '*Stares curiously through garden glass* Chirp chirp... 🌿🐦' },
  // 5. Peeking through Dylan\'s CEO Suite door
  { x: 10.8, z: 8.8, wait: 4.0, activity: 'sitting' as const, speech: 'Meow! Checking in on CEO Dylan Ramos at his executive desk 💼🐱' },
  // 6. Beside the retro arcade cabinet
  { x: 11.2, z: 14.5, wait: 3.5, activity: 'sitting' as const, speech: '*Bats playfully at arcade joystick shadows* Nyaa! 🕹️✨' },
  // 7. Playful visit with Mochi the puppy
  { x: 18.5, z: 14.2, wait: 5.0, activity: 'purring' as const, speech: 'Purrr! Snuggling close to Mochi the puppy 🐶🤍🐱' },
  // 8. Strolling gracefully along the acoustic wood wall
  { x: 19.5, z: 16.0, wait: 4.0, activity: 'walking' as const, speech: 'Mew mew! Silent ninja stealth walk along the wood slat wall 🐾' },
];

export class VoxelCat3D {
  public group: THREE.Group;
  public bodyGroup: THREE.Group;
  public tailGroup: THREE.Group;
  public tail1: THREE.Mesh;
  public tail2: THREE.Mesh;
  public tail3: THREE.Mesh;
  public headGroup: THREE.Group;
  public earsGroup: THREE.Group;
  public whiskersGroup: THREE.Group;

  // 4 Articulated Sleek White Legs with Pink Paw Pads
  public legFL: THREE.Group;
  public legFR: THREE.Group;
  public legBL: THREE.Group;
  public legBR: THREE.Group;

  public currentX: number;
  public currentZ: number;
  public isWalking = false;
  public walkCycle = 0;
  public walkSpeed = 1.25; // Smooth, silent feline stalk & trot
  public currentActivity: 'napping' | 'grooming' | 'stretching' | 'sitting' | 'curious' | 'purring' | 'walking' | 'being_pet' = 'napping';
  public waitTimer = 5.0;
  public circuitIndex = 0;
  public pathQueue: Array<{ x: number; z: number }> = [];
  public speechText = '';
  public speechTimer = 0;

  private animTimer = 0;

  constructor(x: number, z: number) {
    this.currentX = x;
    this.currentZ = z;
    this.group = new THREE.Group();
    this.group.position.set(x, 0.02, z);

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const furWhiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const furCreamMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
    const pinkMat = new THREE.MeshLambertMaterial({ color: 0xf472b6, emissive: 0xf472b6, emissiveIntensity: 0.3 });
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.55 });
    const pupilMat = new THREE.MeshLambertMaterial({ color: 0x090d16 });
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const collarSkyMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8 });
    const silverBellMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0, emissive: 0xe2e8f0, emissiveIntensity: 0.45 });
    const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });

    // 1. Articulated Legs (Pivot at hip/shoulder y = 0.20)
    const createCatLeg = (lx: number, lz: number) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(lx, 0.20, lz);

      // Slender pure white leg
      const leg = new THREE.Mesh(boxGeo, furWhiteMat);
      leg.scale.set(0.09, 0.16, 0.09);
      leg.position.set(0, -0.06, 0);
      leg.castShadow = true;
      legGroup.add(leg);

      // White paw with pink pad underneath
      const paw = new THREE.Mesh(boxGeo, furCreamMat);
      paw.scale.set(0.10, 0.05, 0.11);
      paw.position.set(0, -0.15, 0.01);
      paw.castShadow = true;
      legGroup.add(paw);

      const pad = new THREE.Mesh(boxGeo, pinkMat);
      pad.scale.set(0.07, 0.015, 0.07);
      pad.position.set(0, -0.178, 0.01);
      legGroup.add(pad);

      this.group.add(legGroup);
      return legGroup;
    };

    this.legFL = createCatLeg(-0.13, -0.13);
    this.legFR = createCatLeg(0.13, -0.13);
    this.legBL = createCatLeg(-0.13, 0.13);
    this.legBR = createCatLeg(0.13, 0.13);

    // 2. Main Body Group
    this.bodyGroup = new THREE.Group();
    this.bodyGroup.position.set(0, 0, 0);
    this.group.add(this.bodyGroup);

    // Sleek white cat torso
    const body = new THREE.Mesh(boxGeo, furWhiteMat);
    body.scale.set(0.44, 0.22, 0.40);
    body.position.set(0, 0.32, 0);
    body.castShadow = true;
    this.bodyGroup.add(body);

    // Soft cream chest & belly fluff
    const chest = new THREE.Mesh(boxGeo, furCreamMat);
    chest.scale.set(0.32, 0.18, 0.12);
    chest.position.set(0, 0.32, -0.16);
    this.bodyGroup.add(chest);

    // Sky-blue collar with tiny silver jingle bell
    const collar = new THREE.Mesh(boxGeo, collarSkyMat);
    collar.scale.set(0.32, 0.04, 0.14);
    collar.position.set(0, 0.39, -0.15);
    this.bodyGroup.add(collar);

    const bell = new THREE.Mesh(boxGeo, silverBellMat);
    bell.scale.set(0.05, 0.05, 0.05);
    bell.position.set(0, 0.37, -0.23);
    this.bodyGroup.add(bell);

    // 3. Graceful Articulated S-Curved Tail
    this.tailGroup = new THREE.Group();
    this.tailGroup.position.set(0, 0.38, 0.20);
    this.bodyGroup.add(this.tailGroup);

    // Tail segment 1 (base, pointing slightly up & back)
    this.tail1 = new THREE.Mesh(boxGeo, furWhiteMat);
    this.tail1.scale.set(0.07, 0.15, 0.07);
    this.tail1.position.set(0, 0.07, 0.04);
    this.tail1.rotation.x = 0.45;
    this.tailGroup.add(this.tail1);

    // Tail segment 2 (mid, curving higher)
    this.tail2 = new THREE.Mesh(boxGeo, furWhiteMat);
    this.tail2.scale.set(0.065, 0.15, 0.065);
    this.tail2.position.set(0, 0.18, 0.10);
    this.tail2.rotation.x = 0.75;
    this.tailGroup.add(this.tail2);

    // Tail segment 3 (tip, curving forward like a question mark)
    this.tail3 = new THREE.Mesh(boxGeo, furCreamMat);
    this.tail3.scale.set(0.06, 0.12, 0.06);
    this.tail3.position.set(0, 0.28, 0.12);
    this.tail3.rotation.x = 0.20;
    this.tailGroup.add(this.tail3);

    // 4. Head Group
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.48, -0.18);
    this.bodyGroup.add(this.headGroup);

    // White cat head
    const headMesh = new THREE.Mesh(boxGeo, furWhiteMat);
    headMesh.scale.set(0.36, 0.28, 0.30);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Small cute muzzle
    const muzzle = new THREE.Mesh(boxGeo, furCreamMat);
    muzzle.scale.set(0.20, 0.12, 0.12);
    muzzle.position.set(0, -0.05, -0.16);
    this.headGroup.add(muzzle);

    // Tiny pink cat nose
    const nose = new THREE.Mesh(boxGeo, pinkMat);
    nose.scale.set(0.05, 0.04, 0.04);
    nose.position.set(0, -0.02, -0.23);
    this.headGroup.add(nose);

    // Emerald Green Cat Eyes with vertical pupils & glints
    [-0.10, 0.10].forEach((ex) => {
      // Emerald iris
      const eye = new THREE.Mesh(boxGeo, eyeMat);
      eye.scale.set(0.07, 0.07, 0.03);
      eye.position.set(ex, 0.04, -0.14);
      this.headGroup.add(eye);

      // Slit pupil
      const pupil = new THREE.Mesh(boxGeo, pupilMat);
      pupil.scale.set(0.022, 0.055, 0.035);
      pupil.position.set(ex, 0.04, -0.145);
      this.headGroup.add(pupil);

      // Cute white catchlight glint
      const glint = new THREE.Mesh(boxGeo, glintMat);
      glint.scale.set(0.02, 0.02, 0.04);
      glint.position.set(ex + 0.02, 0.055, -0.15);
      this.headGroup.add(glint);
    });

    // Pointed Triangular Cat Ears with Pink Fluff Inlay
    this.earsGroup = new THREE.Group();
    [-0.13, 0.13].forEach((ex) => {
      const ear = new THREE.Mesh(boxGeo, furWhiteMat);
      ear.scale.set(0.09, 0.14, 0.08);
      ear.position.set(ex, 0.18, -0.02);
      ear.rotation.z = ex < 0 ? 0.20 : -0.20;
      this.earsGroup.add(ear);

      const earFluff = new THREE.Mesh(boxGeo, pinkMat);
      earFluff.scale.set(0.05, 0.09, 0.02);
      earFluff.position.set(ex, 0.17, -0.055);
      earFluff.rotation.z = ex < 0 ? 0.20 : -0.20;
      this.earsGroup.add(earFluff);
    });
    this.headGroup.add(this.earsGroup);

    // Whiskers (Left & Right)
    this.whiskersGroup = new THREE.Group();
    [-1, 1].forEach((side) => {
      [-0.02, 0.02].forEach((wy) => {
        const whisker = new THREE.Mesh(boxGeo, whiskerMat);
        whisker.scale.set(0.12, 0.01, 0.01);
        whisker.position.set(side * 0.16, -0.05 + wy, -0.18);
        whisker.rotation.z = side * wy * 1.5;
        this.whiskersGroup.add(whisker);
      });
    });
    this.headGroup.add(this.whiskersGroup);

    // Tag for 3D raycasting and click interaction
    this.group.traverse((obj) => {
      (obj as any).agentId = 'cat';
    });
  }

  public walkTo(targetX: number, targetZ: number) {
    this.pathQueue = [{ x: targetX, z: targetZ }];
    this.isWalking = true;
  }

  public update(delta: number, isBeingPet = false, onSpeechUpdate?: (text: string, timer: number) => void) {
    this.animTimer += delta;

    if (this.speechTimer > 0) {
      this.speechTimer -= delta;
    }

    // 1. Being Pet Mode: Arch back, head bonk into hand, happy tail question mark curl
    if (isBeingPet) {
      this.currentActivity = 'being_pet';
      this.isWalking = false;
      this.waitTimer = Math.max(this.waitTimer, 3.5);

      this.bodyGroup.position.y = 0.03 + Math.sin(this.animTimer * 6) * 0.02;
      this.bodyGroup.rotation.x = -0.10; // arched back
      this.headGroup.position.y = 0.52;
      this.headGroup.rotation.x = -0.22; // chin up for scratches
      this.headGroup.rotation.y = Math.sin(this.animTimer * 4) * 0.10;
      this.tailGroup.rotation.x = 0.35 + Math.sin(this.animTimer * 5) * 0.15;
      this.tailGroup.rotation.y = Math.sin(this.animTimer * 8) * 0.35;
      this.earsGroup.rotation.z = Math.sin(this.animTimer * 4) * 0.06;

      this.legFL.rotation.x *= 0.8;
      this.legFR.rotation.x *= 0.8;
      this.legBL.rotation.x *= 0.8;
      this.legBR.rotation.x *= 0.8;
      return;
    }

    // 2. Moving along Circuit
    if (this.pathQueue.length > 0) {
      this.isWalking = true;
      const target = this.pathQueue[0];
      const dx = target.x - this.group.position.x;
      const dz = target.z - this.group.position.z;
      const dist = Math.hypot(dx, dz);
      const step = this.walkSpeed * delta;

      const heading = Math.atan2(dx, dz) + Math.PI;
      let diff = heading - this.group.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.group.rotation.y += diff * Math.min(1, delta * 6);

      if (dist <= step) {
        this.group.position.x = target.x;
        this.group.position.z = target.z;
        this.currentX = target.x;
        this.currentZ = target.z;
        this.pathQueue.shift();

        if (this.pathQueue.length === 0) {
          this.isWalking = false;
          const currentPoint = CAT_LOUNGE_CIRCUIT[this.circuitIndex];
          this.currentActivity = currentPoint.activity;
          this.waitTimer = currentPoint.wait;
          this.speechText = currentPoint.speech;
          this.speechTimer = 4.0;
          if (onSpeechUpdate) {
            onSpeechUpdate(currentPoint.speech, 4.0);
          }
        }
      } else {
        this.group.position.x += (dx / dist) * step;
        this.group.position.z += (dz / dist) * step;
        this.currentX = this.group.position.x;
        this.currentZ = this.group.position.z;

        // Feline Stealth Walk Gait
        this.walkCycle += delta * 10;
        this.legFL.rotation.x = Math.sin(this.walkCycle) * 0.55;
        this.legBR.rotation.x = Math.sin(this.walkCycle) * 0.55;
        this.legFR.rotation.x = -Math.sin(this.walkCycle) * 0.55;
        this.legBL.rotation.x = -Math.sin(this.walkCycle) * 0.55;

        // Feline spine flex & graceful tail swaying
        this.bodyGroup.position.y = Math.abs(Math.sin(this.walkCycle)) * 0.02;
        this.bodyGroup.rotation.y = Math.sin(this.walkCycle * 0.5) * 0.04;
        this.tailGroup.rotation.y = Math.sin(this.walkCycle * 0.8) * 0.45;
        this.headGroup.position.y = 0.48 + Math.sin(this.walkCycle) * 0.015;
        this.headGroup.rotation.x = 0;
      }
    } else {
      // 3. Resting / Idling / Napping / Grooming at Waypoint
      this.isWalking = false;
      this.legFL.rotation.x *= 0.85;
      this.legFR.rotation.x *= 0.85;
      this.legBL.rotation.x *= 0.85;
      this.legBR.rotation.x *= 0.85;
      this.bodyGroup.position.y *= 0.85;

      const tailSway = Math.sin(this.animTimer * 2.5) * 0.35;
      this.tailGroup.rotation.y = tailSway;

      if (this.currentActivity === 'napping') {
        // Curled donut nap on cushion
        this.bodyGroup.position.y = -0.06;
        this.bodyGroup.rotation.x = -0.12;
        this.headGroup.position.y = 0.40;
        this.headGroup.rotation.x = 0.18;
        this.headGroup.rotation.y = 0.45;
        this.tailGroup.rotation.y = 0.75;
      } else if (this.currentActivity === 'grooming') {
        // Raising front paw to lick face
        this.legFL.rotation.x = 0.85 + Math.sin(this.animTimer * 6) * 0.15;
        this.headGroup.position.y = 0.44;
        this.headGroup.rotation.x = 0.20;
        this.headGroup.rotation.y = -0.25 + Math.sin(this.animTimer * 6) * 0.08;
      } else if (this.currentActivity === 'stretching') {
        // Classic cat stretch: front down, back arched
        this.bodyGroup.position.y = -0.02;
        this.bodyGroup.rotation.x = 0.22;
        this.tailGroup.rotation.x = -0.55;
        this.headGroup.position.y = 0.42;
        this.headGroup.rotation.x = 0.15;
      } else if (this.currentActivity === 'sitting') {
        // Sphinx / loaf posture
        this.bodyGroup.position.y = -0.04;
        this.bodyGroup.rotation.x = -0.12;
        this.headGroup.position.y = 0.48;
        this.headGroup.rotation.x = -0.08;
        this.headGroup.rotation.y = Math.sin(this.animTimer * 1.5) * 0.08;
      } else {
        // Normal alert standing/sitting
        this.headGroup.position.y = 0.48;
        this.headGroup.rotation.x = 0;
        this.headGroup.rotation.y = Math.sin(this.animTimer * 2) * 0.10;
        this.bodyGroup.rotation.x = 0;
      }

      this.waitTimer -= delta;
      if (this.waitTimer <= 0) {
        this.circuitIndex = (this.circuitIndex + 1) % CAT_LOUNGE_CIRCUIT.length;
        const nextPoint = CAT_LOUNGE_CIRCUIT[this.circuitIndex];
        this.walkTo(nextPoint.x, nextPoint.z);
      }
    }
  }
}

// ============================================================================
// 3D VOXEL CHARACTER CLASS (ALL 5 MEMBERS: DYLAN + 4 WORKERS)
// ============================================================================
export class VoxelCharacter3D {
  public id: string;
  public name: string;
  public group: THREE.Group;
  public currentX: number;
  public currentZ: number;
  public deskX: number;
  public deskZ: number;
  public seatX: number;
  public seatZ: number;
  public status = 'idle';
  public isSeated = true;
  public routineTimer = 10;
  public waitTimer = 0;
  public currentActivity:
    | 'idle'
    | 'working'
    | 'sofa_relax'
    | 'playing_arcade'
    | 'playing_billiards'
    | 'kitchen_work'
    | 'garden_relax'
    | 'drinking_water'
    | 'drinking_coffee'
    | 'meeting'
    | 'kitchen_cooking'
    | 'delivering_food'
    | 'delivering_coffee'
    | 'brewing_coffee'
    | 'petting_puppy'
    | 'delivering_flowers'
    | 'giving_flowers'
    | 'server_audit'
    | 'crash_cart_diagnostics'
    | 'threat_map_review'
    | 'reporting_to_ceo' = 'idle';

  public eahStep:
    | 'relaxing'
    | 'cook_walk'
    | 'cooking'
    | 'deliver_food_walk'
    | 'serving_food'
    | 'coffee_walk'
    | 'brewing'
    | 'deliver_coffee_walk'
    | 'serving_coffee'
    | 'puppy_walk'
    | 'petting_puppy'
    | 'return_armchair' = 'relaxing';
  public eahCycleCount = 0;

  // Dylan Caring Routines for Eah ("Just to Be Fair" 💖💐)
  public dylanStep:
    | 'idle'
    | 'flower_walk'
    | 'giving_flowers'
    | 'cook_walk'
    | 'cooking'
    | 'deliver_food_walk'
    | 'serving_food'
    | 'return_desk' = 'idle';
  public dylanCycleCount = 0;

  private upperBodyGroup: THREE.Group;
  private head: THREE.Mesh;
  private torso: THREE.Mesh;
  private leftLegGroup: THREE.Group;
  private rightLegGroup: THREE.Group;
  private leftKneeGroup: THREE.Group;
  private rightKneeGroup: THREE.Group;
  private leftFootGroup: THREE.Group;
  private rightFootGroup: THREE.Group;
  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private laptopGroup: THREE.Group;
  private lapScreenPivot: THREE.Group;
  private lapCursor: THREE.Mesh | null = null;
  private lapCodeLines: THREE.Mesh[] = [];
  private lapGlowLight: THREE.PointLight | null = null;
  private drinkPropGroup: THREE.Group;
  private coffeeMug: THREE.Mesh;
  private waterCup: THREE.Mesh;
  private cueStickGroup: THREE.Group;
  private tabletGroup: THREE.Group;
  public skilletGroup: THREE.Group;
  public servingTrayGroup: THREE.Group;
  public trayPlate: THREE.Group;
  public trayCoffee: THREE.Group;
  public flowerBouquetGroup: THREE.Group;
  public speechText = '';
  public speechTimer = 0;
  private selectionRing: THREE.Mesh;
  private statusParticles: THREE.Group;

  // Ground contact drop shadow
  private groundShadow: THREE.Mesh;

  public pathQueue: Array<{ x: number; z: number }> = [];
  public isWalking = false;
  public sitTransition = 1.0; // 0.0 = standing upright, 1.0 = seated at desk
  private animTimer = Math.random() * 10;

  constructor(
    id: string,
    name: string,
    shirtColor: number,
    hairColor: number,
    initialX: number,
    initialZ: number,
    deskX: number,
    deskZ: number,
    seatX: number,
    seatZ: number
  ) {
    this.id = id;
    this.name = name;
    this.currentX = initialX;
    this.currentZ = initialZ;
    this.deskX = deskX;
    this.deskZ = deskZ;
    this.seatX = seatX;
    this.seatZ = seatZ;

    this.group = new THREE.Group();
    this.group.position.set(initialX, 0, initialZ);
    // Dylan faces South (+z, towards door); Eah faces East-Southeast (+x/+z, towards Dylan & suite); bullpen specialists face North (-z, towards desk)
    this.group.rotation.y = id === 'dylan' ? 0 : id === 'eah' ? Math.PI * 0.42 : Math.PI;

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffdfba });
    const shirtMat = new THREE.MeshLambertMaterial({ color: shirtColor });
    const hairMat = new THREE.MeshLambertMaterial({ color: hairColor });
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const eyeFrameMat = new THREE.MeshLambertMaterial({ color: 0x090d16 });
    const eyeSparkleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const blushMat = new THREE.MeshLambertMaterial({
      color: 0xfb7185,
      emissive: 0xfb7185,
      emissiveIntensity: 0.35,
    });
    const smileMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
    const eyebrowMat = new THREE.MeshLambertMaterial({ color: hairColor });

    // Iris colors tailored to character personality:
    const irisColors: Record<string, number> = {
      dylan: 0x451a03, // Rich warm hazel-brown
      eah: 0x78350f,   // Sparkling chocolate amber
      ray: 0x0284c7,   // Sapphire cyan
      maya: 0xdb2777,  // Vibrant designer magenta
      alex: 0x2563eb,  // Electric coder blue
      wendy: 0x059669, // Forest emerald
      zane: 0x475569,  // Steel grey
    };
    const irisMat = new THREE.MeshLambertMaterial({ color: irisColors[id] || 0x090d16 });

    // Distinct character shoes with high-contrast soles for crystal-clear walking steps
    let shoeColor = 0x9a3412; // Dylan: Rich cognac leather
    let soleColor = 0xfef3c7; // Cream welt sole
    if (id === 'eah') {
      shoeColor = 0xf43f5e; // Eah: Rose pink stylish shoes
      soleColor = 0xfff1f2; // Soft white sole
    } else if (id === 'ray') {
      shoeColor = 0xffffff; // Ray: Crisp white sneakers
      soleColor = 0x0f172a; // Dark athletic rubber tread
    } else if (id === 'maya') {
      shoeColor = 0xec4899; // Maya: Designer magenta sneakers
      soleColor = 0xfdf2f8; // Clean white/pink sole
    } else if (id === 'alex') {
      shoeColor = 0xea580c; // Alex: Orange skate sneakers
      soleColor = 0xfff7ed; // Cream sole
    } else if (id === 'zane') {
      shoeColor = 0x15803d; // Zane: Tactical military dark boots
      soleColor = 0x0f172a; // Dark stealth tread
    } else if (id === 'wendy') {
      shoeColor = 0xb45309; // Wendy: Warm caramel leather
      soleColor = 0xffffff; // Clean white sole
    }
    const shoeMat = new THREE.MeshLambertMaterial({ color: shoeColor });
    const soleMat = new THREE.MeshLambertMaterial({ color: soleColor });

    // ==========================================
    // UPPER BODY GROUP (Bounces & sways together)
    // ==========================================
    this.upperBodyGroup = new THREE.Group();
    this.group.add(this.upperBodyGroup);

    // Torso Base
    this.torso = new THREE.Mesh(boxGeo, shirtMat);
    this.torso.scale.set(0.65, 0.62, 0.42);
    this.torso.position.y = 0.9;
    this.torso.castShadow = true;
    this.upperBodyGroup.add(this.torso);

    // Torso Clothing & Accessories based on role:
    if (id === 'dylan') {
      // White dress shirt collar notch
      const collarMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
      const collar = new THREE.Mesh(boxGeo, collarMat);
      collar.scale.set(0.24, 0.12, 0.05);
      collar.position.set(0, 1.15, 0.21);
      this.upperBodyGroup.add(collar);

      // CEO Navy Silk Tie
      const tieMat = new THREE.MeshLambertMaterial({ color: 0x1d4ed8 });
      const tie = new THREE.Mesh(boxGeo, tieMat);
      tie.scale.set(0.10, 0.38, 0.03);
      tie.position.set(0, 0.96, 0.22);
      this.upperBodyGroup.add(tie);

      // Founder Gold Lapel Crown Pin
      const pinMat = new THREE.MeshLambertMaterial({
        color: 0xffbe0b,
        emissive: 0xffbe0b,
        emissiveIntensity: 0.7,
      });
      const pin = new THREE.Mesh(boxGeo, pinMat);
      pin.scale.set(0.11, 0.11, 0.04);
      pin.position.set(0.18, 1.05, 0.22);
      this.upperBodyGroup.add(pin);

      // White pocket square
      const pocketSquare = new THREE.Mesh(boxGeo, collarMat);
      pocketSquare.scale.set(0.10, 0.04, 0.03);
      pocketSquare.position.set(-0.18, 1.05, 0.22);
      this.upperBodyGroup.add(pocketSquare);

      // Gold Belt Buckle
      const buckle = new THREE.Mesh(boxGeo, pinMat);
      buckle.scale.set(0.12, 0.06, 0.04);
      buckle.position.set(0, 0.61, 0.21);
      this.upperBodyGroup.add(buckle);

    } else if (id === 'eah') {
      // Soft cream frill collar
      const creamMat = new THREE.MeshLambertMaterial({ color: 0xffedd5 });
      const collar = new THREE.Mesh(boxGeo, creamMat);
      collar.scale.set(0.36, 0.08, 0.28);
      collar.position.set(0, 1.18, 0.08);
      this.upperBodyGroup.add(collar);

      // 3D Gold Heart Pendant Necklace
      const goldMat = new THREE.MeshLambertMaterial({
        color: 0xffbe0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.5,
      });
      const heartPendant = new THREE.Mesh(boxGeo, goldMat);
      heartPendant.scale.set(0.08, 0.08, 0.04);
      heartPendant.position.set(0, 1.13, 0.23);
      this.upperBodyGroup.add(heartPendant);

      // Rose Gold Belt
      const roseBelt = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xf43f5e }));
      roseBelt.scale.set(0.66, 0.06, 0.43);
      roseBelt.position.set(0, 0.61, 0);
      this.upperBodyGroup.add(roseBelt);

    } else if (id === 'alex') {
      // Orange hoodie drawstrings
      const cordMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
      [-0.08, 0.08].forEach((cx) => {
        const cord = new THREE.Mesh(boxGeo, cordMat);
        cord.scale.set(0.025, 0.22, 0.03);
        cord.position.set(cx, 0.98, 0.22);
        this.upperBodyGroup.add(cord);
      });
      // Kangaroo pocket
      const pocketMat = new THREE.MeshLambertMaterial({ color: 0xc2410c });
      const pocket = new THREE.Mesh(boxGeo, pocketMat);
      pocket.scale.set(0.40, 0.18, 0.04);
      pocket.position.set(0, 0.78, 0.22);
      this.upperBodyGroup.add(pocket);

    } else if (id === 'maya') {
      // Designer layered vest & scarf
      const scarfMat = new THREE.MeshLambertMaterial({ color: 0xfce7f3 });
      const scarf = new THREE.Mesh(boxGeo, scarfMat);
      scarf.scale.set(0.32, 0.08, 0.24);
      scarf.position.set(0, 1.18, 0.09);
      this.upperBodyGroup.add(scarf);
    } else if (id === 'ray') {
      // White lab coat lapels & ID badge lanyard
      const coatMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
      [-0.20, 0.20].forEach((lx) => {
        const lapel = new THREE.Mesh(boxGeo, coatMat);
        lapel.scale.set(0.12, 0.58, 0.04);
        lapel.position.set(lx, 0.90, 0.21);
        this.upperBodyGroup.add(lapel);
      });
      // ID Badge lanyard
      const idMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.6 });
      const idBadge = new THREE.Mesh(boxGeo, idMat);
      idBadge.scale.set(0.12, 0.16, 0.03);
      idBadge.position.set(0, 0.88, 0.23);
      this.upperBodyGroup.add(idBadge);
    } else if (id === 'wendy') {
      // Mint tailored jacket collar
      const blouseMat = new THREE.MeshLambertMaterial({ color: 0xf0fdf4 });
      const blouse = new THREE.Mesh(boxGeo, blouseMat);
      blouse.scale.set(0.24, 0.12, 0.04);
      blouse.position.set(0, 1.15, 0.21);
      this.upperBodyGroup.add(blouse);
    } else if (id === 'zane') {
      // Tactical dark utility harness & cyber buckle
      const strapMat = new THREE.MeshLambertMaterial({ color: 0x090d16 });
      const strap = new THREE.Mesh(boxGeo, strapMat);
      strap.scale.set(0.58, 0.07, 0.04);
      strap.position.set(0, 0.96, 0.22);
      this.upperBodyGroup.add(strap);

      const cyberBuckleMat = new THREE.MeshLambertMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.8 });
      const cyberBuckle = new THREE.Mesh(boxGeo, cyberBuckleMat);
      cyberBuckle.scale.set(0.09, 0.09, 0.05);
      cyberBuckle.position.set(0, 0.96, 0.23);
      this.upperBodyGroup.add(cyberBuckle);
    }

    // Head Base
    this.head = new THREE.Mesh(boxGeo, skinMat);
    this.head.scale.set(0.50, 0.50, 0.50);
    this.head.position.y = 1.46;
    this.head.castShadow = true;
    this.upperBodyGroup.add(this.head);

    // ==========================================
    // ANIME VOXEL FACE (Big expressive eyes, glint, blush, eyebrows, smile)
    // ==========================================
    const faceZ = 0.255;

    // Eyebrows
    [-0.13, 0.13].forEach((bx) => {
      const eyebrow = new THREE.Mesh(boxGeo, eyebrowMat);
      eyebrow.scale.set(0.12, 0.035, 0.025);
      eyebrow.position.set(bx, 1.60, faceZ);
      this.upperBodyGroup.add(eyebrow);
    });

    // Big Anime Eyes (Outer Frame + Iris + White Sparkle Glint + Secondary Glimmer)
    [-0.13, 0.13].forEach((ex, idx) => {
      // Dark contour/lash
      const eyeFrame = new THREE.Mesh(boxGeo, eyeFrameMat);
      eyeFrame.scale.set(0.13, 0.14, 0.02);
      eyeFrame.position.set(ex, 1.48, faceZ);
      this.upperBodyGroup.add(eyeFrame);

      // Iris
      const iris = new THREE.Mesh(boxGeo, irisMat);
      iris.scale.set(0.09, 0.09, 0.025);
      iris.position.set(ex, 1.47, faceZ + 0.005);
      this.upperBodyGroup.add(iris);

      // Top-Outer Corner White Sparkle Glint (Anime shine)
      const glintX = idx === 0 ? ex - 0.025 : ex + 0.025;
      const glint = new THREE.Mesh(boxGeo, eyeSparkleMat);
      glint.scale.set(0.04, 0.04, 0.03);
      glint.position.set(glintX, 1.50, faceZ + 0.01);
      this.upperBodyGroup.add(glint);

      // Bottom-Inner Corner Subtle Glimmer
      const glimX = idx === 0 ? ex + 0.025 : ex - 0.025;
      const glim = new THREE.Mesh(boxGeo, eyeSparkleMat);
      glim.scale.set(0.025, 0.025, 0.03);
      glim.position.set(glimX, 1.44, faceZ + 0.01);
      this.upperBodyGroup.add(glim);
    });

    // Rosy Cheeks (Blush)
    [-0.16, 0.16].forEach((cx) => {
      const blush = new THREE.Mesh(boxGeo, blushMat);
      blush.scale.set(0.10, 0.045, 0.02);
      blush.position.set(cx, 1.38, faceZ);
      this.upperBodyGroup.add(blush);
    });

    // Smile Line
    const smile = new THREE.Mesh(boxGeo, smileMat);
    smile.scale.set(0.09, 0.025, 0.02);
    smile.position.set(0, 1.33, faceZ);
    this.upperBodyGroup.add(smile);

    // ==========================================
    // LAYERED 3D VOXEL HAIR & ACCESSORIES
    // ==========================================
    // 1. Crown Top Volume
    const hairCrown = new THREE.Mesh(boxGeo, hairMat);
    hairCrown.scale.set(0.56, 0.22, 0.56);
    hairCrown.position.set(0, 1.64, 0);
    this.upperBodyGroup.add(hairCrown);

    // Top Highlight Volume Step
    const hairHighlightMat = new THREE.MeshLambertMaterial({
      color: id === 'eah' ? 0x9a3412 : id === 'dylan' ? 0x5c3317 : hairColor,
    });
    const hairTopStep = new THREE.Mesh(boxGeo, hairHighlightMat);
    hairTopStep.scale.set(0.38, 0.05, 0.38);
    hairTopStep.position.set(0, 1.74, 0);
    this.upperBodyGroup.add(hairTopStep);

    // Back Hair Dome
    const hairBack = new THREE.Mesh(boxGeo, hairMat);
    hairBack.scale.set(0.56, 0.48, 0.22);
    hairBack.position.set(0, 1.36, -0.22);
    this.upperBodyGroup.add(hairBack);

    // Left & Right Side Hair / Temples
    [-0.26, 0.26].forEach((sx) => {
      const sideHair = new THREE.Mesh(boxGeo, hairMat);
      sideHair.scale.set(0.08, 0.38, 0.38);
      sideHair.position.set(sx, 1.42, 0);
      this.upperBodyGroup.add(sideHair);
    });

    // Front 3D Bangs (Layered Voxel Locks framing forehead)
    const bangsCenter = new THREE.Mesh(boxGeo, hairMat);
    bangsCenter.scale.set(0.24, 0.14, 0.10);
    bangsCenter.position.set(0, 1.61, 0.23);
    this.upperBodyGroup.add(bangsCenter);

    const bangsLeft = new THREE.Mesh(boxGeo, hairMat);
    bangsLeft.scale.set(0.16, 0.18, 0.10);
    bangsLeft.position.set(-0.16, 1.57, 0.23);
    this.upperBodyGroup.add(bangsLeft);

    const bangsRight = new THREE.Mesh(boxGeo, hairMat);
    bangsRight.scale.set(0.16, 0.16, 0.10);
    bangsRight.position.set(0.16, 1.58, 0.23);
    this.upperBodyGroup.add(bangsRight);

    // Character-Specific Hair & Head Accessories:
    if (id === 'dylan') {
      // Gold Wireframe Spectacles (Rims + Bridge)
      const glassesMat = new THREE.MeshLambertMaterial({
        color: 0xffbe0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.6,
      });
      [-0.13, 0.13].forEach((gx) => {
        const rim = new THREE.Mesh(boxGeo, glassesMat);
        rim.scale.set(0.15, 0.14, 0.03);
        rim.position.set(gx, 1.48, 0.27);
        this.upperBodyGroup.add(rim);
      });
      const bridge = new THREE.Mesh(boxGeo, glassesMat);
      bridge.scale.set(0.10, 0.025, 0.03);
      bridge.position.set(0, 1.49, 0.27);
      this.upperBodyGroup.add(bridge);

    } else if (id === 'eah') {
      // Eah's long front twin cascading locks draped forward over shoulders
      const lockMat = new THREE.MeshLambertMaterial({ color: hairColor });
      const leftLock = new THREE.Mesh(boxGeo, lockMat);
      leftLock.scale.set(0.14, 0.52, 0.16);
      leftLock.position.set(-0.25, 1.25, 0.10);
      this.upperBodyGroup.add(leftLock);

      const rightLock = new THREE.Mesh(boxGeo, lockMat);
      rightLock.scale.set(0.14, 0.52, 0.16);
      rightLock.position.set(0.25, 1.25, 0.10);
      this.upperBodyGroup.add(rightLock);

      // Rear long cascading hair
      const rearLongHair = new THREE.Mesh(boxGeo, lockMat);
      rearLongHair.scale.set(0.56, 0.60, 0.20);
      rearLongHair.position.set(0, 1.18, -0.24);
      this.upperBodyGroup.add(rearLongHair);

      // 3D Rose Flower Ribbon Hairpin
      const rosePetalMat = new THREE.MeshLambertMaterial({
        color: 0xf43f5e,
        emissive: 0xf43f5e,
        emissiveIntensity: 0.7,
      });
      const roseClip = new THREE.Mesh(boxGeo, rosePetalMat);
      roseClip.scale.set(0.14, 0.12, 0.08);
      roseClip.position.set(0.25, 1.62, 0.19);
      this.upperBodyGroup.add(roseClip);

      const leafMat = new THREE.MeshLambertMaterial({ color: 0x15803d });
      const leaf = new THREE.Mesh(boxGeo, leafMat);
      leaf.scale.set(0.06, 0.06, 0.04);
      leaf.position.set(0.31, 1.66, 0.19);
      this.upperBodyGroup.add(leaf);

    } else if (id === 'alex') {
      // 3D Chunky Gamer Headset
      const headsetMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
      const padMat = new THREE.MeshLambertMaterial({
        color: 0xea580c,
        emissive: 0xea580c,
        emissiveIntensity: 0.4,
      });
      const arch = new THREE.Mesh(boxGeo, headsetMat);
      arch.scale.set(0.58, 0.045, 0.10);
      arch.position.set(0, 1.76, 0);
      this.upperBodyGroup.add(arch);

      [-0.29, 0.29].forEach((hx) => {
        const earcup = new THREE.Mesh(boxGeo, padMat);
        earcup.scale.set(0.09, 0.18, 0.18);
        earcup.position.set(hx, 1.48, 0);
        this.upperBodyGroup.add(earcup);
      });

    } else if (id === 'maya') {
      // Round Designer Glasses
      const glassesMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
      [-0.14, 0.14].forEach((gx) => {
        const rim = new THREE.Mesh(boxGeo, glassesMat);
        rim.scale.set(0.16, 0.15, 0.03);
        rim.position.set(gx, 1.48, 0.27);
        this.upperBodyGroup.add(rim);
      });
      const bridge = new THREE.Mesh(boxGeo, glassesMat);
      bridge.scale.set(0.10, 0.025, 0.03);
      bridge.position.set(0, 1.49, 0.27);
      this.upperBodyGroup.add(bridge);

    } else if (id === 'ray') {
      // Smart Researcher Glasses
      const glassesMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8 });
      [-0.13, 0.13].forEach((gx) => {
        const rim = new THREE.Mesh(boxGeo, glassesMat);
        rim.scale.set(0.14, 0.13, 0.03);
        rim.position.set(gx, 1.48, 0.27);
        this.upperBodyGroup.add(rim);
      });
      const bridge = new THREE.Mesh(boxGeo, glassesMat);
      bridge.scale.set(0.08, 0.025, 0.03);
      bridge.position.set(0, 1.49, 0.27);
      this.upperBodyGroup.add(bridge);

    } else if (id === 'wendy') {
      // High Bouncy Ponytail at back
      const ponyMat = new THREE.MeshLambertMaterial({ color: hairColor });
      const ponytail = new THREE.Mesh(boxGeo, ponyMat);
      ponytail.scale.set(0.18, 0.40, 0.18);
      ponytail.position.set(0, 1.50, -0.34);
      ponytail.rotation.x = -0.3;
      this.upperBodyGroup.add(ponytail);

      const scrunchieMat = new THREE.MeshLambertMaterial({ color: 0xec4899 });
      const scrunchie = new THREE.Mesh(boxGeo, scrunchieMat);
      scrunchie.scale.set(0.14, 0.08, 0.14);
      scrunchie.position.set(0, 1.62, -0.28);
      this.upperBodyGroup.add(scrunchie);

    } else if (id === 'zane') {
      // Glowing Neon-Green Cyber Visor over Left Eye
      const visorMat = new THREE.MeshLambertMaterial({
        color: 0x22c55e,
        emissive: 0x22c55e,
        emissiveIntensity: 0.95,
      });
      const visor = new THREE.Mesh(boxGeo, visorMat);
      visor.scale.set(0.18, 0.09, 0.04);
      visor.position.set(-0.13, 1.49, 0.275);
      this.upperBodyGroup.add(visor);
    }

    // Arms (Pivoting from shoulder joints at y = 1.15)
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.42, 1.15, 0);
    const leftArmMesh = new THREE.Mesh(boxGeo, shirtMat);
    leftArmMesh.scale.set(0.18, 0.48, 0.18);
    leftArmMesh.position.set(0, -0.24, 0);
    leftArmMesh.castShadow = true;
    this.leftArmGroup.add(leftArmMesh);
    const leftHand = new THREE.Mesh(boxGeo, skinMat);
    leftHand.scale.set(0.15, 0.12, 0.15);
    leftHand.position.set(0, -0.48, 0);
    this.leftArmGroup.add(leftHand);
    this.upperBodyGroup.add(this.leftArmGroup);

    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.42, 1.15, 0);
    const rightArmMesh = new THREE.Mesh(boxGeo, shirtMat);
    rightArmMesh.scale.set(0.18, 0.48, 0.18);
    rightArmMesh.position.set(0, -0.24, 0);
    rightArmMesh.castShadow = true;
    this.rightArmGroup.add(rightArmMesh);
    const rightHand = new THREE.Mesh(boxGeo, skinMat);
    rightHand.scale.set(0.15, 0.12, 0.15);
    rightHand.position.set(0, -0.48, 0);
    this.rightArmGroup.add(rightHand);
    this.upperBodyGroup.add(this.rightArmGroup);

    // ==========================================
    // ARTICULATED LEGS & FEET (Pivoting from Hip Joint at y = 0.58)
    // ==========================================
    // LEFT LEG (Articulated Hip, Knee, and Foot)
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.18, 0.58, 0);
    const leftThigh = new THREE.Mesh(boxGeo, pantsMat);
    leftThigh.scale.set(0.24, 0.24, 0.24);
    leftThigh.position.set(0, -0.12, 0);
    leftThigh.castShadow = true;
    this.leftLegGroup.add(leftThigh);

    // Left Knee Group (Pivoting at knee y = -0.24)
    this.leftKneeGroup = new THREE.Group();
    this.leftKneeGroup.position.set(0, -0.24, 0);
    const leftCalf = new THREE.Mesh(boxGeo, pantsMat);
    leftCalf.scale.set(0.23, 0.22, 0.23);
    leftCalf.position.set(0, -0.11, 0);
    leftCalf.castShadow = true;
    this.leftKneeGroup.add(leftCalf);

    // Left Foot Group (Pivoting at ankle y = -0.22)
    this.leftFootGroup = new THREE.Group();
    this.leftFootGroup.position.set(0, -0.22, 0);
    const leftShoe = new THREE.Mesh(boxGeo, shoeMat);
    leftShoe.scale.set(0.26, 0.12, 0.36);
    leftShoe.position.set(0, -0.04, 0.06);
    leftShoe.castShadow = true;
    this.leftFootGroup.add(leftShoe);
    const leftToe = new THREE.Mesh(boxGeo, shoeMat);
    leftToe.scale.set(0.24, 0.09, 0.14);
    leftToe.position.set(0, -0.05, 0.20);
    leftToe.castShadow = true;
    this.leftFootGroup.add(leftToe);
    const leftSole = new THREE.Mesh(boxGeo, soleMat);
    leftSole.scale.set(0.28, 0.04, 0.38);
    leftSole.position.set(0, -0.11, 0.06);
    leftSole.castShadow = true;
    this.leftFootGroup.add(leftSole);

    this.leftKneeGroup.add(this.leftFootGroup);
    this.leftLegGroup.add(this.leftKneeGroup);
    this.group.add(this.leftLegGroup);

    // RIGHT LEG (Articulated Hip, Knee, and Foot)
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.18, 0.58, 0);
    const rightThigh = new THREE.Mesh(boxGeo, pantsMat);
    rightThigh.scale.set(0.24, 0.24, 0.24);
    rightThigh.position.set(0, -0.12, 0);
    rightThigh.castShadow = true;
    this.rightLegGroup.add(rightThigh);

    // Right Knee Group (Pivoting at knee y = -0.24)
    this.rightKneeGroup = new THREE.Group();
    this.rightKneeGroup.position.set(0, -0.24, 0);
    const rightCalf = new THREE.Mesh(boxGeo, pantsMat);
    rightCalf.scale.set(0.23, 0.22, 0.23);
    rightCalf.position.set(0, -0.11, 0);
    rightCalf.castShadow = true;
    this.rightKneeGroup.add(rightCalf);

    // Right Foot Group (Pivoting at ankle y = -0.22)
    this.rightFootGroup = new THREE.Group();
    this.rightFootGroup.position.set(0, -0.22, 0);
    const rightShoe = new THREE.Mesh(boxGeo, shoeMat);
    rightShoe.scale.set(0.26, 0.12, 0.36);
    rightShoe.position.set(0, -0.04, 0.06);
    rightShoe.castShadow = true;
    this.rightFootGroup.add(rightShoe);
    const rightToe = new THREE.Mesh(boxGeo, shoeMat);
    rightToe.scale.set(0.24, 0.09, 0.14);
    rightToe.position.set(0, -0.05, 0.20);
    rightToe.castShadow = true;
    this.rightFootGroup.add(rightToe);
    const rightSole = new THREE.Mesh(boxGeo, soleMat);
    rightSole.scale.set(0.28, 0.04, 0.38);
    rightSole.position.set(0, -0.11, 0.06);
    rightSole.castShadow = true;
    this.rightFootGroup.add(rightSole);

    this.rightKneeGroup.add(this.rightFootGroup);
    this.rightLegGroup.add(this.rightKneeGroup);
    this.group.add(this.rightLegGroup);

    // ==========================================
    // GROUND CONTACT DROP SHADOW (Signature Voxel RPG Aesthetic)
    // ==========================================
    const shadowGeo = new THREE.PlaneGeometry(0.75, 0.75);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x030712,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    });
    this.groundShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.groundShadow.position.y = 0.035;
    this.group.add(this.groundShadow);

    // Selection Indicator Ring on Floor
    const ringGeo = new THREE.RingGeometry(0.55, 0.75, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: id === 'eah' ? 0xf43f5e : 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    this.selectionRing = new THREE.Mesh(ringGeo, ringMat);
    this.selectionRing.position.y = 0.042;
    this.selectionRing.visible = false;
    this.group.add(this.selectionRing);

    // Floating Working Tech Particles
    this.statusParticles = new THREE.Group();
    const pMat = new THREE.MeshLambertMaterial({
      color: id === 'eah' ? 0xf43f5e : 0x00f0ff,
      emissive: id === 'eah' ? 0xf43f5e : 0x00f0ff,
      emissiveIntensity: 0.8,
    });
    for (let i = 0; i < 3; i++) {
      const p = new THREE.Mesh(boxGeo, pMat);
      p.scale.set(0.12, 0.12, 0.12);
      p.position.set((i - 1) * 0.25, 0, (Math.random() - 0.5) * 0.2);
      this.statusParticles.add(p);
    }
    this.statusParticles.position.set(0, 2.1, 0);
    this.statusParticles.visible = false;
    this.group.add(this.statusParticles);

    // ==========================================
    // ROLE-SPECIFIC DIVERSE VOXEL LAPTOPS & WORKSTATION DISPLAYS
    // (Silver MacBooks, Starlight, Space Gray, Midnight Blue, ThinkPad with TrackPoint, iPad Pro)
    // ==========================================
    this.laptopGroup = new THREE.Group();

    interface CharLapConfig {
      chassisColor: number;
      trimColor: number;
      bevelColor: number;
      deckWellColor: number;
      rgbUnderglow: number;
      keyColor: number;
      logoColor: number;
      logoCoreColor: number;
      screenColor: number;
      headerColor: number;
      codeColors: number[];
      cursorColor: number;
      glowColor: number;
      isTrackpoint?: boolean;
    }

    const LAPTOP_CONFIGS: Record<string, CharLapConfig> = {
      dylan: {
        chassisColor: 0xe2e8f0, // Apple Silver Aluminum Unibody
        trimColor: 0xf8fafc,    // Frosted glass Force Touch trackpad
        bevelColor: 0x94a3b8,
        deckWellColor: 0x090d16,// Space-black recessed well
        rgbUnderglow: 0x00f0ff, // Executive cyan underglow
        keyColor: 0x0f172a,
        logoColor: 0xffffff,    // Glowing white Apple logo
        logoCoreColor: 0x38bdf8,
        screenColor: 0x0284c7,  // Executive analytics dashboard
        headerColor: 0x075985,
        codeColors: [0x38bdf8, 0x00f0ff, 0x7dd3fc, 0x0284c7, 0xbae6fd],
        cursorColor: 0xffffff,
        glowColor: 0x00f0ff,
      },
      maya: {
        chassisColor: 0xf8fafc, // Apple Starlight / Champagne Silver
        trimColor: 0xfef3c7,
        bevelColor: 0xcbd5e1,
        deckWellColor: 0x1e1b4b,
        rgbUnderglow: 0xec4899, // Figma magenta/pink glow
        keyColor: 0x0f172a,
        logoColor: 0xffffff,    // Glowing white Apple logo
        logoCoreColor: 0xf43f5e,
        screenColor: 0xbe185d,  // Radiant Figma UI artboards
        headerColor: 0x831843,
        codeColors: [0xf472b6, 0xfb7185, 0xfacc15, 0x38bdf8, 0xc084fc],
        cursorColor: 0xffffff,
        glowColor: 0xec4899,
      },
      alex: {
        chassisColor: 0x334155, // Space Gray / Dark Titanium Unibody
        trimColor: 0x475569,
        bevelColor: 0x1e293b,
        deckWellColor: 0x090d16,
        rgbUnderglow: 0xf97316, // Fullstack neon orange underglow
        keyColor: 0x020617,
        logoColor: 0xffffff,
        logoCoreColor: 0xf97316,
        screenColor: 0x1c1917,  // VS Code dark theme with syntax
        headerColor: 0x431407,
        codeColors: [0xf97316, 0xfbbf24, 0x38bdf8, 0xa855f7, 0x22c55e],
        cursorColor: 0xfacc15,
        glowColor: 0xf97316,
      },
      ray: {
        chassisColor: 0xdbeafe, // Raw Pure Anodized Silver Aluminum
        trimColor: 0xbfdbfe,
        bevelColor: 0x94a3b8,
        deckWellColor: 0x090d16,
        rgbUnderglow: 0x38bdf8, // Deep neural cyan glow
        keyColor: 0x0f172a,
        logoColor: 0xffffff,    // Glowing Apple logo
        logoCoreColor: 0x38bdf8,
        screenColor: 0x0369a1,  // Deep AI research loss curve
        headerColor: 0x075985,
        codeColors: [0x38bdf8, 0x60a5fa, 0x93c5fd, 0x0284c7, 0xe0f2fe],
        cursorColor: 0xffffff,
        glowColor: 0x38bdf8,
      },
      wendy: {
        chassisColor: 0x1e293b, // Apple Midnight Deep Blue Anodized Aluminum
        trimColor: 0x334155,
        bevelColor: 0x0f172a,
        deckWellColor: 0x090d16,
        rgbUnderglow: 0x10b981, // Growth emerald underglow
        keyColor: 0x020617,
        logoColor: 0xffffff,    // Glowing Apple logo
        logoCoreColor: 0x10b981,
        screenColor: 0x047857,  // Marketing conversion charts & copy
        headerColor: 0x064e3b,
        codeColors: [0x34d399, 0x6ee7b7, 0xfbbf24, 0x10b981, 0xa7f3d0],
        cursorColor: 0xffffff,
        glowColor: 0x10b981,
      },
      zane: {
        chassisColor: 0x090d16, // Matte Stealth Carbon Black ThinkPad
        trimColor: 0x1e293b,
        bevelColor: 0x020617,
        deckWellColor: 0x000000,
        rgbUnderglow: 0x00f59b, // Emerald cyber matrix underglow
        keyColor: 0x0f172a,
        logoColor: 0xef4444,    // ThinkPad red dot LED
        logoCoreColor: 0xef4444,
        screenColor: 0x052e16,  // Live matrix cascade & radar screen
        headerColor: 0x021e0e,
        codeColors: [0x00f59b, 0x22c55e, 0x4ade80, 0x16a34a, 0x86efac],
        cursorColor: 0x22c55e,
        glowColor: 0x00f59b,
        isTrackpoint: true,     // Iconic red TrackPoint nub in keyboard!
      },
      eah: {
        chassisColor: 0xe2e8f0, // Silver iPad Pro back
        trimColor: 0xf8fafc,    // White Magic Keyboard folio
        bevelColor: 0xcbd5e1,
        deckWellColor: 0xf1f5f9,
        rgbUnderglow: 0xfb7185, // Soft rose-gold backlight
        keyColor: 0xffffff,
        logoColor: 0xffffff,
        logoCoreColor: 0xfb7185,
        screenColor: 0x831843,  // Hospitality & concierge schedule
        headerColor: 0x500724,
        codeColors: [0xf472b6, 0xfb7185, 0xfbcfe8, 0xf43f5e],
        cursorColor: 0xffffff,
        glowColor: 0xfb7185,
      },
    };

    const lapCfg = LAPTOP_CONFIGS[this.id] || LAPTOP_CONFIGS.dylan;

    // 1. Sleek Distinct Unibody Chassis
    const lapChassisMat = new THREE.MeshLambertMaterial({ color: lapCfg.chassisColor });
    const lapTrimMat = new THREE.MeshLambertMaterial({ color: lapCfg.trimColor });
    const lapBevelMat = new THREE.MeshLambertMaterial({ color: lapCfg.bevelColor });

    // Main unibody slab (width 0.54, height 0.024, depth 0.36)
    const lapBase = new THREE.Mesh(boxGeo, lapChassisMat);
    lapBase.scale.set(0.54, 0.024, 0.36);
    lapBase.position.set(0, 0.012, 0);
    this.laptopGroup.add(lapBase);

    // Front finger opening notch
    const lapFrontLip = new THREE.Mesh(boxGeo, lapBevelMat);
    lapFrontLip.scale.set(0.12, 0.008, 0.015);
    lapFrontLip.position.set(0, 0.018, -0.176);
    this.laptopGroup.add(lapFrontLip);

    // 2. Precision Glass Trackpad (closest to user at -z)
    const lapTrackpad = new THREE.Mesh(boxGeo, lapTrimMat);
    lapTrackpad.scale.set(0.18, 0.005, 0.11);
    lapTrackpad.position.set(0, 0.025, -0.09);
    this.laptopGroup.add(lapTrackpad);

    const lapTrackpadBorder = new THREE.Mesh(boxGeo, lapBevelMat);
    lapTrackpadBorder.scale.set(0.19, 0.002, 0.12);
    lapTrackpadBorder.position.set(0, 0.024, -0.09);
    this.laptopGroup.add(lapTrackpadBorder);

    // 3. Recessed Keyboard Deck & Backlit Keys (middle of base)
    const lapDeckWell = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: lapCfg.deckWellColor }));
    lapDeckWell.scale.set(0.44, 0.005, 0.17);
    lapDeckWell.position.set(0, 0.024, 0.05);
    this.laptopGroup.add(lapDeckWell);

    // Glowing RGB keyboard underglow layer
    const lapRgbUnderglow = new THREE.Mesh(
      boxGeo,
      new THREE.MeshLambertMaterial({ color: lapCfg.rgbUnderglow, emissive: lapCfg.rgbUnderglow, emissiveIntensity: 0.9 })
    );
    lapRgbUnderglow.scale.set(0.42, 0.003, 0.15);
    lapRgbUnderglow.position.set(0, 0.025, 0.05);
    this.laptopGroup.add(lapRgbUnderglow);

    // Tactile keycaps
    const lapKeyMat = new THREE.MeshLambertMaterial({ color: lapCfg.keyColor });
    const lapSpacebar = new THREE.Mesh(boxGeo, lapKeyMat);
    lapSpacebar.scale.set(0.18, 0.007, 0.026);
    lapSpacebar.position.set(0, 0.028, -0.015);
    this.laptopGroup.add(lapSpacebar);

    const lapKeyBlock = new THREE.Mesh(boxGeo, lapKeyMat);
    lapKeyBlock.scale.set(0.40, 0.007, 0.075);
    lapKeyBlock.position.set(0, 0.028, 0.045);
    this.laptopGroup.add(lapKeyBlock);

    const lapNumRow = new THREE.Mesh(boxGeo, lapKeyMat);
    lapNumRow.scale.set(0.40, 0.007, 0.020);
    lapNumRow.position.set(0, 0.028, 0.098);
    this.laptopGroup.add(lapNumRow);

    // Iconic ThinkPad Red TrackPoint Nub in center of keyboard!
    if (lapCfg.isTrackpoint) {
      const redTrackPoint = new THREE.Mesh(
        boxGeo,
        new THREE.MeshLambertMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.2 })
      );
      redTrackPoint.scale.set(0.022, 0.015, 0.022);
      redTrackPoint.position.set(0, 0.034, 0.045);
      this.laptopGroup.add(redTrackPoint);
    }

    // OLED Touch Bar / Smart status strip
    const lapTouchBar = new THREE.Mesh(
      boxGeo,
      new THREE.MeshLambertMaterial({ color: lapCfg.rgbUnderglow, emissive: lapCfg.rgbUnderglow, emissiveIntensity: 0.95 })
    );
    lapTouchBar.scale.set(0.40, 0.006, 0.014);
    lapTouchBar.position.set(0, 0.028, 0.122);
    this.laptopGroup.add(lapTouchBar);

    // Dual micro-perforated stereo speaker grilles
    const lapSpeakerMat = new THREE.MeshLambertMaterial({ color: 0x090d16 });
    const lapSpeakerL = new THREE.Mesh(boxGeo, lapSpeakerMat);
    lapSpeakerL.scale.set(0.032, 0.003, 0.15);
    lapSpeakerL.position.set(-0.20, 0.025, 0.05);
    this.laptopGroup.add(lapSpeakerL);

    const lapSpeakerR = new THREE.Mesh(boxGeo, lapSpeakerMat);
    lapSpeakerR.scale.set(0.032, 0.003, 0.15);
    lapSpeakerR.position.set(0.20, 0.025, 0.05);
    this.laptopGroup.add(lapSpeakerR);

    // 4. Heavy-Duty Brushed Metal Hinge (placed at rear edge z = +0.172)
    const lapHinge = new THREE.Mesh(boxGeo, lapBevelMat);
    lapHinge.scale.set(0.46, 0.022, 0.022);
    lapHinge.position.set(0, 0.018, 0.172);
    this.laptopGroup.add(lapHinge);

    // 5. Standing Ultra-Thin Screen Lid (Pivot at rear hinge)
    this.lapScreenPivot = new THREE.Group();
    this.lapScreenPivot.position.set(0, 0.018, 0.172);
    // Default open angle: 0.30 rad (~17.2° tilt back towards +z away from user, open 107.2° from base)
    this.lapScreenPivot.rotation.x = 0.30;

    // Outer screen lid chassis (height 0.34, width 0.54, thickness 0.018)
    const lapLid = new THREE.Mesh(boxGeo, lapChassisMat);
    lapLid.scale.set(0.54, 0.34, 0.018);
    lapLid.position.set(0, 0.17, 0);
    this.lapScreenPivot.add(lapLid);

    // ==========================================
    // A. ILLUMINATED OUTWARD LOGO (Faces audiences & viewers across room at +z!)
    // ==========================================
    if (lapCfg.isTrackpoint) {
      // ThinkPad signature diagonal red dot LED on lid
      const tpRedDot = new THREE.Mesh(
        boxGeo,
        new THREE.MeshLambertMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.8 })
      );
      tpRedDot.scale.set(0.025, 0.025, 0.005);
      tpRedDot.position.set(0.18, 0.28, 0.010);
      this.lapScreenPivot.add(tpRedDot);
    } else {
      // Apple / Premium White Glowing Emblem
      const lapLogoBase = new THREE.Mesh(
        boxGeo,
        new THREE.MeshLambertMaterial({ color: lapCfg.logoColor, emissive: lapCfg.logoColor, emissiveIntensity: 1.5 })
      );
      lapLogoBase.scale.set(0.08, 0.08, 0.004);
      lapLogoBase.position.set(0, 0.17, 0.010);
      this.lapScreenPivot.add(lapLogoBase);

      const lapLogoCore = new THREE.Mesh(
        boxGeo,
        new THREE.MeshLambertMaterial({ color: lapCfg.logoCoreColor, emissive: lapCfg.logoCoreColor, emissiveIntensity: 1.2 })
      );
      lapLogoCore.scale.set(0.04, 0.04, 0.005);
      lapLogoCore.position.set(0, 0.17, 0.012);
      this.lapScreenPivot.add(lapLogoCore);
    }

    // ==========================================
    // B. INNER GLOWING RADIANT SCREEN (Faces character at -z!)
    // ==========================================
    // Ultra-crisp slate frame bezel
    const lapBezel = new THREE.Mesh(boxGeo, lapBevelMat);
    lapBezel.scale.set(0.51, 0.31, 0.003);
    lapBezel.position.set(0, 0.17, -0.009);
    this.lapScreenPivot.add(lapBezel);

    // HD Webcam micro-lens
    const lapWebcam = new THREE.Mesh(
      boxGeo,
      new THREE.MeshLambertMaterial({ color: lapCfg.rgbUnderglow, emissive: lapCfg.rgbUnderglow, emissiveIntensity: 0.8 })
    );
    lapWebcam.scale.set(0.02, 0.01, 0.003);
    lapWebcam.position.set(0, 0.32, -0.011);
    this.lapScreenPivot.add(lapWebcam);

    // Radiant Glowing Display
    const lapScreenMat = new THREE.MeshLambertMaterial({
      color: lapCfg.screenColor,
      emissive: lapCfg.screenColor,
      emissiveIntensity: 1.0,
    });
    const lapDisplay = new THREE.Mesh(boxGeo, lapScreenMat);
    lapDisplay.scale.set(0.47, 0.27, 0.003);
    lapDisplay.position.set(0, 0.165, -0.011);
    this.lapScreenPivot.add(lapDisplay);

    // Cyber-OS Top Header Bar
    const lapHeader = new THREE.Mesh(
      boxGeo,
      new THREE.MeshLambertMaterial({ color: lapCfg.headerColor, emissive: lapCfg.headerColor, emissiveIntensity: 0.7 })
    );
    lapHeader.scale.set(0.45, 0.018, 0.002);
    lapHeader.position.set(0, 0.286, -0.013);
    this.lapScreenPivot.add(lapHeader);

    // Active Code & Work Telemetry Lines
    this.lapCodeLines = [];
    const codeWidths = [0.26, 0.32, 0.20, 0.28, 0.24, 0.18, 0.22];
    codeWidths.forEach((w, idx) => {
      const cColor = lapCfg.codeColors[idx % lapCfg.codeColors.length];
      const lineMesh = new THREE.Mesh(
        boxGeo,
        new THREE.MeshLambertMaterial({ color: cColor, emissive: cColor, emissiveIntensity: 0.85 })
      );
      lineMesh.scale.set(w, 0.012, 0.002);
      lineMesh.position.set(-0.08 + (w - 0.26) / 2, 0.252 - idx * 0.021, -0.013);
      this.lapScreenPivot.add(lineMesh);
      this.lapCodeLines.push(lineMesh);
    });

    // Telemetry metric bars on right side of screen
    const barData = [0.06, 0.10, 0.14, 0.08];
    barData.forEach((h, idx) => {
      const bColor = lapCfg.codeColors[(idx + 2) % lapCfg.codeColors.length];
      const barMesh = new THREE.Mesh(
        boxGeo,
        new THREE.MeshLambertMaterial({ color: bColor, emissive: bColor, emissiveIntensity: 0.85 })
      );
      barMesh.scale.set(0.020, h, 0.002);
      barMesh.position.set(0.12 + idx * 0.026, 0.16 + h / 2, -0.013);
      this.lapScreenPivot.add(barMesh);
    });

    // Pure white blinking terminal cursor
    this.lapCursor = new THREE.Mesh(
      boxGeo,
      new THREE.MeshLambertMaterial({ color: lapCfg.cursorColor, emissive: lapCfg.cursorColor, emissiveIntensity: 1.8 })
    );
    this.lapCursor.scale.set(0.016, 0.012, 0.002);
    this.lapCursor.position.set(-0.20, 0.105, -0.013);
    this.lapScreenPivot.add(this.lapCursor);

    // Screen Cyber Ambient Bounce Light onto character
    this.lapGlowLight = new THREE.PointLight(lapCfg.glowColor, 0.85, 2.0);
    this.lapGlowLight.position.set(0, 0.18, -0.15);
    this.lapScreenPivot.add(this.lapGlowLight);

    this.laptopGroup.add(this.lapScreenPivot);
    this.laptopGroup.visible = false;
    this.group.add(this.laptopGroup);

    // Dynamic Drink Props (Held in Right Hand)
    this.drinkPropGroup = new THREE.Group();
    this.drinkPropGroup.position.set(0, -0.48, 0.14);

    // Coffee Mug (Ceramic white with dark roast coffee)
    const mugMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const coffeeMat = new THREE.MeshLambertMaterial({ color: 0x3e2318 });
    this.coffeeMug = new THREE.Mesh(boxGeo, mugMat);
    this.coffeeMug.scale.set(0.14, 0.16, 0.14);
    const coffeeTop = new THREE.Mesh(boxGeo, coffeeMat);
    coffeeTop.scale.set(0.12, 0.02, 0.12);
    coffeeTop.position.y = 0.08;
    this.coffeeMug.add(coffeeTop);
    const mugHandle = new THREE.Mesh(boxGeo, mugMat);
    mugHandle.scale.set(0.04, 0.09, 0.06);
    mugHandle.position.set(0.08, 0, 0);
    this.coffeeMug.add(mugHandle);
    this.drinkPropGroup.add(this.coffeeMug);

    // Water Cup (Clear icy-cyan cone)
    const waterMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 });
    this.waterCup = new THREE.Mesh(boxGeo, waterMat);
    this.waterCup.scale.set(0.13, 0.16, 0.13);
    this.drinkPropGroup.add(this.waterCup);
    this.drinkPropGroup.visible = false;
    this.rightArmGroup.add(this.drinkPropGroup);

    // Billiard Cue Stick Prop
    this.cueStickGroup = new THREE.Group();
    const cueMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
    const chalkMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
    const cueBody = new THREE.Mesh(boxGeo, cueMat);
    cueBody.scale.set(0.04, 0.04, 1.60);
    cueBody.position.set(0, 0, 0.40);
    this.cueStickGroup.add(cueBody);
    const chalkTip = new THREE.Mesh(boxGeo, chalkMat);
    chalkTip.scale.set(0.042, 0.042, 0.06);
    chalkTip.position.set(0, 0, 1.22);
    this.cueStickGroup.add(chalkTip);
    this.cueStickGroup.position.set(0.18, 0.70, 0);
    this.cueStickGroup.visible = false;
    this.group.add(this.cueStickGroup);

    // Rose Gold iPad / Tablet Prop (Held in hands on lap)
    this.tabletGroup = new THREE.Group();
    const tabletChassisMat = new THREE.MeshLambertMaterial({ color: 0xfda4af }); // Rose gold aluminum
    const tabletBack = new THREE.Mesh(boxGeo, tabletChassisMat);
    tabletBack.scale.set(0.38, 0.02, 0.28);
    this.tabletGroup.add(tabletBack);

    const tabletScrMat = new THREE.MeshLambertMaterial({
      color: 0xf43f5e,
      emissive: 0xf43f5e,
      emissiveIntensity: 0.85,
    });
    const tabletScreen = new THREE.Mesh(boxGeo, tabletScrMat);
    tabletScreen.scale.set(0.35, 0.022, 0.25);
    tabletScreen.position.y = 0.005;
    this.tabletGroup.add(tabletScreen);

    this.tabletGroup.position.set(0, 0.36, 0.22);
    this.tabletGroup.rotation.x = -Math.PI / 5;
    this.tabletGroup.visible = false;
    this.group.add(this.tabletGroup);

    // Eah's Cooking Skillet Prop (Cast Iron Skillet with Sunny Eggs & Spatula)
    this.skilletGroup = new THREE.Group();
    const panMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const eggWhiteMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
    const yolkMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.3 });
    const spatulaMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });

    const panBase = new THREE.Mesh(boxGeo, panMat);
    panBase.scale.set(0.36, 0.04, 0.34);
    this.skilletGroup.add(panBase);

    const panRimL = new THREE.Mesh(boxGeo, panMat);
    panRimL.scale.set(0.03, 0.08, 0.34);
    panRimL.position.set(-0.18, 0.03, 0);
    this.skilletGroup.add(panRimL);

    const panRimR = new THREE.Mesh(boxGeo, panMat);
    panRimR.scale.set(0.03, 0.08, 0.34);
    panRimR.position.set(0.18, 0.03, 0);
    this.skilletGroup.add(panRimR);

    const panHandle = new THREE.Mesh(boxGeo, panMat);
    panHandle.scale.set(0.06, 0.04, 0.30);
    panHandle.position.set(0, 0.02, 0.30);
    this.skilletGroup.add(panHandle);

    const egg1 = new THREE.Mesh(boxGeo, eggWhiteMat);
    egg1.scale.set(0.14, 0.02, 0.14);
    egg1.position.set(-0.07, 0.03, -0.05);
    this.skilletGroup.add(egg1);
    const yolk1 = new THREE.Mesh(boxGeo, yolkMat);
    yolk1.scale.set(0.06, 0.04, 0.06);
    yolk1.position.set(-0.07, 0.05, -0.05);
    this.skilletGroup.add(yolk1);

    const egg2 = new THREE.Mesh(boxGeo, eggWhiteMat);
    egg2.scale.set(0.13, 0.02, 0.13);
    egg2.position.set(0.08, 0.03, 0.04);
    this.skilletGroup.add(egg2);
    const yolk2 = new THREE.Mesh(boxGeo, yolkMat);
    yolk2.scale.set(0.055, 0.04, 0.055);
    yolk2.position.set(0.08, 0.05, 0.04);
    this.skilletGroup.add(yolk2);

    const spatula = new THREE.Mesh(boxGeo, spatulaMat);
    spatula.scale.set(0.08, 0.02, 0.24);
    spatula.position.set(0.12, 0.06, -0.02);
    spatula.rotation.y = 0.35;
    this.skilletGroup.add(spatula);

    this.skilletGroup.position.set(0, 0.60, 0.36);
    this.skilletGroup.visible = false;
    this.group.add(this.skilletGroup);

    // Eah's Serving Tray Prop (Silver platter with breakfast plate or hot coffee mug)
    this.servingTrayGroup = new THREE.Group();
    const trayMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
    const trayBase = new THREE.Mesh(boxGeo, trayMat);
    trayBase.scale.set(0.48, 0.025, 0.34);
    this.servingTrayGroup.add(trayBase);

    this.trayPlate = new THREE.Group();
    const plateRim = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }));
    plateRim.scale.set(0.24, 0.02, 0.24);
    this.trayPlate.add(plateRim);
    const foodPancake = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xf59e0b }));
    foodPancake.scale.set(0.16, 0.025, 0.16);
    foodPancake.position.y = 0.02;
    this.trayPlate.add(foodPancake);
    const foodBacon = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xb91c1c }));
    foodBacon.scale.set(0.18, 0.02, 0.05);
    foodBacon.position.set(0, 0.035, 0.06);
    this.trayPlate.add(foodBacon);
    this.trayPlate.position.set(-0.08, 0.02, 0);
    this.servingTrayGroup.add(this.trayPlate);

    this.trayCoffee = new THREE.Group();
    const mugBody = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xf43f5e }));
    mugBody.scale.set(0.12, 0.14, 0.12);
    this.trayCoffee.add(mugBody);
    const latteArt = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xffedd5 }));
    latteArt.scale.set(0.10, 0.02, 0.10);
    latteArt.position.y = 0.07;
    this.trayCoffee.add(latteArt);
    const latteHeart = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xf43f5e, emissive: 0xf43f5e, emissiveIntensity: 0.5 }));
    latteHeart.scale.set(0.04, 0.025, 0.04);
    latteHeart.position.y = 0.08;
    this.trayCoffee.add(latteHeart);
    this.trayCoffee.position.set(0.14, 0.07, 0);
    this.servingTrayGroup.add(this.trayCoffee);

    this.servingTrayGroup.position.set(0, 0.56, 0.34);
    this.servingTrayGroup.visible = false;
    this.group.add(this.servingTrayGroup);

    // Luxury Flower Bouquet Prop (Wrapped Fresh Red Roses, Pink Peonies & Baby's Breath for Eah)
    this.flowerBouquetGroup = new THREE.Group();
    const bouquetWrapMat = new THREE.MeshLambertMaterial({ color: 0xd97706 }); // Kraft paper cone
    const ribbonMat = new THREE.MeshLambertMaterial({ color: 0xffbe0b, emissive: 0xd97706, emissiveIntensity: 0.4 }); // Gold silk bow
    const stemMat = new THREE.MeshLambertMaterial({ color: 0x15803d }); // Emerald stems & leaves
    const redRoseMat = new THREE.MeshLambertMaterial({ color: 0xe11d48, emissive: 0x9f1239, emissiveIntensity: 0.3 }); // Rich red roses
    const pinkRoseMat = new THREE.MeshLambertMaterial({ color: 0xf43f5e, emissive: 0xbe123c, emissiveIntensity: 0.25 }); // Blushing roses
    const softPinkMat = new THREE.MeshLambertMaterial({ color: 0xfbcfe8 }); // Soft peony petals
    const whiteBudMat = new THREE.MeshLambertMaterial({ color: 0xffffff }); // Baby's breath

    const wrapCone = new THREE.Mesh(boxGeo, bouquetWrapMat);
    wrapCone.scale.set(0.24, 0.26, 0.20);
    wrapCone.position.set(0, -0.04, 0);
    this.flowerBouquetGroup.add(wrapCone);

    const bowMesh = new THREE.Mesh(boxGeo, ribbonMat);
    bowMesh.scale.set(0.12, 0.08, 0.22);
    bowMesh.position.set(0, -0.06, 0.02);
    this.flowerBouquetGroup.add(bowMesh);

    const greens = new THREE.Mesh(boxGeo, stemMat);
    greens.scale.set(0.30, 0.10, 0.26);
    greens.position.set(0, 0.10, 0);
    this.flowerBouquetGroup.add(greens);

    const rose1 = new THREE.Mesh(boxGeo, redRoseMat);
    rose1.scale.set(0.10, 0.10, 0.10);
    rose1.position.set(-0.07, 0.17, -0.04);
    this.flowerBouquetGroup.add(rose1);

    const rose2 = new THREE.Mesh(boxGeo, redRoseMat);
    rose2.scale.set(0.10, 0.10, 0.10);
    rose2.position.set(0.07, 0.17, 0.04);
    this.flowerBouquetGroup.add(rose2);

    const rose3 = new THREE.Mesh(boxGeo, pinkRoseMat);
    rose3.scale.set(0.11, 0.11, 0.11);
    rose3.position.set(0, 0.20, 0);
    this.flowerBouquetGroup.add(rose3);

    const peony1 = new THREE.Mesh(boxGeo, softPinkMat);
    peony1.scale.set(0.08, 0.08, 0.08);
    peony1.position.set(-0.06, 0.16, 0.06);
    this.flowerBouquetGroup.add(peony1);

    const peony2 = new THREE.Mesh(boxGeo, softPinkMat);
    peony2.scale.set(0.08, 0.08, 0.08);
    peony2.position.set(0.06, 0.16, -0.06);
    this.flowerBouquetGroup.add(peony2);

    const bud1 = new THREE.Mesh(boxGeo, whiteBudMat);
    bud1.scale.set(0.04, 0.04, 0.04);
    bud1.position.set(-0.11, 0.15, 0);
    this.flowerBouquetGroup.add(bud1);

    const bud2 = new THREE.Mesh(boxGeo, whiteBudMat);
    bud2.scale.set(0.04, 0.04, 0.04);
    bud2.position.set(0.11, 0.15, 0);
    this.flowerBouquetGroup.add(bud2);

    this.flowerBouquetGroup.position.set(0, 0.58, 0.34);
    this.flowerBouquetGroup.visible = false;
    this.group.add(this.flowerBouquetGroup);

    // Tag for Raycasting
    this.group.traverse((obj) => {
      (obj as any).agentId = id;
    });
  }

  public setSelection(selected: boolean) {
    this.selectionRing.visible = selected;
  }

  public setSpeech(text: string, duration = 6.0) {
    if (!text || text.trim() === '') {
      this.speechText = '';
      this.speechTimer = 0;
      return;
    }
    this.speechText = text.trim();
    this.speechTimer = duration;
  }

  public setStatus(newStatus: string, speech?: string) {
    this.status = newStatus;
    this.statusParticles.visible = newStatus === 'working';
    if (speech !== undefined) {
      this.setSpeech(speech, 7.0);
    }
  }

  public walkTo(targetX: number, targetZ: number) {
    this.pathQueue = findPath3D(this.currentX, this.currentZ, targetX, targetZ);
    this.isWalking = this.pathQueue.length > 0;
    this.isSeated = false;
  }

  public update(delta: number) {
    this.animTimer += delta;

    // 1. Follow waypoint path queue if navigating to target
    if (this.pathQueue.length > 0) {
      this.isWalking = true;
      this.isSeated = false;
      const target = this.pathQueue[0];
      const dx = target.x - this.group.position.x;
      const dz = target.z - this.group.position.z;
      const dist = Math.hypot(dx, dz);
      const walkSpeed = 3.8 * delta;

      if (dist < walkSpeed) {
        this.group.position.x = target.x;
        this.group.position.z = target.z;
        this.currentX = target.x;
        this.currentZ = target.z;
        this.pathQueue.shift();

        if (this.pathQueue.length === 0) {
          this.isWalking = false;
          // Check if arrived back at working desk
          if (this.currentActivity === 'reporting_to_ceo' || (this.currentX <= 6.5 && this.currentZ >= 4.5 && this.currentZ <= 6.2)) {
            this.isSeated = false;
            this.currentActivity = 'reporting_to_ceo';
            this.group.rotation.y = Math.PI; // Face North directly towards Dylan Ramos's CEO command desk!
          } else if (Math.hypot(this.currentX - this.deskX, this.currentZ - this.deskZ) < 1.0) {
            this.isSeated = true;
            this.currentActivity = 'working';
            this.group.rotation.y = this.id === 'dylan' ? 0 : Math.PI; // Dylan faces Door (0), specialists face Desk (PI)
          } else if (this.currentX >= 8.5 && this.currentX <= 21.0 && this.currentZ >= 11.5) {
            // Arrived at Lounge Area (Zone 3, Center Suite)
            if (this.currentActivity === 'playing_arcade' || (this.currentX <= 11.4 && this.currentZ < 15.5)) {
              this.isSeated = false;
              this.currentActivity = 'playing_arcade';
              this.group.rotation.y = Math.PI; // Face North directly into the arcade cabinet controls and CRT screen!
            } else if (this.currentActivity === 'drinking_coffee' || (this.currentX <= 11.8 && this.currentZ >= 17.0)) {
              this.isSeated = true; // Seated on espresso barstool
              this.currentActivity = 'drinking_coffee';
              this.group.rotation.y = -Math.PI / 2; // Face West towards espresso counter
            } else if (this.currentZ < 16.0) {
              this.isSeated = true;
              this.currentActivity = 'sofa_relax';
              this.group.rotation.y = 0; // Sofa faces South towards coffee table
            } else {
              this.isSeated = true;
              this.currentActivity = 'working';
              this.group.rotation.y = Math.PI; // Bottom booth faces North towards coffee table
            }
          } else if (this.currentX <= 8.0 && this.currentZ >= 11.0) {
            if (this.currentZ <= 16.0) {
              // Arrived at Gourmet Kitchen Suite & Island Bar
              this.isSeated = true;
              this.currentActivity = 'kitchen_work';
              this.group.rotation.y = Math.PI; // Face north towards island
            } else {
              // Arrived at Outdoor Zen Garden & Patio Terrace
              this.isSeated = true;
              this.currentActivity = 'garden_relax';
              this.group.rotation.y = 0; // Face south into garden/skyline
            }
          } else if (Math.hypot(this.currentX - 28.0, this.currentZ - 4.5) < 2.0) {
            // Arrived at Water Cooler
            this.isSeated = false;
            this.currentActivity = 'drinking_water';
            this.group.rotation.y = -Math.PI / 2;
          } else if (this.currentX > 21.0 && this.currentZ >= 11.5) {
            // Arrived at Grand Executive Boardroom (Zone 4, Right Wing - Extra Spacious!)
            this.isSeated = true;
            this.currentActivity = 'meeting';
            if (this.currentZ < 15.2) {
              this.group.rotation.y = 0; // North seats face south towards table
            } else if (this.currentZ > 17.0) {
              this.group.rotation.y = Math.PI; // South seats face north towards table
            } else {
              this.group.rotation.y = Math.PI / 2; // Dylan at head of table faces east along table
            }
          }
        }
      } else {
        this.group.position.x += (dx / dist) * walkSpeed;
        this.group.position.z += (dz / dist) * walkSpeed;
        const angle = Math.atan2(dx, dz);
        this.group.rotation.y = angle;
      }
    }

    // Procedural Sitting / Standing Smooth Transition (~0.3s ease)
    if (this.isSeated && !this.isWalking) {
      this.sitTransition = Math.min(1.0, this.sitTransition + delta * 3.5);
    } else {
      this.sitTransition = Math.max(0.0, this.sitTransition - delta * 4.2);
    }

    // 2. Active Walking vs Idle/Seated Limb Animation
    if (this.isWalking) {
      this.sitTransition = 0;
      const walkFreq = 11;
      const swing = Math.sin(this.animTimer * walkFreq);

      // A. Hip Stride Swing: Alternating forward and back leg rotation (~50 degrees)
      this.leftLegGroup.rotation.x = swing * 0.85;
      this.rightLegGroup.rotation.x = -swing * 0.85;

      // Natural knee flexion during walking swing:
      this.leftKneeGroup.rotation.x = swing > 0 ? swing * 0.45 : 0;
      this.rightKneeGroup.rotation.x = -swing > 0 ? -swing * 0.45 : 0;

      // B. Dynamic Foot Step Lifting: The swinging foot lifts UP off the ground as it takes a step!
      const leftStepLift = Math.max(0, swing) * 0.16;
      const rightStepLift = Math.max(0, -swing) * 0.16;
      this.leftLegGroup.position.y = 0.58 + leftStepLift;
      this.rightLegGroup.position.y = 0.58 + rightStepLift;

      // C. Dynamic Foot / Ankle Articulation:
      this.leftFootGroup.rotation.x = swing > 0 ? -0.30 * swing : 0.18 * -swing;
      this.rightFootGroup.rotation.x = -swing > 0 ? -0.30 * -swing : 0.18 * swing;

      // D. Arms Swing in Counter-Rhythm from Shoulder Joints
      this.leftArmGroup.rotation.x = -swing * 0.70;
      this.rightArmGroup.rotation.x = swing * 0.70;
      this.leftArmGroup.rotation.z = 0.08;
      this.rightArmGroup.rotation.z = -0.08;

      // E. Stride Bounce & Natural Torso Sway (Upper Body)
      const bounce = Math.abs(Math.sin(this.animTimer * walkFreq)) * 0.07;
      this.upperBodyGroup.position.y = bounce;
      this.upperBodyGroup.rotation.z = Math.sin(this.animTimer * walkFreq) * 0.04;
      this.upperBodyGroup.rotation.y = Math.sin(this.animTimer * walkFreq) * 0.03;

      // F. Carrying Closed Laptop Under Arm while Walking (to/from boardroom, lounge, kitchen, or garden)
      const lastTarget = this.pathQueue.length > 0 ? this.pathQueue[this.pathQueue.length - 1] : null;
      const isHeadingToLaptopZone = lastTarget
        ? (lastTarget.x >= 8.5 && lastTarget.x <= 20.0 && lastTarget.z >= 13.5 && lastTarget.z <= 19.5) ||
          (lastTarget.x >= 22.0 && lastTarget.x <= 28.5 && lastTarget.z >= 14.0 && lastTarget.z <= 20.0) ||
          (lastTarget.x <= 8.0 && lastTarget.z >= 11.0)
        : false;
      const isWalkingWithLaptop =
        this.currentActivity === 'meeting' ||
        this.currentActivity === 'kitchen_work' ||
        this.currentActivity === 'garden_relax' ||
        isHeadingToLaptopZone ||
        (this.currentX >= 8.5 && this.currentX <= 20.0 && this.currentZ >= 13.5 && this.currentZ <= 19.5) ||
        (this.currentX >= 22.0 && this.currentZ >= 14.0) ||
        (this.currentX <= 8.0 && this.currentZ >= 11.0);

      if (this.id === 'eah') {
        this.laptopGroup.visible = false;
        if (this.currentActivity === 'delivering_food' || this.currentActivity === 'delivering_coffee') {
          this.servingTrayGroup.visible = true;
          this.trayPlate.visible = this.currentActivity === 'delivering_food';
          this.trayCoffee.visible = this.currentActivity === 'delivering_coffee' || this.currentActivity === 'delivering_food';
          const carryBounce = Math.abs(Math.sin(this.animTimer * walkFreq)) * 0.03;
          this.servingTrayGroup.position.set(0, 0.56 + carryBounce, 0.34);
          this.leftArmGroup.rotation.x = -0.82;
          this.leftArmGroup.rotation.z = -0.16;
          this.rightArmGroup.rotation.x = -0.82;
          this.rightArmGroup.rotation.z = 0.16;
        }
      } else if (isWalkingWithLaptop) {
        this.laptopGroup.visible = true;
        // Fold screen lid flat shut while walking
        this.lapScreenPivot.rotation.x = -Math.PI / 2;

        // Natural walking stride bounce and sway synchronized with walking steps
        const carryBounce = Math.abs(Math.sin(this.animTimer * walkFreq)) * 0.04;
        const carrySway = Math.cos(this.animTimer * walkFreq) * 0.02;

        this.laptopGroup.position.set(0.26, 0.62 + carryBounce, 0.02 + carrySway);
        this.laptopGroup.rotation.set(Math.PI / 2, 0, 0.12 + carrySway * 0.4);
        this.laptopGroup.scale.set(0.82, 0.82, 0.82);

        // Right arm hugs the folded laptop firmly against the ribs
        this.rightArmGroup.rotation.x = -0.28 + carryBounce * 0.5;
        this.rightArmGroup.rotation.z = -0.26;
      }
    } else {
      // Idle / Seated State smoothly blended with sitTransition!
      // Articulated legs: Thigh rotates 90 deg forward horizontally, knee bends 90 deg down vertically
      const seatHipAngle = -Math.PI / 2;
      const seatKneeAngle = Math.PI / 2;

      this.leftLegGroup.rotation.x = THREE.MathUtils.lerp(0, seatHipAngle, this.sitTransition);
      this.rightLegGroup.rotation.x = THREE.MathUtils.lerp(0, seatHipAngle, this.sitTransition);

      this.leftKneeGroup.rotation.x = THREE.MathUtils.lerp(0, seatKneeAngle, this.sitTransition);
      this.rightKneeGroup.rotation.x = THREE.MathUtils.lerp(0, seatKneeAngle, this.sitTransition);

      // Foot stays flat forward
      this.leftFootGroup.rotation.x = 0;
      this.rightFootGroup.rotation.x = 0;

      // Lower both hip joints and upper body flush onto seat cushions (y = 0.38)
      const seatDrop = -0.20;
      this.leftLegGroup.position.y = THREE.MathUtils.lerp(0.58, 0.58 + seatDrop, this.sitTransition);
      this.rightLegGroup.position.y = THREE.MathUtils.lerp(0.58, 0.58 + seatDrop, this.sitTransition);

      const idleBob = Math.sin(this.animTimer * 2.5) * 0.02;
      this.upperBodyGroup.position.y = THREE.MathUtils.lerp(idleBob, seatDrop, this.sitTransition);

      // 3. MULTI-ACTIVITY PROCEDURAL ANIMATION SYSTEM (Drinking, Gaming, Kitchen, Garden, Sofa Relax, & Meeting)
      const isNearWater = Math.hypot(this.currentX - 28.0, this.currentZ - 4.5) < 1.8;
      const isNearCoffee = Math.hypot(this.currentX - 10.2, this.currentZ - 18.6) < 1.8;
      const isNearArcade = Math.hypot(this.group.position.x - 10.2, this.group.position.z - 13.6) < 1.8 && this.group.position.z >= 13.8;
      const isAtBilliards = false;
      const isAtKitchen = this.currentX <= 8.0 && this.currentZ >= 11.0 && this.currentZ <= 16.0;
      const isAtGarden = this.currentX <= 8.0 && this.currentZ > 16.0;
      const isAtSofa =
        (this.currentX >= 12.0 && this.currentX <= 19.0 && this.currentZ >= 13.0 && this.currentZ <= 20.2) ||
        this.id === 'eah' ||
        (this.currentX >= 2.4 && this.currentX <= 4.8 && this.currentZ >= 8.8 && this.currentZ <= 10.2);
      const isAtWorkBench = this.currentX >= 15.0 && this.currentX <= 18.5 && this.currentZ >= 17.5 && this.currentZ <= 19.5;
      const isAtBoardTable = (this.currentX >= 23.5 && this.currentX <= 35.5 && this.currentZ >= 13.5 && this.currentZ <= 19.5) || Math.hypot(this.currentX - this.seatX, this.currentZ - this.seatZ) < 1.6;

      // Reset prop visibility defaults
      this.laptopGroup.visible = false;
      this.tabletGroup.visible = false;
      this.skilletGroup.visible = false;
      this.servingTrayGroup.visible = false;
      this.flowerBouquetGroup.visible = false;
      this.drinkPropGroup.visible = false;
      this.cueStickGroup.visible = false;
      this.head.rotation.set(0, 0, 0);

      // Dylan & Eah Caring Activities (Flowers Bouquet, Kitchen Cooking, Serving Gourmet Platter)
      if (this.currentActivity === 'delivering_flowers' || this.currentActivity === 'giving_flowers') {
        this.flowerBouquetGroup.visible = true;
        this.flowerBouquetGroup.position.set(0, 0.58 + Math.sin(this.animTimer * 6.0) * 0.015, 0.34);
        this.leftArmGroup.rotation.x = -0.85;
        this.leftArmGroup.rotation.z = -0.18;
        this.rightArmGroup.rotation.x = -0.85;
        this.rightArmGroup.rotation.z = 0.18;
        this.head.rotation.x = -0.06;
        return;
      } else if (this.currentActivity === 'kitchen_cooking') {
        this.skilletGroup.visible = true;
        this.skilletGroup.position.set(0, 0.58 + Math.sin(this.animTimer * 16.0) * 0.01, 0.34);
        this.leftArmGroup.rotation.x = -0.75;
        this.leftArmGroup.rotation.z = -0.14;
        this.rightArmGroup.rotation.x = -0.75 + Math.sin(this.animTimer * 7.0) * 0.22;
        this.rightArmGroup.rotation.z = 0.14;
        this.head.rotation.x = 0.24;
        this.upperBodyGroup.rotation.x = 0.06;
        return;
      } else if (this.currentActivity === 'delivering_food' || this.currentActivity === 'delivering_coffee') {
        this.servingTrayGroup.visible = true;
        this.trayPlate.visible = this.currentActivity === 'delivering_food';
        this.trayCoffee.visible = this.currentActivity === 'delivering_coffee' || (this.id === 'eah' && this.currentActivity === 'delivering_food');
        this.servingTrayGroup.position.set(0, 0.56, 0.34);
        this.leftArmGroup.rotation.x = -0.85;
        this.leftArmGroup.rotation.z = -0.15;
        this.rightArmGroup.rotation.x = -0.85;
        this.rightArmGroup.rotation.z = 0.15;
        this.head.rotation.x = -0.08 + Math.sin(this.animTimer * 2.0) * 0.04;
        return;
      } else if (this.id === 'eah') {
        if (this.currentActivity === 'brewing_coffee') {
          this.drinkPropGroup.visible = true;
          this.coffeeMug.visible = true;
          this.leftArmGroup.rotation.x = -0.65;
          this.rightArmGroup.rotation.x = -0.92 + Math.sin(this.animTimer * 5.0) * 0.18;
          this.head.rotation.x = 0.18;
          return;
        } else if (this.currentActivity === 'petting_puppy') {
          this.upperBodyGroup.position.y = -0.26;
          this.upperBodyGroup.rotation.x = 0.34;
          this.rightArmGroup.rotation.x = -0.95 + Math.sin(this.animTimer * 5.0) * 0.20;
          this.leftArmGroup.rotation.x = -0.32;
          this.head.rotation.x = 0.42;
          return;
        }
      }

      // Keep Eah facing comfortably East-Southeast towards Dylan & room while seated
      if (this.id === 'eah' && !this.isWalking) {
        this.group.rotation.y = Math.PI * 0.42;
      }

      if (this.currentActivity === 'drinking_water' || isNearWater) {
        // A. DRINKING CHILLED WATER ANIMATION
        this.drinkPropGroup.visible = true;
        this.waterCup.visible = true;
        this.coffeeMug.visible = false;

        const drinkT = (this.animTimer * 2.2) % (Math.PI * 2);
        const sip = Math.pow(Math.max(0, Math.sin(drinkT)), 3);
        this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(-0.40, -1.90, sip);
        this.rightArmGroup.rotation.z = THREE.MathUtils.lerp(0, -0.22, sip);
        this.head.rotation.x = THREE.MathUtils.lerp(0, -0.26, sip);
        this.leftArmGroup.rotation.x = -0.25;
        this.leftArmGroup.rotation.z = 0;

      } else if (this.currentActivity === 'drinking_coffee' || isNearCoffee) {
        // B. DRINKING ARTISANAL ESPRESSO COFFEE ANIMATION
        this.drinkPropGroup.visible = true;
        this.waterCup.visible = false;
        this.coffeeMug.visible = true;

        const drinkT = (this.animTimer * 2.0) % (Math.PI * 2);
        const sip = Math.pow(Math.max(0, Math.sin(drinkT)), 3);
        this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(-0.40, -1.92, sip);
        this.rightArmGroup.rotation.z = THREE.MathUtils.lerp(0, -0.24, sip);
        this.head.rotation.x = THREE.MathUtils.lerp(0, -0.28, sip);
        this.leftArmGroup.rotation.x = -0.25;
        this.leftArmGroup.rotation.z = 0;

      } else if (this.currentActivity === 'playing_arcade' || isNearArcade) {
        // C. LEGIT RETRO ARCADE GAMING ANIMATION (Facing North directly into arcade controls & CRT screen!)
        this.group.rotation.y = Math.PI; // Face North directly towards cabinet controls & CRT screen!
        this.isSeated = false;
        // Left hand steers red ball joystick in fluid gaming arcs
        this.leftArmGroup.rotation.x = -0.92 + Math.sin(this.animTimer * 8.0) * 0.14;
        this.leftArmGroup.rotation.y = Math.cos(this.animTimer * 8.0) * 0.12;
        this.leftArmGroup.rotation.z = 0.12;
        // Right hand rapidly hammers multi-color arcade action buttons
        this.rightArmGroup.rotation.x = -0.86 + Math.sin(this.animTimer * 22.0) * 0.24;
        this.rightArmGroup.rotation.z = -0.12;
        // Upper body leans slightly forward into cabinet with gaming bounce
        this.upperBodyGroup.position.y = Math.abs(Math.sin(this.animTimer * 10.0)) * 0.04;
        this.upperBodyGroup.rotation.x = -0.06;
        this.head.rotation.x = -0.16; // Head tilted UP looking directly into glowing CRT screen!

      } else if (this.currentActivity === 'kitchen_work' || (isAtKitchen && this.isSeated && !this.isWalking)) {
        // D1. GOURMET KITCHEN ISLAND LAPTOP WORKING & SNACKING
        this.laptopGroup.visible = true;
        const targetKitchenY = 0.89; // Top surface of waterfall quartz island
        const targetKitchenZ = 0.46; // Distance forward onto counter
        const t = this.sitTransition;

        this.laptopGroup.position.x = THREE.MathUtils.lerp(0.26, 0, t);
        this.laptopGroup.position.y = THREE.MathUtils.lerp(0.62, targetKitchenY, t);
        this.laptopGroup.position.z = THREE.MathUtils.lerp(0.02, targetKitchenZ, t);

        this.laptopGroup.rotation.x = THREE.MathUtils.lerp(Math.PI / 2, 0, t);
        this.laptopGroup.rotation.y = THREE.MathUtils.lerp(0, -0.28, t);
        this.laptopGroup.rotation.z = THREE.MathUtils.lerp(0.12, 0, t);

        this.laptopGroup.scale.set(
          THREE.MathUtils.lerp(0.82, 1.05, t),
          THREE.MathUtils.lerp(0.82, 1.05, t),
          THREE.MathUtils.lerp(0.82, 1.05, t)
        );

        // Upright open screen lid tilted towards character
        this.lapScreenPivot.rotation.x = THREE.MathUtils.lerp(-Math.PI / 2, 0.30, t);

        const typeL = -0.85 + Math.sin(this.animTimer * 12) * 0.12;
        const typeR = -0.85 + Math.cos(this.animTimer * 12) * 0.12;
        this.leftArmGroup.rotation.x = THREE.MathUtils.lerp(-0.20, typeL, t);
        this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(-0.28, typeR, t);
        this.leftArmGroup.rotation.z = 0;
        this.rightArmGroup.rotation.z = THREE.MathUtils.lerp(-0.26, 0, t);

        this.head.rotation.x = -0.18 + Math.sin(this.animTimer * 2.0) * 0.06;

      } else if (this.currentActivity === 'garden_relax' || (isAtGarden && this.isSeated && !this.isWalking)) {
        // D2. OUTDOOR ZEN GARDEN PATIO TERRACE LAPTOP WORK & RELAXATION
        this.laptopGroup.visible = true;
        const targetGardenY = 0.74; // Teak patio table surface
        const targetGardenZ = 0.44;
        const t = this.sitTransition;

        this.laptopGroup.position.x = THREE.MathUtils.lerp(0.26, 0, t);
        this.laptopGroup.position.y = THREE.MathUtils.lerp(0.62, targetGardenY, t);
        this.laptopGroup.position.z = THREE.MathUtils.lerp(0.02, targetGardenZ, t);

        this.laptopGroup.rotation.x = THREE.MathUtils.lerp(Math.PI / 2, 0, t);
        this.laptopGroup.rotation.y = THREE.MathUtils.lerp(0, -0.28, t);
        this.laptopGroup.rotation.z = THREE.MathUtils.lerp(0.12, 0, t);

        this.laptopGroup.scale.set(
          THREE.MathUtils.lerp(0.82, 1.05, t),
          THREE.MathUtils.lerp(0.82, 1.05, t),
          THREE.MathUtils.lerp(0.82, 1.05, t)
        );

        // Upright open screen lid tilted towards character
        this.lapScreenPivot.rotation.x = THREE.MathUtils.lerp(-Math.PI / 2, 0.30, t);

        const breezeSway = Math.sin(this.animTimer * 1.5) * 0.05;
        this.upperBodyGroup.rotation.x = -0.08 + breezeSway;
        const typeL = -0.80 + Math.sin(this.animTimer * 10) * 0.12;
        const typeR = -0.80 + Math.cos(this.animTimer * 10) * 0.12;
        this.leftArmGroup.rotation.x = THREE.MathUtils.lerp(-0.20, typeL, t);
        this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(-0.28, typeR, t);
        this.leftArmGroup.rotation.z = 0;
        this.rightArmGroup.rotation.z = THREE.MathUtils.lerp(-0.26, 0, t);
        this.head.rotation.x = -0.12 + Math.sin(this.animTimer * 2.2) * 0.08;

      } else if (this.currentActivity === 'sofa_relax' || (isAtSofa && this.isSeated && !this.isWalking)) {
        // E. LUXURY VELVET SOFA / LAPTOP LOUNGE WORK POSE
        const sofaBob = Math.sin(this.animTimer * 1.8) * 0.015;
        this.upperBodyGroup.position.y = -0.20 + sofaBob; // Lowered flush onto cushion
        this.upperBodyGroup.rotation.x = -0.06; // Comfortable upright posture for laptop work
        this.leftLegGroup.position.y = 0.38 + sofaBob;
        this.rightLegGroup.position.y = 0.38 + sofaBob;
        this.leftLegGroup.rotation.x = -Math.PI / 2;
        this.rightLegGroup.rotation.x = -Math.PI / 2;
        this.leftKneeGroup.rotation.x = Math.PI / 2;
        this.rightKneeGroup.rotation.x = Math.PI / 2;
        this.leftFootGroup.rotation.x = 0;
        this.rightFootGroup.rotation.x = 0;

        if (this.id === 'eah') {
          // Eah: Holding and tapping iPad on lap (no drinks)
          this.drinkPropGroup.visible = false;
          this.coffeeMug.visible = false;
          this.waterCup.visible = false;
          this.laptopGroup.visible = false;
          this.tabletGroup.visible = true;
          // Both arms held forward holding the iPad with active tapping
          const tapBob = Math.sin(this.animTimer * 5.0) * 0.04;
          this.leftArmGroup.rotation.x = -0.58;
          this.leftArmGroup.rotation.z = -0.18;
          this.rightArmGroup.rotation.x = -0.58 + tapBob;
          this.rightArmGroup.rotation.z = 0.18;
          this.head.rotation.x = 0.24; // Gently looking down at iPad screen
        } else {
          // All specialists in Laptop Lounge have their signature laptop open on lap with active typing telemetry!
          this.tabletGroup.visible = false;
          this.drinkPropGroup.visible = false;
          this.laptopGroup.visible = true;

          // Laptop securely positioned on lap / table surface
          this.laptopGroup.position.set(0, 0.44, 0.34);
          this.laptopGroup.rotation.set(0, 0, 0);
          this.laptopGroup.scale.set(1.05, 1.05, 1.05);

          // Screen lid open tilted upright towards eyes (108 deg)
          this.lapScreenPivot.rotation.x = 0.32;

          // Active typing micro-animations on keyboard
          const typeL = -0.82 + Math.sin(this.animTimer * 12) * 0.08;
          const typeR = -0.82 + Math.cos(this.animTimer * 12) * 0.08;
          this.leftArmGroup.rotation.x = typeL;
          this.rightArmGroup.rotation.x = typeR;
          this.leftArmGroup.rotation.z = -0.12;
          this.rightArmGroup.rotation.z = 0.12;

          // Head looking down attentively at code and telemetry
          this.head.rotation.x = 0.18 + Math.sin(this.animTimer * 2.0) * 0.04;
          this.head.rotation.y = Math.sin(this.animTimer * 1.0) * 0.06;
        }

      } else if (isAtWorkBench && this.isSeated && !this.isWalking) {
        // F. COLLABORATIVE OAK BENCH LAPTOP WORKING
        this.laptopGroup.visible = true;
        const targetBenchY = 0.52;
        const targetBenchZ = 0.38;
        const t = this.sitTransition;

        this.laptopGroup.position.x = THREE.MathUtils.lerp(0.26, 0, t);
        this.laptopGroup.position.y = THREE.MathUtils.lerp(0.62, targetBenchY, t);
        this.laptopGroup.position.z = THREE.MathUtils.lerp(0.02, targetBenchZ, t);

        this.laptopGroup.rotation.x = THREE.MathUtils.lerp(Math.PI / 2, 0, t);
        this.laptopGroup.rotation.y = THREE.MathUtils.lerp(0, -0.28, t);
        this.laptopGroup.rotation.z = THREE.MathUtils.lerp(0.12, 0, t);

        this.laptopGroup.scale.set(
          THREE.MathUtils.lerp(0.82, 1.0, t),
          THREE.MathUtils.lerp(0.82, 1.0, t),
          THREE.MathUtils.lerp(0.82, 1.0, t)
        );

        // Screen lid smoothly unfolds open to an upright badass 107° angle
        this.lapScreenPivot.rotation.x = THREE.MathUtils.lerp(-Math.PI / 2, 0.30, t);

        const typeL = -0.85 + Math.sin(this.animTimer * 12) * 0.14;
        const typeR = -0.85 + Math.cos(this.animTimer * 12) * 0.14;
        this.leftArmGroup.rotation.x = THREE.MathUtils.lerp(-0.20, typeL, t);
        this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(-0.28, typeR, t);
        this.leftArmGroup.rotation.z = 0;
        this.rightArmGroup.rotation.z = THREE.MathUtils.lerp(-0.26, 0, t);

      } else if (this.currentActivity === 'meeting' || (isAtBoardTable && this.isSeated && !this.isWalking)) {
        // G. EXECUTIVE BOARDROOM ALL-HANDS CONFERENCE SEATED POSTURE WITH VISIBLE LAPTOP ON TABLE!
        this.laptopGroup.visible = true;
        const targetTableY = 0.865; // Conference table surface top
        const targetTableZ = this.id === 'dylan' ? 0.65 : 0.52;
        const t = this.sitTransition;

        // Smooth procedural transition from under-arm carry (t=0) to resting on table (t=1)
        this.laptopGroup.position.x = THREE.MathUtils.lerp(0.26, 0, t);
        this.laptopGroup.position.y = THREE.MathUtils.lerp(0.62, targetTableY, t);
        this.laptopGroup.position.z = THREE.MathUtils.lerp(0.02, targetTableZ, t);

        this.laptopGroup.rotation.x = THREE.MathUtils.lerp(Math.PI / 2, 0, t);
        this.laptopGroup.rotation.y = THREE.MathUtils.lerp(0, -0.28, t);
        this.laptopGroup.rotation.z = THREE.MathUtils.lerp(0.12, 0, t);

        this.laptopGroup.scale.set(
          THREE.MathUtils.lerp(0.82, 1.15, t),
          THREE.MathUtils.lerp(0.82, 1.15, t),
          THREE.MathUtils.lerp(0.82, 1.15, t)
        );

        // Screen lid smoothly unfolds open to an upright badass 107° angle
        this.lapScreenPivot.rotation.x = THREE.MathUtils.lerp(-Math.PI / 2, 0.30, t);

        // Active typing arms on laptop keyboard smoothly blend from carry
        const typeL = -0.84 + Math.sin(this.animTimer * 12) * 0.12;
        const typeR = -0.84 + Math.cos(this.animTimer * 12) * 0.12;
        this.leftArmGroup.rotation.x = THREE.MathUtils.lerp(-0.20, typeL, t);
        this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(-0.28, typeR, t);
        this.leftArmGroup.rotation.z = 0;
        this.rightArmGroup.rotation.z = THREE.MathUtils.lerp(-0.26, 0, t);

        // Attentive head movements glancing around table and at speaker/presentation TV
        const glanceColleague = Math.sin(this.animTimer * 1.4);
        this.head.rotation.y = glanceColleague * 0.22;
        this.head.rotation.x = -0.16 + Math.sin(this.animTimer * 2.8) * 0.08;
      } else {
        // J. STANDARD DESK TYPING POSTURE
        const typeLeft = -0.75 + Math.sin(this.animTimer * 10) * 0.15;
        const typeRight = -0.75 + Math.cos(this.animTimer * 10) * 0.15;
        this.leftArmGroup.rotation.x = THREE.MathUtils.lerp(0, typeLeft, this.sitTransition);
        this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(0, typeRight, this.sitTransition);
        this.leftArmGroup.rotation.z = 0;
        this.rightArmGroup.rotation.z = 0;
      }

      this.upperBodyGroup.rotation.z = 0;
      this.upperBodyGroup.rotation.y = 0;

      // Particles float
      if (this.statusParticles.visible) {
        this.statusParticles.children.forEach((p, idx) => {
          p.position.y = Math.sin(this.animTimer * 4 + idx) * 0.15;
          p.rotation.y += delta * 2;
        });
      }

      // Active Work Telemetry Animation on Laptop Displays
      if (this.laptopGroup.visible) {
        if (this.lapCursor) {
          this.lapCursor.visible = Math.sin(this.animTimer * 7.5) > 0;
        }
        if (this.lapGlowLight) {
          this.lapGlowLight.intensity = 0.85 + Math.sin(this.animTimer * 3.5) * 0.25;
        }
        if (this.lapCodeLines.length > 0) {
          const typeW = 0.18 + ((Math.sin(this.animTimer * 12.0) + 1) * 0.5) * 0.12;
          const targetLine = this.lapCodeLines[this.lapCodeLines.length - 1];
          if (targetLine) {
            targetLine.scale.x = typeW;
          }
        }
      }
    }

    if (this.speechTimer > 0) {
      this.speechTimer -= delta;
      if (this.speechTimer <= 0) {
        this.speechText = '';
      }
    }

    if (this.selectionRing.visible) {
      this.selectionRing.rotation.z += delta * 2;
    }



    // Ground Drop Contact Shadow
    if (this.groundShadow) {
      const bounce = Math.abs(Math.sin(this.animTimer * 11)) * 0.07;
      if (this.isWalking) {
        this.groundShadow.scale.setScalar(THREE.MathUtils.lerp(1.0, 0.82, bounce / 0.07));
      } else {
        this.groundShadow.scale.setScalar(1.0);
      }
    }
  }
}

// ============================================================================
// MAIN OFFICE 3D REACT COMPONENT
// ============================================================================
export interface Office3DProps {
  selectedAgentId?: string | null;
  onSelectAgent?: (id: string | null) => void;
  onOpenActionModal?: (id?: string) => void;
  viewMode?: 'pixel' | 'voxel';
  onViewModeChange?: (mode: 'pixel' | 'voxel') => void;
  onLock?: () => void;
}

export default function Office3D({
  selectedAgentId,
  onSelectAgent,
  onOpenActionModal,
  viewMode = 'voxel',
  onViewModeChange,
  onLock,
}: Office3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const charactersRef = useRef<Record<string, VoxelCharacter3D>>({});
  const onSelectAgentRef = useRef(onSelectAgent);
  onSelectAgentRef.current = onSelectAgent;

  // React state for HUD
  const [inMeetingMode, setInMeetingMode] = useState(false);
  const [inRestMode, setInRestMode] = useState(false);
  const [isDylanSeated, setIsDylanSeated] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const inMeetingModeRef = useRef(false);
  inMeetingModeRef.current = inMeetingMode;
  const inRestModeRef = useRef(false);
  inRestModeRef.current = inRestMode;
  const [inKitchenGardenMode, setInKitchenGardenMode] = useState(false);
  const inKitchenGardenModeRef = useRef(false);
  inKitchenGardenModeRef.current = inKitchenGardenMode;
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);

  // Real-time dialogue sequencing refs for boardroom meetings & office banter
  const meetingDialogueTimerRef = useRef(3.5);
  const meetingDialogueIndexRef = useRef(0);
  const casualChatTimerRef = useRef(10.0);
  const pendingReplyRef = useRef<{ speaker: string; text: string; delay: number } | null>(null);

  // Served meal/coffee on Dylan's desk & Served flowers/food on Eah's table
  const servedDeskItemRef = useRef<'food' | 'coffee' | null>(null);
  const servedEahTableItemRef = useRef<'flowers' | 'food' | null>(null);
  const puppySpeechRef = useRef<{ text: string; timer: number }>({ text: '', timer: 0 });
  const puppyRef = useRef<VoxelPuppy3D | null>(null);
  const catSpeechRef = useRef<{ text: string; timer: number }>({ text: '', timer: 0 });
  const catRef = useRef<VoxelCat3D | null>(null);

  // Floating RPG pop-up reactions & proximity action HUD
  const floatingPopupsRef = useRef<Array<{ id: number; text: string; x: number; y: number; z: number; color: string; life: number; maxLife: number }>>([]);
  const [screenPopups, setScreenPopups] = useState<Array<{ id: number; text: string; x: number; y: number; color: string; opacity: number }>>([]);
  const [proximityHUD, setProximityHUD] = useState<{
    type: 'eah' | 'puppy' | 'cat' | 'arcade' | 'coffee' | 'server' | 'water' | 'none';
    title: string;
    badge: string;
    color: string;
  } | null>(null);
  const lastProximityTypeRef = useRef<string | null>(null);
  const lastPopupCountRef = useRef<number>(0);

  // 3D Voxel Camera Tilt & Orbit Controls State
  const [tiltMode, setTiltMode] = useState<'cinematic' | 'isometric' | 'topdown' | 'front'>('cinematic');

  // Responsive HUD Navigation & Viewport States
  const [isHudMinimized, setIsHudMinimized] = useState<boolean>(false);
  const [activeHudTab, setActiveHudTab] = useState<'all' | 'actions' | 'roster' | 'cameras'>('all');
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1440);
  const cameraControlRef = useRef<{
    setTilt: (pitchRad: number, mode: 'cinematic' | 'isometric' | 'topdown' | 'front') => void;
    rotateBy: (deltaYaw: number) => void;
    snapCardinal: () => void;
    focusDylan: () => void;
    focusServerRoom: () => void;
    resetView: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
  }>({
    setTilt: () => {},
    rotateBy: () => {},
    snapCardinal: () => {},
    focusDylan: () => {},
    focusServerRoom: () => {},
    resetView: () => {},
    zoomIn: () => {},
    zoomOut: () => {},
  });

  const addFloatingPopup = (text: string, x: number, y: number, z: number, color = '#fb7185') => {
    floatingPopupsRef.current.push({
      id: Date.now() + Math.random(),
      text,
      x,
      y,
      z,
      color,
      life: 2.8,
      maxLife: 2.8,
    });
  };

  // DOM node references for 100% crisp, retina-sharp HTML speech bubbles
  const bubbleElsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Keyboard continuous control state
  const keysPressed = useRef<Set<string>>(new Set());

  const playSfx = useCallback((type: 'click' | 'drink' | 'bell' | 'door') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.05);
      } else if (type === 'drink') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.15);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.35);
      } else if (type === 'bell') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.6);
      } else if (type === 'door') {
        // Soft futuristic pneumatic / sliding track glide sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.25);
        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.28);
      }
    } catch {}
  }, [soundEnabled]);

  const play8BitGameSound = useCallback((sound: 'click' | 'step' | 'coin' | 'heart' | 'bark' | 'meow' | 'purr' | 'quest') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (sound === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now);
        osc.frequency.setValueAtTime(1318.51, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.35);
      } else if (sound === 'heart') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.4);
      } else if (sound === 'bark') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.18);
      } else if (sound === 'meow') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(680, now);
        osc.frequency.exponentialRampToValueAtTime(940, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(580, now + 0.22);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.22);
      } else if (sound === 'purr') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(75, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.35);
      } else if (sound === 'quest') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.08);
        osc.frequency.setValueAtTime(659.25, now + 0.16);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.45);
      } else if (sound === 'step') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.06);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.06);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(580, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.05);
      }
    } catch {}
  }, [soundEnabled]);

  // Eah cooking & coffee actions
  const handleEahCookBreakfast = useCallback(() => {
    const eah = charactersRef.current.eah;
    if (eah) {
      eah.eahStep = 'cook_walk';
      eah.isSeated = false;
      eah.currentActivity = 'working';
      eah.setSpeech('Right away Dylan! Cooking fresh breakfast for you! 🍳🥓', 4.5);
      eah.walkTo(4.8, 12.7);
      addFloatingPopup('🍳 Eah Cooking Breakfast! ✨ (+500 ENERGY)', eah.currentX, 2.8, eah.currentZ, '#fb7185');
      play8BitGameSound('quest');
      playSfx('click');
    }
  }, [play8BitGameSound, playSfx]);

  const handleEahBrewCoffee = useCallback(() => {
    const eah = charactersRef.current.eah;
    if (eah) {
      eah.eahStep = 'coffee_walk';
      eah.isSeated = false;
      eah.currentActivity = 'working';
      eah.setSpeech('Sure Dylan! Brewing your favorite hot coffee! ☕✨', 4.5);
      eah.walkTo(23.4, 18.6);
      addFloatingPopup('☕ Caramel Latte for Dylan Ramos! ✨ (+350 FOCUS)', eah.currentX, 2.8, eah.currentZ, '#f59e0b');
      play8BitGameSound('quest');
      playSfx('click');
    }
  }, [play8BitGameSound, playSfx]);

  // Dylan caring actions for Eah (Flowers & Cooking with Love! 💖💐)
  const handleDylanGiveFlowers = useCallback(() => {
    const dylan = charactersRef.current.dylan;
    const eah = charactersRef.current.eah;
    if (dylan && eah) {
      dylan.dylanStep = 'flower_walk';
      dylan.isSeated = false;
      dylan.currentActivity = 'delivering_flowers';
      dylan.setSpeech('Surprising Eah with fresh flowers to brighten her day! 💐🌹', 4.5);
      dylan.walkTo(OFFICE_3D_LAYOUT.CEO.eahSeat.x + 0.95, OFFICE_3D_LAYOUT.CEO.eahSeat.z);
      addFloatingPopup('💐 Giving Fresh Flowers to Eah! 🌹 (+500 LOVE)', dylan.currentX, 2.8, dylan.currentZ, '#fb7185');
      play8BitGameSound('heart');
      playSfx('click');
    }
  }, [play8BitGameSound, playSfx]);

  const handleDylanCookForEah = useCallback(() => {
    const dylan = charactersRef.current.dylan;
    const eah = charactersRef.current.eah;
    if (dylan && eah) {
      dylan.dylanStep = 'cook_walk';
      dylan.isSeated = false;
      dylan.currentActivity = 'working';
      dylan.setSpeech('Eah always cooks for me—time to return the favor! 🍳✨', 4.5);
      dylan.walkTo(4.8, 12.7);
      addFloatingPopup('🍳 Dylan Cooking for Eah! 🥞 (+500 AFFECTION)', dylan.currentX, 2.8, dylan.currentZ, '#f59e0b');
      play8BitGameSound('quest');
      playSfx('click');
    }
  }, [play8BitGameSound, playSfx]);

  // Sync selectedAgentId prop
  useEffect(() => {
    Object.entries(charactersRef.current).forEach(([id, char]) => {
      char.setSelection(id === selectedAgentId);
    });
  }, [selectedAgentId]);

  // Dylan Sit/Stand Toggle
  const handleToggleDylanSit = () => {
    playSfx('click');
    const d = charactersRef.current.dylan;
    if (!d) return;
    if (d.isSeated) {
      d.isSeated = false;
      d.group.position.z = d.deskZ + 1.6; // Steps out in front of executive desk towards door
      d.group.rotation.y = 0; // facing door
      d.setSpeech('Standing up & inspecting HQ!');
      setIsDylanSeated(false);
    } else {
      d.walkTo(d.deskX, d.deskZ);
      d.setSpeech('Returning to CEO Command Station.');
      setIsDylanSeated(true);
    }
  };

  // Workers Stand & Stretch
  const handleAllWorkersStand = () => {
    playSfx('bell');
    ['ray', 'maya', 'alex', 'wendy', 'zane'].forEach((id) => {
      const char = charactersRef.current[id];
      if (char) {
        char.isSeated = false;
        char.group.position.z = char.deskZ + 0.8;
        char.setSpeech('🙆‍♂️ Standing up & stretching!');
        char.waitTimer = 5;
      }
    });
  };

  // All-Hands Meeting in Boardroom
  const handleToggleMeetingMode = () => {
    playSfx('bell');
    const nextMeeting = !inMeetingMode;
    setInMeetingMode(nextMeeting);
    if (nextMeeting && inRestMode) {
      setInRestMode(false);
    }

    Object.values(charactersRef.current).forEach((char) => {
      if (char.id === 'eah') {
        char.currentActivity = 'sofa_relax';
        char.isSeated = true;
        char.setSpeech(nextMeeting ? 'Good luck in the all-hands meeting Dylan! 💕' : 'Welcome back to the office, babe! ✨', 4.5);
        return;
      }

      if (nextMeeting) {
        char.currentActivity = 'meeting';
        char.walkTo(char.seatX, char.seatZ);
        char.setSpeech(char.id === 'dylan' ? '📢 All-hands assembled!' : 'Walking to boardroom...');
      } else {
        char.currentActivity = 'working';
        char.walkTo(char.deskX, char.deskZ);
        char.setSpeech('Back to desk.');
      }
    });
  };

  // Automated Directive Sprint Meeting in Executive Boardroom
  const handleStartDirectiveMeeting = useCallback((data: { topic?: string; leadAgent?: string; durationMs?: number }) => {
    playSfx('bell');
    setInMeetingMode(true);
    setInRestMode(false);

    const topic = data.topic ? (data.topic.length > 36 ? data.topic.slice(0, 36) + '...' : data.topic) : 'Executive Directive';
    const leadId = data.leadAgent || 'alex';

    addFloatingPopup(`🤝 ALL-HANDS SPRINT: "${topic}"`, 29.5, 3.8, 16.2, '#00f0ff');

    const roleLines: Record<string, string> = {
      alex: '⚡ Fullstack architecture & API routes ready!',
      maya: '🎨 Designing UI tokens & responsive layouts!',
      ray: '🧠 Research & model patterns aligned!',
      wendy: '📈 Growth metrics & launch messaging locked!',
      zane: '🛡️ Zero-trust firewall & security perimeter verified!',
    };

    Object.values(charactersRef.current).forEach((char) => {
      if (char.id === 'eah') {
        char.currentActivity = 'sofa_relax';
        char.isSeated = true;
        char.setSpeech('Good luck in the strategy meeting, Dylan! 💕✨', 5.0);
        return;
      }

      char.currentActivity = 'meeting';
      char.walkTo(char.seatX, char.seatZ);

      if (char.id === 'dylan') {
        char.setSpeech(`📢 Team, Dylan Ramos assigned: "${topic}"! Let's align!`, 5.5);
      } else if (char.id === leadId) {
        char.setSpeech(`💪 On it Dylan! Leading this sprint now.`, 5.0);
      } else {
        const line = roleLines[char.id] || 'Aligned for sprint!';
        char.setSpeech(line, 4.5);
      }
    });
  }, [playSfx]);

  const handleEndDirectiveMeeting = useCallback((data?: { leadAgent?: string }) => {
    playSfx('bell');
    setInMeetingMode(false);
    const leadId = data?.leadAgent;

    addFloatingPopup('🚀 SPRINT ALIGNED: Commencing execution!', 29.5, 3.8, 16.2, '#22c55e');

    Object.values(charactersRef.current).forEach((char) => {
      if (char.id === 'eah') return;

      char.currentActivity = 'working';
      char.walkTo(char.deskX, char.deskZ);

      if (char.id === leadId) {
        char.setSpeech('Executing directive now! 💻🔥', 5.0);
      } else {
        char.setSpeech('Back to my station!', 3.5);
      }
    });
  }, [playSfx]);

  const handleStartDirectiveMeetingRef = useRef(handleStartDirectiveMeeting);
  handleStartDirectiveMeetingRef.current = handleStartDirectiveMeeting;
  const handleEndDirectiveMeetingRef = useRef(handleEndDirectiveMeeting);
  handleEndDirectiveMeetingRef.current = handleEndDirectiveMeeting;

  // Autonomous or Manual Task Completion Reporting to CEO Room
  const handleReportToCeo = useCallback((agentId?: string, taskTitle?: string) => {
    const targetAgentId = agentId || selectedAgentId || 'alex';
    const char = charactersRef.current[targetAgentId];
    const dylan = charactersRef.current['dylan'];
    if (!char || char.id === 'dylan') return;

    play8BitGameSound('quest');
    const taskName = taskTitle || 'Assigned Architecture & Code Directive';
    addFloatingPopup(`📋 TASK COMPLETED: ${char.name} reporting to CEO Dylan!`, char.currentX, 2.8, char.currentZ, '#ffbe0b');

    char.isSeated = false;
    char.currentActivity = 'reporting_to_ceo';
    char.setSpeech(`Heading to CEO Suite to report completed task to Dylan Ramos! 📋✨`, 4.5);
    // Dylan's executive desk is at x=4.8, z=4.0. Stand at x=4.8, z=5.4 directly in front of desk facing north!
    char.walkTo(4.8, 5.4);

    const checkArrival = setInterval(() => {
      if (char.pathQueue.length === 0 && Math.hypot(char.currentX - 4.8, char.currentZ - 5.4) < 1.4) {
        clearInterval(checkArrival);
        char.group.rotation.y = Math.PI; // Face north towards Dylan
        char.setSpeech(`Dylan! Task completed 100%: "${taskName}"! All deliverables deployed! 🚀📋`, 6.0);
        
        play8BitGameSound('coin');
        playSfx('bell');
        addFloatingPopup(`🌟 TASK APPROVED BY CEO DYLAN RAMOS! ✨ (+1000 XP)`, 4.8, 3.2, 5.0, '#ffbe0b');

        if (dylan) {
          dylan.group.rotation.y = 0; // Dylan turns south in his executive chair to face worker
          setTimeout(() => {
            dylan.setSpeech(`Outstanding work ${char.name.split(' ')[0]}! Exceptional leadership for AVERO HQ! 🌟👑`, 6.0);
          }, 1500);
        }

        setTimeout(() => {
          if (char.currentActivity === 'reporting_to_ceo') {
            char.setSpeech(`Thank you Dylan! Returning to my station with new directives! 💻✨`, 4.0);
            char.walkTo(char.deskX, char.deskZ);
            char.currentActivity = 'working';
          }
        }, 7500);
      }
    }, 500);

    setTimeout(() => clearInterval(checkArrival), 20000);
  }, [play8BitGameSound, playSfx, selectedAgentId]);

  const handleReportToCeoRef = useRef(handleReportToCeo);
  handleReportToCeoRef.current = handleReportToCeo;

  // All-Hands Rest & Relaxation in Coffee Lounge
  const handleToggleRestMode = () => {
    playSfx('drink');
    const nextRest = !inRestMode;
    setInRestMode(nextRest);
    if (nextRest && inMeetingMode) {
      setInMeetingMode(false);
    }

    Object.values(charactersRef.current).forEach((char) => {
      if (char.id === 'eah') {
        char.currentActivity = 'sofa_relax';
        char.isSeated = true;
        char.setSpeech(nextRest ? 'Cozy here in the CEO suite 💕' : 'Keeping Dylan company in the office! 💕', 4.5);
        return;
      }

      if (nextRest) {
        const restSeat = (OFFICE_3D_LAYOUT.REST_AREA.seats as Record<string, { x: number; z: number }>)[char.id];
        if (restSeat) {
          if (char.id === 'dylan') char.currentActivity = 'drinking_coffee';
          else if (char.id === 'zane') char.currentActivity = 'playing_arcade';
          else if (char.id === 'ray' || char.id === 'maya') char.currentActivity = 'sofa_relax';
          else char.currentActivity = 'working';
          char.walkTo(restSeat.x, restSeat.z);
          const msg =
            char.id === 'dylan'
              ? '👑 Founder laptop session at the espresso bar!'
              : char.id === 'alex'
              ? '💻 Crushing API endpoints on the lounge work bench!'
              : char.id === 'wendy'
              ? '📢 Drafting campaign launch copy on the work bench!'
              : char.id === 'maya'
              ? '🎨 Wireframing Figma prototypes on the velvet sofa!'
              : char.id === 'ray'
              ? '🔍 Deep-diving research papers with my laptop in the lounge!'
              : '🛡️ Running zero-trust security audit from the arcade lounge!';
          char.setSpeech(msg);
        }
      } else {
        char.currentActivity = 'working';
        char.walkTo(char.deskX, char.deskZ);
        char.setSpeech('Break finished, back to main desk!');
      }
    });
  };

  // Team Work & Hangout in Kitchen Suite & Outdoor Zen Garden Patio
  const handleToggleKitchenGarden = () => {
    playSfx('drink');
    const nextKG = !inKitchenGardenMode;
    setInKitchenGardenMode(nextKG);
    if (nextKG) {
      if (inMeetingMode) setInMeetingMode(false);
      if (inRestMode) setInRestMode(false);
    }

    Object.values(charactersRef.current).forEach((char) => {
      if (char.id === 'eah') {
        char.currentActivity = 'sofa_relax';
        char.isSeated = true;
        char.setSpeech('Staying right here in Dylan\'s office 🌸', 4.5);
        return;
      }

      if (nextKG) {
        if (char.id === 'dylan') {
          // Dylan visits the Kitchen Island
          char.walkTo(OFFICE_3D_LAYOUT.KITCHEN.seats.left.x, OFFICE_3D_LAYOUT.KITCHEN.seats.left.z);
          char.currentActivity = 'kitchen_work';
          char.setSpeech('☕ Checking metrics with espresso at the kitchen island!');
        } else if (char.id === 'ray') {
          char.walkTo(OFFICE_3D_LAYOUT.KITCHEN.seats.right.x, OFFICE_3D_LAYOUT.KITCHEN.seats.right.z);
          char.currentActivity = 'kitchen_work';
          char.setSpeech('🥐 Reviewing model inference over croissants!');
        } else if (char.id === 'maya') {
          char.walkTo(OFFICE_3D_LAYOUT.GARDEN.seats.left.x, OFFICE_3D_LAYOUT.GARDEN.seats.left.z);
          char.currentActivity = 'garden_relax';
          char.setSpeech('🌿 Designing mobile UI outdoors under the parasol!');
        } else if (char.id === 'alex') {
          char.walkTo(OFFICE_3D_LAYOUT.GARDEN.seats.right.x, OFFICE_3D_LAYOUT.GARDEN.seats.right.z);
          char.currentActivity = 'garden_relax';
          char.setSpeech('💻 Coding fullstack features with a garden breeze!');
        } else if (char.id === 'wendy') {
          char.walkTo(4.5, 17.2);
          char.currentActivity = 'garden_relax';
          char.setSpeech('🌸 Brainstorming viral marketing ideas in the garden!');
        } else if (char.id === 'zane') {
          char.walkTo(1.8, 16.5);
          char.currentActivity = 'garden_relax';
          char.setSpeech('🛡️ Monitoring security feeds by the zen fountain!');
        }
      } else {
        char.currentActivity = 'working';
        char.walkTo(char.deskX, char.deskZ);
        char.setSpeech('Back to workstation desk.');
      }
    });
  };

  // Main Three.js Scene Setup & Render Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- 1. Scene, Renderer, Post-Processing Low-Res Pixel Filter ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c14);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Retina & 4K Super-Sampling Engine:
    // Ensures crisp 1:1 hardware pixel mapping (minimum 2.0 DPR even on standard 1080p monitors)
    const getTargetDpr = () => {
      const native = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
      return Math.min(native, 2);
    };

    const targetDpr = getTargetDpr();
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    renderer.setPixelRatio(targetDpr);
    renderer.setSize(width, height, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    // Hard-lock canvas styling to prevent subpixel scaling blur
    const dom = renderer.domElement;
    dom.style.position = 'absolute';
    dom.style.top = '0';
    dom.style.left = '0';
    dom.style.width = '100%';
    dom.style.height = '100%';
    dom.style.display = 'block';
    dom.style.imageRendering = '-webkit-optimize-contrast';
    dom.style.outline = 'none';
    container.appendChild(dom);

    // --- 2. Tilted Voxel Camera Setup ---
    const aspect = width / height;
    const frustumSize = 27.5;
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      -100,
      1000
    );

    const centerPoint = new THREE.Vector3(19.225, 0, 10.75);
    const cameraRadius = 50;
    const initialPitch = 0.48; // ~27.5° Tilted Cinematic View (Rich 3D depth showing face details, furniture heights, and drop shadows)
    const initialYaw = Math.PI * 0.25; // 45° corner view

    camera.position.set(
      centerPoint.x + cameraRadius * Math.cos(initialPitch) * Math.sin(initialYaw),
      centerPoint.y + cameraRadius * Math.sin(initialPitch),
      centerPoint.z + cameraRadius * Math.cos(initialPitch) * Math.cos(initialYaw)
    );
    camera.lookAt(centerPoint);

    // --- 3. Studio Office Lighting ---
    const ambientLight = new THREE.AmbientLight(0xa0b4d0, 1.1);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff6e6, 1.5);
    dirLight.position.set(35, 45, 25);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    const sSize = 28;
    dirLight.shadow.camera.left = -sSize;
    dirLight.shadow.camera.right = sSize;
    dirLight.shadow.camera.top = sSize;
    dirLight.shadow.camera.bottom = -sSize;
    dirLight.shadow.bias = -0.0003;
    dirLight.shadow.normalBias = 0.02;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x4a6090, 0.45);
    fillLight.position.set(-25, 25, -25);
    scene.add(fillLight);

    // Synthwave glowing desk light in CEO office
    const ceoLight = new THREE.PointLight(0x00f0ff, 1.2, 8);
    ceoLight.position.set(5.0, 2.0, 4.6);
    scene.add(ceoLight);

    // High-Tech Cyber Security & Server Vault Architecture Lighting
    // 1. Clean cool-white datacenter architectural ceiling flood
    const serverMainLight = new THREE.PointLight(0xe0f2fe, 2.4, 18, 1.4);
    serverMainLight.position.set(34.2, 3.8, 5.8);
    scene.add(serverMainLight);

    // 2. High-tech emerald/cyan ambient server rack glow
    const serverRackGlow = new THREE.PointLight(0x00f59b, 1.6, 12, 1.4);
    serverRackGlow.position.set(34.0, 2.6, 2.6);
    scene.add(serverRackGlow);

    // 3. Command console & desk task illumination for Alex & Zane
    const serverTaskLight = new THREE.PointLight(0x38bdf8, 1.6, 10, 1.4);
    serverTaskLight.position.set(34.2, 2.5, 7.4);
    scene.add(serverTaskLight);

    // --- 4. Materials Palette ---
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const mats = {
      ceoNavyFloor: new THREE.MeshLambertMaterial({ color: 0x161e2e }),
      ceoRug: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      bullpenFloor: new THREE.MeshLambertMaterial({ color: 0x7a969e }),
      bullpenAlt: new THREE.MeshLambertMaterial({ color: 0x6f8b93 }),
      boardroomFloor: new THREE.MeshLambertMaterial({ color: 0x4e2f1d }), // Rich executive walnut
      boardroomWoodDark: new THREE.MeshLambertMaterial({ color: 0x3d2314 }), // Deep executive walnut plank
      boardroomWoodPlank: new THREE.MeshLambertMaterial({ color: 0x5a361e }), // Warm golden walnut parquet
      boardroomWoodLight: new THREE.MeshLambertMaterial({ color: 0x6e4326 }), // Polished amber oak inlay
      outerBorder: new THREE.MeshLambertMaterial({ color: 0xf3e3c3 }),
      glassWall: new THREE.MeshLambertMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, depthWrite: false }),
      wallTrim: new THREE.MeshLambertMaterial({ color: 0x0f172a }),
      whiteDesk: new THREE.MeshLambertMaterial({ color: 0xffffff }),
      deskTrim: new THREE.MeshLambertMaterial({ color: 0x334155 }),
      deskWalnut: new THREE.MeshLambertMaterial({ color: 0x2e180d }),
      deskTrimBrass: new THREE.MeshLambertMaterial({ color: 0xd97706, emissive: 0xb45309, emissiveIntensity: 0.35 }),
      laptopSilver: new THREE.MeshLambertMaterial({ color: 0x94a3b8 }),
      laptopDark: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      laptopScreenCode: new THREE.MeshLambertMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.9 }),
      screenBlueCode: new THREE.MeshLambertMaterial({ color: 0x0284c7, emissive: 0x38bdf8, emissiveIntensity: 0.95 }),
      screenPurpleKanban: new THREE.MeshLambertMaterial({ color: 0x7c3aed, emissive: 0xa855f7, emissiveIntensity: 0.95 }),
      screenAmberTickets: new THREE.MeshLambertMaterial({ color: 0xd97706, emissive: 0xf59e0b, emissiveIntensity: 0.95 }),
      screenGreenCopy: new THREE.MeshLambertMaterial({ color: 0x059669, emissive: 0x10b981, emissiveIntensity: 0.95 }),
      screenCyanExecutive: new THREE.MeshLambertMaterial({ color: 0x0891b2, emissive: 0x06b6d4, emissiveIntensity: 0.95 }),
      screenGoldKPI: new THREE.MeshLambertMaterial({ color: 0xb45309, emissive: 0xfbbf24, emissiveIntensity: 0.9 }),
      screenFigmaPink: new THREE.MeshLambertMaterial({ color: 0xdb2777, emissive: 0xec4899, emissiveIntensity: 0.95 }),
      screenPalette: new THREE.MeshLambertMaterial({ color: 0xf43f5e, emissive: 0xfb7185, emissiveIntensity: 0.9 }),
      screenAlexIDE: new THREE.MeshLambertMaterial({ color: 0xc2410c, emissive: 0xf97316, emissiveIntensity: 0.95 }),
      screenAlexTerm: new THREE.MeshLambertMaterial({ color: 0x1c1917, emissive: 0xfbbf24, emissiveIntensity: 0.9 }),
      screenNoraBI: new THREE.MeshLambertMaterial({ color: 0x059669, emissive: 0x10b981, emissiveIntensity: 0.95 }),
      screenNoraSQL: new THREE.MeshLambertMaterial({ color: 0x064e3b, emissive: 0x34d399, emissiveIntensity: 0.9 }),
      screenZaneMatrix: new THREE.MeshLambertMaterial({ color: 0x15803d, emissive: 0x22c55e, emissiveIntensity: 0.95 }),
      screenZaneRadar: new THREE.MeshLambertMaterial({ color: 0x052e16, emissive: 0x4ade80, emissiveIntensity: 0.9 }),
      deskMatBlack: new THREE.MeshLambertMaterial({ color: 0x0f172a }),
      deskMatCyan: new THREE.MeshLambertMaterial({ color: 0x083344 }),
      deskMatPurple: new THREE.MeshLambertMaterial({ color: 0x2e1065 }),
      chairChrome: new THREE.MeshLambertMaterial({ color: 0xcfd8dc }),
      chairMesh: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      chairMeshCeo: new THREE.MeshLambertMaterial({ color: 0x111827 }),
      chairFrameDark: new THREE.MeshLambertMaterial({ color: 0x334155 }),
      rgbTowerCyan: new THREE.MeshLambertMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.85 }),
      rgbTowerPurple: new THREE.MeshLambertMaterial({ color: 0xa855f7, emissive: 0xa855f7, emissiveIntensity: 0.85 }),
      rgbTowerAmber: new THREE.MeshLambertMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.85 }),
      rgbTowerOrange: new THREE.MeshLambertMaterial({ color: 0xf97316, emissive: 0xf97316, emissiveIntensity: 0.85 }),
      rgbTowerEmerald: new THREE.MeshLambertMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.85 }),
      rgbTowerPink: new THREE.MeshLambertMaterial({ color: 0xec4899, emissive: 0xec4899, emissiveIntensity: 0.85 }),
      rgbTowerGreen: new THREE.MeshLambertMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.85 }),
      chairNavy: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      chairFrame: new THREE.MeshLambertMaterial({ color: 0x475569 }),
      screenSynth: new THREE.MeshLambertMaterial({ color: 0xec4899, emissive: 0x00f0ff, emissiveIntensity: 0.8 }),
      screenCode: new THREE.MeshLambertMaterial({ color: 0x00f59b, emissive: 0x00f59b, emissiveIntensity: 0.85 }),
      bookshelf: new THREE.MeshLambertMaterial({ color: 0x78350f }),
      trophy: new THREE.MeshLambertMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.7 }),
      sofaLeather: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      tableGlass: new THREE.MeshLambertMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45, depthWrite: false }),
      coolerBase: new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }),
      coolerJug: new THREE.MeshLambertMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75, depthWrite: false }),
      boardTable: new THREE.MeshLambertMaterial({ color: 0x2d1810 }),
      boardScreen: new THREE.MeshLambertMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.9 }),
      duckYellow: new THREE.MeshLambertMaterial({ color: 0xfacc15 }),
      plantGreen: new THREE.MeshLambertMaterial({ color: 0x15803d }),
      potOrange: new THREE.MeshLambertMaterial({ color: 0xc2410c }),
      // Zone 4 Coffee Lounge & Rest Area Materials (Boutique Lounge matching User Reference)
      loungeRug: new THREE.MeshLambertMaterial({ color: 0x5b8586 }), // Muted sage-teal area rug
      loungeSofa: new THREE.MeshLambertMaterial({ color: 0x283548 }), // Dark slate leather cushions
      loungeSofaTrim: new THREE.MeshLambertMaterial({ color: 0x1b2432 }), // Dark charcoal leather frame
      caramelWood: new THREE.MeshLambertMaterial({ color: 0xc67d4b }), // Warm honey-caramel wood tables
      dogBedDonut: new THREE.MeshLambertMaterial({ color: 0xc27845 }), // Caramel outer donut rim
      dogBedCream: new THREE.MeshLambertMaterial({ color: 0xfef3c7 }), // Plush cream cushion
      dogFurBlack: new THREE.MeshLambertMaterial({ color: 0x18181b }), // Black husky/shiba fur
      dogFurWhite: new THREE.MeshLambertMaterial({ color: 0xf8fafc }), // White muzzle/chest blaze
      dogPinkTongue: new THREE.MeshLambertMaterial({ color: 0xf43f5e, emissive: 0xf43f5e, emissiveIntensity: 0.35 }),
      catBedSky: new THREE.MeshLambertMaterial({ color: 0x38bdf8 }), // Sky-blue outer velvet rim
      catBedFluff: new THREE.MeshLambertMaterial({ color: 0xffffff }), // Pure white cloud cushion
      catFurWhite: new THREE.MeshLambertMaterial({ color: 0xffffff }), // Pure white cat fur
      catPinkNose: new THREE.MeshLambertMaterial({ color: 0xf472b6, emissive: 0xf472b6, emissiveIntensity: 0.3 }),
      catEyeEmerald: new THREE.MeshLambertMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.6 }),
      arcadeBody: new THREE.MeshLambertMaterial({ color: 0x1e1b4b }),
      arcadeScreen: new THREE.MeshLambertMaterial({ color: 0xec4899, emissive: 0xec4899, emissiveIntensity: 0.95 }),
      arcadeMarquee: new THREE.MeshLambertMaterial({ color: 0xffbe0b, emissive: 0xffbe0b, emissiveIntensity: 0.8 }),
      espressoCounter: new THREE.MeshLambertMaterial({ color: 0x334155 }),
      espressoMarble: new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }),
      espressoRed: new THREE.MeshLambertMaterial({ color: 0xdc2626 }),
      goldAccent: new THREE.MeshLambertMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.5 }),
      // Zone 5A Kitchen Materials
      kitchenTileLight: new THREE.MeshLambertMaterial({ color: 0xf1f5f9 }),
      kitchenTileDark: new THREE.MeshLambertMaterial({ color: 0x334155 }),
      kitchenCabinet: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      kitchenCabinetOak: new THREE.MeshLambertMaterial({ color: 0x78350f }),
      kitchenMarble: new THREE.MeshLambertMaterial({ color: 0xf8fafc }),
      kitchenStainless: new THREE.MeshLambertMaterial({ color: 0x94a3b8 }),
      kitchenBarStool: new THREE.MeshLambertMaterial({ color: 0x9a3412 }),
      // Zone 5B Outdoor Garden Materials
      gardenDeck: new THREE.MeshLambertMaterial({ color: 0x92400e }),
      gardenGrass: new THREE.MeshLambertMaterial({ color: 0x15803d }),
      gardenPaver: new THREE.MeshLambertMaterial({ color: 0x94a3b8 }),
      gardenUmbrellaCanopy: new THREE.MeshLambertMaterial({ color: 0xfef3c7 }),
      gardenUmbrellaPole: new THREE.MeshLambertMaterial({ color: 0x475569 }),
      gardenWovenChair: new THREE.MeshLambertMaterial({ color: 0x78350f }),
      fountainStone: new THREE.MeshLambertMaterial({ color: 0x475569 }),
      fountainWater: new THREE.MeshLambertMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 }),
      bistroLightGlow: new THREE.MeshLambertMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 0.95 }),
      // Architectural Door Systems
      doorGlass: new THREE.MeshLambertMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.45,
      }),
      doorFrostedBand: new THREE.MeshLambertMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.75,
      }),
      doorFrameDark: new THREE.MeshLambertMaterial({ color: 0x0f172a }),
      doorJambDark: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      doorTrackSilver: new THREE.MeshLambertMaterial({ color: 0x94a3b8 }),
      doorThreshold: new THREE.MeshLambertMaterial({ color: 0x64748b }),
      doorSealDark: new THREE.MeshLambertMaterial({ color: 0x090d16 }),
      // Zone 6 Server Vault & Cyber Security Room Materials
      serverFloorDark: new THREE.MeshLambertMaterial({ color: 0x0f172a }),
      serverFloorAlt: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      serverFloorGrate: new THREE.MeshLambertMaterial({ color: 0x0a101d }), // Perforated cold aisle airflow floor grate
      serverRackDark: new THREE.MeshLambertMaterial({ color: 0x080c14 }),  // 42U Heavy steel chassis
      serverRackTrim: new THREE.MeshLambertMaterial({ color: 0x334155 }),  // Vertical U-rails / corner posts
      serverRackDoor: new THREE.MeshLambertMaterial({ color: 0x0f172a, transparent: true, opacity: 0.88 }), // Smoked mesh/glass door
      serverMeshGrill: new THREE.MeshLambertMaterial({ color: 0x1e293b }), // Intake honeycomb mesh
      serverDriveCaddy: new THREE.MeshLambertMaterial({ color: 0x475569 }), // 2.5" enterprise drive caddies
      serverPduChassis: new THREE.MeshLambertMaterial({ color: 0x1e1b4b }), // Zero-U vertical PDU body
      serverFanHub: new THREE.MeshLambertMaterial({ color: 0x0284c7, emissive: 0x0284c7, emissiveIntensity: 0.5 }), // Top exhaust fan hub
      fiberDuctYellow: new THREE.MeshLambertMaterial({ color: 0xfacc15 }), // Industrial yellow fiber duct raceway
      fiberDuctCover: new THREE.MeshLambertMaterial({ color: 0xfef08a, transparent: true, opacity: 0.75 }),
      fiberAqua: new THREE.MeshLambertMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 0.9 }),
      fiberOrange: new THREE.MeshLambertMaterial({ color: 0xf97316, emissive: 0xf97316, emissiveIntensity: 0.9 }),
      serverLedGreen: new THREE.MeshLambertMaterial({ color: 0x00f59b, emissive: 0x00f59b, emissiveIntensity: 0.95 }),
      serverLedCyan: new THREE.MeshLambertMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.95 }),
      serverLedAmber: new THREE.MeshLambertMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.95 }),
      serverLedRed: new THREE.MeshLambertMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.95 }),
      threatMapBoard: new THREE.MeshLambertMaterial({ color: 0x021e0e }),
      threatMapGlow: new THREE.MeshLambertMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.95 }),
      threatMapThreat: new THREE.MeshLambertMaterial({ color: 0xf43f5e, emissive: 0xf43f5e, emissiveIntensity: 0.95 }),
      serverCableTray: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      serverCableGlow: new THREE.MeshLambertMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 0.75 }),
      crashCartSteel: new THREE.MeshLambertMaterial({ color: 0x334155 }),
      crashCartScreen: new THREE.MeshLambertMaterial({ color: 0x00f59b, emissive: 0x00f59b, emissiveIntensity: 0.9 }),
      cracChillerBody: new THREE.MeshLambertMaterial({ color: 0x1e293b }), // Industrial In-Row CRAC Chiller
      cracChillerLouver: new THREE.MeshLambertMaterial({ color: 0x0f172a }),
      cracChillerColdGlow: new THREE.MeshLambertMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.75 }),
      fireCylinderRed: new THREE.MeshLambertMaterial({ color: 0xdc2626 }), // FM-200 Fire Clean Agent
      fireManifoldBrass: new THREE.MeshLambertMaterial({ color: 0xd97706 }),
    };

    const ceoSensorMat = new THREE.MeshLambertMaterial({
      color: 0x0284c7,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9,
    });
    const boardSensorMat = new THREE.MeshLambertMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.9,
    });
    const serverSensorMat = new THREE.MeshLambertMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.9,
    });
    const meetingSensorMat = new THREE.MeshLambertMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.9,
    });

    function addVoxel(x: number, y: number, z: number, mat: THREE.Material, sx = 1, sy = 1, sz = 1, shadow = true) {
      const mesh = new THREE.Mesh(boxGeo, mat);
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      mesh.castShadow = shadow;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    }

    // --- Smart Adaptive Cutaway Perimeter Groups (Architectural Section Cut) ---
    // Prevents exterior walls from blocking the interior when camera orbits or tilts
    const northWallGroup = new THREE.Group();
    const southWallGroup = new THREE.Group();
    const eastWallGroup = new THREE.Group();
    const westWallGroup = new THREE.Group();
    scene.add(northWallGroup);
    scene.add(southWallGroup);
    scene.add(eastWallGroup);
    scene.add(westWallGroup);

    let northPlaqueBg: THREE.Mesh | null = null;
    let northPlaqueGold: THREE.Mesh | null = null;
    let eastCableTray: THREE.Mesh | null = null;
    let eastCableGlow: THREE.Mesh | null = null;

    function addVoxelToGroup(
      group: THREE.Group,
      x: number,
      y: number,
      z: number,
      mat: THREE.Material,
      sx = 1,
      sy = 1,
      sz = 1,
      shadow = true
    ) {
      const mesh = new THREE.Mesh(boxGeo, mat);
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      mesh.castShadow = shadow;
      mesh.receiveShadow = true;
      group.add(mesh);
      return mesh;
    }

    // --- 5. High-Resolution Custom Architectural Plaques (AVERO Brand Signage) ---
    function createPlaqueTexture(title: string, subtitle?: string, accentColor = '#ffbe0b') {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 320;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Dark obsidian background
        ctx.fillStyle = '#0a0f1d';
        ctx.fillRect(0, 0, 1024, 320);

        // Gold/Cyan perimeter trim
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 18;
        ctx.strokeRect(18, 18, 988, 284);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(34, 34, 956, 252);

        // Title text
        ctx.fillStyle = '#f8fafc';
        ctx.font = '900 86px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(title, 512, subtitle ? 116 : 160);

        // Subtitle
        if (subtitle) {
          ctx.fillStyle = accentColor;
          ctx.font = '700 42px monospace';
          ctx.fillText(subtitle, 512, 226);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        try {
          tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        } catch {}
        return tex;
      } catch {
        return null;
      }
    }

    const averoCeoTex = createPlaqueTexture('AVERO', 'EXECUTIVE SUITE', '#ffbe0b');
    const averoCeoMat = averoCeoTex ? new THREE.MeshBasicMaterial({ map: averoCeoTex }) : mats.goldAccent;

    const averoBuildingTex = createPlaqueTexture('★ AVERO HQ ★', 'AUTONOMOUS AI VIRTUAL OFFICE', '#00f0ff');
    const averoBuildingMat = averoBuildingTex ? new THREE.MeshBasicMaterial({ map: averoBuildingTex }) : mats.goldAccent;

    // Procedural High-Definition Seamless Tile & Parquet Textures (Zero Seams, Zero Glitching, Zero Z-Fighting!)
    function createKitchenTileTexture() {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const cols = 8;
        const rows = 5;
        const colW = canvas.width / cols;
        const rowH = canvas.height / rows;

        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            const isLight = (c + r) % 2 === 0;
            const x = c * colW;
            const y = r * rowH;

            // Base tile ceramic fill
            ctx.fillStyle = isLight ? '#f8fafc' : '#1e293b';
            ctx.fillRect(x, y, colW, rowH);

            // Subtle 3D beveled edge highlight & shadow
            if (isLight) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(x + 2, y + 2, colW - 4, 3);
              ctx.fillRect(x + 2, y + 2, 3, rowH - 4);
              ctx.fillStyle = '#e2e8f0';
              ctx.fillRect(x + colW - 5, y + 2, 3, rowH - 4);
              ctx.fillRect(x + 2, y + rowH - 5, colW - 4, 3);
            } else {
              ctx.fillStyle = '#334155';
              ctx.fillRect(x + 2, y + 2, colW - 4, 3);
              ctx.fillRect(x + 2, y + 2, 3, rowH - 4);
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(x + colW - 5, y + 2, 3, rowH - 4);
              ctx.fillRect(x + 2, y + rowH - 5, colW - 4, 3);
            }

            // Crisp clean mortar/grout line
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, y + 1, colW - 2, rowH - 2);
          }
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        try {
          tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        } catch {}
        return tex;
      } catch {
        return null;
      }
    }

    function createBoardroomTileTexture() {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const cols = 17;
        const rows = 10;
        const colW = canvas.width / cols;
        const rowH = canvas.height / rows;

        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            const isInlay = c >= 2 && c <= 14 && r >= 2 && r <= 7;
            const isAlt = (c + r) % 2 === 0;
            const x = c * colW;
            const y = r * rowH;

            if (isInlay) {
              // Table inlay: Warm amber oak & golden walnut
              ctx.fillStyle = isAlt ? '#6e4326' : '#5a361e';
              ctx.fillRect(x, y, colW, rowH);

              // Subtle horizontal wood grain slats
              ctx.fillStyle = isAlt ? '#7d4c2b' : '#663d22';
              ctx.fillRect(x + 6, y + rowH * 0.25, colW - 12, 1.5);
              ctx.fillRect(x + 6, y + rowH * 0.50, colW - 12, 1.5);
              ctx.fillRect(x + 6, y + rowH * 0.75, colW - 12, 1.5);
            } else {
              // Perimeter: Deep executive walnut parquet
              ctx.fillStyle = isAlt ? '#5a361e' : '#3d2314';
              ctx.fillRect(x, y, colW, rowH);

              // Subtle vertical wood grain slats
              ctx.fillStyle = isAlt ? '#663d22' : '#4a2b19';
              ctx.fillRect(x + colW * 0.25, y + 6, 1.5, rowH - 12);
              ctx.fillRect(x + colW * 0.50, y + 6, 1.5, rowH - 12);
              ctx.fillRect(x + colW * 0.75, y + 6, 1.5, rowH - 12);
            }

            // Fine parquet groove line
            ctx.strokeStyle = '#26140b';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x + 0.75, y + 0.75, colW - 1.5, rowH - 1.5);
          }
        }

        // Luxurious Brass Inlay Border enclosing columns 2..14 and rows 2..7
        const inlayX0 = 2 * colW;
        const inlayY0 = 2 * rowH;
        const inlayW = 13 * colW;
        const inlayH = 6 * rowH;
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 4;
        ctx.strokeRect(inlayX0 + 2, inlayY0 + 2, inlayW - 4, inlayH - 4);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        try {
          tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        } catch {}
        return tex;
      } catch {
        return null;
      }
    }

    const kitchenTileTex = createKitchenTileTexture();
    const boardroomTileTex = createBoardroomTileTexture();

    // Helper: Ultra-Flush Seamless Textured Floor (Guaranteed zero seams and zero Z-fighting)
    function addFloorSurface(
      xMid: number,
      zMid: number,
      width: number,
      depth: number,
      texture: THREE.Texture | null,
      fallbackMat: THREE.Material
    ) {
      // 1. Foundation rim slab sitting at y = 0.010 with height 0.020 (top is at y = 0.020 - 11mm cleanly BELOW floor quad)
      addVoxel(xMid, 0.010, zMid, mats.wallTrim, width, 0.02, depth, false);

      // 2. Ultra-flush top surface quad (y: 0.031, polygonOffset enabled to guarantee absolute depth priority over any base geometry)
      const planeGeo = new THREE.PlaneGeometry(width, depth);
      const baseMat = texture
        ? new THREE.MeshLambertMaterial({ map: texture, side: THREE.FrontSide })
        : (fallbackMat as THREE.Material).clone();
      const mat = baseMat as THREE.MeshLambertMaterial;
      mat.polygonOffset = true;
      mat.polygonOffsetFactor = -2.0;
      mat.polygonOffsetUnits = -4.0;
      const mesh = new THREE.Mesh(planeGeo, mat);
      mesh.position.set(xMid, 0.031, zMid);
      mesh.rotation.x = -Math.PI / 2;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    }

    // --- 5B. Build Architectural Foundation Base & Interior Room Floors ---
    // A. Architectural Foundation Base Plinth (Unified flush solid base slab under entire office)
    // Strictly below y = 0.00 (from y = -1.21 to -0.01) so foundation never fights with floor bottom
    addVoxel(19.225, -0.61, 10.75, mats.wallTrim, 37.55, 1.20, 20.60, false);

    // B. Interior Room Floor Voxels - Clean Non-Overlapping Precision Grid
    function createRoomFloor(
      xMin: number,
      xMax: number,
      zMin: number,
      zMax: number,
      cols: number,
      rows: number,
      getMaterial: (col: number, row: number, xMid: number, zMid: number) => THREE.Material
    ) {
      const width = xMax - xMin;
      const depth = zMax - zMin;
      const dx = width / cols;
      const dz = depth / rows;

      for (let c = 0; c < cols; c++) {
        const x0 = xMin + c * dx;
        const x1 = xMin + (c + 1) * dx;
        const xMid = (x0 + x1) / 2;
        const sx = x1 - x0;

        for (let r = 0; r < rows; r++) {
          const z0 = zMin + r * dz;
          const z1 = zMin + (r + 1) * dz;
          const zMid = (z0 + z1) / 2;
          const sz = z1 - z0;

          const mat = getMaterial(c, r, xMid, zMid);
          addVoxel(xMid, 0.015, zMid, mat, sx, 0.03, sz, false);
        }
      }
    }

    // 1. CEO Executive Suite (x: 0.45..10.0, z: 0.45..11.0)
    createRoomFloor(0.45, 10.0, 0.45, 11.0, 10, 11, (_c, _r, x, z) => {
      // Dylan's Executive Command Desk Rug
      if (x >= 2.0 && x <= 8.0 && z >= 2.0 && z <= 8.0) return mats.ceoRug;
      return mats.ceoNavyFloor;
    });

    // 2. Team Open Bullpen (x: 10.0..26.0, z: 0.45..11.0)
    createRoomFloor(10.0, 26.0, 0.45, 11.0, 16, 11, (c, r) => {
      return (c + r) % 2 === 0 ? mats.bullpenFloor : mats.bullpenAlt;
    });

    // 3. Cyber Security & Server Vault (x: 26.0..38.0, z: 0.45..11.0)
    createRoomFloor(26.0, 38.0, 0.45, 11.0, 12, 11, (c, r, x, z) => {
      // Cold-Aisle Raised Airflow Floor Grates directly in front of the 4 server racks
      if (z >= 2.5 && z <= 3.5 && x >= 27.2 && x <= 36.8) return mats.serverFloorGrate;
      // High-tech terminal workstation rug under Alex & Zane's desks
      if (x >= 27.2 && x <= 36.8 && z >= 6.0 && z <= 9.2) return mats.ceoRug;
      return (c + r) % 2 === 0 ? mats.serverFloorDark : mats.serverFloorAlt;
    });

    // 4. Gourmet Pantry & Kitchen Suite (x: 0.45..8.0, z: 11.0..16.0)
    // French Bistro Checkerboard Ceramic Tiles - 100% Seamless & Glitch-Free Single Surface!
    addFloorSurface(4.225, 13.5, 7.55, 5.0, kitchenTileTex, mats.kitchenTileLight);

    // 5. Outdoor Zen Garden & Patio Terrace (x: 0.45..8.0, z: 16.0..21.05)
    createRoomFloor(0.45, 8.0, 16.0, 21.05, 8, 5, (c, r, x, z) => {
      if (x >= 2.0 && x <= 6.5 && z >= 16.8 && z <= 19.8) return mats.gardenDeck; // Warm teak slatted outdoor patio deck
      if (c === 0 || r === 4) return mats.gardenGrass; // Outdoor lush grass border
      return mats.gardenPaver; // Natural stone pavers
    });

    // 6. Team Relaxation & Coffee Lounge (x: 8.0..21.0, z: 11.0..21.05)
    createRoomFloor(8.0, 21.0, 11.0, 21.05, 13, 10, (c, r, x, z) => {
      if (x >= 9.5 && x <= 19.5 && z >= 13.0 && z <= 20.0) return mats.loungeRug; // Luxurious sage-teal area rug
      return (c + r) % 2 === 0 ? mats.bullpenFloor : mats.bullpenAlt;
    });

    // 7. Executive Boardroom / Meeting Room (x: 21.0..38.0, z: 11.0..21.05)
    // Rich warm executive walnut hardwood parquet & brass inlay - 100% Seamless & Glitch-Free Single Surface!
    addFloorSurface(29.5, 16.025, 17.0, 10.05, boardroomTileTex, mats.boardroomWoodPlank);

    // =========================================================================
    // 5A. ARCHITECTURAL DIVIDING WALLS & FLUSH PARTITIONS (100% UNIFIED 2.40M)
    // =========================================================================

    // 1. Vertical Glass Dividing Wall between CEO Suite & Bullpen (x = 10.0, z: 0.45..10.90)
    // Continuous overhead lintel spanning from North wall (z = 0.45) to Center horizontal wall (z = 10.90)
    addVoxel(10.0, 2.30, 5.675, mats.wallTrim, 0.24, 0.20, 10.45);
    // North glass section before doorway (z: 0.45..6.85)
    addVoxel(10.0, 1.10, 3.65, mats.glassWall, 0.20, 2.20, 6.40);
    addVoxel(10.0, 0.08, 3.65, mats.wallTrim, 0.24, 0.16, 6.40);
    // South glass section after doorway (z: 10.15..10.90 - connects flush into z = 11 wall)
    addVoxel(10.0, 1.10, 10.525, mats.glassWall, 0.20, 2.20, 0.75);
    addVoxel(10.0, 0.08, 10.525, mats.wallTrim, 0.24, 0.16, 0.75);

    // 2. Vertical Security Glass Wall between Bullpen & Server Room (x = 26.0, z: 0.45..10.90)
    // Continuous overhead lintel spanning from North wall (z = 0.45) to Center horizontal wall (z = 10.90)
    addVoxel(26.0, 2.30, 5.675, mats.wallTrim, 0.24, 0.20, 10.45);
    // North glass section before doorway (z: 0.45..5.20)
    addVoxel(26.0, 1.10, 2.825, mats.glassWall, 0.20, 2.20, 4.75);
    addVoxel(26.0, 0.08, 2.825, mats.wallTrim, 0.24, 0.16, 4.75);
    // South glass section after doorway (z: 7.80..10.90 - connects flush into z = 11 wall)
    addVoxel(26.0, 1.10, 9.35, mats.glassWall, 0.20, 2.20, 3.10);
    addVoxel(26.0, 0.08, 9.35, mats.wallTrim, 0.24, 0.16, 3.10);

    // 3. Main Center Dividing Wall along z = 11.0 (Spans full building from x = 0.45 to x = 37.90)
    // Section A: Gourmet Pantry Back Acoustic Wall (x: 0.45..10.0, width = 9.55m)
    addVoxel(5.225, 1.10, 11.0, mats.doorFrameDark, 9.55, 2.20, 0.20);
    addVoxel(5.225, 2.30, 11.0, mats.wallTrim, 9.55, 0.20, 0.24);
    addVoxel(5.225, 0.08, 11.0, mats.wallTrim, 9.55, 0.16, 0.24);

    // Section B: Bullpen / Lounge Glass Divider (x: 10.0..16.5, width = 6.5m)
    addVoxel(13.25, 1.10, 11.0, mats.glassWall, 6.50, 2.20, 0.20);
    addVoxel(13.25, 2.30, 11.0, mats.wallTrim, 6.50, 0.20, 0.24);
    addVoxel(13.25, 0.08, 11.0, mats.wallTrim, 6.50, 0.16, 0.24);

    // Section C: Lounge Entrance Double Sliding Doors (x: 16.5..20.5, width = 4.0m)
    addVoxel(18.5, 2.30, 11.0, mats.wallTrim, 4.0, 0.20, 0.24);
    addVoxel(18.5, 2.10, 11.0, mats.doorFrameDark, 3.82, 0.20, 0.24); // Flush transom header under lintel
    // Glowing AVERO HQ Corporate Marquee Sign above Central Double Entrance (Both Sides Visible)
    addVoxel(18.5, 2.48, 11.0, mats.wallTrim, 3.6, 0.26, 0.08);
    addVoxel(18.5, 2.48, 11.05, averoBuildingMat, 3.4, 0.22, 0.02, false); // facing Lounge (+z)
    addVoxel(18.5, 2.48, 10.95, averoBuildingMat, 3.4, 0.22, 0.02, false); // facing Bullpen (-z)

    // Section D: Bullpen / Boardroom Solid Acoustic Private Wall (x: 20.5..26.0, width = 5.50m)
    // 100% Solid Soundproof Private Architecture (Zero Glass)
    addVoxel(23.25, 1.10, 11.0, mats.doorFrameDark, 5.50, 2.20, 0.20);
    // Boardroom side (+z): Executive acoustic walnut slat paneling facing the meeting table
    addVoxel(23.25, 1.10, 11.10, mats.bookshelf, 5.46, 2.04, 0.02);
    for (let bx = 20.9; bx <= 25.8; bx += 0.55) {
      addVoxel(bx, 1.10, 11.115, mats.boardroomWoodDark, 0.06, 2.04, 0.02);
    }
    // Bullpen side (-z): Sleek architectural dark finish with baseboard
    addVoxel(23.25, 1.10, 10.90, mats.doorFrameDark, 5.46, 2.04, 0.02);
    addVoxel(23.25, 2.30, 11.0, mats.wallTrim, 5.50, 0.20, 0.24);
    addVoxel(23.25, 0.08, 11.0, mats.wallTrim, 5.50, 0.16, 0.24);

    // Section D2: Server Room / Boardroom Solid Acoustic Wall (x: 26.0..27.5, width = 1.50m)
    addVoxel(26.75, 1.10, 11.0, mats.doorFrameDark, 1.50, 2.20, 0.20);
    addVoxel(26.75, 1.10, 11.10, mats.bookshelf, 1.46, 2.04, 0.02);
    addVoxel(26.75, 1.10, 10.90, mats.serverRackDark, 1.46, 2.04, 0.02);
    addVoxel(26.75, 2.30, 11.0, mats.wallTrim, 1.50, 0.20, 0.24);
    addVoxel(26.75, 0.08, 11.0, mats.wallTrim, 1.50, 0.16, 0.24);

    // Section E: Boardroom Acoustic Media Backing Wall behind Ultra-HD Screen (x: 27.5..31.5, width = 4.0m)
    addVoxel(29.5, 1.10, 11.0, mats.doorFrameDark, 4.0, 2.20, 0.20);
    addVoxel(29.5, 1.10, 11.10, mats.bookshelf, 4.0, 2.04, 0.02);
    addVoxel(29.5, 1.10, 10.90, mats.serverRackDark, 4.0, 2.04, 0.02);
    addVoxel(29.5, 1.90, 10.88, mats.threatMapBoard, 3.6, 0.14, 0.02);
    addVoxel(29.5, 1.90, 10.87, mats.serverLedGreen, 3.2, 0.04, 0.01, false);
    addVoxel(29.5, 2.30, 11.0, mats.wallTrim, 4.0, 0.20, 0.24);
    addVoxel(29.5, 0.08, 11.0, mats.wallTrim, 4.0, 0.16, 0.24);

    // Section F: Solid Acoustic Soundproof Wall between Server Room & Boardroom (x: 31.5..37.90, width = 6.40m)
    // Seamlessly touches East wall inner surface at x = 37.90 (ZERO gap, ZERO step, 100% Solid Private)
    addVoxel(34.70, 1.10, 11.0, mats.doorFrameDark, 6.40, 2.20, 0.20);
    // Boardroom side (+z): Executive acoustic walnut slats
    addVoxel(34.70, 1.10, 11.10, mats.bookshelf, 6.36, 2.04, 0.02);
    for (let mx = 32.0; mx <= 37.5; mx += 0.55) {
      addVoxel(mx, 1.10, 11.115, mats.boardroomWoodDark, 0.06, 2.04, 0.02);
    }
    // Server room side (-z): Dark steel server vault finish
    addVoxel(34.70, 1.10, 10.90, mats.serverRackDark, 6.36, 2.04, 0.02);
    addVoxel(34.70, 2.30, 11.0, mats.wallTrim, 6.40, 0.20, 0.24);
    addVoxel(34.70, 0.08, 11.0, mats.wallTrim, 6.40, 0.16, 0.24);
    // Flush East Wall junction post meeting East Wall
    addVoxel(37.90, 1.10, 11.0, mats.doorJambDark, 0.16, 2.20, 0.22);
    addVoxel(37.90, 2.30, 11.0, mats.wallTrim, 0.16, 0.20, 0.24);
    addVoxel(37.90, 0.08, 11.0, mats.wallTrim, 0.16, 0.16, 0.24);

    // Structural Junction Posts at Grid Intersections along z = 11.0
    // CEO Suite / Bullpen / Pantry / Lounge junction at x = 10.0, z = 11.0
    addVoxel(10.0, 1.10, 11.0, mats.doorJambDark, 0.24, 2.20, 0.24);
    addVoxel(10.0, 2.30, 11.0, mats.wallTrim, 0.26, 0.20, 0.26);
    addVoxel(10.0, 0.08, 11.0, mats.wallTrim, 0.26, 0.16, 0.26);

    // Bullpen / Server Room / Boardroom junction at x = 26.0, z = 11.0
    addVoxel(26.0, 1.10, 11.0, mats.doorJambDark, 0.24, 2.20, 0.24);
    addVoxel(26.0, 2.30, 11.0, mats.wallTrim, 0.26, 0.20, 0.26);
    addVoxel(26.0, 0.08, 11.0, mats.wallTrim, 0.26, 0.16, 0.26);

    // 4. Vertical Wall between Pantry & Lounge / Zen Garden (x = 8.0, z: 11.10..21.05)
    // Continuous overhead lintel spanning from z = 11.10 to z = 21.05
    addVoxel(8.0, 2.30, 16.075, mats.wallTrim, 0.24, 0.20, 9.95);
    // Pantry doorway section: North panel (z: 11.10..12.80)
    addVoxel(8.0, 1.10, 11.95, mats.glassWall, 0.20, 2.20, 1.70);
    addVoxel(8.0, 0.08, 11.95, mats.wallTrim, 0.24, 0.16, 1.70);
    // Pantry Doorway Frame (z: 12.80..15.20)
    addVoxel(8.0, 1.10, 12.80, mats.doorJambDark, 0.24, 2.20, 0.16); // Left jamb post
    addVoxel(8.0, 1.10, 15.20, mats.doorJambDark, 0.24, 2.20, 0.16); // Right jamb post
    addVoxel(8.0, 2.10, 14.00, mats.doorFrameDark, 0.22, 0.20, 2.24); // Overhead transom header (NO GAP!)
    // Post between kitchen door and patio door (z: 15.20..16.0)
    addVoxel(8.0, 1.10, 15.60, mats.glassWall, 0.20, 2.20, 0.80);
    addVoxel(8.0, 0.08, 15.60, mats.wallTrim, 0.24, 0.16, 0.80);
    // Lounge to Zen Garden panoramic glass divider (z: 16.0..21.05, length = 5.05m)
    addVoxel(8.0, 1.10, 18.525, mats.glassWall, 0.20, 2.20, 5.05);
    addVoxel(8.0, 0.08, 18.525, mats.wallTrim, 0.24, 0.16, 5.05);
    // Solid Transition Junction Pillar meeting South Wall at x = 8.0, z = 21.05 (ZERO GAP!)
    addVoxel(8.0, 1.10, 21.05, mats.doorJambDark, 0.24, 2.20, 0.24);
    addVoxel(8.0, 2.30, 21.05, mats.wallTrim, 0.26, 0.20, 0.26);
    addVoxel(8.0, 0.08, 21.05, mats.wallTrim, 0.26, 0.16, 0.26);

    // 5. Sliding Patio Glass Door Divider between Kitchen & Zen Garden (z = 16.0, x: 0.45..8.0)
    addVoxel(4.225, 2.30, 16.0, mats.doorFrameDark, 7.55, 0.20, 0.24); // Overhead lintel
    // West glass panel (x: 0.45..3.00)
    addVoxel(1.725, 1.10, 16.0, mats.doorGlass, 2.55, 2.20, 0.20);
    addVoxel(1.725, 0.08, 16.0, mats.wallTrim, 2.55, 0.16, 0.24);
    // Sliding patio doorway (x: 3.00..5.50)
    addVoxel(3.00, 1.10, 16.0, mats.doorJambDark, 0.16, 2.20, 0.24); // Left jamb post
    addVoxel(5.50, 1.10, 16.0, mats.doorJambDark, 0.16, 2.20, 0.24); // Right jamb post
    addVoxel(4.25, 2.10, 16.0, mats.doorTrackSilver, 2.34, 0.20, 0.24); // Overhead transom & track (NO GAP!)
    addVoxel(4.25, 0.022, 16.0, mats.doorThreshold, 2.50, 0.035, 0.26);
    // East glass panel (x: 5.50..8.00)
    addVoxel(6.75, 1.10, 16.0, mats.doorGlass, 2.50, 2.20, 0.20);
    addVoxel(6.75, 0.08, 16.0, mats.wallTrim, 2.50, 0.16, 0.24);

    // 6. Solid Acoustic Private Dividing Wall between Boardroom & Lounge (x = 21.0, z: 11.10..21.05)
    // 100% Solid Private Architecture (Zero Glass) for Confidential Meeting Space
    addVoxel(21.0, 2.30, 16.075, mats.wallTrim, 0.24, 0.20, 9.95); // Continuous overhead lintel
    // North Solid Acoustic Panel (z: 11.10..14.825, length = 3.725m)
    addVoxel(21.0, 1.10, 12.9625, mats.doorFrameDark, 0.20, 2.20, 3.725);
    // Boardroom side (+x): Warm acoustic walnut paneling & vertical slats
    addVoxel(21.10, 1.10, 12.9625, mats.bookshelf, 0.02, 2.04, 3.68);
    for (let wz = 11.50; wz <= 14.50; wz += 0.45) {
      addVoxel(21.115, 1.10, wz, mats.boardroomWoodDark, 0.02, 2.04, 0.06);
    }
    // Lounge side (-x): Dark architectural finish with warm caramel reveal lines
    addVoxel(20.90, 1.10, 12.9625, mats.doorFrameDark, 0.02, 2.04, 3.68);
    addVoxel(20.89, 1.10, 12.9625, mats.caramelWood, 0.01, 0.08, 3.66);
    addVoxel(20.89, 1.90, 12.9625, mats.caramelWood, 0.01, 0.04, 3.66);
    addVoxel(21.0, 0.08, 12.9625, mats.wallTrim, 0.24, 0.16, 3.725);

    // South Solid Acoustic Panel (z: 17.325..21.05, length = 3.725m)
    addVoxel(21.0, 1.10, 19.1875, mats.doorFrameDark, 0.20, 2.20, 3.725);
    // Boardroom side (+x): Warm acoustic walnut paneling & vertical slats
    addVoxel(21.10, 1.10, 19.1875, mats.bookshelf, 0.02, 2.04, 3.68);
    for (let wz = 17.70; wz <= 20.70; wz += 0.45) {
      addVoxel(21.115, 1.10, wz, mats.boardroomWoodDark, 0.02, 2.04, 0.06);
    }
    // Lounge side (-x): Boutique lounge acoustic finish with double caramel reveal lines
    addVoxel(20.90, 1.10, 19.1875, mats.doorFrameDark, 0.02, 2.04, 3.68);
    addVoxel(20.89, 1.10, 19.1875, mats.caramelWood, 0.01, 0.08, 3.66);
    addVoxel(20.89, 1.90, 19.1875, mats.caramelWood, 0.01, 0.04, 3.66);
    addVoxel(21.0, 0.08, 19.1875, mats.wallTrim, 0.24, 0.16, 3.725);

    // Corner junction post meeting South wall at x = 21.0, z = 21.05
    addVoxel(21.0, 1.10, 21.05, mats.doorJambDark, 0.24, 2.20, 0.24);
    addVoxel(21.0, 2.30, 21.05, mats.wallTrim, 0.26, 0.20, 0.26);
    addVoxel(21.0, 0.08, 21.05, mats.wallTrim, 0.26, 0.16, 0.26);

    // --- 5B. Architectural Door Systems (Frames, Tracks, Plaques & Sliding Leaves) ---
    function addDoorVoxel(
      group: THREE.Group,
      x: number,
      y: number,
      z: number,
      mat: THREE.Material,
      sx = 1,
      sy = 1,
      sz = 1,
      shadow = true
    ) {
      const mesh = new THREE.Mesh(boxGeo, mat);
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      mesh.castShadow = shadow;
      mesh.receiveShadow = true;
      group.add(mesh);
      return mesh;
    }

    // 1. CEO SUITE SLIDING GLASS DOOR (x = 10.0, doorway z: 6.85..10.15, center z = 8.5)
    // Full 2.20m Flush Doorway Jamb Posts (No 20cm gaps!):
    addVoxel(10.0, 1.10, 6.85, mats.doorJambDark, 0.26, 2.20, 0.20);
    addVoxel(10.0, 1.10, 10.15, mats.doorJambDark, 0.26, 2.20, 0.20);
    // Flush Transom Header filling y: 2.00..2.20 directly beneath the 2.40m lintel
    addVoxel(10.0, 2.10, 8.5, mats.doorFrameDark, 0.26, 0.20, 3.10);
    // Overhead heavy-duty sliding guide track (Spanning Northward to accommodate slide into glass partition)
    addVoxel(10.0, 1.95, 7.6, mats.doorTrackSilver, 0.28, 0.10, 5.20);
    // Flush floor threshold guide plate
    addVoxel(10.0, 0.020, 8.5, mats.doorThreshold, 0.32, 0.034, 3.40);
    // Top PIR presence sensor housing & dynamic LED
    addVoxel(10.0, 2.18, 8.5, mats.doorJambDark, 0.30, 0.08, 0.36);
    addVoxel(10.16, 2.18, 8.5, ceoSensorMat, 0.04, 0.04, 0.12, false); // facing bullpen
    addVoxel(9.84, 2.18, 8.5, ceoSensorMat, 0.04, 0.04, 0.12, false);  // facing CEO suite

    // CEO Executive Wall Plaque (AVERO Brand Plaque)
    // Facing Bullpen (x = 10.14)
    addVoxel(10.14, 1.70, 6.45, mats.deskTrimBrass, 0.04, 0.36, 0.94);
    addVoxel(10.16, 1.70, 6.45, mats.doorFrameDark, 0.03, 0.28, 0.86);
    addVoxel(10.18, 1.70, 6.45, averoCeoMat, 0.02, 0.24, 0.82, false); // Engraved AVERO executive plaque
    // Facing CEO Suite (x = 9.86)
    addVoxel(9.86, 1.70, 6.45, mats.deskTrimBrass, 0.04, 0.36, 0.94);
    addVoxel(9.84, 1.70, 6.45, mats.doorFrameDark, 0.03, 0.28, 0.86);
    addVoxel(9.82, 1.70, 6.45, averoCeoMat, 0.02, 0.24, 0.82, false);

    // Dynamic Sliding Door Leaf Group
    const ceoDoorGroup = new THREE.Group();
    ceoDoorGroup.position.set(10.0, 0, 8.5);
    scene.add(ceoDoorGroup);

    // Door Leaf Construction (relative to group center)
    // Tempered glass panel
    addDoorVoxel(ceoDoorGroup, 0, 0.98, 0, mats.doorGlass, 0.07, 1.84, 2.84);
    // Aluminum perimeter frame: top rail & bottom kick plate
    addDoorVoxel(ceoDoorGroup, 0, 1.91, 0, mats.doorFrameDark, 0.11, 0.06, 2.88);
    addDoorVoxel(ceoDoorGroup, 0, 0.08, 0, mats.doorFrameDark, 0.11, 0.14, 2.88);
    // Left & right stiles
    addDoorVoxel(ceoDoorGroup, 0, 0.99, -1.41, mats.doorFrameDark, 0.11, 1.78, 0.06);
    addDoorVoxel(ceoDoorGroup, 0, 0.99, 1.41, mats.doorFrameDark, 0.11, 1.78, 0.06);
    // Frosted privacy manifestation bands
    addDoorVoxel(ceoDoorGroup, 0, 1.05, 0, mats.doorFrostedBand, 0.08, 0.30, 2.80);
    addDoorVoxel(ceoDoorGroup, 0, 1.30, 0, mats.doorFrostedBand, 0.08, 0.04, 2.80);
    addDoorVoxel(ceoDoorGroup, 0, 0.80, 0, mats.doorFrostedBand, 0.08, 0.04, 2.80);
    // Chrome vertical architectural pull handles (on both sides & both ends)
    // North end handles:
    addDoorVoxel(ceoDoorGroup, 0.08, 1.0, -1.1, mats.chairChrome, 0.03, 0.76, 0.03);
    addDoorVoxel(ceoDoorGroup, 0.05, 1.32, -1.1, mats.chairChrome, 0.05, 0.03, 0.03);
    addDoorVoxel(ceoDoorGroup, 0.05, 0.68, -1.1, mats.chairChrome, 0.05, 0.03, 0.03);
    addDoorVoxel(ceoDoorGroup, -0.08, 1.0, -1.1, mats.chairChrome, 0.03, 0.76, 0.03);
    addDoorVoxel(ceoDoorGroup, -0.05, 1.32, -1.1, mats.chairChrome, 0.05, 0.03, 0.03);
    addDoorVoxel(ceoDoorGroup, -0.05, 0.68, -1.1, mats.chairChrome, 0.05, 0.03, 0.03);
    // South end handles:
    addDoorVoxel(ceoDoorGroup, 0.08, 1.0, 1.1, mats.chairChrome, 0.03, 0.76, 0.03);
    addDoorVoxel(ceoDoorGroup, 0.05, 1.32, 1.1, mats.chairChrome, 0.05, 0.03, 0.03);
    addDoorVoxel(ceoDoorGroup, 0.05, 0.68, 1.1, mats.chairChrome, 0.05, 0.03, 0.03);
    addDoorVoxel(ceoDoorGroup, -0.08, 1.0, 1.1, mats.chairChrome, 0.03, 0.76, 0.03);
    addDoorVoxel(ceoDoorGroup, -0.05, 1.32, 1.1, mats.chairChrome, 0.05, 0.03, 0.03);
    addDoorVoxel(ceoDoorGroup, -0.05, 0.68, 1.1, mats.chairChrome, 0.05, 0.03, 0.03);
    // Top roller trolley brackets
    addDoorVoxel(ceoDoorGroup, 0, 1.96, -0.9, mats.chairChrome, 0.12, 0.05, 0.08);
    addDoorVoxel(ceoDoorGroup, 0, 1.96, 0.9, mats.chairChrome, 0.12, 0.05, 0.08);

    // 2. BOARDROOM DOUBLE BI-PARTING FRENCH SLIDING DOORS (z = 11.0, x: 16.5..20.5, center x = 18.5)
    // Full 2.20m Flush Doorway Jamb Posts (No 20cm gaps!):
    addVoxel(16.5, 1.10, 11.0, mats.doorJambDark, 0.18, 2.20, 0.26);
    addVoxel(20.5, 1.10, 11.0, mats.doorJambDark, 0.18, 2.20, 0.26);
    // Flush Transom Header filling y: 2.00..2.20 directly beneath the 2.40m lintel
    addVoxel(18.5, 2.10, 11.0, mats.doorFrameDark, 3.82, 0.20, 0.26);
    // Overhead heavy-duty double sliding track
    addVoxel(18.5, 1.95, 11.0, mats.doorTrackSilver, 4.16, 0.10, 0.28);
    // Flush floor threshold guide plate
    addVoxel(18.5, 0.020, 11.0, mats.doorThreshold, 4.10, 0.034, 0.32);
    // Overhead center motion sensor housing & dynamic LED
    addVoxel(18.5, 2.18, 11.0, mats.doorJambDark, 0.36, 0.08, 0.30);
    addVoxel(18.5, 2.18, 11.16, boardSensorMat, 0.12, 0.04, 0.04, false); // facing bullpen
    addVoxel(18.5, 2.18, 10.84, boardSensorMat, 0.12, 0.04, 0.04, false); // facing boardroom

    // Boardroom Illuminated Acrylic Sign
    // Facing Bullpen (z = 11.15)
    addVoxel(18.5, 2.18, 11.15, mats.doorJambDark, 1.80, 0.18, 0.04);
    addVoxel(18.5, 2.18, 11.18, mats.boardScreen, 1.62, 0.10, 0.03, false); // Luminous cyan title
    // Facing Boardroom (z = 10.85)
    addVoxel(18.5, 2.18, 10.85, mats.doorJambDark, 1.80, 0.18, 0.04);
    addVoxel(18.5, 2.18, 10.82, mats.boardScreen, 1.62, 0.10, 0.03, false);

    // Dynamic Sliding Door Leaves (Bi-Parting: Left & Right, meeting at x = 18.5)
    const boardDoorLeftGroup = new THREE.Group();
    boardDoorLeftGroup.position.set(17.56, 0, 11.0);
    scene.add(boardDoorLeftGroup);

    const boardDoorRightGroup = new THREE.Group();
    boardDoorRightGroup.position.set(19.44, 0, 11.0);
    scene.add(boardDoorRightGroup);

    // Left Leaf Construction (width 1.85, spans x: -0.925 to +0.925 locally)
    addDoorVoxel(boardDoorLeftGroup, 0, 0.98, 0, mats.doorGlass, 1.85, 1.84, 0.07);
    addDoorVoxel(boardDoorLeftGroup, 0, 1.91, 0, mats.doorFrameDark, 1.87, 0.06, 0.11);
    addDoorVoxel(boardDoorLeftGroup, 0, 0.08, 0, mats.doorFrameDark, 1.87, 0.14, 0.11);
    addDoorVoxel(boardDoorLeftGroup, -0.91, 0.99, 0, mats.doorFrameDark, 0.06, 1.78, 0.11);
    addDoorVoxel(boardDoorLeftGroup, 0.91, 0.99, 0, mats.doorSealDark, 0.06, 1.78, 0.11); // Center meeting seal
    addDoorVoxel(boardDoorLeftGroup, 0, 1.05, 0, mats.doorFrostedBand, 1.83, 0.30, 0.08);
    addDoorVoxel(boardDoorLeftGroup, 0, 1.30, 0, mats.doorFrostedBand, 1.83, 0.04, 0.08);
    addDoorVoxel(boardDoorLeftGroup, 0, 0.80, 0, mats.doorFrostedBand, 1.83, 0.04, 0.08);
    // Chrome vertical pull handle near meeting edge (x = 0.78)
    addDoorVoxel(boardDoorLeftGroup, 0.78, 1.0, 0.08, mats.chairChrome, 0.03, 0.76, 0.03);
    addDoorVoxel(boardDoorLeftGroup, 0.78, 1.32, 0.05, mats.chairChrome, 0.03, 0.03, 0.05);
    addDoorVoxel(boardDoorLeftGroup, 0.78, 0.68, 0.05, mats.chairChrome, 0.03, 0.03, 0.05);
    addDoorVoxel(boardDoorLeftGroup, 0.78, 1.0, -0.08, mats.chairChrome, 0.03, 0.76, 0.03);
    addDoorVoxel(boardDoorLeftGroup, 0.78, 1.32, -0.05, mats.chairChrome, 0.03, 0.03, 0.05);
    addDoorVoxel(boardDoorLeftGroup, 0.78, 0.68, -0.05, mats.chairChrome, 0.03, 0.03, 0.05);
    // Trolleys
    addDoorVoxel(boardDoorLeftGroup, -0.55, 1.96, 0, mats.chairChrome, 0.08, 0.05, 0.12);
    addDoorVoxel(boardDoorLeftGroup, 0.55, 1.96, 0, mats.chairChrome, 0.08, 0.05, 0.12);

    // Right Leaf Construction (width 1.85, spans x: -0.925 to +0.925 locally)
    addDoorVoxel(boardDoorRightGroup, 0, 0.98, 0, mats.doorGlass, 1.85, 1.84, 0.07);
    addDoorVoxel(boardDoorRightGroup, 0, 1.91, 0, mats.doorFrameDark, 1.87, 0.06, 0.11);
    addDoorVoxel(boardDoorRightGroup, 0, 0.08, 0, mats.doorFrameDark, 1.87, 0.14, 0.11);
    addDoorVoxel(boardDoorRightGroup, 0.91, 0.99, 0, mats.doorFrameDark, 0.06, 1.78, 0.11);
    addDoorVoxel(boardDoorRightGroup, -0.91, 0.99, 0, mats.doorSealDark, 0.06, 1.78, 0.11); // Center meeting seal
    addDoorVoxel(boardDoorRightGroup, 0, 1.05, 0, mats.doorFrostedBand, 1.83, 0.30, 0.08);
    addDoorVoxel(boardDoorRightGroup, 0, 1.30, 0, mats.doorFrostedBand, 1.83, 0.04, 0.08);
    addDoorVoxel(boardDoorRightGroup, 0, 0.80, 0, mats.doorFrostedBand, 1.83, 0.04, 0.08);
    // Chrome vertical pull handle near meeting edge (x = -0.78)
    addDoorVoxel(boardDoorRightGroup, -0.78, 1.0, 0.08, mats.chairChrome, 0.03, 0.76, 0.03);
    addDoorVoxel(boardDoorRightGroup, -0.78, 1.32, 0.05, mats.chairChrome, 0.03, 0.03, 0.05);
    addDoorVoxel(boardDoorRightGroup, -0.78, 0.68, 0.05, mats.chairChrome, 0.03, 0.03, 0.05);
    addDoorVoxel(boardDoorRightGroup, -0.78, 1.0, -0.08, mats.chairChrome, 0.03, 0.76, 0.03);
    addDoorVoxel(boardDoorRightGroup, -0.78, 1.32, -0.05, mats.chairChrome, 0.03, 0.03, 0.05);
    addDoorVoxel(boardDoorRightGroup, -0.78, 0.68, -0.05, mats.chairChrome, 0.03, 0.03, 0.05);
    // Trolleys
    addDoorVoxel(boardDoorRightGroup, -0.55, 1.96, 0, mats.chairChrome, 0.08, 0.05, 0.12);
    addDoorVoxel(boardDoorRightGroup, 0.55, 1.96, 0, mats.chairChrome, 0.08, 0.05, 0.12);

    // 3. SERVER ROOM HIGH-TECH CYBER SECURITY SLIDING DOOR (x = 26.0, doorway z: 5.20..7.80, center z = 6.50)
    // Full 2.20m Flush Doorway Jamb Posts:
    addVoxel(26.0, 1.10, 5.20, mats.doorJambDark, 0.26, 2.20, 0.18);
    addVoxel(26.0, 1.10, 7.80, mats.doorJambDark, 0.26, 2.20, 0.18);
    // Flush Transom Header filling y: 2.00..2.20 directly beneath the 2.40m lintel
    addVoxel(26.0, 2.10, 6.50, mats.doorFrameDark, 0.26, 0.20, 2.44);
    // Overhead heavy-duty sliding guide track (Spanning Northward into the 4.75m glass partition)
    addVoxel(26.0, 1.95, 5.60, mats.doorTrackSilver, 0.28, 0.10, 4.40);
    // Flush floor threshold guide plate
    addVoxel(26.0, 0.020, 6.50, mats.doorThreshold, 0.32, 0.034, 2.62);
    // Top Motion & Presence Sensor housing & dynamic LED
    addVoxel(26.0, 2.18, 6.50, mats.doorJambDark, 0.30, 0.08, 0.36);
    addVoxel(25.84, 2.18, 6.50, serverSensorMat, 0.04, 0.04, 0.12, false); // facing bullpen
    addVoxel(26.16, 2.18, 6.50, serverSensorMat, 0.04, 0.04, 0.12, false); // facing server room

    // Biometric Handprint & NFC Keycard Access Terminal on South Jamb Post
    addVoxel(25.85, 1.25, 7.65, mats.serverRackDark, 0.05, 0.36, 0.18); // Reader casing
    addVoxel(25.82, 1.32, 7.65, serverSensorMat, 0.02, 0.10, 0.10, false); // Biometric fingerprint scanner
    addVoxel(25.82, 1.18, 7.65, mats.serverLedGreen, 0.02, 0.04, 0.10, false); // Status indicator LED
    // Inside egress push-to-exit plate
    addVoxel(26.15, 1.25, 7.65, mats.serverRackDark, 0.05, 0.36, 0.18);
    addVoxel(26.18, 1.25, 7.65, mats.serverLedGreen, 0.02, 0.14, 0.10, false);

    // Illuminated Cyber Security Sign above doorway
    addVoxel(26.0, 2.36, 6.50, mats.doorJambDark, 0.04, 0.18, 1.80);
    addVoxel(25.97, 2.36, 6.50, mats.threatMapBoard, 0.02, 0.12, 1.64, false); // facing bullpen
    addVoxel(25.96, 2.36, 6.50, mats.serverLedCyan, 0.01, 0.05, 1.40, false); // glowing text badge
    addVoxel(26.03, 2.36, 6.50, mats.threatMapBoard, 0.02, 0.12, 1.64, false); // facing server room
    addVoxel(26.04, 2.36, 6.50, mats.serverLedCyan, 0.01, 0.05, 1.40, false);

    // Dynamic Server Room Sliding Door Leaf Group
    const serverDoorGroup = new THREE.Group();
    serverDoorGroup.position.set(26.0, 0, 6.50);
    scene.add(serverDoorGroup);

    // Door Leaf Construction (relative to group center)
    // Smoked security glass panel
    addDoorVoxel(serverDoorGroup, 0, 0.98, 0, mats.serverRackDoor, 0.07, 1.84, 2.42);
    // Dark titanium steel chassis perimeter frame
    addDoorVoxel(serverDoorGroup, 0, 1.91, 0, mats.serverRackDark, 0.11, 0.06, 2.46);
    addDoorVoxel(serverDoorGroup, 0, 0.08, 0, mats.serverRackDark, 0.11, 0.14, 2.46);
    addDoorVoxel(serverDoorGroup, 0, 0.99, -1.20, mats.serverRackDark, 0.11, 1.78, 0.06);
    addDoorVoxel(serverDoorGroup, 0, 0.99, 1.20, mats.serverRackDark, 0.11, 1.78, 0.06);
    // Cyber manifestation & frosted stripes
    addDoorVoxel(serverDoorGroup, 0, 1.05, 0, mats.serverLedCyan, 0.08, 0.04, 2.40, false);
    addDoorVoxel(serverDoorGroup, 0, 0.85, 0, mats.doorFrostedBand, 0.08, 0.20, 2.40);
    addDoorVoxel(serverDoorGroup, 0, 1.25, 0, mats.doorFrostedBand, 0.08, 0.04, 2.40);
    // Vertical chrome architectural pull handles on both sides
    addDoorVoxel(serverDoorGroup, 0.08, 1.0, 0.95, mats.chairChrome, 0.03, 0.76, 0.03);
    addDoorVoxel(serverDoorGroup, 0.05, 1.32, 0.95, mats.chairChrome, 0.05, 0.03, 0.03);
    addDoorVoxel(serverDoorGroup, 0.05, 0.68, 0.95, mats.chairChrome, 0.05, 0.03, 0.03);
    addDoorVoxel(serverDoorGroup, -0.08, 1.0, 0.95, mats.chairChrome, 0.03, 0.76, 0.03);
    addDoorVoxel(serverDoorGroup, -0.05, 1.32, 0.95, mats.chairChrome, 0.05, 0.03, 0.03);
    addDoorVoxel(serverDoorGroup, -0.05, 0.68, 0.95, mats.chairChrome, 0.05, 0.03, 0.03);
    // Roller trolley brackets
    addDoorVoxel(serverDoorGroup, 0, 1.96, -0.7, mats.chairChrome, 0.12, 0.05, 0.08);
    addDoorVoxel(serverDoorGroup, 0, 1.96, 0.7, mats.chairChrome, 0.12, 0.05, 0.08);

    // 4. MEETING ROOM / EXECUTIVE BOARDROOM SLIDING DOOR (x = 21.0, doorway z: 14.825..17.325, center z = 16.075)
    // Full 2.20m Flush Doorway Jamb Posts:
    addVoxel(21.0, 1.10, 14.825, mats.doorJambDark, 0.24, 2.20, 0.18);
    addVoxel(21.0, 1.10, 17.325, mats.doorJambDark, 0.24, 2.20, 0.18);
    // Flush Transom Header filling y: 2.00..2.20 directly beneath the 2.40m lintel
    addVoxel(21.0, 2.10, 16.075, mats.doorFrameDark, 0.24, 0.20, 2.34);
    // Overhead heavy-duty sliding guide track (Spanning Southward over the sliding leaf)
    addVoxel(21.0, 1.95, 17.00, mats.doorTrackSilver, 0.28, 0.10, 4.40);
    // Flush floor threshold guide plate
    addVoxel(21.0, 0.020, 16.075, mats.doorThreshold, 0.30, 0.034, 2.50);
    // Top Motion & Presence Sensor housing & dynamic LED
    addVoxel(21.0, 2.18, 16.075, mats.doorJambDark, 0.30, 0.08, 0.36);
    addVoxel(20.84, 2.18, 16.075, meetingSensorMat, 0.04, 0.04, 0.12, false); // facing lounge
    addVoxel(21.16, 2.18, 16.075, meetingSensorMat, 0.04, 0.04, 0.12, false); // facing boardroom

    // Boardroom Illuminated Acrylic Sign above doorway
    addVoxel(21.0, 2.36, 16.075, mats.doorJambDark, 0.04, 0.18, 1.80);
    addVoxel(20.97, 2.36, 16.075, mats.boardScreen, 0.02, 0.10, 1.60, false); // facing lounge
    addVoxel(21.03, 2.36, 16.075, mats.boardScreen, 0.02, 0.10, 1.60, false); // facing boardroom

    // Dynamic Meeting Room Sliding Door Leaf Group
    const meetingDoorGroup = new THREE.Group();
    meetingDoorGroup.position.set(21.0, 0, 16.075);
    scene.add(meetingDoorGroup);

    // Door Leaf Construction (relative to group center)
    // 100% Solid Executive Walnut Acoustic Door Leaf (Zero Glass - Full Soundproof Privacy)
    addDoorVoxel(meetingDoorGroup, 0, 0.98, 0, mats.boardroomWoodDark, 0.08, 1.86, 2.38);
    // Inset acoustic fluted walnut panels on both sides
    addDoorVoxel(meetingDoorGroup, 0.045, 0.98, 0, mats.bookshelf, 0.02, 1.72, 2.22);
    addDoorVoxel(meetingDoorGroup, -0.045, 0.98, 0, mats.boardroomWoodDark, 0.02, 1.72, 2.22);
    // Executive brushed brass / gold center vertical accent strip
    addDoorVoxel(meetingDoorGroup, 0.056, 0.98, 0, mats.goldAccent, 0.01, 1.72, 0.06);
    addDoorVoxel(meetingDoorGroup, -0.056, 0.98, 0, mats.goldAccent, 0.01, 1.72, 0.06);
    // Heavy architectural dark bronze perimeter frame & kickplate
    addDoorVoxel(meetingDoorGroup, 0, 1.91, 0, mats.doorFrameDark, 0.11, 0.06, 2.40);
    addDoorVoxel(meetingDoorGroup, 0, 0.08, 0, mats.doorFrameDark, 0.11, 0.14, 2.40);
    addDoorVoxel(meetingDoorGroup, 0, 0.99, -1.17, mats.doorFrameDark, 0.11, 1.78, 0.06);
    addDoorVoxel(meetingDoorGroup, 0, 0.99, 1.17, mats.doorFrameDark, 0.11, 1.78, 0.06);
    // Soundproof perimeter compression acoustic seal
    addDoorVoxel(meetingDoorGroup, 0, 0.02, 0, mats.doorSealDark, 0.09, 0.04, 2.38);
    // Chrome vertical architectural pull handles (inner & outer)
    addDoorVoxel(meetingDoorGroup, 0.08, 1.0, -0.92, mats.chairChrome, 0.03, 0.76, 0.03);
    addDoorVoxel(meetingDoorGroup, 0.05, 1.32, -0.92, mats.chairChrome, 0.05, 0.03, 0.03);
    addDoorVoxel(meetingDoorGroup, 0.05, 0.68, -0.92, mats.chairChrome, 0.05, 0.03, 0.03);
    addDoorVoxel(meetingDoorGroup, -0.08, 1.0, -0.92, mats.chairChrome, 0.03, 0.76, 0.03);
    addDoorVoxel(meetingDoorGroup, -0.05, 1.32, -0.92, mats.chairChrome, 0.05, 0.03, 0.03);
    addDoorVoxel(meetingDoorGroup, -0.05, 0.68, -0.92, mats.chairChrome, 0.05, 0.03, 0.03);
    // Heavy-duty roller trolley brackets
    addDoorVoxel(meetingDoorGroup, 0, 1.96, -0.7, mats.chairChrome, 0.12, 0.05, 0.08);
    addDoorVoxel(meetingDoorGroup, 0, 1.96, 0.7, mats.chairChrome, 0.12, 0.05, 0.08);

    // 4. GOURMET KITCHEN & PANTRY ENTRANCE PORTAL (x = 8.0, z = 14.0)
    addVoxel(8.0, 0.020, 14.0, mats.doorThreshold, 0.30, 0.034, 2.40);
    // Kitchen Illuminated Acrylic Sign above doorway (x = 8.0, z = 14.0)
    addVoxel(8.0, 2.18, 14.0, mats.doorJambDark, 0.04, 0.18, 1.60);
    addVoxel(8.03, 2.18, 14.0, mats.rgbTowerOrange, 0.02, 0.10, 1.45, false); // facing lounge
    addVoxel(7.97, 2.18, 14.0, mats.rgbTowerOrange, 0.02, 0.10, 1.45, false); // facing kitchen

    // --- 6. Build Detailed Furniture Sets ---

    // A. HELPER: Build Herman Miller Aeron-Style Ergonomic Executive Chair
    function buildErgonomicChair(
      cx: number,
      cz: number,
      facing: 'up' | 'down' | 'left' | 'right' = 'up',
      isExecutive = false
    ) {
      // 1. Five-Star Spider Base with rolling caster wheels
      addVoxel(cx, 0.08, cz, mats.chairFrameDark, 0.32, 0.08, 0.32);
      addVoxel(cx - 0.28, 0.06, cz, mats.wallTrim, 0.12, 0.06, 0.12);
      addVoxel(cx + 0.28, 0.06, cz, mats.wallTrim, 0.12, 0.06, 0.12);
      addVoxel(cx, 0.06, cz - 0.28, mats.wallTrim, 0.12, 0.06, 0.12);
      addVoxel(cx, 0.06, cz + 0.28, mats.wallTrim, 0.12, 0.06, 0.12);
      addVoxel(cx + 0.18, 0.06, cz + 0.18, mats.wallTrim, 0.10, 0.06, 0.10);

      // 2. Pneumatic Hydraulic Cylinder
      addVoxel(cx, 0.24, cz, mats.chairChrome, 0.12, 0.24, 0.12);

      // 3. Contoured Ergonomic Mesh Seat Cushion (y: 0.42)
      const seatMesh = isExecutive ? mats.chairMeshCeo : mats.chairMesh;
      addVoxel(cx, 0.42, cz, seatMesh, 0.82, 0.10, 0.82);
      addVoxel(cx, 0.38, cz, mats.chairFrameDark, 0.86, 0.06, 0.86);

      // 4. Backrest Spine, Lumbar Support & Curved Mesh
      const backOffsetZ = facing === 'up' ? 0.36 : facing === 'down' ? -0.36 : 0;
      const backOffsetX = facing === 'right' ? -0.36 : facing === 'left' ? 0.36 : 0;
      const isZAxis = facing === 'up' || facing === 'down';

      const backW = isZAxis ? 0.76 : 0.12;
      const backD = isZAxis ? 0.12 : 0.76;

      // Lumbar support spine
      addVoxel(
        cx + backOffsetX * 1.1,
        0.85,
        cz + backOffsetZ * 1.1,
        mats.chairFrameDark,
        isZAxis ? 0.22 : 0.08,
        0.80,
        isZAxis ? 0.08 : 0.22
      );
      // Curved ergonomic mesh backrest
      addVoxel(cx + backOffsetX, 0.90, cz + backOffsetZ, seatMesh, backW, 0.78, backD);
      // Lumbar cushion pad
      addVoxel(
        cx + backOffsetX * 0.85,
        0.75,
        cz + backOffsetZ * 0.85,
        mats.chairFrameDark,
        isZAxis ? 0.48 : 0.08,
        0.14,
        isZAxis ? 0.08 : 0.48
      );

      // 5. 3D Adjustable Armrests
      if (isZAxis) {
        addVoxel(cx - 0.44, 0.58, cz, mats.chairFrameDark, 0.08, 0.26, 0.08);
        addVoxel(cx - 0.44, 0.68, cz, mats.chairFrameDark, 0.14, 0.05, 0.45);
        addVoxel(cx + 0.44, 0.58, cz, mats.chairFrameDark, 0.08, 0.26, 0.08);
        addVoxel(cx + 0.44, 0.68, cz, mats.chairFrameDark, 0.14, 0.05, 0.45);
      } else {
        addVoxel(cx, 0.58, cz - 0.44, mats.chairFrameDark, 0.08, 0.26, 0.08);
        addVoxel(cx, 0.68, cz - 0.44, mats.chairFrameDark, 0.45, 0.05, 0.14);
        addVoxel(cx, 0.58, cz + 0.44, mats.chairFrameDark, 0.08, 0.26, 0.08);
        addVoxel(cx, 0.68, cz + 0.44, mats.chairFrameDark, 0.45, 0.05, 0.14);
      }

      // 6. Executive Headrest (Dylan's Chair)
      if (isExecutive) {
        addVoxel(cx + backOffsetX, 1.38, cz + backOffsetZ, mats.chairFrameDark, isZAxis ? 0.14 : 0.06, 0.20, isZAxis ? 0.06 : 0.14);
        addVoxel(cx + backOffsetX * 0.9, 1.45, cz + backOffsetZ * 0.9, seatMesh, isZAxis ? 0.44 : 0.12, 0.16, isZAxis ? 0.12 : 0.44);
      }
    }

    // B. HELPER: Build Personalized High-Tech Workstations (Dual Monitors + Laptop + Rig + Desk)
    function buildWorkstation(
      deskX: number,
      deskZ: number,
      chairX: number,
      chairZ: number,
      agentId: string
    ) {
      const isDylan = agentId === 'dylan';

      // 1. Desk Surface & Motorized Standing Legs
      if (isDylan) {
        // Executive Dark Walnut Desk with Brushed Brass Inlay facing the Door (+z)
        addVoxel(deskX, 0.74, deskZ, mats.deskWalnut, 3.6, 0.18, 1.7);
        addVoxel(deskX, 0.68, deskZ, mats.deskTrimBrass, 3.64, 0.06, 1.74);
        addVoxel(deskX - 1.55, 0.36, deskZ, mats.deskWalnut, 0.20, 0.70, 1.4);
        addVoxel(deskX + 1.55, 0.36, deskZ, mats.deskWalnut, 0.20, 0.70, 1.4);
        // Executive modesty front panel facing the door (+z)
        addVoxel(deskX, 0.40, deskZ + 0.76, mats.deskWalnut, 3.2, 0.64, 0.12);
        addVoxel(deskX, 0.40, deskZ + 0.83, mats.deskTrimBrass, 3.24, 0.08, 0.04);
        // Leather desk pad on Dylan's side (-z)
        addVoxel(deskX, 0.84, deskZ - 0.20, mats.deskMatBlack, 2.5, 0.02, 0.95);
      } else {
        // Modern Minimalist Heavy-Duty Standing Desk
        const matColor =
          agentId === 'ray'
            ? mats.deskMatCyan
            : agentId === 'maya'
            ? mats.rgbTowerPink
            : agentId === 'alex'
            ? mats.rgbTowerOrange
            : agentId === 'nora'
            ? mats.rgbTowerEmerald
            : agentId === 'zane'
            ? mats.rgbTowerGreen
            : mats.deskMatBlack;

        addVoxel(deskX, 0.72, deskZ, mats.whiteDesk, 2.9, 0.14, 1.5);
        addVoxel(deskX, 0.68, deskZ, mats.deskTrim, 2.94, 0.06, 1.54);
        addVoxel(deskX - 1.3, 0.36, deskZ, mats.deskTrim, 0.16, 0.68, 1.3);
        addVoxel(deskX + 1.3, 0.36, deskZ, mats.deskTrim, 0.16, 0.68, 1.3);
        addVoxel(deskX - 1.3, 0.04, deskZ, mats.deskTrim, 0.24, 0.08, 1.5);
        addVoxel(deskX + 1.3, 0.04, deskZ, mats.deskTrim, 0.24, 0.08, 1.5);
        addVoxel(deskX, 0.80, deskZ + 0.15, matColor, 2.1, 0.02, 0.85);
      }

      // Cable management tray under rear
      addVoxel(deskX, 0.58, isDylan ? deskZ + 0.45 : deskZ - 0.45, mats.wallTrim, 2.2, 0.12, 0.2);

      // 2. DISPLAY SETUP WITH ACTIVE VISIBLE WORK TELEMETRY
      if (isDylan) {
        // Monitor pole placed at front-center of desk (deskZ + 0.35)
        addVoxel(deskX, 0.88, deskZ + 0.35, mats.wallTrim, 0.22, 0.24, 0.14);
        addVoxel(deskX, 1.25, deskZ + 0.35, mats.wallTrim, 0.10, 0.72, 0.10);
        addVoxel(deskX - 0.48, 1.35, deskZ + 0.30, mats.wallTrim, 0.90, 0.08, 0.08);
        addVoxel(deskX + 0.48, 1.35, deskZ + 0.30, mats.wallTrim, 0.90, 0.08, 0.08);

        // Dylan (CEO): 49" Curved Panoramic Display + Secondary Executive KPI Panel
        // Sleek black back casing facing visitors / door (+z)
        addVoxel(deskX - 0.35, 1.42, deskZ + 0.22, mats.wallTrim, 1.85, 0.78, 0.08);
        // Glowing cyan executive screen facing Dylan (-z)
        addVoxel(deskX - 0.35, 1.42, deskZ + 0.17, mats.screenCyanExecutive, 1.75, 0.70, 0.02);

        // Active Stock / KPI Candlestick Bars on Dylan's Screen (facing Dylan at -z)
        const candleHeights = [0.18, 0.28, 0.22, 0.38, 0.32, 0.44, 0.40, 0.52];
        candleHeights.forEach((ch, cIdx) => {
          const isGreen = cIdx % 3 !== 1;
          const cMat = isGreen
            ? new THREE.MeshLambertMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.95 })
            : new THREE.MeshLambertMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.85 });
          addVoxel(deskX - 0.92 + cIdx * 0.14, 1.20 + ch / 2, deskZ + 0.155, cMat, 0.07, ch, 0.005);
        });
        // Cyan executive upward growth trendline
        addVoxel(deskX - 0.45, 1.48, deskZ + 0.152, mats.screenCyanExecutive, 0.90, 0.025, 0.005);
        // Header bar
        addVoxel(deskX - 0.35, 1.70, deskZ + 0.155, mats.wallTrim, 1.65, 0.04, 0.005);

        // Secondary KPI display (facing Dylan at -z):
        addVoxel(deskX + 1.15, 1.42, deskZ + 0.22, mats.wallTrim, 0.65, 0.95, 0.08);
        addVoxel(deskX + 1.15, 1.42, deskZ + 0.17, mats.screenGoldKPI, 0.58, 0.88, 0.02);
        // Active metric cards
        addVoxel(deskX + 1.15, 1.65, deskZ + 0.155, mats.trophy, 0.46, 0.14, 0.005);
        addVoxel(deskX + 1.15, 1.45, deskZ + 0.155, mats.screenCyanExecutive, 0.46, 0.14, 0.005);
        addVoxel(deskX + 1.15, 1.25, deskZ + 0.155, mats.screenCode, 0.46, 0.14, 0.005);

      } else if (agentId === 'alex') {
        // ALEX: LEAD FULLSTACK DEVELOPER BATTLE-STATION (DUAL 27" HIGH-REFRESH MONITORS)
        addVoxel(deskX, 0.88, deskZ - 0.62, mats.wallTrim, 0.22, 0.24, 0.14);
        addVoxel(deskX, 1.25, deskZ - 0.62, mats.wallTrim, 0.10, 0.72, 0.10);
        addVoxel(deskX - 0.48, 1.35, deskZ - 0.56, mats.wallTrim, 0.90, 0.08, 0.08);
        addVoxel(deskX + 0.48, 1.35, deskZ - 0.56, mats.wallTrim, 0.90, 0.08, 0.08);

        // Monitor 1 (Left): VS Code Fullstack IDE (Screen facing south +z towards Alex)
        addVoxel(deskX - 0.55, 1.38, deskZ - 0.38, mats.wallTrim, 1.05, 0.70, 0.06);
        addVoxel(deskX - 0.55, 1.38, deskZ - 0.34, mats.screenAlexIDE, 0.98, 0.64, 0.02);
        // File explorer sidebar on left
        addVoxel(deskX - 0.90, 1.38, deskZ - 0.325, mats.wallTrim, 0.22, 0.60, 0.005);
        // Syntax code lines in fullstack colors (orange, blue, green, yellow, purple)
        const alexCodeColors = [0xf97316, 0x38bdf8, 0x22c55e, 0xfacc15, 0xa855f7, 0xf97316, 0x38bdf8];
        const alexWidths = [0.44, 0.56, 0.38, 0.50, 0.60, 0.32, 0.46];
        alexWidths.forEach((w, lIdx) => {
          const col = alexCodeColors[lIdx % alexCodeColors.length];
          const lMat = new THREE.MeshLambertMaterial({ color: col, emissive: col, emissiveIntensity: 0.9 });
          addVoxel(deskX - 0.48 - (0.60 - w) / 2, 1.58 - lIdx * 0.055, deskZ - 0.325, lMat, w, 0.022, 0.005);
        });
        // Blinking yellow terminal prompt cursor
        addVoxel(deskX - 0.30, 1.25, deskZ - 0.325, mats.trophy, 0.025, 0.035, 0.005);

        // Monitor 2 (Right): Live Server Terminal & Logs
        addVoxel(deskX + 0.55, 1.38, deskZ - 0.38, mats.wallTrim, 1.05, 0.70, 0.06);
        addVoxel(deskX + 0.55, 1.38, deskZ - 0.34, mats.screenAlexTerm, 0.98, 0.64, 0.02);
        // Terminal header tab with 3 colored dots
        addVoxel(deskX + 0.55, 1.66, deskZ - 0.325, mats.wallTrim, 0.94, 0.04, 0.005);
        // Active server log streams (green & cyan)
        const termLines = [0.60, 0.48, 0.72, 0.55, 0.68, 0.42];
        termLines.forEach((w, lIdx) => {
          const isGreen = lIdx % 2 === 0;
          const col = isGreen ? 0x22c55e : 0x00f0ff;
          const tMat = new THREE.MeshLambertMaterial({ color: col, emissive: col, emissiveIntensity: 0.9 });
          addVoxel(deskX + 0.55 - (0.68 - w) / 2, 1.56 - lIdx * 0.065, deskZ - 0.325, tMat, w, 0.022, 0.005);
        });
        // Green PORT 3000 [ACTIVE] badge
        addVoxel(deskX + 0.82, 1.15, deskZ - 0.325, mats.screenCode, 0.20, 0.045, 0.005);

      } else if (agentId === 'ray') {
        // RAY: AI RESEARCHER & DEEP LEARNING BATTLE-STATION
        addVoxel(deskX, 0.88, deskZ - 0.62, mats.wallTrim, 0.22, 0.24, 0.14);
        addVoxel(deskX, 1.25, deskZ - 0.62, mats.wallTrim, 0.10, 0.72, 0.10);
        addVoxel(deskX - 0.48, 1.35, deskZ - 0.56, mats.wallTrim, 0.90, 0.08, 0.08);
        addVoxel(deskX + 0.48, 1.35, deskZ - 0.56, mats.wallTrim, 0.90, 0.08, 0.08);

        // Monitor 1 (Left): Deep Learning Loss Curve & Epoch Descent
        addVoxel(deskX - 0.55, 1.38, deskZ - 0.38, mats.wallTrim, 1.05, 0.70, 0.06);
        addVoxel(deskX - 0.55, 1.38, deskZ - 0.34, mats.screenBlueCode, 0.98, 0.64, 0.02);
        // Descending gradient loss curve steps
        const lossSteps = [0.46, 0.38, 0.30, 0.24, 0.18, 0.14, 0.11];
        lossSteps.forEach((lh, sIdx) => {
          const lMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.95 });
          addVoxel(deskX - 0.88 + sIdx * 0.10, 1.18 + lh, deskZ - 0.325, lMat, 0.07, 0.02, 0.005);
        });
        // Active Epoch Progress Bar (filling green)
        addVoxel(deskX - 0.55, 1.14, deskZ - 0.325, mats.screenCode, 0.68, 0.035, 0.005);

        // Monitor 2 (Right): Neural Network Architecture Graph & Attention Heatmap
        addVoxel(deskX + 0.55, 1.38, deskZ - 0.38, mats.wallTrim, 1.05, 0.70, 0.06);
        addVoxel(deskX + 0.55, 1.38, deskZ - 0.34, mats.screenCode, 0.98, 0.64, 0.02);
        // 3x3 attention matrix tiles
        for (let rx = 0; rx < 3; rx++) {
          for (let ry = 0; ry < 3; ry++) {
            const hColor = (rx + ry) % 2 === 0 ? 0x00f0ff : 0x059669;
            const hMat = new THREE.MeshLambertMaterial({ color: hColor, emissive: hColor, emissiveIntensity: 0.9 });
            addVoxel(deskX + 0.40 + rx * 0.14, 1.28 + ry * 0.12, deskZ - 0.325, hMat, 0.10, 0.08, 0.005);
          }
        }

      } else if (agentId === 'zane') {
        // ZANE'S SOC CYBERSECURITY BATTLE STATION (Triple Curved Cyber Monitors Array)
        addVoxel(deskX, 0.88, deskZ - 0.62, mats.wallTrim, 0.32, 0.24, 0.18);
        addVoxel(deskX, 1.25, deskZ - 0.62, mats.wallTrim, 0.12, 0.72, 0.12);
        addVoxel(deskX - 0.75, 1.35, deskZ - 0.54, mats.wallTrim, 0.70, 0.08, 0.08);
        addVoxel(deskX + 0.75, 1.35, deskZ - 0.54, mats.wallTrim, 0.70, 0.08, 0.08);

        // Center: 34" Ultrawide IDS Radar & Global Threat Map
        addVoxel(deskX, 1.42, deskZ - 0.38, mats.wallTrim, 1.55, 0.82, 0.06);
        addVoxel(deskX, 1.42, deskZ - 0.34, mats.screenZaneRadar, 1.48, 0.76, 0.02);
        // Concentric Radar Range Rings & Crosshair
        addVoxel(deskX, 1.42, deskZ - 0.325, mats.screenCode, 0.70, 0.015, 0.005);
        addVoxel(deskX, 1.42, deskZ - 0.325, mats.screenCode, 0.015, 0.70, 0.005);
        // Sweeping radar vector line & threat blips
        addVoxel(deskX + 0.18, 1.56, deskZ - 0.325, mats.screenCode, 0.32, 0.02, 0.005);
        // Red threat intrusion alert blips
        addVoxel(deskX + 0.24, 1.60, deskZ - 0.325, new THREE.MeshLambertMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.5 }), 0.04, 0.04, 0.005);
        addVoxel(deskX - 0.22, 1.30, deskZ - 0.325, new THREE.MeshLambertMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.5 }), 0.04, 0.04, 0.005);

        // Left Monitor: Live Firewall & Matrix Cascade Code Stream
        addVoxel(deskX - 0.95, 1.42, deskZ - 0.32, mats.wallTrim, 0.75, 0.82, 0.06);
        addVoxel(deskX - 0.95, 1.42, deskZ - 0.28, mats.screenZaneMatrix, 0.69, 0.76, 0.02);
        // Cascading Matrix stream lines
        for (let col = 0; col < 5; col++) {
          const colX = deskX - 1.15 + col * 0.10;
          addVoxel(colX, 1.42, deskZ - 0.265, mats.screenCode, 0.03, 0.55, 0.005);
        }

        // Right Monitor: Zero-Trust GPU Server Cluster Health & DDoS Mitigation
        addVoxel(deskX + 0.95, 1.42, deskZ - 0.32, mats.wallTrim, 0.75, 0.82, 0.06);
        addVoxel(deskX + 0.95, 1.42, deskZ - 0.28, mats.serverLedCyan, 0.69, 0.76, 0.02);
        // Packet load bars
        for (let bar = 0; bar < 4; bar++) {
          const bH = 0.15 + bar * 0.10;
          addVoxel(deskX + 0.80 + bar * 0.10, 1.25 + bH / 2, deskZ - 0.265, mats.rgbTowerCyan, 0.06, bH, 0.005);
        }

      } else if (agentId === 'maya') {
        // MAYA: LEAD UI/UX DESIGNER 32" HDR STUDIO DISPLAY & FIGMA ARTBOARDS
        addVoxel(deskX + 0.15, 0.88, deskZ - 0.60, mats.wallTrim, 0.24, 0.24, 0.16);
        addVoxel(deskX + 0.15, 1.25, deskZ - 0.60, mats.wallTrim, 0.10, 0.70, 0.10);

        // 32" Display: Figma Dark Canvas
        addVoxel(deskX + 0.15, 1.40, deskZ - 0.40, mats.wallTrim, 1.35, 0.78, 0.06);
        addVoxel(deskX + 0.15, 1.40, deskZ - 0.36, mats.screenFigmaPink, 1.28, 0.72, 0.02);
        // White mobile UI artboard frames on canvas
        addVoxel(deskX - 0.15, 1.40, deskZ - 0.345, mats.whiteDesk, 0.32, 0.54, 0.005);
        addVoxel(deskX + 0.32, 1.40, deskZ - 0.345, mats.whiteDesk, 0.32, 0.54, 0.005);
        // Pink CTA buttons & UI components inside artboards
        addVoxel(deskX - 0.15, 1.24, deskZ - 0.335, mats.rgbTowerPink, 0.22, 0.045, 0.005);
        addVoxel(deskX + 0.32, 1.24, deskZ - 0.335, mats.rgbTowerPink, 0.22, 0.045, 0.005);
        // Design swatch palette bar on right
        const swatchColors = [0xec4899, 0xa855f7, 0x00f0ff, 0xf59e0b, 0x10b981];
        swatchColors.forEach((sc, sIdx) => {
          const sMat = new THREE.MeshLambertMaterial({ color: sc, emissive: sc, emissiveIntensity: 0.9 });
          addVoxel(deskX + 0.64, 1.58 - sIdx * 0.08, deskZ - 0.345, sMat, 0.06, 0.06, 0.005);
        });

      } else if (agentId === 'wendy') {
        // WENDY: MARKETING STRATEGIST LAPTOP-ONLY WORKSTATION
        // Aluminum ergonomic stand riser
        addVoxel(deskX, 0.82, deskZ - 0.12, mats.chairChrome, 0.36, 0.04, 0.26);
        addVoxel(deskX, 0.90, deskZ - 0.12, mats.chairChrome, 0.10, 0.14, 0.10);
        addVoxel(deskX, 0.97, deskZ - 0.08, mats.chairChrome, 0.50, 0.03, 0.30);

        // Open 16" Apple Midnight Blue MacBook Pro on Stand (Facing Wendy at +z)
        // Base / Keyboard
        addVoxel(deskX, 0.99, deskZ - 0.04, mats.laptopDark, 0.54, 0.025, 0.34);
        addVoxel(deskX, 1.005, deskZ - 0.08, mats.wallTrim, 0.46, 0.015, 0.18);
        addVoxel(deskX, 1.005, deskZ + 0.05, mats.chairChrome, 0.20, 0.015, 0.09); // Trackpad
        // Screen Lid: Back casing facing north (-z), Glowing screen facing SOUTH (+z towards Wendy!)
        addVoxel(deskX, 1.20, deskZ - 0.22, mats.laptopDark, 0.54, 0.38, 0.025);
        addVoxel(deskX, 1.20, deskZ - 0.205, mats.screenGreenCopy, 0.48, 0.32, 0.015);
        // Marketing Funnel Bars & Growth Metrics on Screen
        addVoxel(deskX, 1.30, deskZ - 0.195, mats.screenCode, 0.38, 0.03, 0.005);
        addVoxel(deskX, 1.23, deskZ - 0.195, mats.screenCode, 0.28, 0.03, 0.005);
        addVoxel(deskX, 1.16, deskZ - 0.195, mats.screenCode, 0.18, 0.03, 0.005);
        // Glowing Apple logo on back of lid facing north (-z)
        addVoxel(deskX, 1.20, deskZ - 0.235, mats.whiteDesk, 0.08, 0.08, 0.005);

        // Wireless Magic Keyboard & Mouse on desk in front of stand
        addVoxel(deskX, 0.815, deskZ + 0.26, mats.chairChrome, 0.60, 0.025, 0.18);
        addVoxel(deskX + 0.42, 0.815, deskZ + 0.26, mats.chairChrome, 0.10, 0.025, 0.14);
      }

      // 3. OPEN DIVERSE LAPTOPS ON DESKS (Dylan, Maya, Zane)
      const hasSideLaptop = agentId === 'maya' || agentId === 'zane';

      if (isDylan) {
        // Dylan (CEO): Executive MacBook Pro - Radiant Silver Chassis, Illuminated Back Logo (+z)
        const lapMat = mats.laptopSilver;
        // Unibody silver base
        addVoxel(deskX - 1.05, 0.85, deskZ - 0.22, lapMat, 0.54, 0.024, 0.36);
        // Recessed keyboard well with RGB underglow
        addVoxel(deskX - 1.05, 0.865, deskZ - 0.16, mats.wallTrim, 0.44, 0.015, 0.18);
        addVoxel(deskX - 1.05, 0.87, deskZ - 0.16, mats.screenCyanExecutive, 0.40, 0.008, 0.02); // touchbar glow
        // Precision silver glass trackpad near Dylan
        addVoxel(deskX - 1.05, 0.865, deskZ - 0.30, mats.chairChrome, 0.18, 0.010, 0.10);
        // Open standing upright display lid
        addVoxel(deskX - 1.05, 1.03, deskZ - 0.04, lapMat, 0.54, 0.34, 0.022);
        // Radiant glowing cyan screen facing Dylan (-z)
        addVoxel(deskX - 1.05, 1.03, deskZ - 0.053, mats.screenCyanExecutive, 0.48, 0.28, 0.012);
        // High-contrast code lines
        addVoxel(deskX - 1.12, 1.08, deskZ - 0.060, mats.whiteDesk, 0.26, 0.015, 0.005);
        addVoxel(deskX - 1.10, 1.05, deskZ - 0.060, mats.screenCode, 0.30, 0.015, 0.005);
        addVoxel(deskX - 1.14, 1.02, deskZ - 0.060, mats.screenBlueCode, 0.22, 0.015, 0.005);
        // Illuminated Apple logo on back of lid facing door (+z)
        addVoxel(deskX - 1.05, 1.03, deskZ - 0.027, mats.whiteDesk, 0.08, 0.08, 0.005);

      } else if (hasSideLaptop) {
        // Maya: Apple Starlight MacBook Air; Zane: ThinkPad Carbon Stealth
        const isZane = agentId === 'zane';
        const lapMat = isZane ? mats.laptopDark : mats.laptopSilver;
        const lapScreen = isZane ? mats.screenZaneMatrix : mats.screenFigmaPink;

        // Base placed between screen and character
        addVoxel(deskX - 0.95, 0.81, deskZ + 0.12, lapMat, 0.52, 0.024, 0.34);
        addVoxel(deskX - 0.95, 0.825, deskZ + 0.06, mats.wallTrim, 0.44, 0.015, 0.18); // keyboard
        addVoxel(deskX - 0.95, 0.825, deskZ + 0.20, mats.chairChrome, 0.18, 0.010, 0.08); // trackpad

        // ThinkPad Red TrackPoint Nub on Zane's laptop keyboard!
        if (isZane) {
          addVoxel(deskX - 0.95, 0.835, deskZ + 0.06, new THREE.MeshLambertMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.5 }), 0.022, 0.014, 0.022);
        }

        // Open upright display lid (Facing character at +z)
        addVoxel(deskX - 0.95, 1.00, deskZ - 0.06, lapMat, 0.52, 0.34, 0.022);
        // Back of lid emblem (ThinkPad red dot or Apple logo)
        if (isZane) {
          addVoxel(deskX - 0.82, 1.10, deskZ - 0.072, new THREE.MeshLambertMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.8 }), 0.025, 0.025, 0.005);
        } else {
          addVoxel(deskX - 0.95, 1.00, deskZ - 0.072, mats.whiteDesk, 0.08, 0.08, 0.005);
        }
        // Glowing screen facing SOUTH (+z towards character!)
        addVoxel(deskX - 0.95, 1.00, deskZ - 0.047, lapScreen, 0.46, 0.28, 0.012);
        // Active code / wireframe lines
        addVoxel(deskX - 1.01, 1.05, deskZ - 0.040, mats.whiteDesk, 0.24, 0.012, 0.004);
        addVoxel(deskX - 0.99, 1.02, deskZ - 0.040, isZane ? mats.screenCode : mats.screenPalette, 0.28, 0.012, 0.004);
      }

      // 4. Mechanical Keyboard & Mouse
      if (isDylan) {
        addVoxel(deskX, 0.85, deskZ - 0.26, mats.wallTrim, 0.72, 0.035, 0.24);
        addVoxel(deskX, 0.87, deskZ - 0.26, mats.trophy, 0.66, 0.015, 0.18);
        addVoxel(deskX + 0.52, 0.85, deskZ - 0.26, mats.wallTrim, 0.12, 0.035, 0.18);
      } else if (agentId !== 'wendy') {
        addVoxel(deskX, 0.815, deskZ + 0.26, mats.wallTrim, 0.72, 0.035, 0.24);
        addVoxel(deskX, 0.835, deskZ + 0.26, mats.screenCode, 0.66, 0.015, 0.18);
        addVoxel(deskX + 0.52, 0.815, deskZ + 0.26, mats.wallTrim, 0.12, 0.035, 0.18);
      }

      // ======================================================================
      // 5. LEGIT BATTLE-STATION DESKTOP PC RIG (Lian Li / NZXT Dual-Chamber Style)
      // Tempered Glass Panel, Liquid AIO Cooler, Monster GPU, RGB DDR5 RAM, Triple Fans
      // ======================================================================
      const hasTowerPC = agentId === 'alex' || agentId === 'ray' || agentId === 'nora' || agentId === 'maya' || agentId === 'zane' || isDylan;
      if (hasTowerPC) {
        const rgbColor =
          agentId === 'maya'
            ? 0xec4899
            : agentId === 'alex'
            ? 0xf97316
            : agentId === 'ray'
            ? 0x00f0ff
            : agentId === 'zane'
            ? 0x00f59b
            : isDylan
            ? 0x38bdf8
            : 0x10b981;

        const rgbMat = new THREE.MeshLambertMaterial({
          color: rgbColor,
          emissive: rgbColor,
          emissiveIntensity: 1.25,
        });
        const caseMat = new THREE.MeshLambertMaterial({ color: 0x0a0f1d });
        const internalMat = new THREE.MeshLambertMaterial({ color: 0x111827 });
        const psuMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });

        const pX = isDylan ? deskX + 1.25 : deskX + 1.25;
        const pZ = isDylan ? deskZ - 0.20 : deskZ + 0.05;

        // A. Tower Case Frame & Chassis
        addVoxel(pX, 0.82, pZ, caseMat, 0.38, 0.04, 0.70); // Top panel
        addVoxel(pX, 0.83, pZ, rgbMat, 0.28, 0.01, 0.54);   // Top 360mm exhaust radiator RGB mesh
        addVoxel(pX, 0.04, pZ, caseMat, 0.38, 0.08, 0.70); // Basement chassis
        // Rubber decoupling feets
        addVoxel(pX - 0.14, 0.01, pZ - 0.28, mats.wallTrim, 0.06, 0.02, 0.08);
        addVoxel(pX + 0.14, 0.01, pZ - 0.28, mats.wallTrim, 0.06, 0.02, 0.08);
        addVoxel(pX - 0.14, 0.01, pZ + 0.28, mats.wallTrim, 0.06, 0.02, 0.08);
        addVoxel(pX + 0.14, 0.01, pZ + 0.28, mats.wallTrim, 0.06, 0.02, 0.08);

        // Solid Right Metal Side Panel (+x)
        addVoxel(pX + 0.18, 0.44, pZ, caseMat, 0.02, 0.72, 0.70);
        // Solid Rear Metal Back I/O Panel (-z)
        addVoxel(pX, 0.44, pZ - 0.34, caseMat, 0.36, 0.72, 0.02);
        // Rear 120mm exhaust fan with glowing RGB halo
        addVoxel(pX - 0.02, 0.58, pZ - 0.32, rgbMat, 0.16, 0.16, 0.02);

        // B. PSU Shroud Compartment (bottom)
        addVoxel(pX - 0.02, 0.16, pZ, psuMat, 0.34, 0.18, 0.66);
        addVoxel(pX - 0.18, 0.16, pZ - 0.05, mats.wallTrim, 0.01, 0.08, 0.24);

        // C. Motherboard Tray & VRM Heatsinks
        addVoxel(pX + 0.14, 0.48, pZ - 0.05, internalMat, 0.04, 0.44, 0.48);
        addVoxel(pX + 0.12, 0.62, pZ - 0.18, mats.wallTrim, 0.04, 0.08, 0.12);

        // D. 360mm AIO Liquid Cooler Pump Block
        addVoxel(pX + 0.08, 0.52, pZ - 0.05, rgbMat, 0.06, 0.12, 0.12);
        addVoxel(pX + 0.05, 0.52, pZ - 0.05, mats.wallTrim, 0.01, 0.08, 0.08);
        // Dual braided sleeved liquid coolant tubes looping to radiator
        addVoxel(pX + 0.07, 0.62, pZ + 0.05, mats.wallTrim, 0.03, 0.16, 0.03);
        addVoxel(pX + 0.07, 0.72, pZ + 0.08, mats.wallTrim, 0.03, 0.12, 0.03);

        // E. Dual RGB DDR5 RAM Sticks
        addVoxel(pX + 0.09, 0.56, pZ + 0.06, rgbMat, 0.02, 0.14, 0.025);
        addVoxel(pX + 0.09, 0.56, pZ + 0.10, rgbMat, 0.02, 0.14, 0.025);

        // F. Monster Triple-Slot RTX 4090 Workstation GPU!
        addVoxel(pX, 0.34, pZ + 0.02, caseMat, 0.24, 0.12, 0.44);
        // Glowing illuminated side branding strip ("GEFORCE RTX / TITAN")
        addVoxel(pX - 0.12, 0.34, pZ + 0.02, rgbMat, 0.015, 0.04, 0.36);
        // GPU triple cooling fan vents
        addVoxel(pX, 0.28, pZ - 0.10, mats.wallTrim, 0.20, 0.01, 0.10);
        addVoxel(pX, 0.28, pZ + 0.02, mats.wallTrim, 0.20, 0.01, 0.10);
        addVoxel(pX, 0.28, pZ + 0.14, mats.wallTrim, 0.20, 0.01, 0.10);
        // Sleeved 12VHPWR power cable bundle diving down
        addVoxel(pX - 0.08, 0.26, pZ + 0.04, mats.wallTrim, 0.03, 0.08, 0.04);

        // G. Front Triple RGB Intake Fans (Facing +z)
        addVoxel(pX, 0.64, pZ + 0.33, rgbMat, 0.18, 0.18, 0.02);
        addVoxel(pX, 0.44, pZ + 0.33, rgbMat, 0.18, 0.18, 0.02);
        addVoxel(pX, 0.24, pZ + 0.33, rgbMat, 0.18, 0.18, 0.02);
        // Front tempered glass
        addVoxel(pX, 0.45, pZ + 0.35, mats.tableGlass, 0.34, 0.70, 0.015);

        // H. Full Tempered Glass Left Side Window (-x)
        addVoxel(pX - 0.18, 0.45, pZ, mats.tableGlass, 0.015, 0.70, 0.68);
        // Glass panel mounting thumb screws at 4 corners
        addVoxel(pX - 0.19, 0.76, pZ - 0.30, mats.wallTrim, 0.01, 0.02, 0.02);
        addVoxel(pX - 0.19, 0.76, pZ + 0.30, mats.wallTrim, 0.01, 0.02, 0.02);
        addVoxel(pX - 0.19, 0.14, pZ - 0.30, mats.wallTrim, 0.01, 0.02, 0.02);
        addVoxel(pX - 0.19, 0.14, pZ + 0.30, mats.wallTrim, 0.01, 0.02, 0.02);

        // I. Front I/O Top Bevel: Illuminated Power Button & USB 3.2 Ports
        addVoxel(pX - 0.10, 0.84, pZ + 0.28, rgbMat, 0.03, 0.01, 0.03);
        addVoxel(pX - 0.04, 0.84, pZ + 0.28, mats.chairChrome, 0.02, 0.01, 0.04);
      }

      // 6. Role-Specific Props (kanya-kanya sila)
      if (isDylan) {
        // Crystal warm desk lamp
        addVoxel(deskX + 1.35, 1.05, deskZ + 0.10, mats.trophy, 0.22, 0.46, 0.22);
        // CEO Gold Tumbler
        addVoxel(deskX + 0.90, 0.92, deskZ - 0.30, mats.trophy, 0.14, 0.20, 0.14);
      } else if (agentId === 'ray') {
        // Research Notebook & Coffee Mug
        addVoxel(deskX + 0.92, 0.81, deskZ + 0.32, mats.coolerBase, 0.28, 0.02, 0.38);
        addVoxel(deskX + 0.92, 0.88, deskZ - 0.15, mats.whiteDesk, 0.14, 0.18, 0.14);
      } else if (agentId === 'maya') {
        // Wacom Drawing Tablet & Pantone Color Swatches
        addVoxel(deskX + 0.90, 0.81, deskZ + 0.28, mats.wallTrim, 0.38, 0.02, 0.32);
        addVoxel(deskX + 0.88, 0.83, deskZ + 0.28, mats.rgbTowerPink, 0.04, 0.02, 0.22);
        addVoxel(deskX + 0.95, 0.86, deskZ - 0.15, mats.screenPalette, 0.16, 0.18, 0.12);
      } else if (agentId === 'alex') {
        // Insulated Orange Flask + Custom mechanical keypad
        addVoxel(deskX + 0.92, 0.88, deskZ - 0.15, mats.rgbTowerOrange, 0.14, 0.26, 0.14);
        addVoxel(deskX + 0.92, 0.81, deskZ + 0.30, mats.wallTrim, 0.24, 0.03, 0.24);
      } else if (agentId === 'nora') {
        // Iced Matcha Latte + Financial Data Ledger
        addVoxel(deskX + 0.92, 0.88, deskZ - 0.15, mats.rgbTowerEmerald, 0.14, 0.24, 0.14);
        addVoxel(deskX + 0.90, 0.81, deskZ + 0.30, mats.coolerBase, 0.26, 0.02, 0.32);
      } else if (agentId === 'zane') {
        // Hardware YubiKey USB token + matte tumbler
        addVoxel(deskX + 0.92, 0.88, deskZ - 0.15, mats.wallTrim, 0.14, 0.24, 0.14);
        addVoxel(deskX + 0.90, 0.81, deskZ + 0.30, mats.screenZaneMatrix, 0.14, 0.02, 0.18);
      } else if (agentId === 'wendy') {
        // Iconic Yellow Debugging Duck & Mug
        addVoxel(deskX + 0.90, 0.88, deskZ + 0.32, mats.duckYellow, 0.20, 0.22, 0.20);
        addVoxel(deskX + 0.90, 0.88, deskZ - 0.15, mats.whiteDesk, 0.14, 0.18, 0.14);
      }

      // 7. Authentic Ergonomic Aeron Chair at Desk (Faces 'down' towards door for Dylan)
      buildErgonomicChair(chairX, chairZ, isDylan ? 'down' : 'up', isDylan);
    }

    // Build the 7 Workstations (Dylan CEO + 6 Specialized Autonomous Agents)
    buildWorkstation(
      OFFICE_3D_LAYOUT.CEO.desk.x,
      OFFICE_3D_LAYOUT.CEO.desk.z,
      OFFICE_3D_LAYOUT.CEO.chair.x,
      OFFICE_3D_LAYOUT.CEO.chair.z,
      'dylan'
    );
    // Row 1 (AI Researcher, UI/UX Designer, Fullstack Dev)
    buildWorkstation(
      OFFICE_3D_LAYOUT.DESKS.ray.x,
      OFFICE_3D_LAYOUT.DESKS.ray.z,
      OFFICE_3D_LAYOUT.DESKS.ray.chair.x,
      OFFICE_3D_LAYOUT.DESKS.ray.chair.z,
      'ray'
    );
    buildWorkstation(
      OFFICE_3D_LAYOUT.DESKS.maya.x,
      OFFICE_3D_LAYOUT.DESKS.maya.z,
      OFFICE_3D_LAYOUT.DESKS.maya.chair.x,
      OFFICE_3D_LAYOUT.DESKS.maya.chair.z,
      'maya'
    );
    buildWorkstation(
      OFFICE_3D_LAYOUT.DESKS.alex.x,
      OFFICE_3D_LAYOUT.DESKS.alex.z,
      OFFICE_3D_LAYOUT.DESKS.alex.chair.x,
      OFFICE_3D_LAYOUT.DESKS.alex.chair.z,
      'alex'
    );
    // Row 2 (Marketing Strategist, Cybersecurity Specialist)
    buildWorkstation(
      OFFICE_3D_LAYOUT.DESKS.wendy.x,
      OFFICE_3D_LAYOUT.DESKS.wendy.z,
      OFFICE_3D_LAYOUT.DESKS.wendy.chair.x,
      OFFICE_3D_LAYOUT.DESKS.wendy.chair.z,
      'wendy'
    );
    buildWorkstation(
      OFFICE_3D_LAYOUT.DESKS.zane.x,
      OFFICE_3D_LAYOUT.DESKS.zane.z,
      OFFICE_3D_LAYOUT.DESKS.zane.chair.x,
      OFFICE_3D_LAYOUT.DESKS.zane.chair.z,
      'zane'
    );

    // Bookshelf with Gold Trophy on CEO Left Wall (Flush 2.10m height below 2.40m wall top)
    addVoxel(OFFICE_3D_LAYOUT.CEO.bookshelf.x, 1.05, OFFICE_3D_LAYOUT.CEO.bookshelf.z, mats.bookshelf, 0.8, 2.10, 1.8);
    addVoxel(OFFICE_3D_LAYOUT.CEO.bookshelf.x + 0.2, 2.18, OFFICE_3D_LAYOUT.CEO.bookshelf.z, mats.trophy, 0.3, 0.16, 0.3);

    // Eah's Cozy Luxury Velvet Armchair & Side Table (Beside Bookshelf Cabinet)
    const eahSeatPos = OFFICE_3D_LAYOUT.CEO.eahSeat;
    // Velvet armchair deep seat cushion (midnight rose / plush velvet)
    addVoxel(eahSeatPos.x, 0.42, eahSeatPos.z, mats.screenPalette, 0.95, 0.20, 0.95);
    addVoxel(eahSeatPos.x, 0.30, eahSeatPos.z, mats.chairNavy, 0.98, 0.10, 0.98);
    // Ergonomic curved backrest against the side wall
    addVoxel(eahSeatPos.x - 0.42, 0.78, eahSeatPos.z, mats.screenPalette, 0.18, 0.64, 0.98);
    addVoxel(eahSeatPos.x - 0.44, 0.78, eahSeatPos.z, mats.chairNavy, 0.16, 0.66, 1.00);
    // Padded velvet armrests (north towards cabinet and south)
    addVoxel(eahSeatPos.x, 0.62, eahSeatPos.z - 0.44, mats.screenPalette, 0.88, 0.28, 0.16);
    addVoxel(eahSeatPos.x, 0.62, eahSeatPos.z + 0.44, mats.screenPalette, 0.88, 0.28, 0.16);
    // Brushed gold brass tapered chair legs
    addVoxel(eahSeatPos.x - 0.38, 0.14, eahSeatPos.z - 0.38, mats.goldAccent, 0.08, 0.28, 0.08);
    addVoxel(eahSeatPos.x + 0.38, 0.14, eahSeatPos.z - 0.38, mats.goldAccent, 0.08, 0.28, 0.08);
    addVoxel(eahSeatPos.x - 0.38, 0.14, eahSeatPos.z + 0.38, mats.goldAccent, 0.08, 0.28, 0.08);
    addVoxel(eahSeatPos.x + 0.38, 0.14, eahSeatPos.z + 0.38, mats.goldAccent, 0.08, 0.28, 0.08);
    // Gold plush accent throw pillow
    addVoxel(eahSeatPos.x - 0.28, 0.62, eahSeatPos.z - 0.22, mats.trophy, 0.22, 0.28, 0.16);
    // Mini marble pedestal side table between armchair and cabinet
    addVoxel(eahSeatPos.x, 0.44, eahSeatPos.z - 0.85, mats.kitchenMarble, 0.48, 0.04, 0.48);
    addVoxel(eahSeatPos.x, 0.22, eahSeatPos.z - 0.85, mats.goldAccent, 0.08, 0.44, 0.08);
    addVoxel(eahSeatPos.x, 0.02, eahSeatPos.z - 0.85, mats.goldAccent, 0.36, 0.04, 0.36);
    // Scented aromatherapy candle with gentle flame
    addVoxel(eahSeatPos.x, 0.52, eahSeatPos.z - 0.85, mats.whiteDesk, 0.12, 0.12, 0.12);
    addVoxel(eahSeatPos.x, 0.60, eahSeatPos.z - 0.85, mats.duckYellow, 0.04, 0.06, 0.04, false);

    // CEO Private Leather Lounge Sofa & Glass Table
    addVoxel(OFFICE_3D_LAYOUT.CEO.sofa.x, 0.5, OFFICE_3D_LAYOUT.CEO.sofa.z, mats.sofaLeather, 2.2, 0.6, 1.0);
    addVoxel(OFFICE_3D_LAYOUT.CEO.coffeeTable.x, 0.4, OFFICE_3D_LAYOUT.CEO.coffeeTable.z, mats.tableGlass, 1.2, 0.4, 0.8);

    // Dylan's Desk Served Food & Coffee Group (from Eah 💕)
    const servedDeskGroup = new THREE.Group();
    servedDeskGroup.position.set(4.25, 0.82, 4.15);

    // Served Plate
    const servedPlateGroup = new THREE.Group();
    const servedPlateBase = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }));
    servedPlateBase.scale.set(0.32, 0.02, 0.32);
    servedPlateGroup.add(servedPlateBase);
    const servedPancakes = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xf59e0b }));
    servedPancakes.scale.set(0.22, 0.04, 0.22);
    servedPancakes.position.y = 0.03;
    servedPlateGroup.add(servedPancakes);
    const servedButter = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xfef08a, emissive: 0xfde047, emissiveIntensity: 0.2 }));
    servedButter.scale.set(0.06, 0.03, 0.06);
    servedButter.position.y = 0.06;
    servedPlateGroup.add(servedButter);
    const servedBacon = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xb91c1c }));
    servedBacon.scale.set(0.24, 0.025, 0.06);
    servedBacon.position.set(0, 0.04, 0.08);
    servedPlateGroup.add(servedBacon);
    servedDeskGroup.add(servedPlateGroup);

    // Served Coffee Mug
    const servedCoffeeGroup = new THREE.Group();
    servedCoffeeGroup.position.set(0.38, 0, 0);
    const servedMug = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xf43f5e }));
    servedMug.scale.set(0.14, 0.16, 0.14);
    servedMug.position.y = 0.08;
    servedCoffeeGroup.add(servedMug);
    const servedFoam = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xffedd5 }));
    servedFoam.scale.set(0.12, 0.02, 0.12);
    servedFoam.position.y = 0.16;
    servedCoffeeGroup.add(servedFoam);
    const servedHeart = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xf43f5e, emissive: 0xf43f5e, emissiveIntensity: 0.6 }));
    servedHeart.scale.set(0.05, 0.022, 0.05);
    servedHeart.position.y = 0.17;
    servedCoffeeGroup.add(servedHeart);

    // Rising Steam Wisps
    const steamPuffs: THREE.Mesh[] = [];
    const steamMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
    for (let i = 0; i < 3; i++) {
      const puff = new THREE.Mesh(boxGeo, steamMat);
      puff.scale.set(0.035, 0.035, 0.035);
      puff.position.set(0, 0.20 + i * 0.06, 0);
      servedCoffeeGroup.add(puff);
      steamPuffs.push(puff);
    }
    servedDeskGroup.add(servedCoffeeGroup);

    servedDeskGroup.visible = false;
    scene.add(servedDeskGroup);

    // Eah's Side Table Served Flowers & Gourmet Meal Group (from Dylan Ramos "Just to Be Fair" 💖)
    const servedEahTableGroup = new THREE.Group();
    servedEahTableGroup.position.set(eahSeatPos.x, 0.46, eahSeatPos.z - 0.85);

    // 1. Crystal Vase with Blooming Red Roses & Pink Peonies (Flowers from Dylan)
    const eahVaseGroup = new THREE.Group();
    const glassMat = new THREE.MeshLambertMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
    });
    const vaseMesh = new THREE.Mesh(boxGeo, glassMat);
    vaseMesh.scale.set(0.14, 0.22, 0.14);
    vaseMesh.position.y = 0.11;
    eahVaseGroup.add(vaseMesh);

    const waterMesh = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0x0284c7, transparent: true, opacity: 0.6 }));
    waterMesh.scale.set(0.12, 0.14, 0.12);
    waterMesh.position.y = 0.08;
    eahVaseGroup.add(waterMesh);

    const foliageMesh = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0x15803d }));
    foliageMesh.scale.set(0.24, 0.08, 0.24);
    foliageMesh.position.y = 0.24;
    eahVaseGroup.add(foliageMesh);

    const vaseRose1 = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xe11d48, emissive: 0x9f1239, emissiveIntensity: 0.35 }));
    vaseRose1.scale.set(0.10, 0.10, 0.10);
    vaseRose1.position.set(-0.06, 0.30, -0.04);
    eahVaseGroup.add(vaseRose1);

    const vaseRose2 = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xf43f5e, emissive: 0xbe123c, emissiveIntensity: 0.3 }));
    vaseRose2.scale.set(0.11, 0.11, 0.11);
    vaseRose2.position.set(0.06, 0.31, 0.04);
    eahVaseGroup.add(vaseRose2);

    const vaseRose3 = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xfbcfe8 }));
    vaseRose3.scale.set(0.08, 0.08, 0.08);
    vaseRose3.position.set(0, 0.33, 0);
    eahVaseGroup.add(vaseRose3);

    const eahSparkleMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const eahSparkles: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const sp = new THREE.Mesh(boxGeo, eahSparkleMat);
      sp.scale.set(0.025, 0.025, 0.025);
      sp.position.set((i - 1) * 0.08, 0.35 + i * 0.04, ((i % 2) - 0.5) * 0.08);
      eahVaseGroup.add(sp);
      eahSparkles.push(sp);
    }
    servedEahTableGroup.add(eahVaseGroup);

    // 2. Gourmet Food Plate (Golden Soufflé Pancakes with Strawberry cooked by Dylan)
    const eahFoodGroup = new THREE.Group();
    const eahPlateBase = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }));
    eahPlateBase.scale.set(0.28, 0.02, 0.28);
    eahFoodGroup.add(eahPlateBase);

    const eahPancakes = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xf59e0b }));
    eahPancakes.scale.set(0.20, 0.05, 0.20);
    eahPancakes.position.y = 0.035;
    eahFoodGroup.add(eahPancakes);

    const eahStrawberry = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.3 }));
    eahStrawberry.scale.set(0.06, 0.06, 0.06);
    eahStrawberry.position.set(0, 0.08, 0);
    eahFoodGroup.add(eahStrawberry);

    const eahButter = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xfef08a, emissive: 0xfde047, emissiveIntensity: 0.2 }));
    eahButter.scale.set(0.05, 0.025, 0.05);
    eahButter.position.set(0.04, 0.065, 0.04);
    eahFoodGroup.add(eahButter);

    const eahFoodSteamPuffs: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const puff = new THREE.Mesh(boxGeo, steamMat);
      puff.scale.set(0.03, 0.03, 0.03);
      puff.position.set(0, 0.12 + i * 0.05, 0);
      eahFoodGroup.add(puff);
      eahFoodSteamPuffs.push(puff);
    }
    servedEahTableGroup.add(eahFoodGroup);

    servedEahTableGroup.visible = false;
    scene.add(servedEahTableGroup);

    // Ficus Palm Plant in CEO Suite
    addVoxel(OFFICE_3D_LAYOUT.CEO.plant.x, 0.4, OFFICE_3D_LAYOUT.CEO.plant.z, mats.potOrange, 0.7, 0.8, 0.7);
    addVoxel(OFFICE_3D_LAYOUT.CEO.plant.x, 1.3, OFFICE_3D_LAYOUT.CEO.plant.z, mats.plantGreen, 1.2, 1.2, 1.2);

    // Modern Commercial Water Cooler in Bullpen (Relocated to x = 24.2, z = 4.2 to expand Server Room!)
    const wc = OFFICE_3D_LAYOUT.AMENITIES.waterCooler;
    // 1. Sleek Obsidian / Slate pedestal stand with chrome plinth
    addVoxel(wc.x, 0.02, wc.z, mats.chairChrome, 0.58, 0.04, 0.58);
    addVoxel(wc.x, 0.50, wc.z, mats.doorFrameDark, 0.54, 0.96, 0.54);
    addVoxel(wc.x, 0.96, wc.z, mats.wallTrim, 0.56, 0.04, 0.56);
    // 2. Recessed Dispensing Alcove & Chrome Drip Tray
    addVoxel(wc.x, 0.76, wc.z + 0.14, mats.doorSealDark, 0.38, 0.32, 0.18);
    addVoxel(wc.x, 0.62, wc.z + 0.16, mats.chairChrome, 0.36, 0.04, 0.16);
    // 3. Dual Cold (Cyan) & Hot (Red) Dispensing Levers
    addVoxel(wc.x - 0.08, 0.86, wc.z + 0.12, mats.serverLedCyan, 0.04, 0.07, 0.05, false); // Cold Tap
    addVoxel(wc.x + 0.08, 0.86, wc.z + 0.12, mats.espressoRed, 0.04, 0.07, 0.05, false);  // Hot Tap
    // 4. Inverted 5-Gallon Crystal Blue Water Jug
    addVoxel(wc.x, 1.01, wc.z, mats.chairChrome, 0.30, 0.06, 0.30); // Collar ring
    addVoxel(wc.x, 1.34, wc.z, mats.coolerJug, 0.46, 0.60, 0.46);   // Main water reservoir
    addVoxel(wc.x, 1.66, wc.z, mats.coolerJug, 0.36, 0.06, 0.36);   // Inverted bottle base
    // 5. Cylindrical Disposable Cup Dispenser on Side
    addVoxel(wc.x - 0.30, 0.90, wc.z, mats.coolerJug, 0.08, 0.50, 0.08);

    // C. Team Relaxation & Coffee Lounge (Zone 3, Bottom-Center: x: 8..21, z: 11..21)
    const ra = OFFICE_3D_LAYOUT.REST_AREA;

    // 1. Top-Left Dark Leather Sectional Booth
    addVoxel(ra.topBooth.x, 0.65, ra.topBooth.z, mats.loungeSofaTrim, 4.0, 0.70, 0.35); // Top backrest
    addVoxel(ra.topBooth.x - 1.9, 0.65, ra.topBooth.z + 0.55, mats.loungeSofaTrim, 0.35, 0.70, 1.4);  // Left arm/back
    addVoxel(ra.topBooth.x, 0.19, ra.topBooth.z + 0.55, mats.loungeSofa, 3.8, 0.38, 0.75);       // Dark slate leather cushions (top surface y=0.38 matches seated hips!)
    addVoxel(ra.topBooth.x - 1.5, 0.50, ra.topBooth.z + 0.35, mats.goldAccent, 0.36, 0.36, 0.14);     // Gold accent throw pillow

    // Top Caramel Wooden Coffee Table
    addVoxel(ra.topTable.x, 0.20, ra.topTable.z, mats.wallTrim, 0.30, 0.40, 0.30);       // Dark pedestal
    addVoxel(ra.topTable.x, 0.44, ra.topTable.z, mats.caramelWood, 2.0, 0.08, 0.9);      // Caramel wood tabletop
    addVoxel(ra.topTable.x - 0.3, 0.54, ra.topTable.z, mats.whiteDesk, 0.14, 0.14, 0.14); // Ceramic coffee mug

    // 2. Bottom-Right Inverted Dark Leather Sectional Booth
    addVoxel(ra.bottomBooth.x, 0.65, ra.bottomBooth.z, mats.loungeSofaTrim, 4.0, 0.70, 0.35); // Bottom backrest
    addVoxel(ra.bottomBooth.x + 1.9, 0.65, ra.bottomBooth.z - 0.55, mats.loungeSofaTrim, 0.35, 0.70, 1.4);  // Right arm/back
    addVoxel(ra.bottomBooth.x, 0.19, ra.bottomBooth.z - 0.55, mats.loungeSofa, 3.8, 0.38, 0.75);       // Dark slate leather cushions (top surface y=0.38 matches seated hips!)
    addVoxel(ra.bottomBooth.x + 1.5, 0.50, ra.bottomBooth.z - 0.35, mats.whiteDesk, 0.36, 0.36, 0.14);      // Cream throw pillow

    // Bottom Caramel Wooden Coffee Table
    addVoxel(ra.bottomTable.x, 0.20, ra.bottomTable.z, mats.wallTrim, 0.30, 0.40, 0.30);       // Dark pedestal
    addVoxel(ra.bottomTable.x, 0.44, ra.bottomTable.z, mats.caramelWood, 2.0, 0.08, 0.9);      // Caramel wood tabletop
    addVoxel(ra.bottomTable.x - 0.3, 0.54, ra.bottomTable.z, mats.espressoRed, 0.14, 0.14, 0.14); // Red coffee mug

    // 3. Adorable Living Animated Voxel Puppy (Mochi) Dedicated Pet Sanctuary Corner
    const dogX = ra.dogBed.x;
    const dogZ = ra.dogBed.z;
    // Cozy Braided Rug under Puppy Bed
    addVoxel(dogX, 0.02, dogZ, mats.goldAccent, 2.2, 0.04, 2.2);
    // Donut Pet Bed: Caramel outer rim + Plush cream inner cushion
    addVoxel(dogX, 0.14, dogZ, mats.dogBedDonut, 1.40, 0.24, 1.40);
    addVoxel(dogX, 0.20, dogZ, mats.dogBedCream, 0.95, 0.16, 0.95);
    // Stainless Steel Pet Water Bowl with Fresh Water
    addVoxel(dogX - 0.95, 0.08, dogZ + 0.4, mats.chairChrome, 0.32, 0.16, 0.32);
    addVoxel(dogX - 0.95, 0.14, dogZ + 0.4, mats.coolerJug, 0.24, 0.04, 0.24);
    // Red Ceramic Pet Food Bowl with Golden Kibbles
    addVoxel(dogX - 0.95, 0.08, dogZ - 0.35, mats.espressoRed, 0.32, 0.16, 0.32);
    addVoxel(dogX - 0.95, 0.14, dogZ - 0.35, mats.caramelWood, 0.24, 0.04, 0.24);
    // Red Rubber Chew Bone Toy
    addVoxel(dogX + 0.85, 0.06, dogZ + 0.35, mats.dogPinkTongue, 0.28, 0.08, 0.10);
    addVoxel(dogX + 0.72, 0.06, dogZ + 0.35, mats.dogPinkTongue, 0.10, 0.10, 0.18);
    addVoxel(dogX + 0.98, 0.06, dogZ + 0.35, mats.dogPinkTongue, 0.10, 0.10, 0.18);

    // Living Animated Voxel Puppy (Mochi) - Patrols & Wanders Lounge Area
    const puppy3D = new VoxelPuppy3D(dogX, dogZ + 1.0);
    scene.add(puppy3D.group);
    puppyRef.current = puppy3D;

    // 3B. Snowy\'s Deluxe White Cat Sanctuary & Scratching Tower (Zone 3: x = 18.2, z = 18.8)
    const catX = ra.catBed.x;
    const catZ = ra.catBed.z;
    // Circular Sky-Blue Velvet Cat Basket with Fluffy White Cloud Cushion
    addVoxel(catX, 0.10, catZ, mats.catBedSky, 1.10, 0.16, 1.10);
    addVoxel(catX, 0.16, catZ, mats.catBedFluff, 0.85, 0.14, 0.85);
    // Sisal Scratching Tree Post with Sisal Rope Texture
    addVoxel(catX + 0.65, 0.45, catZ + 0.25, mats.caramelWood, 0.16, 0.90, 0.16);
    // Upper Elevated Cat Perch Platform
    addVoxel(catX + 0.65, 0.92, catZ + 0.25, mats.boardTable, 0.52, 0.06, 0.52);
    addVoxel(catX + 0.65, 0.96, catZ + 0.25, mats.catBedFluff, 0.44, 0.04, 0.44);
    // Dangling Pink Sisal Yarn Ball Toy
    addVoxel(catX + 0.52, 0.72, catZ + 0.25, mats.catPinkNose, 0.10, 0.10, 0.10);
    addVoxel(catX + 0.52, 0.82, catZ + 0.25, mats.chairChrome, 0.015, 0.12, 0.015);
    // Porcelain White Cat Saucer with Fresh Milk
    addVoxel(catX - 0.75, 0.06, catZ + 0.25, mats.whiteDesk, 0.28, 0.08, 0.28);
    addVoxel(catX - 0.75, 0.10, catZ + 0.25, mats.catBedFluff, 0.20, 0.02, 0.20);
    // Salmon Fish Treat Bowl
    addVoxel(catX - 0.75, 0.06, catZ - 0.25, mats.espressoRed, 0.28, 0.08, 0.28);
    addVoxel(catX - 0.75, 0.10, catZ - 0.25, mats.potOrange, 0.20, 0.03, 0.20);

    // Living Animated Voxel White Cat (Snowy) - Wanders Lounge, Zen Garden & CEO Wing
    const cat3D = new VoxelCat3D(catX, catZ);
    scene.add(cat3D.group);
    catRef.current = cat3D;

    // 4. Framed Heart Photo & Miniature Succulent (Near Lounge Wall)
    addVoxel(ra.framedHeartPhoto.x, 0.18, ra.framedHeartPhoto.z, mats.bookshelf, 0.40, 0.36, 0.12);      // Wooden easel stand
    addVoxel(ra.framedHeartPhoto.x, 0.54, ra.framedHeartPhoto.z, mats.whiteDesk, 0.38, 0.46, 0.06);      // White photo frame
    addVoxel(ra.framedHeartPhoto.x, 0.54, ra.framedHeartPhoto.z + 0.04, mats.dogPinkTongue, 0.16, 0.16, 0.03, false); // Red Heart (❤️)
    // Terracotta pot with green succulent
    addVoxel(ra.framedHeartPhoto.x + 0.4, 0.22, ra.framedHeartPhoto.z, mats.potOrange, 0.20, 0.24, 0.20);
    addVoxel(ra.framedHeartPhoto.x + 0.4, 0.40, ra.framedHeartPhoto.z, mats.plantGreen, 0.24, 0.16, 0.24);

    // Warm Ambient Lounge Light for Cozy Boutique Aesthetic
    const loungeLight = new THREE.PointLight(0xffedd5, 2.2, 14, 1.8);
    loungeLight.position.set(14.5, 3.8, 16.5);
    scene.add(loungeLight);

    // 5. Espresso Bar Counter & Italian Chrome Machine with Barstools (Beside Kitchen)
    addVoxel(ra.espressoBar.x, 0.6, ra.espressoBar.z, mats.espressoCounter, ra.espressoBar.width, 1.2, ra.espressoBar.depth);
    addVoxel(ra.espressoBar.x, 1.22, ra.espressoBar.z, mats.espressoMarble, ra.espressoBar.width + 0.2, 0.08, ra.espressoBar.depth + 0.2);
    addVoxel(ra.espressoBar.x, 1.5, ra.espressoBar.z - 0.3, mats.espressoRed, 0.8, 0.5, 0.6);
    addVoxel(ra.espressoBar.x, 1.45, ra.espressoBar.z + 0.05, mats.whiteDesk, 0.6, 0.3, 0.15);
    addVoxel(ra.espressoBar.x, 1.35, ra.espressoBar.z + 0.15, mats.goldAccent, 0.4, 0.1, 0.15);
    // Swivel Barstools facing espresso bar
    addVoxel(ra.espressoBar.x + 1.2, 0.45, ra.espressoBar.z - 0.6, mats.chairFrameDark, 0.35, 0.08, 0.35);
    addVoxel(ra.espressoBar.x + 1.2, 0.22, ra.espressoBar.z - 0.6, mats.chairChrome, 0.10, 0.40, 0.10);
    addVoxel(ra.espressoBar.x + 1.2, 0.45, ra.espressoBar.z + 0.6, mats.chairFrameDark, 0.35, 0.08, 0.35);
    addVoxel(ra.espressoBar.x + 1.2, 0.22, ra.espressoBar.z + 0.6, mats.chairChrome, 0.10, 0.40, 0.10);

    // 6. Retro Pixel Arcade Cabinet (Stepped authentic chassis, glowing CRT screen, illuminated marquee & control panel)
    const ax = ra.arcadeCabinet.x;
    const az = ra.arcadeCabinet.z;

    // A. Lower Cabinet Pedestal & Twin Coin Vault
    addVoxel(ax, 0.48, az - 0.05, mats.arcadeBody, 1.12, 0.96, 0.90);
    // Chrome Coin Door Frame & Key Lock
    addVoxel(ax, 0.48, az + 0.41, mats.chairChrome, 0.52, 0.48, 0.04);
    addVoxel(ax, 0.64, az + 0.435, mats.doorFrameDark, 0.04, 0.04, 0.02);
    // Dual Glowing Orange Coin Return Slots
    addVoxel(ax - 0.14, 0.56, az + 0.435, mats.goldAccent, 0.07, 0.09, 0.02);
    addVoxel(ax + 0.14, 0.56, az + 0.435, mats.goldAccent, 0.07, 0.09, 0.02);

    // B. Protruding Control Panel Deck (Slanted forward at hip height)
    addVoxel(ax, 1.00, az + 0.16, mats.arcadeBody, 1.16, 0.12, 0.48);
    addVoxel(ax, 1.06, az + 0.18, mats.doorFrameDark, 1.12, 0.04, 0.44);
    // Player 1 Joystick (Chrome shaft + Vibrant Red Ball-Top)
    addVoxel(ax - 0.22, 1.14, az + 0.24, mats.chairChrome, 0.035, 0.12, 0.035);
    addVoxel(ax - 0.22, 1.21, az + 0.24, mats.espressoRed, 0.09, 0.09, 0.09);
    // Player 1 Action Buttons (Multi-color Japanese layout)
    addVoxel(ax + 0.10, 1.09, az + 0.17, mats.rgbTowerCyan, 0.065, 0.03, 0.065);
    addVoxel(ax + 0.20, 1.09, az + 0.17, mats.goldAccent, 0.065, 0.03, 0.065);
    addVoxel(ax + 0.30, 1.09, az + 0.17, mats.espressoRed, 0.065, 0.03, 0.065);
    addVoxel(ax + 0.10, 1.09, az + 0.27, mats.screenCode, 0.065, 0.03, 0.065);
    addVoxel(ax + 0.20, 1.09, az + 0.27, mats.arcadeScreen, 0.065, 0.03, 0.065);
    addVoxel(ax + 0.30, 1.09, az + 0.27, mats.rgbTowerPurple, 0.065, 0.03, 0.065);
    // 1P & 2P Start Buttons
    addVoxel(ax - 0.05, 1.09, az + 0.10, mats.kitchenTileLight, 0.045, 0.02, 0.045);
    addVoxel(ax + 0.05, 1.09, az + 0.10, mats.kitchenTileLight, 0.045, 0.02, 0.045);

    // C. Recessed CRT Screen Housing (Slanted backward into the cabinet interior)
    addVoxel(ax, 1.54, az - 0.08, mats.arcadeBody, 1.08, 0.88, 0.62);
    // CRT Bezel (Dark surround)
    addVoxel(ax, 1.54, az + 0.14, mats.doorFrameDark, 0.98, 0.74, 0.14);
    // Glowing Cyber Neon CRT Screen (Vibrant pink/magenta display)
    addVoxel(ax, 1.54, az + 0.215, mats.arcadeScreen, 0.84, 0.60, 0.04);
    // 8-bit Pixel Art Centerpiece (Golden space invader / high-score emblem)
    addVoxel(ax, 1.54, az + 0.24, mats.arcadeMarquee, 0.38, 0.22, 0.02);
    // CRT Glare Scanline Accent
    addVoxel(ax, 1.76, az + 0.24, mats.bistroLightGlow, 0.68, 0.035, 0.015);

    // D. Top Canopy Hood & Radiant Marquee Header
    addVoxel(ax, 2.12, az - 0.04, mats.arcadeBody, 1.14, 0.32, 0.88);
    // Slanted Illuminated Marquee Sign (Glows over the screen)
    addVoxel(ax, 2.05, az + 0.34, mats.arcadeMarquee, 0.98, 0.24, 0.14);
    addVoxel(ax, 2.18, az + 0.36, mats.doorFrameDark, 1.02, 0.04, 0.12);
    addVoxel(ax, 1.93, az + 0.32, mats.doorFrameDark, 1.02, 0.04, 0.12);

    // E. Left & Right Outer Side Panels with Rubber T-Molding Edging
    addVoxel(ax - 0.55, 1.25, az + 0.04, mats.arcadeBody, 0.06, 1.95, 0.84);
    addVoxel(ax - 0.56, 1.25, az + 0.04, mats.wallTrim, 0.03, 1.98, 0.86);
    addVoxel(ax + 0.55, 1.25, az + 0.04, mats.arcadeBody, 0.06, 1.95, 0.84);
    addVoxel(ax + 0.56, 1.25, az + 0.04, mats.wallTrim, 0.03, 1.98, 0.86);

    // 7. Tall Potted Fig Tree in Corner
    addVoxel(ra.plant.x, 0.5, ra.plant.z, mats.potOrange, 0.9, 1.0, 0.9);
    addVoxel(ra.plant.x, 1.6, ra.plant.z, mats.plantGreen, 1.4, 1.6, 1.4);

    // D. Executive Boardroom Conference Suite (Zone 4, Bottom-Right: x: 21..29, z: 11..21)
    const bt = OFFICE_3D_LAYOUT.BOARDROOM.table;
    addVoxel(bt.x, 0.75, bt.z, mats.boardTable, bt.width, 0.2, bt.depth);
    addVoxel(bt.x, 0.76, bt.z, mats.wallTrim, bt.width - 0.4, 0.21, bt.depth - 0.4);
    addVoxel(bt.x - 1.8, 0.37, bt.z, mats.deskTrim, 0.6, 0.75, 1.4);
    addVoxel(bt.x + 1.8, 0.37, bt.z, mats.deskTrim, 0.6, 0.75, 1.4);

    // Executive Conference Swivel Chairs around Table
    Object.entries(OFFICE_3D_LAYOUT.BOARDROOM.seats).forEach(([chairId, seat]) => {
      const isHead = chairId === 'dylan';
      const isTop = seat.z < bt.z;
      const facing = isHead ? 'right' : isTop ? 'down' : 'up';
      buildErgonomicChair(seat.x, seat.z, facing, isHead);
    });

    // Boardroom Executive Presentation Display System (Mounted on North Wall at x = 25.0, z = 11.15)
    const scr = OFFICE_3D_LAYOUT.BOARDROOM.screen;
    // Heavy-duty dual steel wall-mounting arm brackets (Centered at y = 1.38, well below 2.40m lintel)
    addVoxel(scr.x - 0.9, 1.38, 11.06, mats.wallTrim, 0.10, 0.70, 0.12);
    addVoxel(scr.x + 0.9, 1.38, 11.06, mats.wallTrim, 0.10, 0.70, 0.12);
    // TV Slim Bezel (Obsidian Titanium Frame, 3.4m wide x 1.25m high, centered at y = 1.38)
    addVoxel(scr.x, 1.38, scr.z - 0.03, mats.wallTrim, 3.40, 1.25, 0.08);
    // 85" Ultra-HD Luminous Presentation Display (Facing Boardroom at z = 11.18)
    addVoxel(scr.x, 1.38, scr.z + 0.02, mats.boardScreen, 3.24, 1.12, 0.04);
    // High-End Integrated Conference Video Soundbar (Underneath screen at y = 0.70)
    addVoxel(scr.x, 0.70, scr.z, mats.doorFrameDark, 2.20, 0.10, 0.14);
    addVoxel(scr.x, 0.70, scr.z + 0.06, mats.wallTrim, 2.10, 0.06, 0.03);
    // 4K Wide-Angle Conference AI Camera (Centered on top of screen at y = 2.06, well below 2.40m wall top)
    addVoxel(scr.x, 2.06, scr.z, mats.doorFrameDark, 0.36, 0.08, 0.12);
    addVoxel(scr.x, 2.06, scr.z + 0.06, mats.chairChrome, 0.08, 0.04, 0.03, false);

    // Modern Wood Slat Acoustic Accent Wall along East Perimeter Wall (x: 37.85, z: 11.0 to 21.05)
    // Solid architectural backing wall:
    addVoxelToGroup(eastWallGroup, 38.0, 1.10, 16.025, mats.doorFrameDark, 0.20, 2.20, 10.05);
    for (let sl = 11.5; sl <= 20.5; sl += 0.5) {
      addVoxelToGroup(eastWallGroup, 37.85, 1.18, sl, mats.bookshelf, 0.06, 2.04, 0.22);
    }

    // Clean Architectural Cool White Boardroom Light (Centered directly above conference table)
    const boardLight = new THREE.PointLight(0xe0f2fe, 2.0, 12, 1.8);
    boardLight.position.set(29.5, 3.8, 16.2);
    scene.add(boardLight);

    // Corner Executive Ficus Plant in Boardroom (South-East Corner at x = 36.8, z = 19.6)
    addVoxel(36.8, 0.5, 19.6, mats.potOrange, 0.8, 1.0, 0.8);
    addVoxel(36.8, 1.6, 19.6, mats.plantGreen, 1.2, 1.5, 1.2);

    // Executive Mineral Water Dispenser in Boardroom (Northwest Corner at x = 22.4, z = 11.8)
    const bWc = OFFICE_3D_LAYOUT.BOARDROOM.waterDispenser;
    // 1. Sleek Obsidian Pedestal Chassis
    addVoxel(bWc.x, 0.48, bWc.z, mats.doorFrameDark, 0.56, 0.96, 0.52);
    // Brushed Chrome Floor Plinth
    addVoxel(bWc.x, 0.02, bWc.z, mats.chairChrome, 0.58, 0.04, 0.54);
    // Beveled Upper Trim
    addVoxel(bWc.x, 0.94, bWc.z, mats.wallTrim, 0.56, 0.04, 0.52);

    // 2. Recessed Dispensing Alcove
    addVoxel(bWc.x, 0.78, bWc.z + 0.12, mats.doorSealDark, 0.40, 0.30, 0.22);
    // Chrome Drip Tray & Perforated Grill
    addVoxel(bWc.x, 0.65, bWc.z + 0.14, mats.chairChrome, 0.38, 0.04, 0.20);
    // Dual Cold & Hot Water Taps
    addVoxel(bWc.x - 0.08, 0.90, bWc.z + 0.10, mats.rgbTowerCyan, 0.05, 0.08, 0.08, false); // Cold Blue Tap
    addVoxel(bWc.x + 0.08, 0.90, bWc.z + 0.10, mats.espressoRed, 0.05, 0.08, 0.08, false);  // Hot Red Tap
    // Status Indicator LEDs
    addVoxel(bWc.x - 0.08, 0.98, bWc.z + 0.23, mats.serverLedCyan, 0.04, 0.02, 0.01, false);
    addVoxel(bWc.x + 0.08, 0.98, bWc.z + 0.23, mats.serverLedAmber, 0.04, 0.02, 0.01, false);

    // 3. Inverted 5-Gallon Crystal Clear Mineral Water Bottle
    addVoxel(bWc.x, 1.00, bWc.z, mats.chairChrome, 0.38, 0.06, 0.38); // Chrome Collar Neck
    addVoxel(bWc.x, 1.06, bWc.z, mats.coolerBase, 0.44, 0.08, 0.44);   // Lower Reservoir Housing
    addVoxel(bWc.x, 1.38, bWc.z, mats.coolerJug, 0.46, 0.56, 0.46);    // Translucent Blue Bottle
    addVoxel(bWc.x, 1.36, bWc.z, mats.rgbTowerCyan, 0.38, 0.50, 0.38, false); // Glowing Mineral Water Interior
    addVoxel(bWc.x, 1.68, bWc.z, mats.coolerJug, 0.36, 0.08, 0.36);    // Rounded Bottle Top

    // 4. Side-Mounted Paper Cup Dispenser (Facing East into room)
    addVoxel(bWc.x + 0.31, 0.94, bWc.z, mats.chairChrome, 0.06, 0.10, 0.08); // Chrome Bracket
    addVoxel(bWc.x + 0.31, 1.02, bWc.z, mats.tableGlass, 0.14, 0.54, 0.14);  // Clear Plastic Tube
    addVoxel(bWc.x + 0.31, 0.98, bWc.z, mats.whiteDesk, 0.12, 0.44, 0.12);   // Stack of White Paper Cups
    addVoxel(bWc.x + 0.31, 0.72, bWc.z, mats.rgbTowerCyan, 0.14, 0.06, 0.14, false); // Bottom Pull Ring
    addVoxel(bWc.x + 0.31, 1.30, bWc.z, mats.chairChrome, 0.15, 0.04, 0.15); // Chrome Top Lid

    // 5. Ready Glass Tumbler on Drip Tray
    addVoxel(bWc.x - 0.08, 0.73, bWc.z + 0.14, mats.tableGlass, 0.10, 0.12, 0.10);
    addVoxel(bWc.x - 0.08, 0.71, bWc.z + 0.14, mats.rgbTowerCyan, 0.07, 0.07, 0.07, false);

    // E. ZONE 5A: GOURMET PANTRY & KITCHEN SUITE (Indoor: x: 1..8, z: 11..16)
    // 1. Double-Door Stainless Smart Refrigerator with Glass Water/Ice Dispenser (x: 1.6, z: 11.6)
    addVoxel(1.6, 1.05, 11.6, mats.kitchenStainless, 1.1, 2.10, 0.9);
    addVoxel(1.6, 1.10, 11.15, mats.wallTrim, 1.05, 2.20, 0.04);
    // Dispenser recess & ice blue light
    addVoxel(1.4, 1.45, 12.06, mats.doorFrameDark, 0.28, 0.36, 0.04);
    addVoxel(1.4, 1.45, 12.08, mats.rgbTowerCyan, 0.22, 0.28, 0.02, false);
    // Brushed chrome door handles
    addVoxel(1.55, 1.35, 12.08, mats.chairChrome, 0.04, 0.85, 0.04);
    addVoxel(1.65, 1.35, 12.08, mats.chairChrome, 0.04, 0.85, 0.04);

    // 2. Kitchen Back Counter Suite along North Partition (x: 2.5 to 7.2, z: 11.6)
    // Lower cabinetry (Midnight navy / slate)
    addVoxel(4.8, 0.44, 11.6, mats.kitchenCabinet, 4.8, 0.88, 0.85);
    // Premium quartz countertop (White marble)
    addVoxel(4.8, 0.90, 11.6, mats.kitchenMarble, 4.9, 0.06, 0.90);
    // Stainless steel undermount sink & swan-neck faucet
    addVoxel(3.2, 0.91, 11.6, mats.kitchenStainless, 0.75, 0.02, 0.55);
    addVoxel(3.2, 1.05, 11.45, mats.chairChrome, 0.06, 0.26, 0.06);
    addVoxel(3.2, 1.16, 11.55, mats.chairChrome, 0.06, 0.06, 0.20);
    // Microwave & convection oven on counter
    addVoxel(4.4, 1.12, 11.55, mats.kitchenStainless, 0.80, 0.42, 0.55);
    addVoxel(4.4, 1.12, 11.83, mats.doorGlass, 0.55, 0.30, 0.02);
    // High-end Commercial Dual-Boiler Espresso Machine (Chrome + Ruby)
    addVoxel(5.8, 1.14, 11.55, mats.espressoRed, 0.70, 0.44, 0.55);
    addVoxel(5.8, 1.18, 11.75, mats.chairChrome, 0.55, 0.32, 0.16);
    addVoxel(5.8, 0.96, 11.75, mats.whiteDesk, 0.14, 0.14, 0.14); // Ceramic cup catching espresso
    // Fresh Fruit & Snack Basket
    addVoxel(6.7, 0.96, 11.6, mats.potOrange, 0.36, 0.10, 0.36);
    addVoxel(6.7, 1.03, 11.6, mats.duckYellow, 0.12, 0.12, 0.12);
    addVoxel(6.78, 1.03, 11.64, mats.espressoRed, 0.12, 0.12, 0.12);

    // Upper Floating Oak Shelves with Glassware & Coffee Beans
    addVoxel(4.8, 1.95, 11.25, mats.kitchenCabinetOak, 4.4, 0.06, 0.35);
    addVoxel(4.8, 2.30, 11.25, mats.kitchenCabinetOak, 4.4, 0.06, 0.35);
    // Coffee jars & artisanal cups on shelves
    addVoxel(3.6, 2.05, 11.25, mats.tableGlass, 0.18, 0.22, 0.18);
    addVoxel(4.4, 2.05, 11.25, mats.coolerBase, 0.20, 0.22, 0.20);
    addVoxel(5.2, 2.05, 11.25, mats.trophy, 0.18, 0.20, 0.18);
    addVoxel(6.0, 2.05, 11.25, mats.whiteDesk, 0.16, 0.18, 0.16);

    // 3. Luxurious Waterfall Quartz Kitchen Island Bar (x: 4.5, z: 13.8)
    // Waterfall side slabs
    addVoxel(2.35, 0.44, 13.8, mats.kitchenMarble, 0.12, 0.88, 1.25);
    addVoxel(6.65, 0.44, 13.8, mats.kitchenMarble, 0.12, 0.88, 1.25);
    // Island base cabinet (Oak & brass reveal)
    addVoxel(4.5, 0.42, 13.6, mats.kitchenCabinetOak, 4.1, 0.84, 0.85);
    // Waterfall quartz top bar (generous overhang for knees & laptops)
    addVoxel(4.5, 0.89, 13.8, mats.kitchenMarble, 4.4, 0.06, 1.30);
    // Linear brass LED pendant chandelier over island
    addVoxel(4.5, 2.40, 13.8, mats.goldAccent, 3.2, 0.05, 0.08);
    addVoxel(4.5, 2.38, 13.8, mats.bistroLightGlow, 3.0, 0.02, 0.06, false);
    const kitchenLight = new THREE.PointLight(0xfff7ed, 2.0, 7, 1.8);
    kitchenLight.position.set(4.5, 2.2, 13.8);
    scene.add(kitchenLight);

    // 4. Two Cognac Leather & Chrome Barstools (Facing North into Island: x = 3.5 & x = 5.5, z = 14.8)
    [3.5, 5.5].forEach((bsX) => {
      // Circular chrome base & footrest
      addVoxel(bsX, 0.04, 14.8, mats.chairChrome, 0.40, 0.04, 0.40);
      addVoxel(bsX, 0.32, 14.8, mats.chairChrome, 0.08, 0.60, 0.08);
      addVoxel(bsX, 0.22, 14.65, mats.chairChrome, 0.28, 0.04, 0.04); // footrest ring
      // Cognac leather padded seat (height 0.62)
      addVoxel(bsX, 0.62, 14.8, mats.kitchenBarStool, 0.46, 0.08, 0.46);
      // Low curved leather backrest
      addVoxel(bsX, 0.78, 15.0, mats.kitchenBarStool, 0.44, 0.24, 0.08);
    });

    // 5. Props on Kitchen Island: Warm Croissant Plate & Ceramic Cappuccino Mug
    addVoxel(3.8, 0.93, 13.8, mats.whiteDesk, 0.28, 0.02, 0.28);
    addVoxel(3.8, 0.96, 13.8, mats.deskTrimBrass, 0.16, 0.08, 0.12); // Flaky butter croissant
    addVoxel(4.2, 0.98, 13.7, mats.whiteDesk, 0.14, 0.16, 0.14); // Cappuccino mug
    addVoxel(4.2, 1.05, 13.7, mats.bookshelf, 0.11, 0.02, 0.11); // Espresso crema

    // F. ZONE 5B: OUTDOOR ZEN GARDEN & PATIO TERRACE (Outdoor: x: 1..8, z: 16..21)
    // 1. Stacked Slate Zen Water Fountain (x: 1.8, z: 17.5)
    // Fountain basin
    addVoxel(1.8, 0.20, 17.5, mats.fountainStone, 1.1, 0.40, 1.1);
    addVoxel(1.8, 0.36, 17.5, mats.fountainWater, 0.9, 0.08, 0.9, false);
    // Tiered stacked stone monolith
    addVoxel(1.8, 0.60, 17.5, mats.fountainStone, 0.55, 0.45, 0.55);
    addVoxel(1.8, 0.90, 17.5, mats.fountainStone, 0.35, 0.30, 0.35);
    addVoxel(1.8, 0.88, 17.5, mats.fountainWater, 0.38, 0.04, 0.38, false);

    // 2. Slatted Teak Patio Dining & Collaborative Work Table (x: 4.5, z: 18.5)
    // Sturdy teak table legs
    addVoxel(3.4, 0.36, 18.0, mats.gardenDeck, 0.12, 0.72, 0.12);
    addVoxel(5.6, 0.36, 18.0, mats.gardenDeck, 0.12, 0.72, 0.12);
    addVoxel(3.4, 0.36, 19.0, mats.gardenDeck, 0.12, 0.72, 0.12);
    addVoxel(5.6, 0.36, 19.0, mats.gardenDeck, 0.12, 0.72, 0.12);
    // Slatted teak table top (height 0.74, width 2.6, depth 1.4)
    addVoxel(4.5, 0.74, 18.5, mats.gardenDeck, 2.6, 0.06, 1.4);
    // Center runner & beverage coasters
    addVoxel(4.5, 0.75, 18.5, mats.kitchenMarble, 0.40, 0.01, 1.35);
    addVoxel(4.0, 0.76, 18.3, mats.doorThreshold, 0.14, 0.01, 0.14);
    addVoxel(4.0, 0.85, 18.3, mats.coolerJug, 0.10, 0.18, 0.10); // Iced tumbler with straw

    // 3. Two Ergonomic Woven Wicker Patio Armchairs (x: 3.4 & x: 5.6, z: 18.5 facing table)
    // Left patio chair (facing east towards table)
    addVoxel(3.4, 0.22, 18.5, mats.gardenWovenChair, 0.55, 0.44, 0.55);
    addVoxel(3.4, 0.45, 18.5, mats.gardenUmbrellaCanopy, 0.50, 0.08, 0.50); // Cream weather-resistant cushion
    addVoxel(3.15, 0.65, 18.5, mats.gardenWovenChair, 0.08, 0.45, 0.55); // Backrest
    // Right patio chair (facing west towards table)
    addVoxel(5.6, 0.22, 18.5, mats.gardenWovenChair, 0.55, 0.44, 0.55);
    addVoxel(5.6, 0.45, 18.5, mats.gardenUmbrellaCanopy, 0.50, 0.08, 0.50);
    addVoxel(5.85, 0.65, 18.5, mats.gardenWovenChair, 0.08, 0.45, 0.55);

    // 4. Large Cantilever Parasol Sun Umbrella (Center over patio table)
    // Cast-iron weighted umbrella base
    addVoxel(4.5, 0.06, 17.3, mats.doorFrameDark, 0.50, 0.08, 0.50);
    // Sturdy aluminum pole arching upward
    addVoxel(4.5, 1.25, 17.3, mats.gardenUmbrellaPole, 0.08, 2.45, 0.08);
    addVoxel(4.5, 2.50, 17.9, mats.gardenUmbrellaPole, 0.08, 0.08, 1.25);
    // Cream Canvas Octagonal Canopy (y = 2.48, center x = 4.5, z = 18.5)
    addVoxel(4.5, 2.50, 18.5, mats.gardenUmbrellaCanopy, 2.8, 0.08, 2.4);
    addVoxel(4.5, 2.55, 18.5, mats.gardenUmbrellaCanopy, 2.2, 0.12, 1.8);
    addVoxel(4.5, 2.62, 18.5, mats.gardenUmbrellaCanopy, 1.4, 0.12, 1.2);
    addVoxel(4.5, 2.70, 18.5, mats.gardenUmbrellaPole, 0.15, 0.10, 0.15); // Finial cap

    // 5. Cedar Wood Pergola with Hanging Bistro String Lights
    // 4 Corner pergola posts
    [1.4, 7.4].forEach((px) => {
      [16.4, 20.6].forEach((pz) => {
        addVoxel(px, 1.4, pz, mats.gardenDeck, 0.16, 2.8, 0.16);
      });
    });
    // Overhead horizontal cedar beams
    addVoxel(4.4, 2.80, 16.4, mats.gardenDeck, 6.2, 0.14, 0.16);
    addVoxel(4.4, 2.80, 20.6, mats.gardenDeck, 6.2, 0.14, 0.16);
    for (let bx = 2.2; bx <= 6.8; bx += 1.4) {
      addVoxel(bx, 2.90, 18.5, mats.gardenDeck, 0.14, 0.14, 4.4);
    }
    // Festive warm bistro Edison string light bulbs hanging under beams
    for (let lx = 2.5; lx <= 6.5; lx += 1.0) {
      addVoxel(lx, 2.65, 17.4, mats.bistroLightGlow, 0.10, 0.12, 0.10, false);
      addVoxel(lx, 2.65, 19.6, mats.bistroLightGlow, 0.10, 0.12, 0.10, false);
    }
    const gardenLight = new THREE.PointLight(0xfef3c7, 2.2, 9, 1.8);
    gardenLight.position.set(4.5, 2.6, 18.5);
    scene.add(gardenLight);

    // 6. Lush Potted Birds of Paradise, Tropical Palm & Cedar Planter Boxes
    addVoxel(7.2, 0.35, 17.4, mats.gardenDeck, 0.55, 0.70, 1.6);
    addVoxel(7.2, 0.85, 17.4, mats.plantGreen, 0.65, 0.60, 1.7);
    addVoxel(7.2, 1.05, 17.4, mats.espressoRed, 0.18, 0.25, 0.18); // Exotic blooms
    addVoxel(7.2, 0.35, 19.8, mats.gardenDeck, 0.55, 0.70, 1.6);
    addVoxel(7.2, 0.85, 19.8, mats.plantGreen, 0.65, 0.60, 1.7);
    addVoxel(7.2, 1.05, 19.8, mats.goldAccent, 0.18, 0.25, 0.18);
    // Corner tall tropical palm in terracotta pot
    addVoxel(1.8, 0.40, 20.2, mats.potOrange, 0.7, 0.8, 0.7);
    addVoxel(1.8, 1.45, 20.2, mats.plantGreen, 1.4, 1.6, 1.4);

    // =========================================================================
    // 0. Complete Exterior Building Perimeter Architecture (Unified Flush 2.40m Height)
    // 100% True Rectangle: North/South = 37.55m, East/West = 20.60m, all 4 corners 90°
    // =========================================================================

    // A. North Perimeter Wall (z = 0.45, x: 0.45..38.00 - Total width: 37.55m)
    // Northwest Corner Structural Pillar (x = 0.45, z = 0.45)
    addVoxelToGroup(northWallGroup, 0.45, 1.10, 0.45, mats.doorJambDark, 0.24, 2.20, 0.24);
    addVoxelToGroup(northWallGroup, 0.45, 2.30, 0.45, mats.wallTrim, 0.26, 0.20, 0.26);
    addVoxelToGroup(northWallGroup, 0.45, 0.08, 0.45, mats.wallTrim, 0.26, 0.16, 0.26);
    // Northeast Corner Structural Pillar (x = 38.00, z = 0.45)
    addVoxelToGroup(northWallGroup, 38.0, 1.10, 0.45, mats.doorJambDark, 0.24, 2.20, 0.24);
    addVoxelToGroup(northWallGroup, 38.0, 2.30, 0.45, mats.wallTrim, 0.26, 0.20, 0.26);
    addVoxelToGroup(northWallGroup, 38.0, 0.08, 0.45, mats.wallTrim, 0.26, 0.16, 0.26);

    // CEO Executive Suite North Wall (x: 0.45..10.0)
    addVoxelToGroup(northWallGroup, 5.225, 1.10, 0.45, mats.ceoNavyFloor, 9.55, 2.20, 0.20);
    addVoxelToGroup(northWallGroup, 5.225, 2.30, 0.45, mats.wallTrim, 9.55, 0.20, 0.24);
    addVoxelToGroup(northWallGroup, 5.225, 0.08, 0.45, mats.wallTrim, 9.55, 0.16, 0.24);

    // Bullpen Workspace North Wall (x: 10.0..26.0, width = 16.0m)
    addVoxelToGroup(northWallGroup, 18.0, 1.10, 0.45, mats.whiteDesk, 16.0, 2.20, 0.20);
    addVoxelToGroup(northWallGroup, 18.0, 2.30, 0.45, mats.wallTrim, 16.0, 0.20, 0.24);
    addVoxelToGroup(northWallGroup, 18.0, 0.08, 0.45, mats.wallTrim, 16.0, 0.16, 0.24);
    // Bullpen "AVERO HQ" title plaque (Centered on Bullpen North Wall at x = 18.0)
    northPlaqueBg = addVoxelToGroup(northWallGroup, 18.0, 1.95, 0.56, mats.wallTrim, 4.2, 0.35, 0.03);
    northPlaqueGold = addVoxelToGroup(northWallGroup, 18.0, 1.95, 0.58, averoBuildingMat, 4.0, 0.28, 0.01, false);

    // North Wall / Divider Structural Junction Post at x = 26.0, z = 0.45
    addVoxelToGroup(northWallGroup, 26.0, 1.10, 0.45, mats.doorJambDark, 0.24, 2.20, 0.24);
    addVoxelToGroup(northWallGroup, 26.0, 2.30, 0.45, mats.wallTrim, 0.26, 0.20, 0.26);
    addVoxelToGroup(northWallGroup, 26.0, 0.08, 0.45, mats.wallTrim, 0.26, 0.16, 0.26);

    // Server Room North Perimeter Security Vault Wall (x: 26.0..38.0, width = 12.0m)
    addVoxelToGroup(northWallGroup, 32.0, 1.10, 0.45, mats.doorFrameDark, 12.0, 2.20, 0.20);
    addVoxelToGroup(northWallGroup, 32.0, 2.30, 0.45, mats.wallTrim, 12.0, 0.20, 0.24);
    addVoxelToGroup(northWallGroup, 32.0, 0.08, 0.45, mats.wallTrim, 12.0, 0.16, 0.24);

    // B. West Perimeter Wall (x = 0.45)
    // CEO Suite & Gourmet Pantry Solid Architectural Wall section (z: 0.45..16.00 - Total indoor length: 15.55m)
    addVoxelToGroup(westWallGroup, 0.45, 0.08, 8.225, mats.wallTrim, 0.24, 0.16, 15.55);
    addVoxelToGroup(westWallGroup, 0.45, 2.30, 8.225, mats.wallTrim, 0.24, 0.20, 15.55);
    addVoxelToGroup(westWallGroup, 0.45, 1.10, 8.225, mats.doorFrameDark, 0.20, 2.20, 15.55);
    // Terminal indoor structural post where kitchen ends at x = 0.45, z = 16.00
    addVoxelToGroup(westWallGroup, 0.45, 1.10, 16.0, mats.doorJambDark, 0.24, 2.20, 0.24);
    addVoxelToGroup(westWallGroup, 0.45, 2.30, 16.0, mats.wallTrim, 0.26, 0.20, 0.26);
    addVoxelToGroup(westWallGroup, 0.45, 0.08, 16.0, mats.wallTrim, 0.26, 0.16, 0.26);
    // Outdoor Zen Garden West Balustrade (z: 16.00..21.05, length = 5.05m) - NO FIREWALL, Authentic Outdoor Terrace!
    addVoxelToGroup(westWallGroup, 0.45, 0.55, 18.525, mats.glassWall, 0.10, 1.10, 5.05);
    addVoxelToGroup(westWallGroup, 0.45, 1.12, 18.525, mats.chairChrome, 0.14, 0.05, 5.05);
    addVoxelToGroup(westWallGroup, 0.45, 0.04, 18.525, mats.wallTrim, 0.16, 0.08, 5.05);
    // Exterior Solid Foundation Facade below west balustrade (Zero Z-Fighting, Zero Glitching)
    addVoxelToGroup(westWallGroup, 0.44, -0.50, 18.525, mats.wallTrim, 0.10, 1.00, 5.05, false);
    for (let rz = 17.5; rz <= 20.0; rz += 1.25) {
      addVoxelToGroup(westWallGroup, 0.45, 0.56, rz, mats.chairChrome, 0.08, 1.12, 0.08);
    }

    // C. East Perimeter Wall (x = 38.00, z: 0.45..21.05 - Total length: 20.60m)
    // Continuous baseboard and top lintel spanning full 20.60m length
    addVoxelToGroup(eastWallGroup, 38.0, 0.08, 10.75, mats.wallTrim, 0.24, 0.16, 20.60);
    addVoxelToGroup(eastWallGroup, 38.0, 2.30, 10.75, mats.wallTrim, 0.24, 0.20, 20.60);
    // Server Room Vault Section (z: 0.45..11.00)
    addVoxelToGroup(eastWallGroup, 38.0, 1.10, 5.725, mats.serverRackDark, 0.20, 2.20, 10.55);
    // East wall heavy-duty cable trunk & cyber telemetry conduit
    eastCableTray = addVoxelToGroup(eastWallGroup, 37.88, 1.70, 5.725, mats.serverCableTray, 0.06, 0.16, 8.4);
    eastCableGlow = addVoxelToGroup(eastWallGroup, 37.84, 1.70, 5.725, mats.serverCableGlow, 0.03, 0.06, 8.2, false);

    // D. South Perimeter Wall & Windows (z = 21.05)
    // Indoor South Perimeter Floor-to-Ceiling Windows (x: 8.00..38.00, width = 30.00m)
    addVoxelToGroup(southWallGroup, 23.0, 0.08, 21.05, mats.wallTrim, 30.0, 0.16, 0.24);
    addVoxelToGroup(southWallGroup, 23.0, 2.30, 21.05, mats.wallTrim, 30.0, 0.20, 0.24);
    addVoxelToGroup(southWallGroup, 23.0, 1.10, 21.05, mats.glassWall, 30.0, 2.20, 0.12);
    // Architectural vertical mullions every 2.0m across indoor south facade
    for (let mx = 10.0; mx <= 36.0; mx += 2.0) {
      addVoxelToGroup(southWallGroup, mx, 1.10, 21.05, mats.doorJambDark, 0.08, 2.20, 0.16);
    }
    // Structural transition junction pillar at x = 8.0, z = 21.05 where indoor building meets outdoor terrace
    addVoxelToGroup(southWallGroup, 8.0, 1.10, 21.05, mats.doorJambDark, 0.24, 2.20, 0.24);
    addVoxelToGroup(southWallGroup, 8.0, 2.30, 21.05, mats.wallTrim, 0.26, 0.20, 0.26);
    addVoxelToGroup(southWallGroup, 8.0, 0.08, 21.05, mats.wallTrim, 0.26, 0.16, 0.26);
    // Southeast Corner Structural Pillar (x = 38.00, z = 21.05)
    addVoxelToGroup(southWallGroup, 38.0, 1.10, 21.05, mats.doorJambDark, 0.24, 2.20, 0.24);
    addVoxelToGroup(southWallGroup, 38.0, 2.30, 21.05, mats.wallTrim, 0.26, 0.20, 0.26);
    addVoxelToGroup(southWallGroup, 38.0, 0.08, 21.05, mats.wallTrim, 0.26, 0.16, 0.26);

    // Outdoor Zen Garden South Balustrade (x: 0.45..8.00, width = 7.55m) - NO FIREWALL, Authentic Open Balustrade!
    addVoxelToGroup(southWallGroup, 4.225, 0.55, 21.05, mats.glassWall, 7.55, 1.10, 0.10);
    addVoxelToGroup(southWallGroup, 4.225, 1.12, 21.05, mats.chairChrome, 7.55, 0.05, 0.14);
    addVoxelToGroup(southWallGroup, 4.225, 0.04, 21.05, mats.wallTrim, 7.55, 0.08, 0.16);
    // Exterior Solid Foundation Facade below south balustrade (Zero Z-Fighting, Zero Glitching)
    addVoxelToGroup(southWallGroup, 4.225, -0.50, 21.06, mats.wallTrim, 7.55, 1.00, 0.10, false);
    // Southwest Corner Chrome Balustrade Post (x = 0.45, z = 21.05)
    addVoxelToGroup(southWallGroup, 0.45, 0.56, 21.05, mats.chairChrome, 0.14, 1.12, 0.14);
    for (let rx = 2.0; rx <= 6.5; rx += 1.5) {
      addVoxelToGroup(southWallGroup, rx, 0.56, 21.05, mats.chairChrome, 0.08, 1.12, 0.08);
    }

    // Clean Architectural Datacenter Overhead LED Light Troffers (Suspended at y = 2.8, centered across 12m room at x = 32.0)
    // Front cold aisle luminaire over server racks
    addVoxel(32.0, 2.82, 3.6, mats.wallTrim, 8.5, 0.06, 0.22);
    addVoxel(32.0, 2.78, 3.6, mats.boardScreen, 8.3, 0.03, 0.16, false);
    // Workstation aisle luminaire over Alex & Zane's desks
    addVoxel(32.0, 2.82, 6.2, mats.wallTrim, 8.5, 0.06, 0.22);
    addVoxel(32.0, 2.78, 6.2, mats.boardScreen, 8.3, 0.03, 0.16, false);

    // Biometric RFID Badge Scanner with glowing LED (Bullpen side facing west)
    addVoxel(25.84, 1.40, 7.6, mats.wallTrim, 0.05, 0.24, 0.14);
    addVoxel(25.81, 1.44, 7.6, mats.serverLedGreen, 0.02, 0.06, 0.08, false); // Active green status
    addVoxel(25.81, 1.34, 7.6, mats.serverLedCyan, 0.02, 0.04, 0.08, false);  // Keypad
    // Security Warning Plaque above doorway
    addVoxel(25.84, 1.95, 6.5, mats.deskTrimBrass, 0.04, 0.18, 1.6);
    addVoxel(25.82, 1.95, 6.5, mats.threatMapBoard, 0.02, 0.14, 1.54);
    addVoxel(25.80, 1.95, 6.5, mats.serverLedGreen, 0.01, 0.06, 1.4, false);

    // 2. 4x 42U Enterprise Server Cabinets (Ultra-Realistic Datacenter Hardware from All Angles!)
    // Spaced along z = 2.0 at x = 27.8, 30.4, 33.0, 35.6
    const serverRacks = OFFICE_3D_LAYOUT.SERVER_ROOM.racks;
    serverRacks.forEach((rack, rIdx) => {
      const rx = rack.x;
      const rz = rack.z;

      // A. Heavy Matte Black Steel Chassis (42U 600mm x 1000mm)
      addVoxel(rx, 1.075, rz, mats.serverRackDark, 1.34, 2.14, 0.88);

      // B. 4x Vertical Corner Structural Posts / 42U Equipment Mounting Rails
      addVoxel(rx - 0.67, 1.075, rz - 0.44, mats.serverRackTrim, 0.06, 2.15, 0.06);
      addVoxel(rx + 0.67, 1.075, rz - 0.44, mats.serverRackTrim, 0.06, 2.15, 0.06);
      addVoxel(rx - 0.67, 1.075, rz + 0.44, mats.serverRackTrim, 0.06, 2.15, 0.06);
      addVoxel(rx + 0.67, 1.075, rz + 0.44, mats.serverRackTrim, 0.06, 2.15, 0.06);

      // C. Heavy-Duty Leveling Feet / Casters at Base Corners
      addVoxel(rx - 0.65, 0.02, rz - 0.42, mats.doorTrackSilver, 0.08, 0.04, 0.08);
      addVoxel(rx + 0.65, 0.02, rz - 0.42, mats.doorTrackSilver, 0.08, 0.04, 0.08);
      addVoxel(rx - 0.65, 0.02, rz + 0.42, mats.doorTrackSilver, 0.08, 0.04, 0.08);
      addVoxel(rx + 0.65, 0.02, rz + 0.42, mats.doorTrackSilver, 0.08, 0.04, 0.08);

      // D. ROOF TOP PANEL (CRITICAL FOR ISOMETRIC & TOP-DOWN VIEWS!)
      // Recessed top ventilation deck
      addVoxel(rx, 2.15, rz, mats.serverFloorGrate, 1.32, 0.02, 0.86);
      // Outer beveled roof perimeter trim
      addVoxel(rx, 2.16, rz - 0.43, mats.serverRackTrim, 1.36, 0.03, 0.04);
      addVoxel(rx, 2.16, rz + 0.43, mats.serverRackTrim, 1.36, 0.03, 0.04);
      addVoxel(rx - 0.66, 2.16, rz, mats.serverRackTrim, 0.04, 0.03, 0.86);
      addVoxel(rx + 0.66, 2.16, rz, mats.serverRackTrim, 0.04, 0.03, 0.86);

      // 4x 140mm Heavy-Duty Exhaust Fan Blowers in 2x2 grid on the roof!
      const fanOffsets = [
        { fx: rx - 0.32, fz: rz - 0.18 },
        { fx: rx + 0.32, fz: rz - 0.18 },
        { fx: rx - 0.32, fz: rz + 0.18 },
        { fx: rx + 0.32, fz: rz + 0.18 },
      ];
      fanOffsets.forEach((fan) => {
        // Recessed circular fan well
        addVoxel(fan.fx, 2.16, fan.fz, mats.doorSealDark, 0.34, 0.015, 0.34);
        // Central fan hub with subtle cooling air flow glow
        addVoxel(fan.fx, 2.165, fan.fz, mats.serverFanHub, 0.14, 0.02, 0.14, false);
        // Cross protective grill spokes
        addVoxel(fan.fx, 2.162, fan.fz, mats.serverRackTrim, 0.30, 0.01, 0.04);
        addVoxel(fan.fx, 2.162, fan.fz, mats.serverRackTrim, 0.04, 0.01, 0.30);
      });
      // Top Cable Brush Entry Grommets (rear of roof)
      addVoxel(rx, 2.165, rz - 0.34, mats.doorSealDark, 0.42, 0.02, 0.10);

      // E. REAR CABINET (LOOKING NORTH TOWARDS WALL - CRITICAL FOR CAMERA ANGLE!)
      // Perforated honeycomb mesh rear door
      addVoxel(rx, 1.075, rz - 0.45, mats.serverRackDoor, 1.28, 2.06, 0.02);
      // Rear door industrial latch handle
      addVoxel(rx + 0.54, 1.05, rz - 0.47, mats.doorTrackSilver, 0.04, 0.16, 0.03);

      // Dual Vertical Zero-U Power Distribution Units (PDUs) mounted inside rear posts
      // PDU A (Left rear post)
      addVoxel(rx - 0.58, 1.075, rz - 0.42, mats.serverPduChassis, 0.08, 1.95, 0.05);
      // PDU B (Right rear post)
      addVoxel(rx + 0.58, 1.075, rz - 0.42, mats.serverPduChassis, 0.08, 1.95, 0.05);
      // PDU Digital Load Readout Displays (Amber / Green)
      addVoxel(rx - 0.58, 1.85, rz - 0.45, mats.serverLedAmber, 0.05, 0.06, 0.01, false);
      addVoxel(rx + 0.58, 1.85, rz - 0.45, mats.serverLedGreen, 0.05, 0.06, 0.01, false);
      // C13/C19 Outlet Bank status indicators along PDU height
      for (let ob = 0; ob < 4; ob++) {
        const oy = 0.45 + ob * 0.38;
        addVoxel(rx - 0.58, oy, rz - 0.45, mats.serverLedCyan, 0.04, 0.04, 0.01, false);
        addVoxel(rx + 0.58, oy, rz - 0.45, mats.serverLedGreen, 0.04, 0.04, 0.01, false);
      }
      // Bundled black heavy-duty PDU drop cables running vertically
      addVoxel(rx - 0.62, 1.075, rz - 0.40, mats.doorSealDark, 0.04, 2.0, 0.04);
      addVoxel(rx + 0.62, 1.075, rz - 0.40, mats.doorSealDark, 0.04, 2.0, 0.04);

      // F. SIDE PANELS (LOOKING EAST / WEST)
      // Embossed cooling vents
      addVoxel(rx - 0.68, 1.075, rz, mats.serverMeshGrill, 0.01, 1.90, 0.60);
      addVoxel(rx + 0.68, 1.075, rz, mats.serverMeshGrill, 0.01, 1.90, 0.60);
      // Industrial cabinet stencil badge
      addVoxel(rx - 0.685, 1.90, rz, mats.threatMapBoard, 0.01, 0.12, 0.40);
      addVoxel(rx - 0.686, 1.90, rz, mats.serverLedCyan, 0.01, 0.04, 0.36, false);

      // G. FRONT FACE (LOOKING SOUTH INTO SERVER ROOM)
      // Perforated smoked glass / lockable door
      addVoxel(rx, 1.075, rz + 0.45, mats.doorGlass, 1.28, 2.06, 0.02);
      // Brushed titanium front door handle
      addVoxel(rx + 0.54, 1.05, rz + 0.47, mats.doorTrackSilver, 0.04, 0.18, 0.03);

      // Illuminated OLED Header Marquee with rack name
      addVoxel(rx, 2.08, rz + 0.44, mats.threatMapBoard, 1.24, 0.10, 0.03);
      addVoxel(rx, 2.08, rz + 0.46, mats.serverLedCyan, 1.16, 0.05, 0.01, false);

      // H. HETEROGENEOUS ENTERPRISE HARDWARE TIERS (Inside Rack)
      // Tier 1: 2x 1U 100GbE Cisco Spine Switches (Top, Units 39-42)
      addVoxel(rx, 1.94, rz + 0.40, mats.serverRackDark, 1.22, 0.08, 0.05);
      addVoxel(rx, 1.84, rz + 0.40, mats.serverRackDark, 1.22, 0.08, 0.05);
      // 48x SFP+/QSFP fiber ports with dense blinking LEDs
      addVoxel(rx - 0.25, 1.94, rz + 0.43, mats.serverLedCyan, 0.55, 0.03, 0.01, false);
      addVoxel(rx + 0.30, 1.94, rz + 0.43, mats.serverLedGreen, 0.45, 0.03, 0.01, false);
      addVoxel(rx - 0.25, 1.84, rz + 0.43, mats.serverLedGreen, 0.55, 0.03, 0.01, false);
      addVoxel(rx + 0.30, 1.84, rz + 0.43, mats.serverLedCyan, 0.45, 0.03, 0.01, false);
      // Looped fiber patch cords
      addVoxel(rx - 0.54, 1.89, rz + 0.43, mats.fiberAqua, 0.05, 0.14, 0.03, false);
      addVoxel(rx + 0.54, 1.89, rz + 0.43, mats.fiberOrange, 0.05, 0.14, 0.03, false);

      // Tier 2: 1U KVM Rack Console Drawer (Units 35-36)
      addVoxel(rx, 1.72, rz + 0.41, mats.crashCartSteel, 1.22, 0.05, 0.06);
      addVoxel(rx, 1.72, rz + 0.44, mats.serverLedGreen, 0.25, 0.02, 0.01, false);

      // Tier 3: 2x 4U NVIDIA DGX Supercomputing AI Nodes (Units 21-32)
      // DGX Node A
      addVoxel(rx, 1.48, rz + 0.39, mats.serverRackDark, 1.22, 0.24, 0.08);
      addVoxel(rx - 0.56, 1.48, rz + 0.44, mats.doorTrackSilver, 0.04, 0.16, 0.03); // Left handle
      addVoxel(rx + 0.56, 1.48, rz + 0.44, mats.doorTrackSilver, 0.04, 0.16, 0.03); // Right handle
      addVoxel(rx, 1.48, rz + 0.42, mats.serverMeshGrill, 0.95, 0.18, 0.01);
      addVoxel(rx - 0.20, 1.54, rz + 0.43, mats.serverLedGreen, 0.35, 0.02, 0.01, false);
      addVoxel(rx + 0.20, 1.54, rz + 0.43, mats.serverLedCyan, 0.35, 0.02, 0.01, false);

      // DGX Node B
      addVoxel(rx, 1.21, rz + 0.39, mats.serverRackDark, 1.22, 0.24, 0.08);
      addVoxel(rx - 0.56, 1.21, rz + 0.44, mats.doorTrackSilver, 0.04, 0.16, 0.03); // Left handle
      addVoxel(rx + 0.56, 1.21, rz + 0.44, mats.doorTrackSilver, 0.04, 0.16, 0.03); // Right handle
      addVoxel(rx, 1.21, rz + 0.42, mats.serverMeshGrill, 0.95, 0.18, 0.01);
      addVoxel(rx - 0.20, 1.27, rz + 0.43, mats.serverLedAmber, 0.35, 0.02, 0.01, false);
      addVoxel(rx + 0.20, 1.27, rz + 0.43, mats.serverLedGreen, 0.35, 0.02, 0.01, false);

      // Tier 4: Enterprise SAN 24-Bay NVMe Storage Shelves (Units 9-20)
      // Storage Shelf 1
      addVoxel(rx, 0.89, rz + 0.39, mats.serverRackDark, 1.22, 0.20, 0.08);
      addVoxel(rx, 0.89, rz + 0.42, mats.serverDriveCaddy, 1.10, 0.16, 0.02);
      addVoxel(rx - 0.25, 0.93, rz + 0.44, mats.serverLedGreen, 0.50, 0.025, 0.01, false);
      addVoxel(rx + 0.25, 0.93, rz + 0.44, mats.serverLedAmber, 0.50, 0.025, 0.01, false);
      addVoxel(rx - 0.25, 0.85, rz + 0.44, mats.serverLedGreen, 0.50, 0.025, 0.01, false);
      addVoxel(rx + 0.25, 0.85, rz + 0.44, mats.serverLedCyan, 0.50, 0.025, 0.01, false);

      // Storage Shelf 2
      addVoxel(rx, 0.66, rz + 0.39, mats.serverRackDark, 1.22, 0.18, 0.08);
      addVoxel(rx, 0.66, rz + 0.42, mats.serverDriveCaddy, 1.10, 0.14, 0.02);
      addVoxel(rx - 0.25, 0.70, rz + 0.44, mats.serverLedGreen, 0.50, 0.025, 0.01, false);
      addVoxel(rx + 0.25, 0.70, rz + 0.44, mats.serverLedGreen, 0.50, 0.025, 0.01, false);

      // Tier 5: 3U Online Double-Conversion UPS Backup Battery Unit (Units 1-8)
      addVoxel(rx, 0.28, rz + 0.39, mats.doorFrameDark, 1.22, 0.38, 0.08);
      // Digital LCD status display ("100% ONLINE // 48.2V")
      addVoxel(rx - 0.32, 0.36, rz + 0.43, mats.serverLedCyan, 0.28, 0.08, 0.01, false);
      // Heavy-duty test switches & status LEDs
      addVoxel(rx + 0.30, 0.36, rz + 0.43, mats.serverLedGreen, 0.12, 0.04, 0.01, false);
      addVoxel(rx + 0.45, 0.36, rz + 0.43, mats.serverLedAmber, 0.08, 0.04, 0.01, false);
    });

    // 3. Overhead High-Capacity Yellow Fiber Duct Raceway ("Fiber Runner") System
    // Spans continuously across all 4 racks from x = 27.0 to 36.4 at y = 2.22, z = 2.0
    addVoxel(31.7, 2.22, 2.0, mats.fiberDuctYellow, 9.8, 0.08, 0.42);
    addVoxel(31.7, 2.27, 2.0, mats.fiberDuctCover, 9.7, 0.02, 0.40);
    // Ceiling trapeze support brackets every 1.6m
    for (let bx = 27.2; bx <= 36.2; bx += 1.6) {
      addVoxel(bx, 2.33, 2.0, mats.crashCartSteel, 0.05, 0.14, 0.44);
    }
    // High-density glowing OM4 fiber trunks running inside raceway
    addVoxel(31.7, 2.24, 1.94, mats.fiberAqua, 9.6, 0.025, 0.06, false);
    addVoxel(31.7, 2.24, 2.00, mats.fiberOrange, 9.6, 0.025, 0.06, false);
    addVoxel(31.7, 2.24, 2.06, mats.serverLedGreen, 9.6, 0.025, 0.06, false);
    // Yellow vertical drop funnels (spillways) feeding fiber into top of each rack
    serverRacks.forEach((rack) => {
      addVoxel(rack.x, 2.19, 2.0, mats.fiberDuctYellow, 0.22, 0.06, 0.22);
      addVoxel(rack.x, 2.18, 1.95, mats.fiberAqua, 0.06, 0.06, 0.06, false);
      addVoxel(rack.x, 2.18, 2.05, mats.fiberOrange, 0.06, 0.06, 0.06, false);
    });

    // 4. Industrial In-Row CRAC (Computer Room Air Conditioning) Chiller Unit (East Wall at x = 37.3, z = 4.5)
    addVoxel(37.3, 1.10, 4.5, mats.cracChillerBody, 0.85, 2.20, 1.20);
    // Front service door facing west (-x)
    addVoxel(36.86, 1.10, 4.5, mats.doorSealDark, 0.03, 2.10, 1.14);
    // Dual vertical cooling airflow intake louvers
    addVoxel(36.84, 0.70, 4.5, mats.cracChillerLouver, 0.02, 0.90, 0.95);
    addVoxel(36.84, 1.55, 4.5, mats.cracChillerLouver, 0.02, 0.60, 0.95);
    // Digital HVAC Climate Control Panel (Displaying 18.5°C | 45% RH)
    addVoxel(36.84, 1.95, 4.5, mats.cracChillerColdGlow, 0.02, 0.12, 0.45, false);
    addVoxel(36.84, 1.95, 4.15, mats.serverLedGreen, 0.02, 0.04, 0.04, false);

    // 5. FM-200 Fire Suppression Clean Agent System (North Wall at x = 26.8, z = 0.8)
    // Dual pressurized red cylinders
    addVoxel(26.65, 0.95, 0.85, mats.fireCylinderRed, 0.32, 1.50, 0.32);
    addVoxel(27.05, 0.95, 0.85, mats.fireCylinderRed, 0.32, 1.50, 0.32);
    // Brass distribution manifold & overhead release pipe
    addVoxel(26.85, 1.80, 0.85, mats.fireManifoldBrass, 0.75, 0.08, 0.08);
    addVoxel(26.85, 2.05, 0.85, mats.fireManifoldBrass, 0.08, 0.42, 0.08);
    // Analog pressure gauges (Green nominal zone)
    addVoxel(26.65, 1.75, 0.70, mats.serverLedGreen, 0.08, 0.08, 0.02, false);
    addVoxel(27.05, 1.75, 0.70, mats.serverLedGreen, 0.08, 0.08, 0.02, false);

    // 6. Massive SOC Cyber Threat Map Wall Array (North Wall Center: x = 32.0, z = 0.8, flush under 2.40m lintel)
    const tmPos = OFFICE_3D_LAYOUT.SERVER_ROOM.threatMap;
    // Dark matte stealth wall bezel
    addVoxel(tmPos.x, 1.48, tmPos.z, mats.wallTrim, 4.8, 1.25, 0.08);
    // Deep emerald cyber matrix glass background
    addVoxel(tmPos.x, 1.48, tmPos.z + 0.04, mats.threatMapBoard, 4.65, 1.15, 0.02);

    // Illuminated Vector World Continents (Stylized voxel representation)
    // North America & South America
    addVoxel(tmPos.x - 1.3, 1.60, tmPos.z + 0.06, mats.threatMapGlow, 0.9, 0.38, 0.01, false);
    addVoxel(tmPos.x - 1.1, 1.30, tmPos.z + 0.06, mats.threatMapGlow, 0.6, 0.32, 0.01, false);
    // Europe & Africa
    addVoxel(tmPos.x - 0.1, 1.66, tmPos.z + 0.06, mats.threatMapGlow, 0.7, 0.30, 0.01, false);
    addVoxel(tmPos.x - 0.05, 1.35, tmPos.z + 0.06, mats.threatMapGlow, 0.65, 0.40, 0.01, false);
    // Asia & Pacific
    addVoxel(tmPos.x + 1.15, 1.64, tmPos.z + 0.06, mats.threatMapGlow, 1.2, 0.38, 0.01, false);
    addVoxel(tmPos.x + 1.45, 1.26, tmPos.z + 0.06, mats.threatMapGlow, 0.6, 0.24, 0.01, false);

    // Glowing Threat Attack Vector Arcs & Warning Beacons (Intercepted in real-time)
    addVoxel(tmPos.x - 0.7, 1.58, tmPos.z + 0.07, mats.threatMapThreat, 0.45, 0.03, 0.01, false);
    addVoxel(tmPos.x + 0.5, 1.50, tmPos.z + 0.07, mats.threatMapThreat, 0.65, 0.03, 0.01, false);
    addVoxel(tmPos.x, 1.50, tmPos.z + 0.07, mats.serverLedGreen, 0.14, 0.14, 0.01, false); // Target enterprise shield node
    // Top Threat Status Banner
    addVoxel(tmPos.x, 2.05, tmPos.z + 0.06, mats.threatMapGlow, 3.8, 0.06, 0.01, false);

    // 7. Mobile Diagnostic Crash Cart (x = 27.2, z = 4.5)
    const cartPos = OFFICE_3D_LAYOUT.SERVER_ROOM.crashCart;
    // Rolling caster legs
    addVoxel(cartPos.x - 0.40, 0.08, cartPos.z - 0.30, mats.wallTrim, 0.08, 0.16, 0.08);
    addVoxel(cartPos.x + 0.40, 0.08, cartPos.z - 0.30, mats.wallTrim, 0.08, 0.16, 0.08);
    addVoxel(cartPos.x - 0.40, 0.08, cartPos.z + 0.30, mats.wallTrim, 0.08, 0.16, 0.08);
    addVoxel(cartPos.x + 0.40, 0.08, cartPos.z + 0.30, mats.wallTrim, 0.08, 0.16, 0.08);
    // Lower shelf & power unit
    addVoxel(cartPos.x, 0.20, cartPos.z, mats.crashCartSteel, 0.95, 0.06, 0.75);
    addVoxel(cartPos.x, 0.32, cartPos.z, mats.serverRackDark, 0.70, 0.18, 0.50);
    // Upright stainless corner struts
    addVoxel(cartPos.x - 0.42, 0.65, cartPos.z - 0.32, mats.crashCartSteel, 0.06, 0.85, 0.06);
    addVoxel(cartPos.x + 0.42, 0.65, cartPos.z - 0.32, mats.crashCartSteel, 0.06, 0.85, 0.06);
    addVoxel(cartPos.x - 0.42, 0.65, cartPos.z + 0.32, mats.crashCartSteel, 0.06, 0.85, 0.06);
    addVoxel(cartPos.x + 0.42, 0.65, cartPos.z + 0.32, mats.crashCartSteel, 0.06, 0.85, 0.06);
    // Working tabletop
    addVoxel(cartPos.x, 0.98, cartPos.z, mats.crashCartSteel, 0.98, 0.05, 0.78);
    // Pull-out KVM keyboard tray
    addVoxel(cartPos.x, 0.91, cartPos.z + 0.15, mats.wallTrim, 0.75, 0.03, 0.35);
    addVoxel(cartPos.x, 0.93, cartPos.z + 0.15, mats.screenCode, 0.65, 0.015, 0.22);
    // Diagnostic Terminal Display facing south (+z)
    addVoxel(cartPos.x, 1.30, cartPos.z - 0.15, mats.wallTrim, 0.78, 0.56, 0.06);
    addVoxel(cartPos.x, 1.30, cartPos.z - 0.12, mats.crashCartScreen, 0.72, 0.50, 0.02);
    // Diagnostic coiled cable linking crash cart (x = 27.2, z = 4.5) to Rack 1 (x = 27.8, z = 2.0)
    addVoxel(27.5, 0.95, 3.25, mats.serverCableGlow, 0.06, 0.06, 2.5, false);

    // 8. Central DevOps & SecOps Command Console Bridge (Connecting Alex & Zane's workstations)
    // Sits at x = 31.3, z = 7.2 between Alex (x = 28.8) and Zane (x = 33.8)
    addVoxel(31.3, 0.72, 7.2, mats.deskMatBlack, 1.8, 0.06, 1.1);
    addVoxel(31.3, 0.36, 7.2, mats.deskTrimBrass, 0.08, 0.72, 0.08); // Support pedestal
    // 100GbE High-Speed Fiber Optic Distribution Switch & Patch Bay
    addVoxel(31.3, 0.82, 7.0, mats.serverRackDark, 1.5, 0.14, 0.45);
    addVoxel(31.3, 0.82, 7.23, mats.serverRackDoor, 1.4, 0.10, 0.02);
    // Dynamic pulsing LEDs across switch channels
    addVoxel(30.8, 0.82, 7.24, mats.serverLedGreen, 0.35, 0.04, 0.01, false);
    addVoxel(31.3, 0.82, 7.24, mats.serverLedCyan, 0.35, 0.04, 0.01, false);
    addVoxel(31.8, 0.82, 7.24, mats.serverLedAmber, 0.35, 0.04, 0.01, false);
    // Glowing fiber trunk running directly from switch into overhead yellow raceway at z = 2.0
    addVoxel(31.3, 1.75, 4.6, mats.serverCableGlow, 0.06, 0.06, 5.2, false);

    // --- 7. Spawn the 10 3D Characters (Dylan Ramos CEO + 9 Specialized Autonomous Agents) ---
    const characters: Record<string, VoxelCharacter3D> = {
      dylan: new VoxelCharacter3D(
        'dylan',
        'Dylan Ramos',
        0x1e1b4b, // Designer dark navy suit
        0x5c3a21, // Styled brown hair
        OFFICE_3D_LAYOUT.CEO.chair.x,
        OFFICE_3D_LAYOUT.CEO.chair.z,
        OFFICE_3D_LAYOUT.CEO.chair.x,
        OFFICE_3D_LAYOUT.CEO.chair.z,
        OFFICE_3D_LAYOUT.BOARDROOM.seats.dylan.x,
        OFFICE_3D_LAYOUT.BOARDROOM.seats.dylan.z
      ),
      // CEO Suite Permanent Resident: Dylan's Partner Eah Ilagan (Seated beside the Cabinet)
      eah: new VoxelCharacter3D(
        'eah',
        'Eah Ilagan',
        0xfb7185, // Soft blush rose top
        0x1c1917, // Silky dark hair
        OFFICE_3D_LAYOUT.CEO.eahSeat.x,
        OFFICE_3D_LAYOUT.CEO.eahSeat.z,
        OFFICE_3D_LAYOUT.CEO.eahSeat.x,
        OFFICE_3D_LAYOUT.CEO.eahSeat.z,
        OFFICE_3D_LAYOUT.CEO.eahSeat.x,
        OFFICE_3D_LAYOUT.CEO.eahSeat.z
      ),
      // Row 1 (AI Researcher, Designer, COO)
      ray: new VoxelCharacter3D(
        'ray',
        'Ray (Researcher)',
        0x0284c7, // Tech blue
        0x3e2723, // Brown hair
        OFFICE_3D_LAYOUT.DESKS.ray.chair.x,
        OFFICE_3D_LAYOUT.DESKS.ray.chair.z,
        OFFICE_3D_LAYOUT.DESKS.ray.chair.x,
        OFFICE_3D_LAYOUT.DESKS.ray.chair.z,
        OFFICE_3D_LAYOUT.BOARDROOM.seats.ray.x,
        OFFICE_3D_LAYOUT.BOARDROOM.seats.ray.z
      ),
      maya: new VoxelCharacter3D(
        'maya',
        'Maya (Designer)',
        0xdb2777, // Magenta pink
        0x4a044e, // Plum styled bob
        OFFICE_3D_LAYOUT.DESKS.maya.chair.x,
        OFFICE_3D_LAYOUT.DESKS.maya.chair.z,
        OFFICE_3D_LAYOUT.DESKS.maya.chair.x,
        OFFICE_3D_LAYOUT.DESKS.maya.chair.z,
        OFFICE_3D_LAYOUT.BOARDROOM.seats.maya.x,
        OFFICE_3D_LAYOUT.BOARDROOM.seats.maya.z
      ),
      // Row 1 (Fullstack Developer)
      alex: new VoxelCharacter3D(
        'alex',
        'Alex (Developer)',
        0xea580c, // Dark orange hoodie
        0x1c1917, // Jet black hair
        OFFICE_3D_LAYOUT.DESKS.alex.chair.x,
        OFFICE_3D_LAYOUT.DESKS.alex.chair.z,
        OFFICE_3D_LAYOUT.DESKS.alex.chair.x,
        OFFICE_3D_LAYOUT.DESKS.alex.chair.z,
        OFFICE_3D_LAYOUT.BOARDROOM.seats.alex.x,
        OFFICE_3D_LAYOUT.BOARDROOM.seats.alex.z
      ),

      wendy: new VoxelCharacter3D(
        'wendy',
        'Wendy (Marketing)',
        0x059669, // Emerald green
        0xb45309, // Auburn hair
        OFFICE_3D_LAYOUT.DESKS.wendy.chair.x,
        OFFICE_3D_LAYOUT.DESKS.wendy.chair.z,
        OFFICE_3D_LAYOUT.DESKS.wendy.chair.x,
        OFFICE_3D_LAYOUT.DESKS.wendy.chair.z,
        OFFICE_3D_LAYOUT.BOARDROOM.seats.wendy.x,
        OFFICE_3D_LAYOUT.BOARDROOM.seats.wendy.z
      ),
      zane: new VoxelCharacter3D(
        'zane',
        'Zane (Cyber Sec)',
        0x15803d, // Tactical military green
        0x052e16, // Dark hair
        OFFICE_3D_LAYOUT.DESKS.zane.chair.x,
        OFFICE_3D_LAYOUT.DESKS.zane.chair.z,
        OFFICE_3D_LAYOUT.DESKS.zane.chair.x,
        OFFICE_3D_LAYOUT.DESKS.zane.chair.z,
        OFFICE_3D_LAYOUT.BOARDROOM.seats.zane.x,
        OFFICE_3D_LAYOUT.BOARDROOM.seats.zane.z
      ),
    };

    charactersRef.current = characters;
    if (characters.eah) {
      characters.eah.isSeated = true;
      characters.eah.currentActivity = 'sofa_relax';
      characters.eah.routineTimer = 18;
      characters.eah.eahStep = 'relaxing';
    }
    if (selectedAgentId && characters[selectedAgentId]) {
      characters[selectedAgentId].setSelection(true);
    }

    Object.values(characters).forEach((char) => scene.add(char.group));

    // --- 8. Connect to State & SSE Stream ---
    fetch('/api/state')
      .then((r) => r.json())
      .then((data) => {
        if (!data || !data.agents) return;
        data.agents.forEach((a: any) => {
          const char = characters[a.id];
          if (char) {
            char.status = a.status;
            if (a.bubble_text) {
              char.setSpeech(a.bubble_text, 8.0);
            }
          }
        });
      })
      .catch(() => {});

    const sse = new EventSource('/api/stream');
    sse.addEventListener('agent:status', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        const char = characters[data.agentId];
        if (char) {
          char.setStatus(data.status, data.bubbleText);
          if (char.isSeated && Math.random() < 0.5) {
            char.isSeated = false;
            char.group.position.z = char.deskZ + 0.8;
          }
        }
      } catch {}
    });

    sse.addEventListener('office:meeting:start', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        handleStartDirectiveMeetingRef.current(data);
      } catch {}
    });

    sse.addEventListener('office:meeting:end', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        handleEndDirectiveMeetingRef.current(data);
      } catch {}
    });

    sse.addEventListener('agent:task:completed', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        handleReportToCeoRef.current(data.agentId, data.taskTitle);
      } catch {}
    });

    const onReportEvent = (e: any) => {
      handleReportToCeoRef.current(e.detail?.agentId, e.detail?.taskTitle);
    };
    window.addEventListener('office:report:ceo', onReportEvent);

    // --- 9. Smooth Orbit, Tilt & Pan Camera Controls ---
    const raycaster = new THREE.Raycaster();
    let isDragging = false;
    let dragButton = 0; // 0 = Left (Orbit/Tilt), 2 = Right (Pan)
    let prevMouseX = 0;
    let prevMouseY = 0;
    let downPos = { x: 0, y: 0 };

    const targetCenter = new THREE.Vector3(19.225, 0, 10.75);
    const currentCenter = new THREE.Vector3(19.225, 0, 10.75);
    let targetYaw = Math.PI * 0.25;
    let currentYaw = Math.PI * 0.25;
    let targetPitch = 0.48; // ~27.5° Tilted Cinematic View
    let currentPitch = 0.48;

    cameraControlRef.current = {
      setTilt: (pitchRad: number, mode: 'cinematic' | 'isometric' | 'topdown' | 'front') => {
        if (mode === 'front') {
          // 0° Front Elevation - 100% True Rectangle with perfectly parallel vertical walls (Zero Trapezoid Distortion)
          targetPitch = 0.38;
          targetYaw = 0;
          targetCenter.set(19.225, 0, 10.75);
          camera.zoom = 1.0;
          camera.updateProjectionMatrix();
          addFloatingPopup('📐 FRONT VIEW: 0° True Rectangle (Zero Trapezoid Distortion)', currentCenter.x, 2.8, currentCenter.z, '#00f0ff');
        } else if (mode === 'topdown') {
          // True 90° Top-Down blueprint plan - 100% true 90-degree rectangle with zero distortion!
          targetPitch = Math.PI * 0.5 - 0.0001;
          const step = Math.PI * 0.5;
          targetYaw = Math.round(targetYaw / step) * step;
        } else if (mode === 'isometric') {
          // True 35.264° Isometric - symmetric axonometric projection with 45° diagonal yaw
          targetPitch = 0.6155;
          targetYaw = (Math.round((targetYaw - Math.PI * 0.25) / (Math.PI * 0.5)) * Math.PI * 0.5) + Math.PI * 0.25;
        } else {
          // Cinematic 27.5° Tilt with symmetric 45° corner alignment
          targetPitch = 0.48;
          targetYaw = (Math.round((targetYaw - Math.PI * 0.25) / (Math.PI * 0.5)) * Math.PI * 0.5) + Math.PI * 0.25;
        }
        setTiltMode(mode);
        play8BitGameSound('click');
      },
      rotateBy: (deltaYaw: number) => {
        targetYaw += deltaYaw;
        play8BitGameSound('click');
      },
      snapCardinal: () => {
        // Snap to nearest 90° right angle (0, 90°, 180°, 270°) - guaranteed 100% straight rectangle!
        const step = Math.PI * 0.5;
        targetYaw = Math.round(targetYaw / step) * step;
        play8BitGameSound('click');
        addFloatingPopup('📐 SNAP: True 90° Orthogonal Alignment!', currentCenter.x, 2.8, currentCenter.z, '#00f0ff');
      },
      focusDylan: () => {
        const d = charactersRef.current['dylan'];
        if (d) {
          targetCenter.set(d.group.position.x, 0, d.group.position.z);
          play8BitGameSound('click');
          addFloatingPopup('🎯 CAMERA: Focused on Dylan Ramos (CEO)', d.group.position.x, 2.8, d.group.position.z, '#ffbe0b');
        }
      },
      focusServerRoom: () => {
        targetCenter.set(34.0, 0, 5.5);
        play8BitGameSound('click');
        addFloatingPopup('🛡️ CAMERA: Focused on Cyber Security Server Vault', 34.0, 2.8, 5.5, '#22c55e');
      },
      resetView: () => {
        targetCenter.set(19.225, 0, 10.75);
        targetYaw = Math.PI * 0.25;
        targetPitch = 0.48;
        camera.zoom = 1.0;
        camera.updateProjectionMatrix();
        setTiltMode('cinematic');
        play8BitGameSound('click');
      },
      zoomIn: () => {
        camera.zoom = Math.min(camera.zoom * 1.25, 3.2);
        camera.updateProjectionMatrix();
        addFloatingPopup(`🔍 ZOOM: ${Math.round(camera.zoom * 100)}% (Ultra Sharp)`, currentCenter.x, 2.8, currentCenter.z, '#00f0ff');
        play8BitGameSound('click');
      },
      zoomOut: () => {
        camera.zoom = Math.max(camera.zoom * 0.8, 0.45);
        camera.updateProjectionMatrix();
        addFloatingPopup(`🔍 ZOOM: ${Math.round(camera.zoom * 100)}%`, currentCenter.x, 2.8, currentCenter.z, '#00f0ff');
        play8BitGameSound('click');
      },
    };

    const onPointerDown = (e: MouseEvent) => {
      isDragging = true;
      dragButton = e.button;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      downPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      if (dragButton === 2 || e.shiftKey) {
        // Right-Click Drag or Shift+Left-Drag: Pan in camera ground plane
        const cosY = Math.cos(targetYaw);
        const sinY = Math.sin(targetYaw);
        const rightX = cosY;
        const rightZ = -sinY;
        const forwardX = -sinY;
        const forwardZ = -cosY;

        const panSpeed = 0.04;
        targetCenter.x += (-deltaX * rightX + deltaY * forwardX) * panSpeed;
        targetCenter.z += (-deltaX * rightZ + deltaY * forwardZ) * panSpeed;
      } else {
        // Left-Click Drag: TILT vertically & ORBIT horizontally!
        targetYaw -= deltaX * 0.007;
        // Allow pitch up to 90° true top-down plan view
        targetPitch = Math.max(0.35, Math.min(Math.PI * 0.5 - 0.0001, targetPitch + deltaY * 0.005));
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const onPointerUp = (e: MouseEvent) => {
      isDragging = false;
      const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);

      // If user finished rotating the camera (dragged):
      if (dist >= 6) {
        if (targetPitch > 1.35) {
          // Snap to true 90° top-down plan view
          targetPitch = Math.PI * 0.5 - 0.0001;
          const step = Math.PI * 0.5;
          targetYaw = Math.round(targetYaw / step) * step;
          setTiltMode('topdown');
        } else {
          // If within ~5° of a cardinal or 45° angle, snap exactly to keep lines straight
          const step = Math.PI * 0.25;
          const nearest = Math.round(targetYaw / step) * step;
          if (Math.abs(targetYaw - nearest) < 0.09) {
            targetYaw = nearest;
          }
        }
      }

      if (dist < 6) {
        // Clean Click: Raycast into scene
        const rect = renderer.domElement.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

        const intersects = raycaster.intersectObjects(scene.children, true);
        let clickedAgentId: string | null = null;
        let groundHit: THREE.Vector3 | null = null;

        for (const hit of intersects) {
          let curr: THREE.Object3D | null = hit.object;
          while (curr) {
            if ((curr as any).agentId) {
              clickedAgentId = (curr as any).agentId;
              break;
            }
            curr = curr.parent;
          }
          if (clickedAgentId) break;
          if (!groundHit && hit.point.y < 0.2) {
            groundHit = hit.point;
          }
        }

        if (clickedAgentId) {
          onSelectAgentRef.current?.(clickedAgentId);
          if (clickedAgentId === 'eah') {
            const eahQuotes = [
              'Hi Dylan! ✨ Relaxing on my iPad here. Press [C] if you want breakfast or [B] for hot coffee! ☕🍳',
              "Don't overwork yourself Dylan! Everything is running smoothly at HQ. 💖",
              'I love keeping you company in our executive suite, Dylan ✨',
              'Found some stunning design ideas for our AI agents, Dylan! 💻',
              'Always cheering for you, Dylan! Have some breakfast or coffee with me anytime! ☕✨',
            ];
            const quote = eahQuotes[Math.floor(Math.random() * eahQuotes.length)];
            characters.eah.setSpeech(quote, 5.0);
            addFloatingPopup('✨ TALK WITH EAH ILAGAN! 💖', characters.eah.currentX, 2.8, characters.eah.currentZ, '#fb7185');
            play8BitGameSound('heart');
          } else if (clickedAgentId === 'puppy') {
            const pupX = puppyRef.current ? puppyRef.current.group.position.x : 19.2;
            const pupZ = puppyRef.current ? puppyRef.current.group.position.z : 14.8;
            puppySpeechRef.current = { text: 'Arf arf! 🐶💕 *happy puppy tail wag & kisses for Dylan & Eah*', timer: 5.0 };
            addFloatingPopup('🐶 +150 HAPPINESS! *happy puppy kisses!*', pupX, 1.6, pupZ, '#f59e0b');
            play8BitGameSound('bark');
          } else if (clickedAgentId === 'cat') {
            const catX = catRef.current ? catRef.current.group.position.x : 18.2;
            const catZ = catRef.current ? catRef.current.group.position.z : 18.8;
            catSpeechRef.current = { text: 'Purrrrrrr... Nyaa~ 💕 *Snowy leans in for warm chin scratches & purrs happily*', timer: 5.0 };
            addFloatingPopup('🐱 +150 HAPPINESS! *soft purring & cozy headbonk!*', catX, 1.6, catZ, '#38bdf8');
            play8BitGameSound('meow');
          } else {
            const char = characters[clickedAgentId];
            if (char) {
              addFloatingPopup(`💬 +50 SYNC XP with ${char.name}! ✨`, char.currentX, 2.8, char.currentZ, '#38bdf8');
              play8BitGameSound('coin');
            }
          }
          playSfx('click');
        } else if (groundHit) {
          const pupX = puppyRef.current ? puppyRef.current.group.position.x : OFFICE_3D_LAYOUT.REST_AREA.dogBed.x;
          const pupZ = puppyRef.current ? puppyRef.current.group.position.z : OFFICE_3D_LAYOUT.REST_AREA.dogBed.z;
          const distPuppy = Math.hypot(groundHit.x - pupX, groundHit.z - pupZ);
          const catX = catRef.current ? catRef.current.group.position.x : OFFICE_3D_LAYOUT.REST_AREA.catBed.x;
          const catZ = catRef.current ? catRef.current.group.position.z : OFFICE_3D_LAYOUT.REST_AREA.catBed.z;
          const distCat = Math.hypot(groundHit.x - catX, groundHit.z - catZ);
          if (distPuppy < 1.4) {
            puppySpeechRef.current = { text: 'Arf arf! 🐶💕 *happy puppy kisses & tail wag*', timer: 5.0 };
            addFloatingPopup('🐶 +150 HAPPINESS! *happy puppy kisses!*', pupX, 1.6, pupZ, '#f59e0b');
            play8BitGameSound('bark');
            playSfx('click');
          } else if (distCat < 1.4) {
            catSpeechRef.current = { text: 'Purrrrrrr... Nyaa~ 💕 *Snowy leans in for warm chin scratches & purrs happily*', timer: 5.0 };
            addFloatingPopup('🐱 +150 HAPPINESS! *soft purring & cozy headbonk!*', catX, 1.6, catZ, '#38bdf8');
            play8BitGameSound('meow');
            playSfx('click');
          } else if (!isTileBlocked3D(groundHit.x, groundHit.z)) {
            // Player Click-to-Move for Dylan Ramos in 3D
            const dylan = characters.dylan;
            dylan.walkTo(groundHit.x, groundHit.z);
            setIsDylanSeated(false);
            play8BitGameSound('step');
            playSfx('click');
          }
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.90 : 1.10;
      camera.zoom = Math.max(0.45, Math.min(camera.zoom * zoomFactor, 3.2));
      camera.updateProjectionMatrix();
    };

    // Touch & Pinch-to-Zoom Support for Mobile / Trackpad
    let initialTouchDist = 0;
    let initialZoom = 1.0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialZoom = camera.zoom;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialTouchDist > 0) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = dist / initialTouchDist;
        camera.zoom = Math.max(0.45, Math.min(initialZoom * factor, 3.2));
        camera.updateProjectionMatrix();
      }
    };
    const onTouchEnd = () => {
      initialTouchDist = 0;
    };

    dom.addEventListener('contextmenu', onContextMenu);
    dom.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    dom.addEventListener('touchmove', onTouchMove, { passive: false });
    dom.addEventListener('touchend', onTouchEnd, { passive: true });

    // Keyboard WASD Controls for Dylan in 3D & Eah Interaction Shortcuts
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
        keysPressed.current.add(e.code);
        if (characters.dylan && characters.dylan.dylanStep !== 'idle') {
          characters.dylan.dylanStep = 'idle';
        }
      } else if (e.code === 'KeyF') {
        // [F] Give fresh flowers to Eah ("Just to Be Fair" 💐🌹)
        handleDylanGiveFlowers();
      } else if (e.code === 'KeyG') {
        // [G] Cook warm gourmet meal for Eah ("Just to Be Fair" 🍳🥞)
        handleDylanCookForEah();
      } else if (e.code === 'KeyC') {
        // [C] Ask Eah to cook breakfast for Dylan
        const eah = characters.eah;
        if (eah && eah.eahStep === 'relaxing') {
          eah.eahStep = 'cook_walk';
          eah.isSeated = false;
          eah.currentActivity = 'working';
          eah.setSpeech('Right away Dylan! Cooking fresh breakfast for you! 🍳🥓', 4.5);
          eah.walkTo(4.8, 12.7);
          addFloatingPopup('🍳 Eah Cooking Breakfast! ✨ (+500 ENERGY)', eah.currentX, 2.8, eah.currentZ, '#fb7185');
          play8BitGameSound('quest');
          playSfx('click');
        }
      } else if (e.code === 'KeyB') {
        // [B] Ask Eah to brew coffee for Dylan
        const eah = characters.eah;
        if (eah && eah.eahStep === 'relaxing') {
          eah.eahStep = 'coffee_walk';
          eah.isSeated = false;
          eah.currentActivity = 'working';
          eah.setSpeech('Sure Dylan! Brewing your favorite hot coffee! ☕✨', 4.5);
          eah.walkTo(23.4, 18.6);
          addFloatingPopup('☕ Caramel Latte for Dylan Ramos! ✨ (+350 FOCUS)', eah.currentX, 2.8, eah.currentZ, '#f59e0b');
          play8BitGameSound('quest');
          playSfx('click');
        }
      } else if (e.code === 'KeyE') {
        // [E] Interact: Water dispenser (Bullpen or Boardroom), Server audit if in server vault, Pet puppy if close, or sweet talk with Eah if close
        const dylan = characters.dylan;
        const distBoardroomWater = Math.hypot(dylan.group.position.x - 22.4, dylan.group.position.z - 11.8);
        const distBullpenWater = Math.hypot(dylan.group.position.x - 24.2, dylan.group.position.z - 4.2);
        const inServerVault = dylan.group.position.x > 26.0 && dylan.group.position.z <= 11.5;
        const pupPos = puppyRef.current ? puppyRef.current.group.position : OFFICE_3D_LAYOUT.REST_AREA.dogBed;
        const distPuppy = Math.hypot(dylan.group.position.x - pupPos.x, dylan.group.position.z - pupPos.z);
        const catPos = catRef.current ? catRef.current.group.position : OFFICE_3D_LAYOUT.REST_AREA.catBed;
        const distCat = Math.hypot(dylan.group.position.x - catPos.x, dylan.group.position.z - catPos.z);
        const distArcade = Math.hypot(dylan.group.position.x - 10.2, dylan.group.position.z - 14.65);
        const distEah = characters.eah ? Math.hypot(dylan.group.position.x - characters.eah.group.position.x, dylan.group.position.z - characters.eah.group.position.z) : 999;
        if (distBoardroomWater < 2.0 || distBullpenWater < 2.0) {
          addFloatingPopup('💧 +100 HYDRATION! Ice-cold mineral water! 🧊✨', dylan.group.position.x, 2.8, dylan.group.position.z, '#38bdf8');
          dylan.setSpeech('💧 Grabbing a cup of cold mineral water! Refreshing! ✨', 4.0);
          play8BitGameSound('coin');
          playSfx('click');
        } else if (inServerVault) {
          setIsServerModalOpen(true);
          addFloatingPopup('🛡️ ZERO-TRUST AUDIT: All 4 Server Racks 100% Secure! 🔒', 34.0, 3.2, 5.0, '#00f59b');
          play8BitGameSound('quest');
          playSfx('click');
          if (characters.zane) {
            characters.zane.setSpeech('Zero-trust mainframe terminal online, Boss Dylan! Racks 1-4 active. 🛡️⚡', 6.0);
          }
        } else if (distArcade < 2.2) {
          dylan.walkTo(10.2, 14.65);
          dylan.currentActivity = 'playing_arcade';
          dylan.group.rotation.y = Math.PI;
          play8BitGameSound('quest');
          addFloatingPopup('🕹️ HIGH SCORE: 128,400 PTS! 👾✨', 10.2, 2.6, 14.0, '#ec4899');
          dylan.setSpeech('🕹️ Speedrunning personal best on Retro Arcade! 128,400 pts! 🚀👾', 5.0);
          playSfx('click');
        } else if (distPuppy < 2.5) {
          puppySpeechRef.current = { text: 'Arf arf! 🐶💕 *happy puppy tail wag & kisses for Dylan & Eah*', timer: 5.0 };
          addFloatingPopup('🐶 +150 HAPPINESS! *kisses for Dylan & Eah*', pupPos.x, 1.6, pupPos.z, '#f59e0b');
          play8BitGameSound('bark');
          playSfx('click');
        } else if (distCat < 2.5) {
          const catPos = catRef.current ? catRef.current.group.position : OFFICE_3D_LAYOUT.REST_AREA.catBed;
          catSpeechRef.current = { text: 'Purrrrrrr... Nyaa~ 💕 *Snowy leans in for warm chin scratches & purrs happily*', timer: 5.0 };
          addFloatingPopup('🐱 +150 HAPPINESS! *soft purring & cozy headbonk!*', catPos.x, 1.6, catPos.z, '#38bdf8');
          play8BitGameSound('meow');
          playSfx('click');
        } else if (distEah < 2.8) {
          const quotes = [
            'Hi Dylan! ✨ Always so proud of what we are building!',
            'Need some coffee or a snack Dylan? [Press C] to Cook • [Press B] for Coffee ☕🍳',
            "Keep up the great work as CEO, Dylan! Don't forget to eat and stay hydrated! 💖",
            'You are doing such amazing leadership, Dylan! So proud of you! 👑✨',
          ];
          characters.eah.setSpeech(quotes[Math.floor(Math.random() * quotes.length)], 5.0);
          addFloatingPopup('✨ TALK WITH EAH ILAGAN! 💖', characters.eah.currentX, 2.8, characters.eah.currentZ, '#fb7185');
          play8BitGameSound('heart');
          playSfx('click');
        } else {
          // Check proximity to colleagues
          for (const char of Object.values(characters)) {
            if (char.id !== 'dylan' && char.id !== 'eah') {
              const d = Math.hypot(dylan.group.position.x - char.group.position.x, dylan.group.position.z - char.group.position.z);
              if (d < 2.5) {
                char.setSpeech(`Hey CEO Dylan! Everything is running smoothly on our sprint! 🚀`);
                addFloatingPopup(`💬 +100 SPRINT VELOCITY with ${char.name}! ✨`, char.currentX, 2.8, char.currentZ, '#38bdf8');
                play8BitGameSound('coin');
                break;
              }
            }
          }
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // --- 10. Animation & Routine Loop ---
    let animId: number;
    let lastTime = performance.now();
    let ceoDoorProgress = 0; // 0 = closed, 1 = open
    let boardDoorProgress = 0;
    let serverDoorProgress = 0;
    let meetingDoorProgress = 0;
    let lastCeoDoorState = 0;
    let lastBoardDoorState = 0;
    let lastServerDoorState = 0;
    let lastMeetingDoorState = 0;

    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // --- Smooth Camera Tilt, Orbit & Pan Damping (Lerp) ---
      currentYaw += (targetYaw - currentYaw) * Math.min(1.0, delta * 9.0);
      currentPitch += (targetPitch - currentPitch) * Math.min(1.0, delta * 9.0);
      currentCenter.lerp(targetCenter, Math.min(1.0, delta * 9.0));

      const cosP = Math.cos(currentPitch);
      const sinP = Math.sin(currentPitch);
      const cosY = Math.cos(currentYaw);
      const sinY = Math.sin(currentYaw);

      if (currentPitch > 1.48) {
        // High top-down plan view: set camera up vector to avoid gimbal lock & maintain true 90° orientation
        camera.up.set(-sinY, 0, -cosY);
      } else {
        camera.up.set(0, 1, 0);
      }

      camera.position.set(
        currentCenter.x + cameraRadius * cosP * sinY,
        currentCenter.y + cameraRadius * sinP,
        currentCenter.z + cameraRadius * cosP * cosY
      );
      camera.lookAt(currentCenter.x, currentCenter.y, currentCenter.z);

      // Guarantee all 4 walls maintain uniform architectural height (2.40m) at ALL camera angles
      // Completely eliminates trapezoid slanting, mismatched wall heights, and corner asymmetry!
      northWallGroup.scale.y = 1.0;
      southWallGroup.scale.y = 1.0;
      westWallGroup.scale.y = 1.0;
      eastWallGroup.scale.y = 1.0;

      if (northPlaqueBg) northPlaqueBg.visible = true;
      if (northPlaqueGold) northPlaqueGold.visible = true;
      if (eastCableTray) eastCableTray.visible = true;
      if (eastCableGlow) eastCableGlow.visible = true;

      // Pulse & modulate Server Room Rack LEDs to simulate real active computing
      const sec = time * 0.001;
      mats.serverLedGreen.emissiveIntensity = 0.75 + 0.35 * Math.sin(sec * 10) * (Math.sin(sec * 3.3) > -0.2 ? 1 : 0.4);
      mats.serverLedCyan.emissiveIntensity = 0.70 + 0.35 * Math.cos(sec * 14);
      mats.serverLedAmber.emissiveIntensity = 0.55 + 0.45 * Math.sin(sec * 6);
      mats.serverCableGlow.emissiveIntensity = 0.65 + 0.35 * Math.sin(sec * 5);

      // --- Automatic Door Sensor & Sliding Motion ---
      let ceoActive = false;
      if (Math.hypot(characters.dylan.group.position.x - 10.0, characters.dylan.group.position.z - 8.5) < 2.9) {
        ceoActive = true;
      } else {
        for (const char of Object.values(characters)) {
          if (Math.hypot(char.group.position.x - 10.0, char.group.position.z - 8.5) < 2.7) {
            ceoActive = true;
            break;
          }
        }
      }

      let boardActive = inMeetingModeRef.current;
      if (!boardActive) {
        if (Math.hypot(characters.dylan.group.position.x - 18.5, characters.dylan.group.position.z - 11.0) < 3.2) {
          boardActive = true;
        } else {
          for (const char of Object.values(characters)) {
            if (Math.hypot(char.group.position.x - 18.5, char.group.position.z - 11.0) < 2.9) {
              boardActive = true;
              break;
            }
          }
        }
      }

      // Server Room Automated High-Tech Sliding Door Proximity (x = 26.0, z = 6.50)
      let serverActive = false;
      if (Math.hypot(characters.dylan.group.position.x - 26.0, characters.dylan.group.position.z - 6.50) < 3.0) {
        serverActive = true;
      } else {
        for (const char of Object.values(characters)) {
          if (Math.hypot(char.group.position.x - 26.0, char.group.position.z - 6.50) < 2.8) {
            serverActive = true;
            break;
          }
        }
      }

      // Meeting Room / Boardroom Automated Sliding Door Proximity (x = 21.0, z = 16.075)
      let meetingActive = inMeetingModeRef.current;
      if (!meetingActive) {
        if (Math.hypot(characters.dylan.group.position.x - 21.0, characters.dylan.group.position.z - 16.075) < 3.1) {
          meetingActive = true;
        } else {
          for (const char of Object.values(characters)) {
            if (Math.hypot(char.group.position.x - 21.0, char.group.position.z - 16.075) < 2.8) {
              meetingActive = true;
              break;
            }
          }
        }
      }

      const ceoTarget = ceoActive ? 1.0 : 0.0;
      const boardTarget = boardActive ? 1.0 : 0.0;
      const serverTarget = serverActive ? 1.0 : 0.0;
      const meetingTarget = meetingActive ? 1.0 : 0.0;

      if (ceoTarget !== lastCeoDoorState) {
        lastCeoDoorState = ceoTarget;
        playSfx('door');
      }
      if (boardTarget !== lastBoardDoorState) {
        lastBoardDoorState = boardTarget;
        playSfx('door');
      }
      if (serverTarget !== lastServerDoorState) {
        lastServerDoorState = serverTarget;
        playSfx('door');
      }
      if (meetingTarget !== lastMeetingDoorState) {
        lastMeetingDoorState = meetingTarget;
        playSfx('door');
      }

      ceoDoorProgress += (ceoTarget - ceoDoorProgress) * Math.min(1.0, delta * 4.8);
      boardDoorProgress += (boardTarget - boardDoorProgress) * Math.min(1.0, delta * 4.8);
      serverDoorProgress += (serverTarget - serverDoorProgress) * Math.min(1.0, delta * 4.8);
      meetingDoorProgress += (meetingTarget - meetingDoorProgress) * Math.min(1.0, delta * 4.8);

      // Slide CEO door leaf along Z axis to the opposite side (North into the 6.4m glass partition)
      ceoDoorGroup.position.z = 8.5 - ceoDoorProgress * 1.85;

      // Bi-part slide Boardroom concourse double doors along X axis
      boardDoorLeftGroup.position.x = 17.56 - boardDoorProgress * 1.40;
      boardDoorRightGroup.position.x = 19.44 + boardDoorProgress * 1.40;

      // Slide Server Room high-tech door leaf along Z axis (North into partition: 6.50 down to 4.65)
      serverDoorGroup.position.z = 6.50 - serverDoorProgress * 1.85;

      // Slide Meeting Room executive door leaf along Z axis (South into partition: 16.075 up to 17.925)
      meetingDoorGroup.position.z = 16.075 + meetingDoorProgress * 1.85;

      // Dynamic Sensor LED Color feedback (green when open/active, cyan/blue when idle)
      if (ceoDoorProgress > 0.08) {
        ceoSensorMat.color.setHex(0x10b981);
        ceoSensorMat.emissive.setHex(0x10b981);
      } else {
        ceoSensorMat.color.setHex(0x0284c7);
        ceoSensorMat.emissive.setHex(0x0284c7);
      }

      if (boardDoorProgress > 0.08) {
        boardSensorMat.color.setHex(0x10b981);
        boardSensorMat.emissive.setHex(0x10b981);
      } else {
        boardSensorMat.color.setHex(0x00f0ff);
        boardSensorMat.emissive.setHex(0x00f0ff);
      }

      if (serverDoorProgress > 0.08) {
        serverSensorMat.color.setHex(0x00f59b);
        serverSensorMat.emissive.setHex(0x00f59b);
      } else {
        serverSensorMat.color.setHex(0x00f0ff);
        serverSensorMat.emissive.setHex(0x00f0ff);
      }

      if (meetingDoorProgress > 0.08) {
        meetingSensorMat.color.setHex(0x10b981);
        meetingSensorMat.emissive.setHex(0x10b981);
      } else {
        meetingSensorMat.color.setHex(0x00f0ff);
        meetingSensorMat.emissive.setHex(0x00f0ff);
      }

      const dylan = characters.dylan;

      // Dylan Real-time WASD Player Control in 3D
      let mx = 0;
      let mz = 0;
      const speed = 4.0 * delta;

      if (keysPressed.current.has('KeyW') || keysPressed.current.has('ArrowUp')) mz -= speed;
      if (keysPressed.current.has('KeyS') || keysPressed.current.has('ArrowDown')) mz += speed;
      if (keysPressed.current.has('KeyA') || keysPressed.current.has('ArrowLeft')) mx -= speed;
      if (keysPressed.current.has('KeyD') || keysPressed.current.has('ArrowRight')) mx += speed;

      if (mx !== 0 || mz !== 0) {
        dylan.pathQueue = [];
        dylan.isSeated = false;
        dylan.isWalking = true;
        setIsDylanSeated(false);

        if (mx !== 0 && mz !== 0) {
          mx *= 0.7071;
          mz *= 0.7071;
        }

        const nextX = dylan.group.position.x + mx;
        const nextZ = dylan.group.position.z + mz;

        if (!isTileBlocked3D(nextX, dylan.group.position.z)) {
          dylan.group.position.x = nextX;
          dylan.currentX = nextX;
        }
        if (!isTileBlocked3D(dylan.group.position.x, nextZ)) {
          dylan.group.position.z = nextZ;
          dylan.currentZ = nextZ;
        }

        dylan.group.rotation.y = Math.atan2(mx, mz);
      } else if (dylan.pathQueue.length === 0) {
        dylan.isWalking = false;
        if (Math.hypot(dylan.currentX - dylan.deskX, dylan.currentZ - dylan.deskZ) < 1.0 && !dylan.isSeated) {
          dylan.isSeated = true;
          dylan.currentActivity = 'working';
          dylan.group.rotation.y = 0;
          setIsDylanSeated(true);
        }
      }

      // LIVE CONVERSATION & MEETING DIALOGUE SEQUENCER
      // A. Process pending conversation replies (2nd turn in 2-person banter)
      if (pendingReplyRef.current) {
        pendingReplyRef.current.delay -= delta;
        if (pendingReplyRef.current.delay <= 0) {
          const replyChar = characters[pendingReplyRef.current.speaker];
          if (replyChar) {
            replyChar.setSpeech(pendingReplyRef.current.text, 4.5);
          }
          pendingReplyRef.current = null;
        }
      }

      // B. Sequenced Boardroom All-Hands Discussion
      if (inMeetingModeRef.current) {
        meetingDialogueTimerRef.current -= delta;
        if (meetingDialogueTimerRef.current <= 0) {
          meetingDialogueTimerRef.current = 5.0;
          const scriptItem = MEETING_SCRIPT[meetingDialogueIndexRef.current];
          const speakerChar = characters[scriptItem.speaker];
          if (speakerChar) {
            speakerChar.setSpeech(scriptItem.text, 4.8);
          }
          meetingDialogueIndexRef.current = (meetingDialogueIndexRef.current + 1) % MEETING_SCRIPT.length;
        }
      } else if (!inRestModeRef.current) {
        // C. Spontaneous Cross-Desk & Office Banter (every 13 - 21s)
        casualChatTimerRef.current -= delta;
        if (casualChatTimerRef.current <= 0) {
          casualChatTimerRef.current = 13.0 + Math.random() * 8.0;
          const convo = CASUAL_CONVERSATIONS[Math.floor(Math.random() * CASUAL_CONVERSATIONS.length)];
          const char1 = characters[convo.first.speaker];
          const char2 = characters[convo.reply.speaker];
          if (char1 && char2 && !char1.speechText && !char2.speechText) {
            char1.setSpeech(convo.first.text, 4.0);
            pendingReplyRef.current = {
              speaker: convo.reply.speaker,
              text: convo.reply.text,
              delay: 2.2,
            };
          }
        }
      }

      // Autonomous Worker Stand-Up Routines (Every ~15 seconds)
      Object.values(characters).forEach((char) => {
        char.update(delta);

        if (char.id === 'eah') {
          if (char.eahStep === 'relaxing') {
            char.routineTimer -= delta;
            if (char.routineTimer <= 0) {
              char.eahCycleCount++;
              const cycle = char.eahCycleCount % 3;
              if (cycle === 1) {
                // CYCLE 1: Walk to kitchen, cook comfort breakfast for Dylan
                char.eahStep = 'cook_walk';
                char.isSeated = false;
                char.currentActivity = 'working';
                char.setSpeech('Cooking a delicious breakfast for Dylan Ramos! 🍳🥓', 4.5);
                char.walkTo(4.8, 12.7);
              } else if (cycle === 2) {
                // CYCLE 2: Walk to espresso bar in Lounge, brew special latte for Dylan
                char.eahStep = 'coffee_walk';
                char.isSeated = false;
                char.currentActivity = 'working';
                char.setSpeech('Brewing a special hot coffee for CEO Dylan! ☕✨', 4.5);
                char.walkTo(11.4, 18.6);
              } else {
                // CYCLE 3: Walk to lounge, visit & pet fluffy puppy
                char.eahStep = 'puppy_walk';
                char.isSeated = false;
                char.currentActivity = 'working';
                char.setSpeech('Taking a quick break to visit our puppy, Dylan! 🐶🐾', 4.5);
                char.walkTo(18.2, 14.0);
              }
            }
          } else if (char.eahStep === 'cook_walk') {
            if (char.pathQueue.length === 0) {
              char.eahStep = 'cooking';
              char.currentActivity = 'kitchen_cooking';
              char.group.rotation.y = Math.PI;
              char.waitTimer = 7.5;
              char.setSpeech('Sizzling sunny eggs & breakfast for Dylan! 🍳✨', 5.0);
            }
          } else if (char.eahStep === 'cooking') {
            char.waitTimer -= delta;
            if (char.waitTimer <= 0) {
              char.eahStep = 'deliver_food_walk';
              char.currentActivity = 'delivering_food';
              char.setSpeech('Fresh and piping hot! Delivering to Dylan Ramos! 🍲✨', 4.0);
              char.walkTo(4.8, 5.8);
            }
          } else if (char.eahStep === 'deliver_food_walk') {
            if (char.pathQueue.length === 0) {
              char.eahStep = 'serving_food';
              char.currentActivity = 'delivering_food';
              char.group.rotation.y = Math.PI;
              char.waitTimer = 5.0;
              char.setSpeech("Here you go Dylan, I cooked this specially for you! Enjoy! 🍲✨", 5.0);
              servedDeskItemRef.current = 'food';
              if (characters.dylan) {
                characters.dylan.setSpeech("Thank you so much Eah! ✨ This looks delicious, you're the best! 🍳", 5.5);
              }
            }
          } else if (char.eahStep === 'coffee_walk') {
            if (char.pathQueue.length === 0) {
              char.eahStep = 'brewing';
              char.currentActivity = 'brewing_coffee';
              char.group.rotation.y = Math.PI; // Face west towards the espresso bar
              char.waitTimer = 6.5;
              char.setSpeech('Freshly brewed latte with heart foam art for Dylan ☕✨', 4.5);
            }
          } else if (char.eahStep === 'brewing') {
            char.waitTimer -= delta;
            if (char.waitTimer <= 0) {
              char.eahStep = 'deliver_coffee_walk';
              char.currentActivity = 'delivering_coffee';
              char.setSpeech('Delivering fresh hot coffee to Dylan Ramos! ☕✨', 4.0);
              char.walkTo(4.8, 5.8);
            }
          } else if (char.eahStep === 'deliver_coffee_walk') {
            if (char.pathQueue.length === 0) {
              char.eahStep = 'serving_coffee';
              char.currentActivity = 'delivering_coffee';
              char.group.rotation.y = Math.PI;
              char.waitTimer = 5.0;
              char.setSpeech("Here is your fresh hot coffee Dylan! ☕✨ Don't work too hard!", 5.0);
              servedDeskItemRef.current = 'coffee';
              if (characters.dylan) {
                characters.dylan.setSpeech("Thank you so much Eah! You're the best! ☕✨", 5.5);
              }
            }
          } else if (char.eahStep === 'puppy_walk') {
            if (char.pathQueue.length === 0) {
              char.eahStep = 'petting_puppy';
              char.currentActivity = 'petting_puppy';
              char.group.rotation.y = Math.PI * 0.25;
              char.waitTimer = 6.0;
              char.setSpeech("You are the cutest puppy and kitty ever, Dylan will love you both! 🐶🤍🐱", 5.0);
              puppySpeechRef.current = { text: 'Arf arf! 🐶💕 *happy puppy kisses for Dylan & Eah*', timer: 5.0 };
              catSpeechRef.current = { text: 'Purrrrr... Nyaa~ 💕 *Snowy purrs happily for Eah & Dylan*', timer: 5.0 };
              play8BitGameSound('meow');
            }
          } else if (char.eahStep === 'serving_food' || char.eahStep === 'serving_coffee' || char.eahStep === 'petting_puppy') {
            char.waitTimer -= delta;
            if (char.waitTimer <= 0) {
              char.eahStep = 'return_armchair';
              char.currentActivity = 'working';
              char.setSpeech('Heading back to my cozy iPad nook beside Dylan ✨', 3.5);
              char.walkTo(OFFICE_3D_LAYOUT.CEO.eahSeat.x, OFFICE_3D_LAYOUT.CEO.eahSeat.z);
            }
          } else if (char.eahStep === 'return_armchair') {
            if (char.pathQueue.length === 0) {
              char.eahStep = 'relaxing';
              char.isSeated = true;
              char.currentActivity = 'sofa_relax';
              char.routineTimer = 22 + Math.random() * 12;
              char.setSpeech('Chilling on my iPad beside Dylan Ramos 💻✨', 4.5);
            }
          }
        } else if (char.id === 'dylan') {
          if (char.dylanStep === 'idle') {
            // Autonomous Caring Cycle: Dylan occasionally stands up to give flowers or cook for Eah ("Just to Be Fair" 💖)
            if (char.isSeated && char.pathQueue.length === 0 && !inMeetingModeRef.current && !inRestModeRef.current && !inKitchenGardenModeRef.current && keysPressed.current.size === 0) {
              char.routineTimer -= delta;
              if (char.routineTimer <= 0) {
                char.routineTimer = 28 + Math.random() * 14;
                char.dylanCycleCount++;
                const cycle = char.dylanCycleCount % 2;

                if (cycle === 1) {
                  // ROUTINE 1: Surprise Eah with fresh luxury flowers!
                  char.dylanStep = 'flower_walk';
                  char.isSeated = false;
                  char.currentActivity = 'delivering_flowers';
                  char.setSpeech('Surprising Eah with fresh flowers to brighten her day! 💐🌹', 4.5);
                  char.walkTo(OFFICE_3D_LAYOUT.CEO.eahSeat.x + 0.95, OFFICE_3D_LAYOUT.CEO.eahSeat.z);
                } else {
                  // ROUTINE 2: Cook a warm gourmet meal for Eah!
                  char.dylanStep = 'cook_walk';
                  char.isSeated = false;
                  char.currentActivity = 'working';
                  char.setSpeech('Eah always cooks for me—time to return the favor! 🍳✨', 4.5);
                  char.walkTo(4.8, 12.7);
                }
              }
            }
          } else if (char.dylanStep === 'flower_walk') {
            if (char.pathQueue.length === 0) {
              char.dylanStep = 'giving_flowers';
              char.currentActivity = 'delivering_flowers';
              char.group.rotation.y = -Math.PI * 0.5;
              char.waitTimer = 5.5;
              char.setSpeech('These fresh flowers are for you, my dearest Eah! 💐🌹 Thank you for always taking care of me! 💖✨', 5.5);
              servedEahTableItemRef.current = 'flowers';
              addFloatingPopup('💐 Dylan Gave Fresh Flowers to Eah! 🌹 (+500 LOVE & MORALE)', char.currentX, 2.8, char.currentZ, '#fb7185');
              play8BitGameSound('heart');
              if (characters.eah) {
                characters.eah.group.rotation.y = Math.PI * 0.5;
                characters.eah.setSpeech('Awww Dylan, they are absolutely gorgeous! 🌹🥰 You are the sweetest! Thank you! 💖✨', 5.5);
              }
            }
          } else if (char.dylanStep === 'cook_walk') {
            if (char.pathQueue.length === 0) {
              char.dylanStep = 'cooking';
              char.currentActivity = 'kitchen_cooking';
              char.group.rotation.y = Math.PI;
              char.waitTimer = 7.0;
              char.setSpeech('Sizzling fluffy golden pancakes & breakfast for Eah! 🥞🍳✨', 5.0);
            }
          } else if (char.dylanStep === 'cooking') {
            char.waitTimer -= delta;
            if (char.waitTimer <= 0) {
              char.dylanStep = 'deliver_food_walk';
              char.currentActivity = 'delivering_food';
              char.setSpeech('Fresh and piping hot! Delivering to Eah! 🥞🍓✨', 4.0);
              char.walkTo(OFFICE_3D_LAYOUT.CEO.eahSeat.x + 0.95, OFFICE_3D_LAYOUT.CEO.eahSeat.z);
            }
          } else if (char.dylanStep === 'deliver_food_walk') {
            if (char.pathQueue.length === 0) {
              char.dylanStep = 'serving_food';
              char.currentActivity = 'delivering_food';
              char.group.rotation.y = -Math.PI * 0.5;
              char.waitTimer = 5.5;
              char.setSpeech('Here is your special gourmet breakfast, Eah! 🥞✨ Made with love, enjoy! 💖', 5.5);
              servedEahTableItemRef.current = 'food';
              addFloatingPopup('🍳 Dylan Cooked Gourmet Meal for Eah! 🥞 (+500 AFFECTION)', char.currentX, 2.8, char.currentZ, '#f59e0b');
              play8BitGameSound('quest');
              if (characters.eah) {
                characters.eah.group.rotation.y = Math.PI * 0.5;
                characters.eah.setSpeech('Omg Dylan, you cooked for me?! 🥞😋 Smells amazing! Best partner ever! 💖✨', 5.5);
              }
            }
          } else if (char.dylanStep === 'giving_flowers' || char.dylanStep === 'serving_food') {
            char.waitTimer -= delta;
            if (char.waitTimer <= 0) {
              char.dylanStep = 'return_desk';
              char.currentActivity = 'working';
              char.setSpeech('Glad Eah loved it! Back to CEO command station 💻👑', 3.5);
              char.walkTo(OFFICE_3D_LAYOUT.CEO.chair.x, OFFICE_3D_LAYOUT.CEO.chair.z);
            }
          } else if (char.dylanStep === 'return_desk') {
            if (char.pathQueue.length === 0) {
              char.dylanStep = 'idle';
              char.isSeated = true;
              char.currentActivity = 'idle';
              char.group.rotation.y = 0;
              char.routineTimer = 28 + Math.random() * 14;
            }
          }
        } else if (char.id !== 'dylan' && !inMeetingModeRef.current && !inRestModeRef.current && !inKitchenGardenModeRef.current && char.pathQueue.length === 0) {
          if (char.waitTimer > 0) {
            char.waitTimer -= delta;
            if (char.currentActivity === 'reporting_to_ceo') {
              char.group.rotation.y = Math.PI; // Face North directly towards Dylan's executive command desk
              if (char.waitTimer > 4.0 && characters.dylan) {
                characters.dylan.group.rotation.y = 0; // Dylan turns south to listen to worker
              }
            }
            if (char.waitTimer <= 0) {
              if (char.currentActivity === 'reporting_to_ceo') {
                char.setSpeech('Thank you Dylan! Returning to my desk with new directives! 💻✨', 4.0);
              } else {
                char.setSpeech('Back to work.');
              }
              char.currentActivity = 'working';
              char.walkTo(char.deskX, char.deskZ);
            }
          } else {
            char.routineTimer -= delta;
            if (char.routineTimer <= 0) {
              char.routineTimer = 12 + Math.random() * 14;
              const act = Math.random();

              if ((char.id === 'zane' || char.id === 'alex') && act < 0.65) {
                // Specialized Server Vault & DevOps/SecOps tasks in Zone 6 for Alex & Zane!
                if (char.id === 'alex') {
                  if (act < 0.25) {
                    const rack = OFFICE_3D_LAYOUT.SERVER_ROOM.racks[0]; // PROD-DB-CLUSTER
                    char.walkTo(rack.x, rack.z + 1.2);
                    char.currentActivity = 'server_audit';
                    char.setSpeech(`Deploying microservices & DB migration on ${rack.name}! 🚀💾`);
                    char.waitTimer = 7.5;
                  } else if (act < 0.45) {
                    char.walkTo(OFFICE_3D_LAYOUT.SERVER_ROOM.crashCart.x, OFFICE_3D_LAYOUT.SERVER_ROOM.crashCart.z + 0.8);
                    char.currentActivity = 'crash_cart_diagnostics';
                    char.setSpeech('Profiling backend API latency & container clusters on the crash cart! ⚡');
                    char.waitTimer = 8.0;
                  } else {
                    char.walkTo(OFFICE_3D_LAYOUT.DESKS.zane.chair.x - 0.8, OFFICE_3D_LAYOUT.DESKS.zane.chair.z);
                    char.currentActivity = 'idle';
                    char.setSpeech('Syncing with Zane on zero-trust API gateway security! 🛡️🤝');
                    char.waitTimer = 6.5;
                  }
                } else {
                  // Zane
                  if (act < 0.25) {
                    const rack = OFFICE_3D_LAYOUT.SERVER_ROOM.racks[Math.floor(Math.random() * OFFICE_3D_LAYOUT.SERVER_ROOM.racks.length)];
                    char.walkTo(rack.x, rack.z + 1.2);
                    char.currentActivity = 'server_audit';
                    char.setSpeech(`Auditing ${rack.name} • Zero-trust firewall nominal! 🛡️⚡`);
                    char.waitTimer = 7.5;
                  } else if (act < 0.45) {
                    char.walkTo(OFFICE_3D_LAYOUT.SERVER_ROOM.crashCart.x, OFFICE_3D_LAYOUT.SERVER_ROOM.crashCart.z + 0.8);
                    char.currentActivity = 'crash_cart_diagnostics';
                    char.setSpeech('Running memory dump & packet capture diagnostics on the crash cart! 💻');
                    char.waitTimer = 8.0;
                  } else {
                    char.walkTo(OFFICE_3D_LAYOUT.SERVER_ROOM.threatMap.x, OFFICE_3D_LAYOUT.SERVER_ROOM.threatMap.z + 1.8);
                    char.currentActivity = 'threat_map_review';
                    char.setSpeech('Monitoring live global intrusion vectors on the SOC wall! 🛡️🌐');
                    char.waitTimer = 7.0;
                  }
                }
              } else if (act < 0.14) {
                // 1. Work & Snack at Kitchen Island Bar (Zone 5A)
                const kSeat = (OFFICE_3D_LAYOUT.KITCHEN.seats as any)[char.id === 'alex' || char.id === 'wendy' ? 'right' : 'left'];
                char.walkTo(kSeat.x, kSeat.z);
                char.currentActivity = 'kitchen_work';
                char.setSpeech('☕ Working on laptop & grabbing espresso at the kitchen island!');
                char.waitTimer = 8.5;
              } else if (act < 0.28) {
                // 2. Work & Relax at Outdoor Garden Patio (Zone 5B)
                const gSeat = (OFFICE_3D_LAYOUT.GARDEN.seats as any)[char.id === 'maya' || char.id === 'zane' ? 'right' : 'left'];
                char.walkTo(gSeat.x, gSeat.z);
                char.currentActivity = 'garden_relax';
                char.setSpeech('🌿 Working on laptop under the garden parasol & enjoying the fresh breeze!');
                char.waitTimer = 9.0;
              } else if (act < 0.40) {
                // 2. Play Retro Arcade Machine in Lounge
                char.walkTo(OFFICE_3D_LAYOUT.REST_AREA.arcadeCabinet.x, 14.65);
                char.currentActivity = 'playing_arcade';
                char.setSpeech('🕹️ Speedrunning retro arcade high score!');
                char.waitTimer = 7.5;
              } else if (act < 0.48) {
                // 3. Brew Fresh Espresso at Coffee Bar
                char.walkTo(OFFICE_3D_LAYOUT.REST_AREA.espressoBar.x + 0.6, OFFICE_3D_LAYOUT.REST_AREA.espressoBar.z - 0.4);
                char.currentActivity = 'drinking_coffee';
                char.setSpeech('☕ Brewing a fresh hot espresso shot!');
                char.waitTimer = 6.0;
              } else if (act < 0.62) {
                // 4. Hydration Break at Water Cooler
                char.walkTo(OFFICE_3D_LAYOUT.AMENITIES.waterCooler.x - 1, OFFICE_3D_LAYOUT.AMENITIES.waterCooler.z);
                char.currentActivity = 'drinking_water';
                char.setSpeech('🥤 Hydration break! Chilled mountain water.');
                char.waitTimer = 5.0;
              } else if (act < 0.74) {
                // 5. Relax on Sofa or Collaborative Work Bench with Laptop
                const restSeat = (OFFICE_3D_LAYOUT.REST_AREA.seats as Record<string, { x: number; z: number }>)[char.id] || { x: 14.5, z: 14.8 };
                char.walkTo(restSeat.x, restSeat.z);
                if (char.id === 'alex' || char.id === 'wendy') {
                  char.currentActivity = 'working';
                  char.setSpeech('💻 Working on my laptop from the lounge oak bench!');
                } else if (char.id === 'zane') {
                  char.currentActivity = 'playing_arcade';
                  char.setSpeech('🛡️ Checking network telemetry by the arcade!');
                } else {
                  char.currentActivity = 'sofa_relax';
                  char.setSpeech('🛋️ Sipping coffee and relaxing on the velvet sofa!');
                }
                char.waitTimer = 8.0;
              } else if (act < 0.83) {
                // 6. Autonomous Task Completion Report to CEO Dylan Ramos!
                char.isSeated = false;
                char.currentActivity = 'reporting_to_ceo';
                char.setSpeech('Reporting completed sprint tasks to CEO Dylan Ramos! 📋✨', 4.5);
                char.walkTo(4.8, 5.4);
                char.waitTimer = 11.0;
                addFloatingPopup(`📋 ${char.name.split(' ')[0]} reporting completed task to Dylan!`, char.currentX, 2.8, char.currentZ, '#ffbe0b');
              } else if (act < 0.90) {
                // 7. Work in Boardroom Suite with Laptop at Conference Table!
                char.walkTo(char.seatX, char.seatZ);
                char.currentActivity = 'meeting';
                char.setSpeech('💻 Bringing my laptop to work at the boardroom table!');
                char.waitTimer = 9.0;
              } else if (act < 0.95) {
                // 7. Visit Colleague for sync
                const targetDesk = char.id === 'ray' ? OFFICE_3D_LAYOUT.DESKS.wendy.chair : OFFICE_3D_LAYOUT.DESKS.alex.chair;
                char.walkTo(targetDesk.x, targetDesk.z);
                char.currentActivity = 'idle';
                char.setSpeech('Quick sync!');
                char.waitTimer = 4.0;
              } else {
                // 8. Stand up & Stretch
                char.isSeated = false;
                char.currentActivity = 'idle';
                char.group.position.z = char.deskZ + 0.8;
                char.setSpeech('🙆‍♂️ Stretching!');
                char.waitTimer = 4.0;
              }
            }
          }
        }
      });

      // Update served meal / coffee mug visibility and coffee steam animation on Dylan's desk
      if (servedDeskItemRef.current === 'food') {
        servedDeskGroup.visible = true;
        servedPlateGroup.visible = true;
        servedCoffeeGroup.visible = false;
      } else if (servedDeskItemRef.current === 'coffee') {
        servedDeskGroup.visible = true;
        servedCoffeeGroup.visible = true;
      }
      if (servedCoffeeGroup.visible) {
        steamPuffs.forEach((puff, idx) => {
          puff.position.y = 0.20 + ((time * 0.001 + idx * 0.35) % 0.22);
          puff.scale.setScalar(0.03 + Math.sin(time * 0.004 + idx) * 0.012);
        });
      }

      // Update served flowers / gourmet food visibility and animation on Eah's side table (Gift with Love 💖)
      if (servedEahTableItemRef.current === 'flowers') {
        servedEahTableGroup.visible = true;
        eahVaseGroup.visible = true;
        eahFoodGroup.visible = false;
        eahSparkles.forEach((sp, idx) => {
          sp.position.y = 0.35 + Math.sin(time * 0.003 + idx * 1.5) * 0.03;
          sp.rotation.y = time * 0.002 + idx;
        });
      } else if (servedEahTableItemRef.current === 'food') {
        servedEahTableGroup.visible = true;
        eahVaseGroup.visible = false;
        eahFoodGroup.visible = true;
        eahFoodSteamPuffs.forEach((puff, idx) => {
          puff.position.y = 0.12 + ((time * 0.001 + idx * 0.35) % 0.18);
          puff.scale.setScalar(0.025 + Math.sin(time * 0.004 + idx) * 0.01);
        });
      }

      // Update living puppy animation, tail wagging & autonomous lounge circuit patrol
      if (puppyRef.current) {
        const pupPos = puppyRef.current.group.position;
        const isDylanNearPup = Math.hypot(characters.dylan.group.position.x - pupPos.x, characters.dylan.group.position.z - pupPos.z) < 2.5;
        const isEahNearPup = characters.eah && Math.hypot(characters.eah.group.position.x - pupPos.x, characters.eah.group.position.z - pupPos.z) < 2.5;
        puppyRef.current.update(delta, isDylanNearPup || isEahNearPup, (text, timer) => {
          puppySpeechRef.current = { text, timer };
        });
      }

      // Update living white cat (Snowy) animation, purring & autonomous exploration
      if (catRef.current) {
        const catPos = catRef.current.group.position;
        const isDylanNearCat = Math.hypot(characters.dylan.group.position.x - catPos.x, characters.dylan.group.position.z - catPos.z) < 2.5;
        const isEahNearCat = characters.eah && Math.hypot(characters.eah.group.position.x - catPos.x, characters.eah.group.position.z - catPos.z) < 2.5;
        catRef.current.update(delta, isDylanNearCat || isEahNearCat, (text, timer) => {
          catSpeechRef.current = { text, timer };
        });
      }

      // Proximity Arcade HUD calculation (State debounced - only dispatches on zone change!)
      const dylanX = characters.dylan.group.position.x;
      const dylanZ = characters.dylan.group.position.z;
      const distEah = characters.eah ? Math.hypot(dylanX - characters.eah.group.position.x, dylanZ - characters.eah.group.position.z) : 999;
      const distPup = puppyRef.current ? Math.hypot(dylanX - puppyRef.current.group.position.x, dylanZ - puppyRef.current.group.position.z) : 999;
      const distCat = catRef.current ? Math.hypot(dylanX - catRef.current.group.position.x, dylanZ - catRef.current.group.position.z) : 999;
      const distArcade = Math.hypot(dylanX - 10.2, dylanZ - 14.65);

      const inServerVault = dylanX > 26.0 && dylanZ <= 11.5;
      const distBoardroomWater = Math.hypot(dylanX - 22.4, dylanZ - 11.8);
      const distBullpenWater = Math.hypot(dylanX - 24.2, dylanZ - 4.2);

      let nextProximityType: 'water' | 'eah' | 'puppy' | 'cat' | 'arcade' | 'server' | null = null;
      let nextProximityObj: {
        type: 'eah' | 'puppy' | 'cat' | 'arcade' | 'coffee' | 'server' | 'water' | 'none';
        title: string;
        badge: string;
        color: string;
      } | null = null;

      if (distBoardroomWater < 2.0 || distBullpenWater < 2.0) {
        nextProximityType = 'water';
        nextProximityObj = {
          type: 'water',
          title: distBullpenWater < 2.0 ? 'Bullpen Cold Water Dispenser 💧' : 'Executive Mineral Water Dispenser 💧',
          badge: '💧 HYDRATION STATION • PRESS [E]',
          color: '#38bdf8',
        };
      } else if (distEah < 2.8) {
        nextProximityType = 'eah';
        nextProximityObj = {
          type: 'eah',
          title: 'Eah Ilagan is right beside you ✨',
          badge: '✨ EXECUTIVE PARTNER',
          color: '#fb7185',
        };
      } else if (distPup < 2.5) {
        nextProximityType = 'puppy';
        nextProximityObj = {
          type: 'puppy',
          title: 'Mochi is wagging his tail happily at you 🐶',
          badge: '🐶 CHIEF HAPPINESS OFFICER',
          color: '#f59e0b',
        };
      } else if (distCat < 2.5) {
        nextProximityType = 'cat';
        nextProximityObj = {
          type: 'cat',
          title: 'Snowy is purring softly and headbonking your hand 🐱🤍',
          badge: '🐱 EXECUTIVE PURR OFFICER • PRESS [E]',
          color: '#38bdf8',
        };
      } else if (distArcade < 2.2) {
        nextProximityType = 'arcade';
        nextProximityObj = {
          type: 'arcade',
          title: 'Retro Pixel Arcade Cabinet 🕹️',
          badge: '🕹️ HIGH SCORE: 128,400 PTS',
          color: '#ec4899',
        };
      } else if (inServerVault) {
        nextProximityType = 'server';
        nextProximityObj = {
          type: 'server',
          title: 'Zero-Trust SOC & Enterprise Server Vault 🛡️',
          badge: '🛡️ CYBER SECURITY OPERATIONS',
          color: '#22c55e',
        };
      }

      if (lastProximityTypeRef.current !== nextProximityType) {
        lastProximityTypeRef.current = nextProximityType;
        setProximityHUD(nextProximityObj);
      }

      // 2. Project 3D Overhead Coordinates to 2D Screen Space (100% Crisp HTML, Zero Blur!)
      const currentW = container.clientWidth || window.innerWidth;
      const currentH = container.clientHeight || window.innerHeight;
      const projVec = new THREE.Vector3();

      // Project Floating RPG Reaction Popups in screen space
      if (floatingPopupsRef.current.length > 0) {
        const activePopups: Array<{ id: number; text: string; x: number; y: number; color: string; opacity: number }> = [];
        floatingPopupsRef.current = floatingPopupsRef.current.filter((p) => {
          p.life -= delta;
          p.y += delta * 0.45;
          if (p.life <= 0) return false;

          projVec.set(p.x, p.y, p.z);
          projVec.project(camera);
          const screenX = ((projVec.x + 1) * currentW) / 2;
          const screenY = ((-projVec.y + 1) * currentH) / 2;
          const alpha = Math.min(1.0, p.life / 0.5);
          activePopups.push({
            id: p.id,
            text: p.text,
            x: screenX,
            y: screenY,
            color: p.color,
            opacity: alpha,
          });
          return true;
        });
        lastPopupCountRef.current = activePopups.length;
        setScreenPopups(activePopups);
      } else if (lastPopupCountRef.current > 0) {
        lastPopupCountRef.current = 0;
        setScreenPopups([]);
      }

      // Project Puppy Speech Bubble in screen space
      if (puppySpeechRef.current.timer > 0) {
        puppySpeechRef.current.timer -= delta;
        const el = bubbleElsRef.current['puppy'];
        if (el) {
          const pupX = puppyRef.current ? puppyRef.current.group.position.x : OFFICE_3D_LAYOUT.REST_AREA.dogBed.x;
          const pupZ = puppyRef.current ? puppyRef.current.group.position.z : OFFICE_3D_LAYOUT.REST_AREA.dogBed.z;
          projVec.set(pupX, 1.40, pupZ);
          projVec.project(camera);
          const screenX = ((projVec.x + 1) * currentW) / 2;
          const screenY = ((-projVec.y + 1) * currentH) / 2;
          const inBounds = screenX > -150 && screenX < currentW + 150 && screenY > -80 && screenY < currentH + 80;
          if (inBounds) {
            el.style.display = 'block';
            el.style.opacity = '1';
            el.style.pointerEvents = 'auto';
            el.style.transform = `translate3d(${Math.round(screenX)}px, ${Math.round(screenY)}px, 0) translate(-50%, -100%)`;
            const textNode = el.querySelector<HTMLDivElement>('.crisp-speech-text');
            if (textNode && textNode.textContent !== puppySpeechRef.current.text) {
              textNode.textContent = puppySpeechRef.current.text;
            }
          } else {
            el.style.display = 'none';
          }
        }
      } else {
        const el = bubbleElsRef.current['puppy'];
        if (el) {
          el.style.display = 'none';
          el.style.opacity = '0';
        }
      }

      // Project Cat (Snowy) Speech Bubble in screen space
      if (catSpeechRef.current.timer > 0) {
        catSpeechRef.current.timer -= delta;
        const el = bubbleElsRef.current['cat'];
        if (el) {
          const catX = catRef.current ? catRef.current.group.position.x : OFFICE_3D_LAYOUT.REST_AREA.catBed.x;
          const catZ = catRef.current ? catRef.current.group.position.z : OFFICE_3D_LAYOUT.REST_AREA.catBed.z;
          projVec.set(catX, 1.35, catZ);
          projVec.project(camera);
          const screenX = ((projVec.x + 1) * currentW) / 2;
          const screenY = ((-projVec.y + 1) * currentH) / 2;
          const inBounds = screenX > -150 && screenX < currentW + 150 && screenY > -80 && screenY < currentH + 80;
          if (inBounds) {
            el.style.display = 'block';
            el.style.opacity = '1';
            el.style.pointerEvents = 'auto';
            el.style.transform = `translate3d(${Math.round(screenX)}px, ${Math.round(screenY)}px, 0) translate(-50%, -100%)`;
            const textNode = el.querySelector<HTMLDivElement>('.crisp-speech-text');
            if (textNode && textNode.textContent !== catSpeechRef.current.text) {
              textNode.textContent = catSpeechRef.current.text;
            }
          } else {
            el.style.display = 'none';
          }
        }
      } else {
        const el = bubbleElsRef.current['cat'];
        if (el) {
          el.style.display = 'none';
          el.style.opacity = '0';
        }
      }

      Object.values(characters).forEach((char) => {
        const el = bubbleElsRef.current[char.id];
        if (!el) return;

        if (char.speechTimer > 0 && char.speechText) {
          // Point just above character head in 3D world (y = 2.45)
          projVec.set(char.group.position.x, 2.45, char.group.position.z);
          projVec.project(camera);

          const screenX = ((projVec.x + 1) * currentW) / 2;
          const screenY = ((-projVec.y + 1) * currentH) / 2;

          const inBounds = screenX > -150 && screenX < currentW + 150 && screenY > -80 && screenY < currentH + 80;

          if (inBounds) {
            el.style.display = 'block';
            el.style.opacity = '1';
            el.style.pointerEvents = 'auto';
            el.style.transform = `translate3d(${Math.round(screenX)}px, ${Math.round(screenY)}px, 0) translate(-50%, -100%)`;

            const textNode = el.querySelector<HTMLDivElement>('.crisp-speech-text');
            if (textNode && textNode.textContent !== char.speechText) {
              textNode.textContent = char.speechText;
            }
          } else {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            el.style.display = 'none';
          }
        } else {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          el.style.display = 'none';
        }
      });

      // 3. Render Direct Pure High-Performance 3D
      renderer.render(scene, camera);
    };

    animate(performance.now());

    // Window Resize with Dynamic High-DPI Re-calibration
    const onResize = () => {
      if (!container) return;
      const newW = container.clientWidth || window.innerWidth;
      const newH = container.clientHeight || window.innerHeight;
      const newAspect = newW / newH;

      setWindowWidth(newW);

      camera.left = (-frustumSize * newAspect) / 2;
      camera.right = (frustumSize * newAspect) / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
      camera.updateProjectionMatrix();

      const newDpr = getTargetDpr();
      if (renderer.getPixelRatio() !== newDpr) {
        renderer.setPixelRatio(newDpr);
      }
      renderer.setSize(newW, newH, false);
    };
    window.addEventListener('resize', onResize);

    // ResizeObserver ensures canvas aspect ratio updates immediately when sidepanel opens/closes
    const resizeObserver = new ResizeObserver(() => {
      onResize();
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      sse.close();
      resizeObserver.disconnect();
      dom.removeEventListener('contextmenu', onContextMenu);
      dom.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('touchstart', onTouchStart);
      dom.removeEventListener('touchmove', onTouchMove);
      dom.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('office:report:ceo', onReportEvent);
      renderer.dispose();
      if (dom.parentNode) {
        dom.parentNode.removeChild(dom);
      }
    };
  }, [playSfx, play8BitGameSound]);

  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth > 768 && windowWidth <= 1120;
  const isCompact = isMobile || isTablet;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'grab',
        backgroundColor: '#0a0c14',
      }}
    >
      {/* 3D EXECUTIVE HUD OVERLAY (RESPONSIVE, MODULAR, RETINA CRISP) */}
      <div
        style={{
          position: 'absolute',
          top: isMobile ? '8px' : '14px',
          left: isMobile ? '8px' : '16px',
          right: isMobile ? '8px' : '16px',
          zIndex: 25,
          background: 'rgba(10, 14, 26, 0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(0, 240, 255, 0.35)',
          borderRadius: isMobile ? '10px' : '12px',
          padding: isMobile ? '8px 10px' : isTablet ? '8px 12px' : '10px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: isHudMinimized ? '0px' : '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.75), 0 0 16px rgba(0, 240, 255, 0.12)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          maxWidth: 'calc(100% - 32px)',
        }}
      >
        {/* ROW 1: MASTER IDENTITY & PRIMARY CONTROLS (Always Single Slim Row) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: isMobile ? '6px' : '10px',
            width: '100%',
          }}
        >
          {/* Left: Brand + Assign Worker + Dylan Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '10px', minWidth: 0 }}>
            {/* AVERO HQ Master Corporate Brand Badge */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.22), rgba(255, 190, 11, 0.15))',
                border: '1.5px solid #00f0ff',
                borderRadius: '8px',
                padding: isMobile ? '4px 8px' : '6px 12px',
                height: isMobile ? '36px' : '40px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 0 12px rgba(0, 240, 255, 0.3)',
                flexShrink: 0,
              }}
            >
              <IconBuilding size={isMobile ? 18 : 20} color="#00f0ff" />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                <span
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: isMobile ? '10px' : '11.5px',
                    color: '#00f0ff',
                    letterSpacing: '0.5px',
                    textShadow: '0 0 10px rgba(0, 240, 255, 0.7)',
                  }}
                >
                  AVERO HQ
                </span>
                {!isMobile && (
                  <span style={{ fontSize: '7px', color: '#ffbe0b', fontFamily: "'Press Start 2P', monospace", letterSpacing: '0.5px' }}>
                    AI VIRTUAL OFFICE
                  </span>
                )}
              </div>
            </div>

            {/* Main Action Trigger: ASSIGN WORKER */}
            {onOpenActionModal && (
              <button
                onClick={() => onOpenActionModal(selectedAgentId || 'alex')}
                style={{
                  backgroundColor: '#00f0ff',
                  color: '#05070e',
                  border: '1.5px solid #00f0ff',
                  borderRadius: '8px',
                  padding: isMobile ? '6px 10px' : '8px 14px',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: isMobile ? '8px' : '8.5px',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 0 14px rgba(0, 240, 255, 0.65)',
                  transition: 'all 0.15s ease',
                  height: isMobile ? '36px' : '40px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.03)';
                  e.currentTarget.style.boxShadow = '0 0 22px rgba(0, 240, 255, 1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 0 14px rgba(0, 240, 255, 0.65)';
                }}
              >
                <IconZap size={13} color="#05070e" />
                <span>{isMobile ? 'ASSIGN' : 'ASSIGN WORKER'}</span>
              </button>
            )}

            {/* Dylan Ramos CEO Badge */}
            <div
              style={{
                display: isMobile ? 'none' : 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 6px',
                borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#00f59b',
                  boxShadow: '0 0 8px #00f59b',
                  flexShrink: 0,
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '9.5px',
                    color: '#ffbe0b',
                    letterSpacing: '0.5px',
                  }}
                >
                  DYLAN RAMOS
                </span>
                <span style={{ fontSize: '7px', color: '#94a3b8', fontFamily: "'Press Start 2P', monospace", display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>AVERO HQ •</span>
                  {isDylanSeated ? (
                    <>
                      <IconArmchair size={10} color="#00f59b" />
                      <span>Seated</span>
                    </>
                  ) : (
                    <>
                      <IconFootprints size={10} color="#ffbe0b" />
                      <span>Roaming</span>
                    </>
                  )}
                </span>
              </div>

              <button
                onClick={handleToggleDylanSit}
                title={isDylanSeated ? 'Make Dylan stand up and roam the office' : 'Send Dylan back to executive desk'}
                style={{
                  background: isDylanSeated ? 'rgba(0, 240, 255, 0.18)' : 'rgba(255, 190, 11, 0.22)',
                  border: isDylanSeated ? '1px solid #00f0ff' : '1px solid #ffbe0b',
                  color: isDylanSeated ? '#00f0ff' : '#ffbe0b',
                  borderRadius: '6px',
                  padding: '6px 11px',
                  fontSize: '8px',
                  fontFamily: "'Press Start 2P', monospace",
                  cursor: 'pointer',
                  fontWeight: 700,
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                }}
              >
                {isDylanSeated ? <IconFootprints size={12} color="#00f0ff" /> : <IconArmchair size={12} color="#ffbe0b" />}
                <span>{isDylanSeated ? 'STAND' : 'SIT'}</span>
              </button>
            </div>
          </div>

          {/* Right: Tab Filter (on compact), Sound Toggle, Sidebar Toggle & Minimize/Expand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '5px' : '8px', flexShrink: 0 }}>
            {/* Filter buttons on smaller screens when expanded */}
            {isCompact && !isHudMinimized && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '6px',
                  padding: '2px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <button
                  onClick={() => setActiveHudTab('actions')}
                  style={{
                    background: activeHudTab === 'actions' ? 'rgba(0, 240, 255, 0.25)' : 'transparent',
                    border: activeHudTab === 'actions' ? '1px solid #00f0ff' : 'none',
                    color: activeHudTab === 'actions' ? '#00f0ff' : '#94a3b8',
                    borderRadius: '4px',
                    padding: '4px 7px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '7.5px',
                    cursor: 'pointer',
                  }}
                >
                  ACT
                </button>
                <button
                  onClick={() => setActiveHudTab('roster')}
                  style={{
                    background: activeHudTab === 'roster' ? 'rgba(0, 240, 255, 0.25)' : 'transparent',
                    border: activeHudTab === 'roster' ? '1px solid #00f0ff' : 'none',
                    color: activeHudTab === 'roster' ? '#00f0ff' : '#94a3b8',
                    borderRadius: '4px',
                    padding: '4px 7px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '7.5px',
                    cursor: 'pointer',
                  }}
                >
                  AI
                </button>
                <button
                  onClick={() => setActiveHudTab('cameras')}
                  style={{
                    background: activeHudTab === 'cameras' ? 'rgba(0, 240, 255, 0.25)' : 'transparent',
                    border: activeHudTab === 'cameras' ? '1px solid #00f0ff' : 'none',
                    color: activeHudTab === 'cameras' ? '#00f0ff' : '#94a3b8',
                    borderRadius: '4px',
                    padding: '4px 7px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '7.5px',
                    cursor: 'pointer',
                  }}
                >
                  CAM
                </button>
              </div>
            )}

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute 8-Bit Audio' : 'Enable 8-Bit Sound Effects'}
              style={{
                background: soundEnabled ? 'rgba(0, 245, 155, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: soundEnabled ? '1.5px solid #00f59b' : '1px solid rgba(255, 255, 255, 0.15)',
                color: soundEnabled ? '#00f59b' : '#94a3b8',
                borderRadius: '7px',
                padding: isMobile ? '5px 8px' : '6px 10px',
                fontSize: '8px',
                fontFamily: "'Press Start 2P', monospace",
                cursor: 'pointer',
                height: isMobile ? '34px' : '38px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              {soundEnabled ? <IconVolume2 size={13} color="#00f59b" /> : <IconVolumeX size={13} color="#94a3b8" />}
              {!isMobile && <span>{soundEnabled ? 'ON' : 'OFF'}</span>}
            </button>

            {/* Toggle Sidebar Button */}
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('office:toggle:sidebar'));
              }}
              title="Toggle Dylan Ramos Command Sidebar"
              style={{
                background: 'rgba(0, 240, 255, 0.15)',
                border: '1.5px solid #00f0ff',
                color: '#00f0ff',
                borderRadius: '7px',
                padding: isMobile ? '5px 8px' : '6px 12px',
                fontSize: '8px',
                fontFamily: "'Press Start 2P', monospace",
                letterSpacing: '0.4px',
                cursor: 'pointer',
                height: isMobile ? '34px' : '38px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 0 10px rgba(0, 240, 255, 0.25)',
              }}
            >
              <IconSidebar size={13} color="#00f0ff" />
              <span>{isMobile ? 'PANEL' : 'SIDEBAR'}</span>
            </button>

            {/* Minimize / Expand HUD Toggle */}
            <button
              onClick={() => setIsHudMinimized(!isHudMinimized)}
              title={isHudMinimized ? 'Expand full team & camera toolbars' : 'Minimize HUD for maximum 3D view'}
              style={{
                background: isHudMinimized ? 'rgba(255, 190, 11, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                border: isHudMinimized ? '1.5px solid #ffbe0b' : '1px solid rgba(255, 255, 255, 0.18)',
                color: isHudMinimized ? '#ffbe0b' : '#cbd5e1',
                borderRadius: '7px',
                padding: isMobile ? '5px 8px' : '6px 10px',
                fontSize: '8px',
                fontFamily: "'Press Start 2P', monospace",
                letterSpacing: '0.4px',
                cursor: 'pointer',
                height: isMobile ? '34px' : '38px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              {isHudMinimized ? <IconChevronDown size={12} /> : <IconChevronUp size={12} />}
              {!isMobile && <span>{isHudMinimized ? 'EXPAND' : 'MIN'}</span>}
            </button>
          </div>
        </div>

        {/* EXPANDABLE TOOLBARS (Organized Horizontal Strips with smooth horizontal scrolling) */}
        {!isHudMinimized && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '8px',
              width: '100%',
              overflow: 'hidden',
            }}
          >
            {/* TOOLBAR 1: Quick Roster Pills */}
            {(!isCompact || activeHudTab === 'all' || activeHudTab === 'roster') && onOpenActionModal && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  overflowX: 'auto',
                  paddingBottom: '2px',
                  scrollbarWidth: 'none',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    fontSize: '8px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontWeight: 800,
                    color: '#38bdf8',
                    marginRight: '6px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    letterSpacing: '0.8px',
                  }}
                >
                  AI ROSTER:
                </span>
                {['alex', 'maya', 'wendy', 'ray', 'zane', 'eah'].map((id) => {
                  const meta = AGENT_ROSTER_INFO[id];
                  if (!meta) return null;
                  const isSelected = selectedAgentId === id;
                  return (
                    <button
                      key={id}
                      onClick={() => onOpenActionModal(id)}
                      title={`Assign direct task to ${meta.name} (${meta.title})`}
                      style={{
                        backgroundColor: isSelected ? `${meta.color}33` : 'rgba(255, 255, 255, 0.05)',
                        border: isSelected ? `2px solid ${meta.color}` : '1.5px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '7px',
                        padding: '6px 10px',
                        height: '34px',
                        color: isSelected ? '#f8fafc' : '#cbd5e1',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '8px',
                        fontFamily: "'Press Start 2P', monospace",
                        fontWeight: 700,
                        letterSpacing: '0.3px',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? `0 0 12px ${meta.color}55` : 'none',
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = meta.color;
                        e.currentTarget.style.backgroundColor = `${meta.color}25`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = isSelected ? meta.color : 'rgba(255, 255, 255, 0.12)';
                        e.currentTarget.style.backgroundColor = isSelected ? `${meta.color}33` : 'rgba(255, 255, 255, 0.05)';
                      }}
                    >
                      {getAgentIcon(id, 13, isSelected ? meta.color : '#cbd5e1')}
                      <span>{meta.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TOOLBAR 2: Team Routines & Directives */}
            {(!isCompact || activeHudTab === 'all' || activeHudTab === 'actions') && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  overflowX: 'auto',
                  paddingBottom: '2px',
                  scrollbarWidth: 'none',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    fontSize: '8px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontWeight: 800,
                    color: '#ffbe0b',
                    marginRight: '6px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    letterSpacing: '0.8px',
                  }}
                >
                  ROUTINES:
                </span>

                <button
                  onClick={handleAllWorkersStand}
                  style={{
                    background: 'rgba(56, 189, 248, 0.18)',
                    border: '1.5px solid #38bdf8',
                    color: '#38bdf8',
                    borderRadius: '7px',
                    padding: '6px 10px',
                    height: '34px',
                    fontSize: '8px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontWeight: 700,
                    letterSpacing: '0.4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 0 10px rgba(56, 189, 248, 0.25)',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <IconActivity size={13} color="#38bdf8" />
                  <span>WORKERS STAND</span>
                </button>

                <button
                  onClick={handleToggleRestMode}
                  title="Send team with laptops to work at the lounge sofa & collaborative oak bench"
                  style={{
                    background: inRestMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.18)',
                    border: inRestMode ? '1.5px solid #10b981' : '1.5px solid #059669',
                    color: inRestMode ? '#34d399' : '#10b981',
                    borderRadius: '7px',
                    padding: '6px 10px',
                    height: '34px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '8px',
                    fontWeight: 700,
                    letterSpacing: '0.4px',
                    cursor: 'pointer',
                    boxShadow: inRestMode ? '0 0 14px rgba(16, 185, 129, 0.45)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {inRestMode ? <IconBriefcase size={13} color="#34d399" /> : <IconLaptop size={13} color="#10b981" />}
                  <span>{inRestMode ? 'DESK WORK' : 'LAPTOP LOUNGE'}</span>
                </button>

                <button
                  onClick={handleToggleKitchenGarden}
                  title="Send team with laptops to work & hang out in the Gourmet Kitchen & Outdoor Zen Garden"
                  style={{
                    background: inKitchenGardenMode ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.18)',
                    border: inKitchenGardenMode ? '1.5px solid #f59e0b' : '1.5px solid #d97706',
                    color: inKitchenGardenMode ? '#fbbf24' : '#f59e0b',
                    borderRadius: '7px',
                    padding: '6px 10px',
                    height: '34px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '8px',
                    fontWeight: 700,
                    letterSpacing: '0.4px',
                    cursor: 'pointer',
                    boxShadow: inKitchenGardenMode ? '0 0 14px rgba(245, 158, 11, 0.45)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {inKitchenGardenMode ? <IconBriefcase size={13} color="#fbbf24" /> : <IconCoffee size={13} color="#f59e0b" />}
                  <span>{inKitchenGardenMode ? 'DESK WORK' : 'KITCHEN & GARDEN'}</span>
                </button>

                <button
                  onClick={handleToggleMeetingMode}
                  style={{
                    background: inMeetingMode ? 'rgba(255, 190, 11, 0.3)' : 'rgba(0, 240, 255, 0.18)',
                    border: inMeetingMode ? '1.5px solid #ffbe0b' : '1.5px solid #00f0ff',
                    color: inMeetingMode ? '#ffbe0b' : '#00f0ff',
                    borderRadius: '7px',
                    padding: '6px 10px',
                    height: '34px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '8px',
                    fontWeight: 700,
                    letterSpacing: '0.4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: inMeetingMode ? '0 0 16px rgba(255, 190, 11, 0.6)' : '0 0 10px rgba(0, 240, 255, 0.3)',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {inMeetingMode ? <IconBriefcase size={13} color="#ffbe0b" /> : <IconUsers size={12} color="#00f0ff" />}
                  <span>{inMeetingMode ? 'DISMISS' : 'ALL-HANDS MEETING'}</span>
                </button>

                <button
                  onClick={() => handleReportToCeo(selectedAgentId || 'alex')}
                  title="Dispatch worker to CEO Suite to report completed tasks directly to Dylan Ramos"
                  style={{
                    background: 'rgba(255, 190, 11, 0.22)',
                    border: '1.5px solid #ffbe0b',
                    color: '#ffbe0b',
                    borderRadius: '7px',
                    padding: '6px 10px',
                    height: '34px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '8px',
                    fontWeight: 700,
                    letterSpacing: '0.4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 0 12px rgba(255, 190, 11, 0.4)',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <IconCheckCircle size={13} color="#ffbe0b" />
                  <span>REPORT TO CEO</span>
                </button>

                {onLock && (
                  <button
                    onClick={onLock}
                    title="Lock Office and Return to Front Page"
                    style={{
                      background: 'rgba(239, 68, 68, 0.22)',
                      border: '1.5px solid #ef4444',
                      color: '#f87171',
                      borderRadius: '7px',
                      padding: '6px 10px',
                      height: '34px',
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: '8px',
                      fontWeight: 700,
                      letterSpacing: '0.4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 0 10px rgba(239, 68, 68, 0.35)',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <IconLock size={12} color="#f87171" />
                    <span>LOCK HQ</span>
                  </button>
                )}
              </div>
            )}

            {/* TOOLBAR 3: Camera Presets & Focus Angles */}
            {(!isCompact || activeHudTab === 'all' || activeHudTab === 'cameras') && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  overflowX: 'auto',
                  paddingBottom: '2px',
                  scrollbarWidth: 'none',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    fontSize: '8px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontWeight: 800,
                    color: '#00f59b',
                    marginRight: '6px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    letterSpacing: '0.8px',
                  }}
                >
                  CAMERAS:
                </span>

                {/* Pure 3D Ultra HD Architectural Engine Badge */}
                <div
                  style={{
                    background: 'rgba(0, 240, 255, 0.16)',
                    border: '1.5px solid #00f0ff',
                    color: '#00f0ff',
                    borderRadius: '7px',
                    padding: '6px 9px',
                    height: '34px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '8px',
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    flexShrink: 0,
                    boxShadow: '0 0 12px rgba(0, 240, 255, 0.35)',
                  }}
                  title="AVERO HQ 4K Ultra-Sharp Supersampling Active (Zero Blur At Any Zoom Level)"
                >
                  <IconSparkles size={12} color="#00f0ff" />
                  <span>4K CRISP HD</span>
                </div>

                {/* Direct Zoom In & Zoom Out Controls */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '7px',
                    padding: '2px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    flexShrink: 0,
                    gap: '2px',
                  }}
                >
                  <button
                    onClick={() => cameraControlRef.current.zoomIn()}
                    title="Zoom In (Razor-Sharp High-Definition View)"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#00f0ff',
                      borderRadius: '5px',
                      padding: '5px 8px',
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: '8px',
                      cursor: 'pointer',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    + ZOOM
                  </button>
                  <button
                    onClick={() => cameraControlRef.current.zoomOut()}
                    title="Zoom Out (Wide View)"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      borderRadius: '5px',
                      padding: '5px 8px',
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: '8px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    - ZOOM
                  </button>
                </div>

                {/* 3D Tilt Angle Presets */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '7px',
                    padding: '2px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    flexShrink: 0,
                  }}
                >
                  <button
                    onClick={() => cameraControlRef.current.setTilt(0.38, 'front')}
                    style={{
                      background: tiltMode === 'front' ? 'rgba(0, 240, 255, 0.3)' : 'transparent',
                      border: tiltMode === 'front' ? '1px solid #00f0ff' : 'none',
                      color: tiltMode === 'front' ? '#00f0ff' : '#94a3b8',
                      borderRadius: '5px',
                      padding: '5px 7px',
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: '7.5px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="0° Front Elevation - Parallel Vertical Walls"
                  >
                    <IconLayers size={11} color={tiltMode === 'front' ? '#00f0ff' : '#94a3b8'} />
                    <span>0° FRONT</span>
                  </button>
                  <button
                    onClick={() => cameraControlRef.current.setTilt(0.48, 'cinematic')}
                    style={{
                      background: tiltMode === 'cinematic' ? 'rgba(0, 240, 255, 0.3)' : 'transparent',
                      border: tiltMode === 'cinematic' ? '1px solid #00f0ff' : 'none',
                      color: tiltMode === 'cinematic' ? '#00f0ff' : '#94a3b8',
                      borderRadius: '5px',
                      padding: '5px 7px',
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: '7.5px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Cinematic Tilted 3D Angle (~28°)"
                  >
                    <IconCompass size={11} color={tiltMode === 'cinematic' ? '#00f0ff' : '#94a3b8'} />
                    <span>28° TILT</span>
                  </button>
                  <button
                    onClick={() => cameraControlRef.current.setTilt(0.66, 'isometric')}
                    style={{
                      background: tiltMode === 'isometric' ? 'rgba(0, 240, 255, 0.3)' : 'transparent',
                      border: tiltMode === 'isometric' ? '1px solid #00f0ff' : 'none',
                      color: tiltMode === 'isometric' ? '#00f0ff' : '#94a3b8',
                      borderRadius: '5px',
                      padding: '5px 7px',
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: '7.5px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Isometric 3D Angle (~38°)"
                  >
                    <IconBox size={11} color={tiltMode === 'isometric' ? '#00f0ff' : '#94a3b8'} />
                    <span>38° ISO</span>
                  </button>
                  <button
                    onClick={() => cameraControlRef.current.setTilt(Math.PI * 0.5 - 0.0001, 'topdown')}
                    style={{
                      background: tiltMode === 'topdown' ? 'rgba(0, 240, 255, 0.3)' : 'transparent',
                      border: tiltMode === 'topdown' ? '1px solid #00f0ff' : 'none',
                      color: tiltMode === 'topdown' ? '#00f0ff' : '#94a3b8',
                      borderRadius: '5px',
                      padding: '5px 7px',
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: '7.5px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="True 90° Top-Down Blueprint Plan"
                  >
                    <IconGrid size={11} color={tiltMode === 'topdown' ? '#00f0ff' : '#94a3b8'} />
                    <span>90° TOP</span>
                  </button>
                </div>

                {/* Quick Camera Actions */}
                <button
                  onClick={() => cameraControlRef.current.snapCardinal()}
                  style={{
                    background: 'rgba(0, 240, 255, 0.16)',
                    border: '1.5px solid #00f0ff',
                    color: '#00f0ff',
                    borderRadius: '7px',
                    padding: '6px 8px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    flexShrink: 0,
                  }}
                  title="Snap Camera to Exact 90° Orthogonal Alignment"
                >
                  <IconGrid size={11} color="#00f0ff" />
                  <span>90° SNAP</span>
                </button>

                <button
                  onClick={() => cameraControlRef.current.rotateBy(Math.PI * 0.25)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1.5px solid rgba(255, 255, 255, 0.15)',
                    color: '#e2e8f0',
                    borderRadius: '7px',
                    padding: '6px 8px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    flexShrink: 0,
                  }}
                  title="Rotate camera 45° around the office"
                >
                  <IconRotateCw size={11} color="#e2e8f0" />
                  <span>45°</span>
                </button>

                <button
                  onClick={() => cameraControlRef.current.focusDylan()}
                  style={{
                    background: 'rgba(255, 190, 11, 0.18)',
                    border: '1.5px solid #ffbe0b',
                    color: '#ffbe0b',
                    borderRadius: '7px',
                    padding: '6px 8px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    flexShrink: 0,
                  }}
                  title="Focus Camera on Dylan Ramos (CEO)"
                >
                  <IconTarget size={11} color="#ffbe0b" />
                  <span>CEO</span>
                </button>

                <button
                  onClick={() => cameraControlRef.current.focusServerRoom()}
                  style={{
                    background: 'rgba(34, 197, 94, 0.18)',
                    border: '1.5px solid #22c55e',
                    color: '#4ade80',
                    borderRadius: '7px',
                    padding: '6px 8px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    flexShrink: 0,
                  }}
                  title="Focus Camera on Cyber Security & Server Vault"
                >
                  <IconServer size={11} color="#4ade80" />
                  <span>SERVERS</span>
                </button>

                <button
                  onClick={() => cameraControlRef.current.resetView()}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1.5px solid rgba(255, 255, 255, 0.15)',
                    color: '#94a3b8',
                    borderRadius: '7px',
                    padding: '6px 8px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    flexShrink: 0,
                  }}
                  title="Reset Camera Center & Tilt"
                >
                  <IconRotateCcw size={11} color="#94a3b8" />
                  <span>RESET</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 100% CRISP HTML SPEECH BUBBLE OVERLAY (RETINA / HIGH-DPI SHARP, NEVER BLURRY!) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 15,
        }}
      >
        {Object.values(AGENT_BUBBLE_CONFIG).map((cfg) => (
          <div
            key={cfg.id}
            ref={(el) => {
              bubbleElsRef.current[cfg.id] = el;
            }}
            onClick={() => onSelectAgentRef.current?.(cfg.id)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: 0,
              display: 'none',
              pointerEvents: 'none',
              transform: 'translate3d(-9999px, -9999px, 0)',
              transition: 'opacity 0.2s ease',
              willChange: 'transform, opacity',
              cursor: 'pointer',
            }}
          >
            {/* The Speech Bubble Card */}
            <div
              style={{
                position: 'relative',
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(10px)',
                border: `1.5px solid ${cfg.borderColor}`,
                borderRadius: '8px',
                padding: '8px 12px',
                maxWidth: '260px',
                minWidth: '150px',
                boxShadow: `0 8px 24px rgba(0, 0, 0, 0.8), 0 0 14px ${cfg.glowColor}`,
                color: '#f8fafc',
                fontFamily: "'Fira Code', -apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
              {/* Header Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                  paddingBottom: '4px',
                  marginBottom: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px' }}>{cfg.icon}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: cfg.badgeColor,
                      letterSpacing: '0.3px',
                    }}
                  >
                    {cfg.name}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '8px',
                    padding: '2px 5px',
                    borderRadius: '4px',
                    backgroundColor: cfg.badgeBg,
                    color: cfg.badgeColor,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {cfg.badge}
                </span>
              </div>

              {/* Message Body (100% Crisp HTML Text, Auto-wrapping, Zero Blur) */}
              <div
                className="crisp-speech-text"
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  lineHeight: '1.45',
                  color: '#f8fafc',
                  wordBreak: 'break-word',
                  textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                }}
              >
                ...
              </div>

              {/* Downward Pointer Triangle (Tail) towards character head */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '7px solid transparent',
                  borderRight: '7px solid transparent',
                  borderTop: `8px solid ${cfg.borderColor}`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-6.5px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '7px solid rgba(15, 23, 42, 0.95)',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 3D FLOATING RPG ACTION / EMOTE POPUPS */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 25,
        }}
      >
        {screenPopups.map((popup) => (
          <div
            key={popup.id}
            style={{
              position: 'absolute',
              left: `${popup.x}px`,
              top: `${popup.y}px`,
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '11px',
              fontWeight: 700,
              color: popup.color,
              textShadow: '0 0 8px rgba(0,0,0,0.95), 0 2px 4px #000',
              opacity: popup.opacity,
              pointerEvents: 'none',
              transition: 'opacity 0.1s linear',
              whiteSpace: 'nowrap',
            }}
          >
            {popup.text}
          </div>
        ))}
      </div>

      {/* PROXIMITY ACTION HUD (Retro Arcade Prompt Wheel) */}
      {proximityHUD && (
        <div
          style={{
            position: 'absolute',
            bottom: isMobile ? '56px' : '72px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(12px)',
            border: `1.5px solid ${proximityHUD.color}`,
            borderRadius: '12px',
            padding: isMobile ? '8px 12px' : '10px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '8px' : '14px',
            boxShadow: `0 8px 30px rgba(0, 0, 0, 0.8), 0 0 16px ${proximityHUD.color}40`,
            maxWidth: 'calc(100vw - 24px)',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span
              style={{
                fontSize: '9px',
                fontFamily: "'Press Start 2P', monospace",
                color: proximityHUD.color,
                letterSpacing: '0.5px',
              }}
            >
              {proximityHUD.badge}
            </span>
            <span
              style={{
                fontSize: '9px',
                fontFamily: "'Press Start 2P', monospace",
                color: '#f8fafc',
                fontWeight: 600,
              }}
            >
              {proximityHUD.title}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {proximityHUD.type === 'eah' ? (
              <>
                <button
                  onClick={() => {
                    const eah = charactersRef.current['eah'];
                    if (eah) {
                      const quotes = [
                        "Hello Dylan! You are doing amazing as CEO! ✨",
                        "I'm always cheering for you, Dylan! Everything is running smoothly. 👑",
                        "Great work leading the AI agents today, Dylan! 💖",
                      ];
                      eah.speechText = quotes[Math.floor(Math.random() * quotes.length)];
                      eah.speechTimer = 5.5;
                      play8BitGameSound('heart');
                      addFloatingPopup('✨ +50 FOCUS XP', eah.group.position.x, 2.8, eah.group.position.z, '#fb7185');
                    }
                  }}
                  style={{
                    background: 'rgba(244, 63, 94, 0.25)',
                    border: '1px solid #f43f5e',
                    color: '#fb7185',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '8px',
                    fontFamily: "'Press Start 2P', monospace",
                    cursor: 'pointer',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <IconHeart size={12} color="#fb7185" />
                  [E] TALK
                </button>
                <button
                  onClick={handleDylanGiveFlowers}
                  style={{
                    background: 'rgba(244, 63, 94, 0.35)',
                    border: '1px solid #f43f5e',
                    color: '#ffe4e6',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '8px',
                    fontFamily: "'Press Start 2P', monospace",
                    cursor: 'pointer',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 0 10px rgba(244, 63, 94, 0.4)',
                  }}
                >
                  <IconSparkles size={12} color="#fb7185" />
                  [F] FLOWERS 💐
                </button>
                <button
                  onClick={handleDylanCookForEah}
                  style={{
                    background: 'rgba(245, 158, 11, 0.35)',
                    border: '1px solid #f59e0b',
                    color: '#fef3c7',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '8px',
                    fontFamily: "'Press Start 2P', monospace",
                    cursor: 'pointer',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)',
                  }}
                >
                  <IconFlame size={12} color="#f59e0b" />
                  [G] COOK FOR EAH 🍳
                </button>
                <button
                  onClick={handleEahCookBreakfast}
                  style={{
                    background: 'rgba(245, 158, 11, 0.20)',
                    border: '1px solid rgba(245, 158, 11, 0.5)',
                    color: '#fcd34d',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '8px',
                    fontFamily: "'Press Start 2P', monospace",
                    cursor: 'pointer',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <IconFlame size={12} color="#fcd34d" />
                  [C] ASK COOK
                </button>
                <button
                  onClick={handleEahBrewCoffee}
                  style={{
                    background: 'rgba(168, 85, 247, 0.20)',
                    border: '1px solid rgba(168, 85, 247, 0.5)',
                    color: '#c084fc',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '8px',
                    fontFamily: "'Press Start 2P', monospace",
                    cursor: 'pointer',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <IconCoffee size={12} color="#c084fc" />
                  [B] ASK COFFEE
                </button>
              </>
            ) : proximityHUD.type === 'puppy' ? (
              <button
                onClick={() => {
                  puppySpeechRef.current = {
                    text: 'WOOF WOOF! 🐾 *wags tail excitedly for Dylan Ramos!*',
                    timer: 4.5,
                  };
                  const pupX = puppyRef.current ? puppyRef.current.group.position.x : OFFICE_3D_LAYOUT.REST_AREA.dogBed.x;
                  const pupZ = puppyRef.current ? puppyRef.current.group.position.z : OFFICE_3D_LAYOUT.REST_AREA.dogBed.z;
                  addFloatingPopup('🐾 +20 HAPPINESS', pupX, 1.8, pupZ, '#f59e0b');
                }}
                style={{
                  background: 'rgba(245, 158, 11, 0.25)',
                  border: '1px solid #f59e0b',
                  color: '#fcd34d',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '10px',
                  fontFamily: "'Press Start 2P', monospace",
                  cursor: 'pointer',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <IconHeart size={12} color="#fcd34d" />
                [E] PET MOCHI
              </button>
            ) : proximityHUD.type === 'cat' ? (
              <button
                onClick={() => {
                  catSpeechRef.current = {
                    text: 'Purrrrrrr... Nyaa~ 💕 *Snowy leans in for warm chin scratches & purrs*',
                    timer: 5.0,
                  };
                  const catX = catRef.current ? catRef.current.group.position.x : OFFICE_3D_LAYOUT.REST_AREA.catBed.x;
                  const catZ = catRef.current ? catRef.current.group.position.z : OFFICE_3D_LAYOUT.REST_AREA.catBed.z;
                  addFloatingPopup('🐱 +150 HAPPINESS! *soft purring & cozy headbonk!*', catX, 1.8, catZ, '#38bdf8');
                  play8BitGameSound('meow');
                  playSfx('click');
                }}
                style={{
                  background: 'rgba(56, 189, 248, 0.25)',
                  border: '1px solid #38bdf8',
                  color: '#bae6fd',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '10px',
                  fontFamily: "'Press Start 2P', monospace",
                  cursor: 'pointer',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <IconHeart size={12} color="#38bdf8" />
                [E] PET SNOWY
              </button>
            ) : proximityHUD.type === 'arcade' ? (
              <button
                onClick={() => {
                  const dylan = charactersRef.current['dylan'];
                  if (dylan) {
                    dylan.walkTo(10.2, 14.65);
                    dylan.currentActivity = 'playing_arcade';
                    dylan.group.rotation.y = Math.PI;
                    play8BitGameSound('quest');
                    addFloatingPopup('HIGH SCORE: 128,400 PTS!', 10.2, 2.6, 14.0, '#ec4899');
                    dylan.setSpeech('Speedrunning personal best on Retro Arcade! 128,400 pts!', 5.0);
                  }
                }}
                style={{
                  background: 'rgba(236, 72, 153, 0.25)',
                  border: '1px solid #ec4899',
                  color: '#f472b6',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '10px',
                  fontFamily: "'Press Start 2P', monospace",
                  cursor: 'pointer',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <IconGamepad size={12} color="#f472b6" />
                [E] PLAY ARCADE
              </button>
            ) : proximityHUD.type === 'server' ? (
              <button
                onClick={() => {
                  setIsServerModalOpen(true);
                  play8BitGameSound('quest');
                  addFloatingPopup('ZERO-TRUST AUDIT: All 4 Server Racks 100% Secure!', 34.0, 3.2, 5.0, '#00f59b');
                  if (charactersRef.current['zane']) {
                    charactersRef.current['zane'].setSpeech('Zero-trust mainframe terminal online, Boss Dylan! Racks 1-4 synced.', 6.0);
                  }
                }}
                style={{
                  background: 'rgba(34, 197, 94, 0.25)',
                  border: '1px solid #22c55e',
                  color: '#4ade80',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '10px',
                  fontFamily: "'Press Start 2P', monospace",
                  cursor: 'pointer',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <IconShield size={12} color="#4ade80" />
                [E] AUDIT SERVERS
              </button>
            ) : proximityHUD.type === 'water' ? (
              <button
                onClick={() => {
                  const dylan = charactersRef.current['dylan'];
                  if (dylan) {
                    play8BitGameSound('coin');
                    playSfx('click');
                    addFloatingPopup('💧 +100 HYDRATION! Ice-cold mineral water! 🧊✨', 22.4, 2.8, 11.8, '#38bdf8');
                    dylan.setSpeech('💧 Grabbing a cup of cold mineral water before the meeting! Refreshing! ✨', 4.0);
                  }
                }}
                style={{
                  background: 'rgba(56, 189, 248, 0.25)',
                  border: '1px solid #38bdf8',
                  color: '#38bdf8',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '10px',
                  fontFamily: "'Press Start 2P', monospace",
                  cursor: 'pointer',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <IconZap size={12} color="#38bdf8" />
                [E] DRINK WATER
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* 3D CONTROLS TIP BANNER (Bottom Left - Responsive) */}
      <div
        style={{
          position: 'absolute',
          bottom: isMobile ? '10px' : '16px',
          left: isMobile ? '10px' : '20px',
          zIndex: 20,
          background: 'rgba(15, 23, 42, 0.90)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(99, 115, 178, 0.3)',
          borderRadius: '8px',
          padding: isMobile ? '6px 10px' : '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: isMobile ? '7.5px' : '8.5px',
          fontFamily: "'Press Start 2P', monospace",
          color: '#94a3b8',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
          maxWidth: isMobile ? 'calc(100vw - 20px)' : 'calc(100vw - 40px)',
          whiteSpace: 'nowrap',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        <IconGamepad size={isMobile ? 13 : 15} color="#38bdf8" />
        <span>
          {isMobile
            ? 'Drag to Orbit • Pinch/Wheel to Zoom • [E] Interact'
            : isTablet
            ? 'WASD to Walk • Drag to Orbit • Wheel to Zoom • [E] Interact'
            : 'WASD to Walk • Left-Drag to Tilt & Orbit • Right-Drag to Pan • Wheel to Zoom • [C] Cook • [B] Coffee • [E] Interact'}
        </span>
      </div>


      {/* High-Tech Cyber Security & Server Vault Operations Modal */}
      <ServerRoomModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        onAuditFinished={(msg) => addFloatingPopup(msg, 34.0, 3.2, 5.0, '#00f59b')}
      />
    </div>
  );
}

