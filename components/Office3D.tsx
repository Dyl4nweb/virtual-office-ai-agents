'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MEETING_SCRIPT, CASUAL_CONVERSATIONS } from './PixelOffice';

// ============================================================================
// SHARED 3D OFFICE LAYOUT CONTRACT (MATCHES PIXEL VIEW 1:1)
// ============================================================================
export const OFFICE_3D_LAYOUT = {
  GRID_WIDTH: 30,
  GRID_HEIGHT: 22,

  // 1. CEO Executive Suite (Zone 1, Top-Left) - Desk & Chair Face Sliding Door (+z)
  CEO: {
    desk: { x: 5.0, z: 4.6 },
    chair: { x: 5.0, z: 3.2 },
    bookshelf: { x: 1.2, z: 2.5 },
    sofa: { x: 3.6, z: 9.5 },
    coffeeTable: { x: 6.0, z: 9.5 },
    plant: { x: 8.5, z: 2.2 },
    doorway: { x: 10.0, z: 8.5 },
  },

  // 2. Team Open Bullpen (Zone 2, Top-Right) - 2x3 Specialized Grid
  DESKS: {
    dylan: { x: 5.0, z: 4.6, chair: { x: 5.0, z: 3.2 } },
    // Row 1 (AI Researcher, Designer, Fullstack Dev)
    ray: { x: 13.5, z: 3.6, chair: { x: 13.5, z: 4.8 } },
    maya: { x: 19.5, z: 3.6, chair: { x: 19.5, z: 4.8 } },
    alex: { x: 25.5, z: 3.6, chair: { x: 25.5, z: 4.8 } },
    // Row 2 (Marketing Strategist, Cybersecurity)
    wendy: { x: 16.5, z: 7.8, chair: { x: 16.5, z: 9.0 } },
    zane: { x: 22.5, z: 7.8, chair: { x: 22.5, z: 9.0 } },
  },

  AMENITIES: {
    waterCooler: { x: 28.0, z: 4.5 },
    miniFridge: { x: 12.8, z: 8.5 },
  },

  // 3. Boardroom (Zone 3, Bottom) - 6 Executive Conference Seats
  BOARDROOM: {
    table: { x: 15.0, z: 16.5, width: 10.2, depth: 3.2 },
    screen: { x: 13.2, z: 11.15 },
    doors: { x: 18.5, z: 11.0 },
    seats: {
      dylan: { x: 9.2, z: 16.5 }, // Head of table (CEO Dylan)
      // North side (3 specialists)
      ray: { x: 12.0, z: 14.4 },
      maya: { x: 15.0, z: 14.4 },
      alex: { x: 18.0, z: 14.4 },
      // South side (2 specialists)
      wendy: { x: 13.5, z: 18.6 },
      zane: { x: 16.5, z: 18.6 },
    },
  },

  // 4. Team Relaxation & Coffee Lounge (Zone 4, Bottom-Right)
  REST_AREA: {
    rug: { x: 25.0, z: 16.5, width: 7.0, depth: 7.0 },
    sofa: { x: 25.0, z: 14.5, width: 4.8, depth: 1.2 },
    coffeeTable: { x: 25.0, z: 16.5, width: 2.8, depth: 1.4 },
    workBench: { x: 25.4, z: 18.6, width: 3.8, depth: 1.0 },
    espressoBar: { x: 22.0, z: 19.0, width: 1.6, depth: 2.4 },
    arcadeCabinet: { x: 28.0, z: 14.5, width: 1.2, depth: 1.2 },
    plant: { x: 28.5, z: 19.5 },
    seats: {
      dylan: { x: 23.2, z: 18.5 }, // Espresso bar counter
      ray: { x: 23.8, z: 14.8 },   // Velvet sofa seat 1
      maya: { x: 25.4, z: 14.8 },  // Velvet sofa seat 2
      alex: { x: 24.2, z: 18.2 },  // Collaborative work bench seat 1
      wendy: { x: 26.4, z: 18.2 }, // Collaborative work bench seat 2
      zane: { x: 28.0, z: 15.6 },  // Arcade lounge seat
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
  // Outer perimeter
  if (x < 1.0 || x > 28.8 || z < 1.0 || z > 20.8) return true;

  // Glass Wall between CEO & Bullpen (x = 10, ONLY in z in [1, 11]!)
  // Doorway is at z in [7.2, 10.2]
  if (x >= 9.6 && x <= 10.4 && z <= 11.0) {
    if (z < 7.2 || z > 10.2) return true;
  }

  // Horizontal Glass Wall between Bullpen & Boardroom (z = 11, x in [1, 29])
  // Double doors are at x in [16.5, 20.5]
  if (z >= 10.6 && z <= 11.4) {
    if (x < 16.5 || x > 20.5) return true;
  }

  // Vertical Glass Divider between Zone 5 (Kitchen & Garden) & Boardroom (x = 8, z in [11, 21])
  // Doorway is at z in [12.5, 15.5]
  if (x >= 7.6 && x <= 8.4 && z >= 11.0 && z <= 21.0) {
    if (z < 12.5 || z > 15.5) return true;
  }

  // Dividing Wall & Sliding Patio Glass Door between Kitchen & Outdoor Garden (z = 16, x in [1, 8])
  // Sliding Patio Doorway is at x in [3.4, 5.6]
  if (z >= 15.6 && z <= 16.4 && x >= 1.0 && x <= 8.0) {
    if (x < 3.4 || x > 5.6) return true;
  }

  // Vertical Glass Divider between Boardroom & Lounge (x = 21, z in [11, 21])
  // Doorway is at z in [12.5, 15.5]
  if (x >= 20.6 && x <= 21.4 && z >= 11.0 && z <= 21.0) {
    if (z < 12.5 || z > 15.5) return true;
  }

  // Kitchen Counters & Waterfall Island (Zone 5A)
  if (x >= 1.2 && x <= 7.4 && z >= 11.1 && z <= 12.1) return true; // Back counter & fridge
  if (x >= 2.2 && x <= 6.8 && z >= 13.2 && z <= 14.4) return true; // Waterfall Quartz Island

  // Outdoor Zen Garden Patio (Zone 5B)
  if (x >= 3.4 && x <= 5.6 && z >= 17.8 && z <= 19.2) return true; // Slatted Teak Table
  if (x >= 1.2 && x <= 2.5 && z >= 16.8 && z <= 18.2) return true; // Zen Stone Fountain

  // CEO Furniture (Executive Desk facing Door at z = 4.6)
  if (x >= 3.2 && x <= 6.8 && z >= 3.8 && z <= 5.5) return true; // CEO Desk
  if (x >= 0.8 && x <= 1.8 && z >= 1.5 && z <= 3.5) return true; // Bookshelf
  if (x >= 2.4 && x <= 4.8 && z >= 8.8 && z <= 10.2) return true; // Sofa

  // Bullpen 5 Workstation Desks Grid (Row 1 at z=3.6, Row 2 at z=7.8)
  const isRow1Desk = (z >= 3.0 && z <= 4.2) && ((x >= 12.4 && x <= 14.6) || (x >= 18.4 && x <= 20.6) || (x >= 24.4 && x <= 26.6));
  const isRow2Desk = (z >= 7.2 && z <= 8.4) && ((x >= 15.4 && x <= 17.6) || (x >= 21.4 && x <= 23.6));
  if (isRow1Desk || isRow2Desk) return true;

  // Boardroom Conference Table (table surface is x: 9.9..20.1, z: 14.9..18.1)
  // Generous margin around all edges so characters can walk around freely:
  if (x >= 10.2 && x <= 19.8 && z >= 15.1 && z <= 17.9) return true;

  // Rest Area Lounge Furniture (x: 21..29, z: 13..21)
  if (x >= 22.6 && x <= 27.4 && z >= 13.8 && z <= 15.0) return true; // Sofa back
  if (x >= 23.6 && x <= 26.4 && z >= 15.8 && z <= 17.2) return true; // Coffee table
  if (x >= 23.5 && x <= 27.3 && z >= 18.4 && z <= 19.1) return true; // Collaborative work bench
  if (x >= 21.2 && x <= 22.8 && z >= 17.8 && z <= 20.2) return true; // Espresso counter
  if (x >= 27.4 && x <= 28.8 && z >= 13.8 && z <= 15.2) return true; // Arcade cabinet

  return false;
}

// Smart 3D Path Routing through Doorways
export function findPath3D(
  startX: number,
  startZ: number,
  targetX: number,
  targetZ: number
): Array<{ x: number; z: number }> {
  const getZone = (x: number, z: number) => {
    if (x <= 10.0 && z <= 11.0) return 'ceo';
    if (x > 10.0 && z <= 11.0) return 'bullpen';
    if (x < 8.0 && z > 11.0 && z <= 16.0) return 'kitchen';
    if (x < 8.0 && z > 16.0) return 'garden';
    if (x > 21.0 && z > 11.0) return 'lounge';
    return 'boardroom';
  };

  const sZone = getZone(startX, startZ);
  const tZone = getZone(targetX, targetZ);

  if (sZone === tZone) {
    if (sZone === 'ceo') {
      if ((startZ < 3.8 && targetZ > 5.5) || (startZ > 5.5 && targetZ < 3.8)) {
        return [
          { x: 8.5, z: startZ },
          { x: 8.5, z: targetZ },
          { x: targetX, z: targetZ },
        ];
      }
    }
    if (sZone === 'bullpen') {
      const midZ = 6.4;
      if ((startZ < midZ && targetZ > midZ) || (startZ > midZ && targetZ < midZ)) {
        return [
          { x: startX, z: midZ },
          { x: 19.0, z: midZ },
          { x: 19.0, z: targetZ },
          { x: targetX, z: targetZ },
        ];
      }
    }
    if (sZone === 'boardroom') {
      if ((startX < 10.5 && targetX > 10.5) || (startX > 10.5 && targetX < 10.5)) {
        return [
          { x: startX < 10.5 ? 9.2 : startX, z: 13.5 },
          { x: targetX < 10.5 ? 9.2 : targetX, z: 13.5 },
          { x: targetX, z: targetZ },
        ];
      }
    }
    return [{ x: targetX, z: targetZ }];
  }

  const ceoDoor = { x: 10.0, z: 8.6 };
  const boardDoors = { x: 18.5, z: 11.0 };
  const recDoor = { x: 8.0, z: 14.0 };
  const patioDoor = { x: 4.5, z: 16.0 };
  const loungeDoor = { x: 21.0, z: 14.0 };
  const path: Array<{ x: number; z: number }> = [];

  // Special case: Direct transit between Kitchen & Outdoor Garden
  if (sZone === 'kitchen' && tZone === 'garden') {
    path.push({ x: 4.5, z: 14.8 });
    path.push(patioDoor);
    path.push({ x: targetX, z: targetZ });
    return path;
  }
  if (sZone === 'garden' && tZone === 'kitchen') {
    path.push({ x: 4.5, z: 17.5 });
    path.push(patioDoor);
    path.push({ x: targetX, z: targetZ });
    return path;
  }

  // 1. Exit start zone into common transit point:
  if (sZone === 'ceo') {
    if (startZ < 3.8) path.push({ x: 8.5, z: startZ });
    path.push({ x: 8.5, z: 8.6 });
    path.push(ceoDoor);
    path.push({ x: 11.5, z: 8.6 });
    if (tZone === 'bullpen') {
      path.push({ x: 11.5, z: 6.4 });
      path.push({ x: targetX, z: 6.4 });
    } else {
      path.push({ x: 18.5, z: 8.6 });
      path.push(boardDoors);
      path.push({ x: 18.5, z: 13.5 });
    }
  } else if (sZone === 'bullpen') {
    path.push({ x: startX, z: 6.4 });
    if (tZone === 'ceo') {
      path.push({ x: 11.5, z: 6.4 });
      path.push({ x: 11.5, z: 8.6 });
      path.push(ceoDoor);
      path.push({ x: 8.5, z: 8.6 });
    } else {
      path.push({ x: 18.5, z: 6.4 });
      path.push(boardDoors);
      path.push({ x: 18.5, z: 13.5 });
    }
  } else if (sZone === 'kitchen') {
    path.push({ x: 4.5, z: 14.0 });
    path.push(recDoor);
    path.push({ x: 9.5, z: 13.5 });
  } else if (sZone === 'garden') {
    path.push({ x: 4.5, z: 17.5 });
    path.push(patioDoor);
    path.push({ x: 4.5, z: 14.0 });
    path.push(recDoor);
    path.push({ x: 9.5, z: 13.5 });
  } else if (sZone === 'lounge') {
    path.push({ x: 22.5, z: 14.0 });
    path.push(loungeDoor);
    path.push({ x: 18.5, z: 13.5 });
  } else if (sZone === 'boardroom') {
    if (startX < 10.5) path.push({ x: 9.2, z: 13.5 });
    else path.push({ x: 18.5, z: 13.5 });
  }

  // 2. If destination is other zones from the Boardroom aisle:
  if (tZone === 'ceo' && sZone !== 'bullpen') {
    path.push({ x: 18.5, z: 13.5 });
    path.push(boardDoors);
    path.push({ x: 18.5, z: 8.6 });
    path.push({ x: 11.5, z: 8.6 });
    path.push(ceoDoor);
    path.push({ x: 8.5, z: 8.6 });
    if (targetZ < 3.8) path.push({ x: 8.5, z: targetZ });
  } else if (tZone === 'bullpen' && sZone !== 'ceo') {
    path.push({ x: 18.5, z: 13.5 });
    path.push(boardDoors);
    path.push({ x: 18.5, z: 6.4 });
    path.push({ x: targetX, z: 6.4 });
  } else if (tZone === 'kitchen') {
    path.push({ x: 9.5, z: 13.5 });
    path.push(recDoor);
    path.push({ x: 5.5, z: 14.0 });
  } else if (tZone === 'garden') {
    path.push({ x: 9.5, z: 13.5 });
    path.push(recDoor);
    path.push({ x: 4.5, z: 14.8 });
    path.push(patioDoor);
    path.push({ x: 4.5, z: 17.5 });
  } else if (tZone === 'lounge') {
    path.push({ x: 18.5, z: 13.5 });
    path.push(loungeDoor);
    path.push({ x: 22.5, z: 14.0 });
  } else if (tZone === 'boardroom') {
    if (targetX < 10.5) path.push({ x: 9.2, z: 13.5 });
  }

  path.push({ x: targetX, z: targetZ });
  return path;
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
};

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
    | 'meeting' = 'idle';

  private upperBodyGroup: THREE.Group;
  private head: THREE.Mesh;
  private torso: THREE.Mesh;
  private leftLegGroup: THREE.Group;
  private rightLegGroup: THREE.Group;
  private leftFootGroup: THREE.Group;
  private rightFootGroup: THREE.Group;
  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private laptopGroup: THREE.Group;
  private lapScreenPivot: THREE.Group;
  private drinkPropGroup: THREE.Group;
  private coffeeMug: THREE.Mesh;
  private waterCup: THREE.Mesh;
  private cueStickGroup: THREE.Group;
  public speechText = '';
  public speechTimer = 0;
  private selectionRing: THREE.Mesh;
  private statusParticles: THREE.Group;

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
    // Dylan faces South (+z, towards door); bullpen specialists face North (-z, towards desk)
    this.group.rotation.y = id === 'dylan' ? 0 : Math.PI;

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffdfba });
    const shirtMat = new THREE.MeshLambertMaterial({ color: shirtColor });
    const hairMat = new THREE.MeshLambertMaterial({ color: hairColor });
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });

    // Distinct character shoes with high-contrast soles for crystal-clear walking steps
    let shoeColor = 0x9a3412; // Dylan: Rich cognac leather
    let soleColor = 0xfef3c7; // Cream welt sole
    if (id === 'ray') {
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

    // Torso
    this.torso = new THREE.Mesh(boxGeo, shirtMat);
    this.torso.scale.set(0.65, 0.62, 0.42);
    this.torso.position.y = 0.9;
    this.torso.castShadow = true;
    this.upperBodyGroup.add(this.torso);

    // Head
    this.head = new THREE.Mesh(boxGeo, skinMat);
    this.head.scale.set(0.5, 0.5, 0.5);
    this.head.position.y = 1.46;
    this.head.castShadow = true;
    this.upperBodyGroup.add(this.head);

    // Hair
    const hair = new THREE.Mesh(boxGeo, hairMat);
    hair.scale.set(0.54, 0.24, 0.54);
    hair.position.set(0, 1.63, 0);
    this.upperBodyGroup.add(hair);

    // Eyes
    const leftEye = new THREE.Mesh(boxGeo, eyeMat);
    leftEye.scale.set(0.08, 0.08, 0.05);
    leftEye.position.set(-0.12, 1.48, 0.26);
    this.upperBodyGroup.add(leftEye);

    const rightEye = new THREE.Mesh(boxGeo, eyeMat);
    rightEye.scale.set(0.08, 0.08, 0.05);
    rightEye.position.set(0.12, 1.48, 0.26);
    this.upperBodyGroup.add(rightEye);

    // Founder Gold Lapel Badge for Dylan
    if (id === 'dylan') {
      const badgeMat = new THREE.MeshLambertMaterial({ color: 0xffbe0b, emissive: 0xffbe0b, emissiveIntensity: 0.6 });
      const badge = new THREE.Mesh(boxGeo, badgeMat);
      badge.scale.set(0.12, 0.12, 0.05);
      badge.position.set(0.16, 1.05, 0.22);
      this.upperBodyGroup.add(badge);
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
    // LEFT LEG
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.18, 0.58, 0);
    const leftThigh = new THREE.Mesh(boxGeo, pantsMat);
    leftThigh.scale.set(0.24, 0.44, 0.24);
    leftThigh.position.set(0, -0.22, 0);
    leftThigh.castShadow = true;
    this.leftLegGroup.add(leftThigh);

    // Left Foot Group (Pivoting at ankle y = -0.44)
    this.leftFootGroup = new THREE.Group();
    this.leftFootGroup.position.set(0, -0.44, 0);
    // Main shoe body
    const leftShoe = new THREE.Mesh(boxGeo, shoeMat);
    leftShoe.scale.set(0.26, 0.12, 0.36);
    leftShoe.position.set(0, -0.04, 0.06);
    leftShoe.castShadow = true;
    this.leftFootGroup.add(leftShoe);
    // Toe cap
    const leftToe = new THREE.Mesh(boxGeo, shoeMat);
    leftToe.scale.set(0.24, 0.09, 0.14);
    leftToe.position.set(0, -0.05, 0.20);
    leftToe.castShadow = true;
    this.leftFootGroup.add(leftToe);
    // Contrasting sole
    const leftSole = new THREE.Mesh(boxGeo, soleMat);
    leftSole.scale.set(0.28, 0.04, 0.38);
    leftSole.position.set(0, -0.11, 0.06);
    leftSole.castShadow = true;
    this.leftFootGroup.add(leftSole);
    this.leftLegGroup.add(this.leftFootGroup);
    this.group.add(this.leftLegGroup);

    // RIGHT LEG
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.18, 0.58, 0);
    const rightThigh = new THREE.Mesh(boxGeo, pantsMat);
    rightThigh.scale.set(0.24, 0.44, 0.24);
    rightThigh.position.set(0, -0.22, 0);
    rightThigh.castShadow = true;
    this.rightLegGroup.add(rightThigh);

    // Right Foot Group (Pivoting at ankle y = -0.44)
    this.rightFootGroup = new THREE.Group();
    this.rightFootGroup.position.set(0, -0.44, 0);
    // Main shoe body
    const rightShoe = new THREE.Mesh(boxGeo, shoeMat);
    rightShoe.scale.set(0.26, 0.12, 0.36);
    rightShoe.position.set(0, -0.04, 0.06);
    rightShoe.castShadow = true;
    this.rightFootGroup.add(rightShoe);
    // Toe cap
    const rightToe = new THREE.Mesh(boxGeo, shoeMat);
    rightToe.scale.set(0.24, 0.09, 0.14);
    rightToe.position.set(0, -0.05, 0.20);
    rightToe.castShadow = true;
    this.rightFootGroup.add(rightToe);
    // Contrasting sole
    const rightSole = new THREE.Mesh(boxGeo, soleMat);
    rightSole.scale.set(0.28, 0.04, 0.38);
    rightSole.position.set(0, -0.11, 0.06);
    rightSole.castShadow = true;
    this.rightFootGroup.add(rightSole);
    this.rightLegGroup.add(this.rightFootGroup);
    this.group.add(this.rightLegGroup);

    // Selection Indicator Ring on Floor
    const ringGeo = new THREE.RingGeometry(0.55, 0.75, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    this.selectionRing = new THREE.Mesh(ringGeo, ringMat);
    this.selectionRing.position.y = 0.04;
    this.selectionRing.visible = false;
    this.group.add(this.selectionRing);

    // Floating Working Tech Particles
    this.statusParticles = new THREE.Group();
    const pMat = new THREE.MeshLambertMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.8 });
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
    // DYNAMIC PORTABLE LAPTOP MODEL FOR LOUNGE WORKING
    // ==========================================
    this.laptopGroup = new THREE.Group();
    const lapSilverMat = new THREE.MeshLambertMaterial({ color: 0xcfd8dc });
    const lapDarkMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });

    // Laptop Base Deck / Keyboard
    const lapBase = new THREE.Mesh(boxGeo, lapSilverMat);
    lapBase.scale.set(0.48, 0.024, 0.32);
    lapBase.position.set(0, 0, 0.16);
    this.laptopGroup.add(lapBase);

    const lapKeys = new THREE.Mesh(boxGeo, lapDarkMat);
    lapKeys.scale.set(0.42, 0.015, 0.15);
    lapKeys.position.set(0, 0.014, 0.11);
    this.laptopGroup.add(lapKeys);

    // Screen Lid (Angled open ~105 degrees towards character face)
    this.lapScreenPivot = new THREE.Group();
    this.lapScreenPivot.position.set(0, 0.012, 0.01);
    this.lapScreenPivot.rotation.x = -Math.PI / 1.7;

    const lapLid = new THREE.Mesh(boxGeo, lapSilverMat);
    lapLid.scale.set(0.48, 0.32, 0.02);
    lapLid.position.set(0, 0.16, 0);
    this.lapScreenPivot.add(lapLid);

    // Role-tailored emissive screen display
    const roleColors: Record<string, number> = {
      dylan: 0x00f0ff,
      alex: 0xf97316,
      maya: 0xec4899,
      wendy: 0x10b981,
      ray: 0x38bdf8,
      zane: 0x22c55e,
    };
    const scrColor = roleColors[id] || 0x00f0ff;
    const lapScreenMat = new THREE.MeshLambertMaterial({
      color: scrColor,
      emissive: scrColor,
      emissiveIntensity: 0.95,
    });
    const lapDisplay = new THREE.Mesh(boxGeo, lapScreenMat);
    lapDisplay.scale.set(0.44, 0.28, 0.01);
    lapDisplay.position.set(0, 0.16, -0.012);
    this.lapScreenPivot.add(lapDisplay);

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
          if (Math.hypot(this.currentX - this.deskX, this.currentZ - this.deskZ) < 1.0) {
            this.isSeated = true;
            this.currentActivity = 'working';
            this.group.rotation.y = this.id === 'dylan' ? 0 : Math.PI; // Dylan faces Door (0), specialists face Desk (PI)
          } else if (this.currentX >= 21.0 && this.currentZ >= 13.0) {
            // Arrived at Lounge Area
            if (this.currentX > 27.0 && this.currentZ < 16.5) {
              this.isSeated = false;
              this.currentActivity = 'playing_arcade';
              this.group.rotation.y = 0; // Face arcade screen
            } else if (this.currentX <= 23.2 && this.currentZ >= 17.5) {
              this.isSeated = false;
              this.currentActivity = 'drinking_coffee';
              this.group.rotation.y = -Math.PI / 2; // Face espresso counter
            } else if (this.currentZ < 16.0) {
              this.isSeated = true;
              this.currentActivity = 'sofa_relax';
              this.group.rotation.y = 0; // Sofa faces south into room
            } else {
              this.isSeated = true;
              this.currentActivity = 'working';
              this.group.rotation.y = Math.PI; // Bench faces north towards coffee table
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
          } else if (this.currentX >= 8.5 && this.currentX <= 20.0 && this.currentZ >= 13.5 && this.currentZ <= 19.5) {
            // Arrived at Boardroom Conference Seat
            this.isSeated = true;
            this.currentActivity = 'meeting';
            if (this.currentZ < 15.5) {
              this.group.rotation.y = 0; // North seats face south
            } else if (this.currentZ > 17.5) {
              this.group.rotation.y = Math.PI; // South seats face north
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

      if (isWalkingWithLaptop) {
        this.laptopGroup.visible = true;
        // Fold screen lid flat shut while walking
        this.lapScreenPivot.rotation.x = 0;

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
      const seatHipAngle = -Math.PI / 2.3;
      this.leftLegGroup.rotation.x = THREE.MathUtils.lerp(0, seatHipAngle, this.sitTransition);
      this.rightLegGroup.rotation.x = THREE.MathUtils.lerp(0, seatHipAngle, this.sitTransition);

      const seatFootAngle = Math.PI / 2.3;
      this.leftFootGroup.rotation.x = THREE.MathUtils.lerp(0, seatFootAngle, this.sitTransition);
      this.rightFootGroup.rotation.x = THREE.MathUtils.lerp(0, seatFootAngle, this.sitTransition);

      this.leftLegGroup.position.y = 0.58;
      this.rightLegGroup.position.y = 0.58;

      const idleBob = Math.sin(this.animTimer * 2.5) * 0.02;
      const seatDrop = -0.16; // Lowered onto chair cushion
      this.upperBodyGroup.position.y = THREE.MathUtils.lerp(idleBob, seatDrop, this.sitTransition);

      // 3. MULTI-ACTIVITY PROCEDURAL ANIMATION SYSTEM (Drinking, Gaming, Kitchen, Garden, Sofa Relax, & Meeting)
      const isNearWater = Math.hypot(this.currentX - 28.0, this.currentZ - 4.5) < 1.8;
      const isNearCoffee = Math.hypot(this.currentX - 22.0, this.currentZ - 19.0) < 1.8;
      const isNearArcade = Math.hypot(this.currentX - 28.0, this.currentZ - 14.5) < 1.6 || Math.hypot(this.currentX - 28.0, this.currentZ - 15.6) < 1.6;
      const isAtBilliards = false;
      const isAtKitchen = this.currentX <= 8.0 && this.currentZ >= 11.0 && this.currentZ <= 16.0;
      const isAtGarden = this.currentX <= 8.0 && this.currentZ > 16.0;
      const isAtSofa = this.currentX >= 23.0 && this.currentX <= 27.5 && this.currentZ >= 14.0 && this.currentZ <= 15.8;
      const isAtWorkBench = this.currentX >= 23.0 && this.currentX <= 27.8 && this.currentZ >= 17.5 && this.currentZ <= 19.5;
      const isAtBoardTable = (this.currentX >= 8.5 && this.currentX <= 19.5 && this.currentZ >= 13.5 && this.currentZ <= 19.5) || Math.hypot(this.currentX - this.seatX, this.currentZ - this.seatZ) < 1.4;

      // Reset prop visibility defaults
      this.laptopGroup.visible = false;
      this.drinkPropGroup.visible = false;
      this.cueStickGroup.visible = false;
      this.head.rotation.set(0, 0, 0);

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
        // C. LEGIT RETRO ARCADE GAMING ANIMATION (Vigorous Joystick + Rapid Button Tapping + Body Bob)
        this.leftArmGroup.rotation.x = -0.88 + Math.sin(this.animTimer * 14) * 0.25;
        this.leftArmGroup.rotation.z = Math.cos(this.animTimer * 14) * 0.18;
        this.rightArmGroup.rotation.x = -0.82 + Math.sin(this.animTimer * 24) * 0.35;
        this.rightArmGroup.rotation.z = -0.10;
        this.upperBodyGroup.position.y = Math.abs(Math.sin(this.animTimer * 12)) * 0.06;
        this.upperBodyGroup.rotation.x = 0.08;
        this.head.rotation.x = 0.14; // Looking up at CRT screen

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
        this.laptopGroup.rotation.y = 0;
        this.laptopGroup.rotation.z = THREE.MathUtils.lerp(0.12, 0, t);

        this.laptopGroup.scale.set(
          THREE.MathUtils.lerp(0.82, 1.05, t),
          THREE.MathUtils.lerp(0.82, 1.05, t),
          THREE.MathUtils.lerp(0.82, 1.05, t)
        );

        this.lapScreenPivot.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 1.7, t);

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
        this.laptopGroup.rotation.y = 0;
        this.laptopGroup.rotation.z = THREE.MathUtils.lerp(0.12, 0, t);

        this.laptopGroup.scale.set(
          THREE.MathUtils.lerp(0.82, 1.05, t),
          THREE.MathUtils.lerp(0.82, 1.05, t),
          THREE.MathUtils.lerp(0.82, 1.05, t)
        );

        this.lapScreenPivot.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 1.7, t);

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
        // E. LUXURY VELVET SOFA RELAXATION POSE
        this.upperBodyGroup.position.y = -0.22 + Math.sin(this.animTimer * 1.8) * 0.02; // Deep cushion sink & relaxed breathing
        this.upperBodyGroup.rotation.x = -0.16; // Leaning back comfortably
        this.leftArmGroup.rotation.x = -0.25;
        this.leftArmGroup.rotation.z = 0.44;   // Left arm resting along sofa backrest
        this.rightArmGroup.rotation.x = -0.65;
        this.rightArmGroup.rotation.z = 0;
        this.drinkPropGroup.visible = true;
        this.coffeeMug.visible = true;         // Holding coffee mug leisurely

      } else if (isAtWorkBench && this.isSeated && !this.isWalking) {
        // F. COLLABORATIVE OAK BENCH LAPTOP WORKING
        this.laptopGroup.visible = true;
        const targetBenchY = 0.52;
        const targetBenchZ = 0.30;
        const t = this.sitTransition;

        this.laptopGroup.position.x = THREE.MathUtils.lerp(0.26, 0, t);
        this.laptopGroup.position.y = THREE.MathUtils.lerp(0.62, targetBenchY, t);
        this.laptopGroup.position.z = THREE.MathUtils.lerp(0.02, targetBenchZ, t);

        this.laptopGroup.rotation.x = THREE.MathUtils.lerp(Math.PI / 2, 0, t);
        this.laptopGroup.rotation.y = 0;
        this.laptopGroup.rotation.z = THREE.MathUtils.lerp(0.12, 0, t);

        this.laptopGroup.scale.set(
          THREE.MathUtils.lerp(0.82, 1.0, t),
          THREE.MathUtils.lerp(0.82, 1.0, t),
          THREE.MathUtils.lerp(0.82, 1.0, t)
        );

        // Screen lid smoothly unfolds open as the character sits down
        this.lapScreenPivot.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 1.7, t);

        const typeL = -0.85 + Math.sin(this.animTimer * 12) * 0.14;
        const typeR = -0.85 + Math.cos(this.animTimer * 12) * 0.14;
        this.leftArmGroup.rotation.x = THREE.MathUtils.lerp(-0.20, typeL, t);
        this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(-0.28, typeR, t);
        this.leftArmGroup.rotation.z = 0;
        this.rightArmGroup.rotation.z = THREE.MathUtils.lerp(-0.26, 0, t);

      } else if (this.currentActivity === 'meeting' || (isAtBoardTable && this.isSeated && !this.isWalking)) {
        // G. EXECUTIVE BOARDROOM ALL-HANDS CONFERENCE SEATED POSTURE WITH VISIBLE LAPTOP ON TABLE!
        this.laptopGroup.visible = true;
        const targetTableY = 0.865; // High table surface top (table center 0.76 + half-height 0.105)
        const targetTableZ = this.id === 'dylan' ? 0.78 : 0.58;
        const t = this.sitTransition;

        // Smooth procedural transition from under-arm carry (t=0) to resting on table (t=1)
        this.laptopGroup.position.x = THREE.MathUtils.lerp(0.26, 0, t);
        this.laptopGroup.position.y = THREE.MathUtils.lerp(0.62, targetTableY, t);
        this.laptopGroup.position.z = THREE.MathUtils.lerp(0.02, targetTableZ, t);

        this.laptopGroup.rotation.x = THREE.MathUtils.lerp(Math.PI / 2, 0, t);
        this.laptopGroup.rotation.y = 0;
        this.laptopGroup.rotation.z = THREE.MathUtils.lerp(0.12, 0, t);

        this.laptopGroup.scale.set(
          THREE.MathUtils.lerp(0.82, 1.15, t),
          THREE.MathUtils.lerp(0.82, 1.15, t),
          THREE.MathUtils.lerp(0.82, 1.15, t)
        );

        // Screen lid smoothly unfolds open as the character sits down
        this.lapScreenPivot.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 1.7, t);

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
        // H. STANDARD DESK TYPING POSTURE
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
  }
}

// ============================================================================
// MAIN OFFICE 3D REACT COMPONENT
// ============================================================================
export interface Office3DProps {
  selectedAgentId?: string | null;
  onSelectAgent?: (id: string | null) => void;
}

export default function Office3D({ selectedAgentId, onSelectAgent }: Office3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const charactersRef = useRef<Record<string, VoxelCharacter3D>>({});
  const onSelectAgentRef = useRef(onSelectAgent);
  onSelectAgentRef.current = onSelectAgent;

  // React state for HUD
  const [inMeetingMode, setInMeetingMode] = useState(false);
  const [inRestMode, setInRestMode] = useState(false);
  const [isDylanSeated, setIsDylanSeated] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isCrispMode, setIsCrispMode] = useState(true);
  const isCrispModeRef = useRef(true);
  isCrispModeRef.current = isCrispMode;
  const inMeetingModeRef = useRef(false);
  inMeetingModeRef.current = inMeetingMode;
  const inRestModeRef = useRef(false);
  inRestModeRef.current = inRestMode;
  const [inKitchenGardenMode, setInKitchenGardenMode] = useState(false);
  const inKitchenGardenModeRef = useRef(false);
  inKitchenGardenModeRef.current = inKitchenGardenMode;

  // Real-time dialogue sequencing refs for boardroom meetings & office banter
  const meetingDialogueTimerRef = useRef(3.5);
  const meetingDialogueIndexRef = useRef(0);
  const casualChatTimerRef = useRef(10.0);
  const pendingReplyRef = useRef<{ speaker: string; text: string; delay: number } | null>(null);

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

  // All-Hands Rest & Relaxation in Coffee Lounge
  const handleToggleRestMode = () => {
    playSfx('drink');
    const nextRest = !inRestMode;
    setInRestMode(nextRest);
    if (nextRest && inMeetingMode) {
      setInMeetingMode(false);
    }

    Object.values(charactersRef.current).forEach((char) => {
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

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Pixel render target (480x320)
    const pixelWidth = 480;
    const pixelHeight = 320;
    const renderTarget = new THREE.WebGLRenderTarget(pixelWidth, pixelHeight, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
    });

    const postScene = new THREE.Scene();
    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const postMaterial = new THREE.MeshBasicMaterial({ map: renderTarget.texture });
    const postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMaterial);
    postScene.add(postQuad);

    // --- 2. Isometric Camera Setup ---
    const aspect = width / height;
    const frustumSize = 25;
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      -100,
      1000
    );

    const centerPoint = new THREE.Vector3(15, 0, 11);
    const isoDistance = 42;
    camera.position.set(
      centerPoint.x + isoDistance,
      centerPoint.y + isoDistance * 1.15,
      centerPoint.z + isoDistance
    );
    camera.lookAt(centerPoint);

    // --- 3. Studio Office Lighting ---
    const ambientLight = new THREE.AmbientLight(0xa0b4d0, 1.1);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff6e6, 1.5);
    dirLight.position.set(35, 45, 25);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    const sSize = 26;
    dirLight.shadow.camera.left = -sSize;
    dirLight.shadow.camera.right = sSize;
    dirLight.shadow.camera.top = sSize;
    dirLight.shadow.camera.bottom = -sSize;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x4a6090, 0.45);
    fillLight.position.set(-25, 25, -25);
    scene.add(fillLight);

    // Synthwave glowing desk light in CEO office
    const ceoLight = new THREE.PointLight(0x00f0ff, 1.2, 8);
    ceoLight.position.set(5.0, 2.0, 4.6);
    scene.add(ceoLight);

    // --- 4. Materials Palette ---
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const mats = {
      ceoNavyFloor: new THREE.MeshLambertMaterial({ color: 0x161e2e }),
      ceoRug: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      bullpenFloor: new THREE.MeshLambertMaterial({ color: 0x7a969e }),
      bullpenAlt: new THREE.MeshLambertMaterial({ color: 0x6f8b93 }),
      boardroomFloor: new THREE.MeshLambertMaterial({ color: 0x543d2b }),
      outerBorder: new THREE.MeshLambertMaterial({ color: 0xf3e3c3 }),
      glassWall: new THREE.MeshLambertMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 }),
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
      tableGlass: new THREE.MeshLambertMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 }),
      coolerBase: new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }),
      coolerJug: new THREE.MeshLambertMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 }),
      boardTable: new THREE.MeshLambertMaterial({ color: 0x2d1810 }),
      boardScreen: new THREE.MeshLambertMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.9 }),
      duckYellow: new THREE.MeshLambertMaterial({ color: 0xfacc15 }),
      plantGreen: new THREE.MeshLambertMaterial({ color: 0x15803d }),
      potOrange: new THREE.MeshLambertMaterial({ color: 0xc2410c }),
      // Zone 4 Coffee Lounge & Rest Area Materials
      loungeRug: new THREE.MeshLambertMaterial({ color: 0x312e81 }),
      loungeSofa: new THREE.MeshLambertMaterial({ color: 0x047857 }),
      loungeSofaTrim: new THREE.MeshLambertMaterial({ color: 0x064e3b }),
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

    function addVoxel(x: number, y: number, z: number, mat: THREE.Material, sx = 1, sy = 1, sz = 1, shadow = true) {
      const mesh = new THREE.Mesh(boxGeo, mat);
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      mesh.castShadow = shadow;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    }

    // --- 5. Build Floors & Glass Partition Walls Matching Pixel View ---
    const { GRID_WIDTH, GRID_HEIGHT } = OFFICE_3D_LAYOUT;

    for (let x = 0; x < GRID_WIDTH; x++) {
      for (let z = 0; z < GRID_HEIGHT; z++) {
        let fMat = mats.outerBorder;

        // ZONE 1: CEO Suite
        if (x <= 10 && z <= 11) {
          fMat = (x >= 2 && x <= 8 && z >= 2 && z <= 8) ? mats.ceoRug : mats.ceoNavyFloor;
        }
        // ZONE 2: Team Bullpen (Chevron teal)
        else if (x > 10 && z <= 11) {
          fMat = ((x + z) % 2 === 0) ? mats.bullpenFloor : mats.bullpenAlt;
        }
        // ZONE 5A: Gourmet Pantry & Kitchen (Indoor: x < 8, z in 11..16)
        else if (x < 8 && z > 11 && z <= 16) {
          fMat = (x + z) % 2 === 0 ? mats.kitchenTileLight : mats.kitchenTileDark;
        }
        // ZONE 5B: Outdoor Zen Garden & Patio Terrace (Outdoor: x < 8, z > 16)
        else if (x < 8 && z > 16) {
          if (x >= 2 && x <= 7 && z >= 17 && z <= 20) {
            fMat = mats.gardenDeck;
          } else {
            fMat = (x === 1 || z === 21) ? mats.gardenGrass : mats.gardenPaver;
          }
        }
        // ZONE 4: Rest Area & Coffee Lounge (Indigo rug in bottom-right)
        else if (x >= 22 && x <= 28 && z >= 13 && z <= 20) {
          fMat = mats.loungeRug;
        }
        // ZONE 3: Boardroom (Mahogany wood in center suite)
        else if (z > 11) {
          fMat = mats.boardroomFloor;
        }

        addVoxel(x, -0.5, z, fMat, 1, 1, 1, false);

        // Glass Dividing Walls with Overhead Track & Continuous Lintels
        // Vertical Wall between CEO & Bullpen (x = 10, z in [1, 11])
        if (x === 10 && z <= 11) {
          if (z < 7 || z > 10) {
            addVoxel(x, 1.0, z, mats.glassWall, 0.2, 2.0, 1.0);
          }
          // Continuous overhead header lintel / transom track across doorway
          addVoxel(x, 2.1, z, mats.wallTrim, 0.24, 0.2, 1.0);
        }

        // Horizontal Wall between Bullpen & Boardroom (z = 11, x in [1, 29])
        if (z === 11 && x >= 1 && x <= 29) {
          if (x < 17 || x > 20) {
            addVoxel(x, 1.0, z, mats.glassWall, 1.0, 2.0, 0.2);
          }
          // Continuous overhead header lintel / transom track across boardroom doorway
          addVoxel(x, 2.1, z, mats.wallTrim, 1.0, 0.2, 0.24);
        }

        // Vertical Glass Divider between Zone 5 (Kitchen & Garden) & Boardroom (x = 8, z in [11, 21])
        if (x === 8 && z >= 11 && z <= 21) {
          if (z < 13 || z > 15) {
            addVoxel(x, 1.0, z, mats.glassWall, 0.2, 2.0, 1.0);
          }
          addVoxel(x, 2.1, z, mats.wallTrim, 0.24, 0.2, 1.0);
        }

        // Dividing Wall & Sliding Patio Glass Door between Kitchen & Outdoor Garden (z = 16, x in [1, 8])
        if (z === 16 && x >= 1 && x <= 8) {
          if (x < 3 || x > 5) {
            addVoxel(x, 1.0, z, mats.doorGlass, 1.0, 2.0, 0.16);
            addVoxel(x, 2.05, z, mats.doorFrameDark, 1.0, 0.12, 0.22);
          } else {
            // Sliding patio door threshold & top track
            addVoxel(x, 0.015, z, mats.doorThreshold, 1.0, 0.03, 0.28);
            addVoxel(x, 2.05, z, mats.doorTrackSilver, 1.0, 0.12, 0.26);
          }
        }

        // Vertical Glass Divider between Boardroom & Rest Lounge (x = 21, z in [11, 21])
        if (x === 21 && z >= 11 && z <= 21) {
          if (z < 13 || z > 15) {
            addVoxel(x, 1.0, z, mats.glassWall, 0.2, 2.0, 1.0);
          }
          addVoxel(x, 2.1, z, mats.wallTrim, 0.24, 0.2, 1.0);
        }
      }
    }

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

    // 1. CEO SUITE SLIDING GLASS DOOR (x = 10.0, doorway z: 6.9..10.1, center z = 8.5)
    // Fixed Doorway Frame & Threshold:
    // Left jamb post
    addVoxel(10.0, 1.0, 6.85, mats.doorJambDark, 0.26, 2.0, 0.20);
    // Right jamb post
    addVoxel(10.0, 1.0, 10.15, mats.doorJambDark, 0.26, 2.0, 0.20);
    // Overhead heavy-duty sliding guide track
    addVoxel(10.0, 1.95, 8.5, mats.doorTrackSilver, 0.28, 0.10, 3.48);
    // Flush floor threshold guide plate
    addVoxel(10.0, 0.015, 8.5, mats.doorThreshold, 0.32, 0.03, 3.40);
    // Top PIR presence sensor housing & dynamic LED
    addVoxel(10.0, 2.08, 8.5, mats.doorJambDark, 0.30, 0.08, 0.36);
    addVoxel(10.16, 2.08, 8.5, ceoSensorMat, 0.04, 0.04, 0.12, false); // facing bullpen
    addVoxel(9.84, 2.08, 8.5, ceoSensorMat, 0.04, 0.04, 0.12, false);  // facing CEO suite

    // CEO Executive Wall Plaque
    // Facing Bullpen (x = 10.14)
    addVoxel(10.14, 1.70, 6.45, mats.deskTrimBrass, 0.04, 0.32, 0.88);
    addVoxel(10.16, 1.70, 6.45, mats.doorFrameDark, 0.03, 0.24, 0.80);
    addVoxel(10.18, 1.70, 6.45, mats.goldAccent, 0.02, 0.10, 0.68, false); // Engraved text bar
    // Facing CEO Suite (x = 9.86)
    addVoxel(9.86, 1.70, 6.45, mats.deskTrimBrass, 0.04, 0.32, 0.88);
    addVoxel(9.84, 1.70, 6.45, mats.doorFrameDark, 0.03, 0.24, 0.80);
    addVoxel(9.82, 1.70, 6.45, mats.goldAccent, 0.02, 0.10, 0.68, false);

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
    // Chrome vertical architectural pull handles (on both sides)
    // Bullpen side:
    addDoorVoxel(ceoDoorGroup, 0.08, 1.0, -1.1, mats.chairChrome, 0.03, 0.76, 0.03);
    addDoorVoxel(ceoDoorGroup, 0.05, 1.32, -1.1, mats.chairChrome, 0.05, 0.03, 0.03);
    addDoorVoxel(ceoDoorGroup, 0.05, 0.68, -1.1, mats.chairChrome, 0.05, 0.03, 0.03);
    // CEO side:
    addDoorVoxel(ceoDoorGroup, -0.08, 1.0, -1.1, mats.chairChrome, 0.03, 0.76, 0.03);
    addDoorVoxel(ceoDoorGroup, -0.05, 1.32, -1.1, mats.chairChrome, 0.05, 0.03, 0.03);
    addDoorVoxel(ceoDoorGroup, -0.05, 0.68, -1.1, mats.chairChrome, 0.05, 0.03, 0.03);
    // Top roller trolley brackets
    addDoorVoxel(ceoDoorGroup, 0, 1.96, -0.9, mats.chairChrome, 0.12, 0.05, 0.08);
    addDoorVoxel(ceoDoorGroup, 0, 1.96, 0.9, mats.chairChrome, 0.12, 0.05, 0.08);

    // 2. BOARDROOM DOUBLE BI-PARTING FRENCH SLIDING DOORS (z = 11.0, x: 16.5..20.5, center x = 18.5)
    // Fixed Doorway Frame & Threshold:
    // Left jamb post
    addVoxel(16.5, 1.0, 11.0, mats.doorJambDark, 0.18, 2.0, 0.26);
    // Right jamb post
    addVoxel(20.5, 1.0, 11.0, mats.doorJambDark, 0.18, 2.0, 0.26);
    // Overhead heavy-duty double sliding track
    addVoxel(18.5, 1.95, 11.0, mats.doorTrackSilver, 4.16, 0.10, 0.28);
    // Flush floor threshold guide plate
    addVoxel(18.5, 0.015, 11.0, mats.doorThreshold, 4.10, 0.03, 0.32);
    // Overhead center motion sensor housing & dynamic LED
    addVoxel(18.5, 2.08, 11.0, mats.doorJambDark, 0.36, 0.08, 0.30);
    addVoxel(18.5, 2.08, 11.16, boardSensorMat, 0.12, 0.04, 0.04, false); // facing bullpen
    addVoxel(18.5, 2.08, 10.84, boardSensorMat, 0.12, 0.04, 0.04, false); // facing boardroom

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

      // 2. DISPLAY SETUP (Dual Monitors, Single Monitor, or Laptop-Only)
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

        // Secondary KPI display:
        addVoxel(deskX + 1.15, 1.42, deskZ + 0.22, mats.wallTrim, 0.65, 0.95, 0.08);
        addVoxel(deskX + 1.15, 1.42, deskZ + 0.17, mats.screenGoldKPI, 0.58, 0.88, 0.02);

      } else if (agentId === 'alex' || agentId === 'ray') {
        // DUAL 27" MONITORS (Desktop Developer / AI Researcher - NO LAPTOP)
        // Monitor arm base clamp & vertical pole
        addVoxel(deskX, 0.88, deskZ - 0.62, mats.wallTrim, 0.22, 0.24, 0.14);
        addVoxel(deskX, 1.25, deskZ - 0.62, mats.wallTrim, 0.10, 0.72, 0.10);
        addVoxel(deskX - 0.48, 1.35, deskZ - 0.56, mats.wallTrim, 0.90, 0.08, 0.08);
        addVoxel(deskX + 0.48, 1.35, deskZ - 0.56, mats.wallTrim, 0.90, 0.08, 0.08);

        const s1Mat = agentId === 'alex' ? mats.screenAlexIDE : mats.screenBlueCode;
        const s2Mat = agentId === 'alex' ? mats.screenAlexTerm : mats.screenCode;

        // Monitor 1 (Left): Back facing north (-z), Screen facing south (+z towards person)
        addVoxel(deskX - 0.55, 1.38, deskZ - 0.38, mats.wallTrim, 1.05, 0.70, 0.06);
        addVoxel(deskX - 0.55, 1.38, deskZ - 0.34, s1Mat, 0.98, 0.64, 0.02);

        // Monitor 2 (Right): Back facing north (-z), Screen facing south (+z towards person)
        addVoxel(deskX + 0.55, 1.38, deskZ - 0.38, mats.wallTrim, 1.05, 0.70, 0.06);
        addVoxel(deskX + 0.55, 1.38, deskZ - 0.34, s2Mat, 0.98, 0.64, 0.02);



      } else if (agentId === 'maya' || agentId === 'zane') {
        // SINGLE 32" MONITOR (Accompanied by an open laptop on the side)
        addVoxel(deskX + 0.15, 0.88, deskZ - 0.60, mats.wallTrim, 0.24, 0.24, 0.16);
        addVoxel(deskX + 0.15, 1.25, deskZ - 0.60, mats.wallTrim, 0.10, 0.70, 0.10);

        const singleMat = agentId === 'maya' ? mats.screenFigmaPink : mats.screenZaneRadar;
        // Back facing north (-z), Screen facing south (+z towards person)
        addVoxel(deskX + 0.15, 1.40, deskZ - 0.40, mats.wallTrim, 1.35, 0.78, 0.06);
        addVoxel(deskX + 0.15, 1.40, deskZ - 0.36, singleMat, 1.28, 0.72, 0.02);

      } else if (agentId === 'wendy') {
        // LAPTOP-ONLY WORKSTATION (No big desktop monitors! Clean ergonomic laptop stand)
        // Aluminum ergonomic stand riser
        addVoxel(deskX, 0.82, deskZ - 0.12, mats.chairChrome, 0.36, 0.04, 0.26);
        addVoxel(deskX, 0.90, deskZ - 0.12, mats.chairChrome, 0.10, 0.14, 0.10);
        addVoxel(deskX, 0.97, deskZ - 0.08, mats.chairChrome, 0.50, 0.03, 0.30);

        // Open 16" MacBook Pro resting on elevated stand - SCREEN FACING WENDY (+z)!
        // Base / Keyboard
        addVoxel(deskX, 0.99, deskZ - 0.04, mats.laptopSilver, 0.54, 0.025, 0.34);
        addVoxel(deskX, 1.005, deskZ - 0.08, mats.wallTrim, 0.46, 0.015, 0.18);
        addVoxel(deskX, 1.005, deskZ + 0.05, mats.laptopSilver, 0.20, 0.015, 0.09); // Trackpad
        // Screen Lid: Back casing facing north (-z), Glowing screen facing SOUTH (+z towards Wendy!)
        addVoxel(deskX, 1.20, deskZ - 0.22, mats.laptopSilver, 0.54, 0.38, 0.025);
        addVoxel(deskX, 1.20, deskZ - 0.205, mats.screenGreenCopy, 0.48, 0.32, 0.015);

        // Wireless Magic Keyboard & Mouse on desk in front of stand
        addVoxel(deskX, 0.815, deskZ + 0.26, mats.chairChrome, 0.60, 0.025, 0.18);
        addVoxel(deskX + 0.42, 0.815, deskZ + 0.26, mats.chairChrome, 0.10, 0.025, 0.14);
      }

      // 3. OPEN LAPTOPS (Dylan, Maya, Zane only - Wendy already has centered laptop)
      const hasSideLaptop = agentId === 'maya' || agentId === 'zane';

      if (isDylan) {
        // Dylan (CEO): Executive MacBook Pro - FACING DYLAN (-z direction)
        const lapMat = mats.laptopSilver;
        // Base on Dylan's side
        addVoxel(deskX - 1.05, 0.85, deskZ - 0.22, lapMat, 0.54, 0.03, 0.38);
        addVoxel(deskX - 1.05, 0.87, deskZ - 0.16, mats.wallTrim, 0.46, 0.015, 0.20);
        addVoxel(deskX - 1.05, 0.87, deskZ - 0.32, lapMat, 0.20, 0.015, 0.10);
        // Open tilted display lid facing Dylan (-z)
        addVoxel(deskX - 1.05, 1.03, deskZ - 0.04, lapMat, 0.54, 0.36, 0.03);
        addVoxel(deskX - 1.05, 1.03, deskZ - 0.055, mats.screenSynth, 0.48, 0.30, 0.02);

      } else if (hasSideLaptop) {
        // Maya & Zane: Dedicated Laptop on Left Side of Desk - FACING THE AGENT (+z direction)!
        const lapMat = agentId === 'zane' ? mats.laptopDark : mats.laptopSilver;
        const lapScreen = agentId === 'maya' ? mats.screenPalette : mats.screenZaneMatrix;

        // Base placed between screen and character (character is at chairZ = deskZ + 1.2)
        addVoxel(deskX - 0.95, 0.81, deskZ + 0.12, lapMat, 0.52, 0.025, 0.34);
        addVoxel(deskX - 0.95, 0.825, deskZ + 0.06, mats.wallTrim, 0.44, 0.015, 0.18); // keyboard
        addVoxel(deskX - 0.95, 0.825, deskZ + 0.20, lapMat, 0.18, 0.015, 0.08); // trackpad closer to person

        // Open upright display lid:
        // Back casing facing north (-z towards wall):
        addVoxel(deskX - 0.95, 1.00, deskZ - 0.06, lapMat, 0.52, 0.36, 0.025);
        // Glowing screen facing SOUTH (+z DIRECTLY FACING AGENT & VIEWERS!):
        addVoxel(deskX - 0.95, 1.00, deskZ - 0.045, lapScreen, 0.46, 0.30, 0.015);
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

      // 5. Gaming/Workstation Tower PC with Tempered Glass & Glowing RGB Internals
      const hasTowerPC = agentId === 'alex' || agentId === 'ray' || agentId === 'nora' || agentId === 'maya' || agentId === 'zane';
      if (hasTowerPC) {
        const rgbMat =
          agentId === 'maya'
            ? mats.rgbTowerPink
            : agentId === 'alex'
            ? mats.rgbTowerOrange
            : agentId === 'nora'
            ? mats.rgbTowerEmerald
            : agentId === 'zane'
            ? mats.rgbTowerGreen
            : mats.rgbTowerCyan;

        addVoxel(deskX + 1.25, 0.45, deskZ + 0.05, mats.wallTrim, 0.38, 0.76, 0.68);
        addVoxel(deskX + 1.05, 0.45, deskZ + 0.05, rgbMat, 0.02, 0.64, 0.56);
        addVoxel(deskX + 1.04, 0.45, deskZ + 0.05, mats.tableGlass, 0.02, 0.68, 0.60);
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

    // Bookshelf with Gold Trophy on CEO Left Wall
    addVoxel(OFFICE_3D_LAYOUT.CEO.bookshelf.x, 1.5, OFFICE_3D_LAYOUT.CEO.bookshelf.z, mats.bookshelf, 0.8, 3.0, 1.8);
    addVoxel(OFFICE_3D_LAYOUT.CEO.bookshelf.x + 0.2, 2.2, OFFICE_3D_LAYOUT.CEO.bookshelf.z, mats.trophy, 0.3, 0.4, 0.3);

    // CEO Private Leather Lounge Sofa & Glass Table
    addVoxel(OFFICE_3D_LAYOUT.CEO.sofa.x, 0.5, OFFICE_3D_LAYOUT.CEO.sofa.z, mats.sofaLeather, 2.2, 0.6, 1.0);
    addVoxel(OFFICE_3D_LAYOUT.CEO.coffeeTable.x, 0.4, OFFICE_3D_LAYOUT.CEO.coffeeTable.z, mats.tableGlass, 1.2, 0.4, 0.8);

    // Ficus Palm Plant in CEO Suite
    addVoxel(OFFICE_3D_LAYOUT.CEO.plant.x, 0.4, OFFICE_3D_LAYOUT.CEO.plant.z, mats.potOrange, 0.7, 0.8, 0.7);
    addVoxel(OFFICE_3D_LAYOUT.CEO.plant.x, 1.3, OFFICE_3D_LAYOUT.CEO.plant.z, mats.plantGreen, 1.2, 1.2, 1.2);

    // Water Cooler on Right Wall
    const wc = OFFICE_3D_LAYOUT.AMENITIES.waterCooler;
    addVoxel(wc.x, 0.6, wc.z, mats.coolerBase, 0.8, 1.2, 0.8);
    addVoxel(wc.x, 1.5, wc.z, mats.coolerJug, 0.6, 0.7, 0.6);

    // C. Boardroom Conference Suite (Zone 3)
    const bt = OFFICE_3D_LAYOUT.BOARDROOM.table;
    addVoxel(bt.x, 0.75, bt.z, mats.boardTable, bt.width, 0.2, bt.depth);
    addVoxel(bt.x, 0.76, bt.z, mats.wallTrim, bt.width - 0.4, 0.21, bt.depth - 0.4);
    addVoxel(bt.x - 3.0, 0.37, bt.z, mats.deskTrim, 0.6, 0.75, 1.4);
    addVoxel(bt.x + 3.0, 0.37, bt.z, mats.deskTrim, 0.6, 0.75, 1.4);

    // 5 Executive Conference Swivel Chairs around Table
    Object.entries(OFFICE_3D_LAYOUT.BOARDROOM.seats).forEach(([chairId, seat]) => {
      const isHead = chairId === 'dylan';
      const isTop = seat.z < bt.z;
      const facing = isHead ? 'right' : isTop ? 'down' : 'up';
      buildErgonomicChair(seat.x, seat.z, facing, isHead);
    });

    // Boardroom Executive Presentation Display System (Mounted on solid glass partition at x = 13.2, leaving doorway completely clear)
    const scr = OFFICE_3D_LAYOUT.BOARDROOM.screen;
    // Heavy-duty dual steel wall-mounting arm brackets
    addVoxel(scr.x - 0.9, 1.95, 11.06, mats.wallTrim, 0.10, 0.80, 0.12);
    addVoxel(scr.x + 0.9, 1.95, 11.06, mats.wallTrim, 0.10, 0.80, 0.12);
    // TV Slim Bezel (Obsidian Titanium Frame, 3.4m wide x 1.45m high)
    addVoxel(scr.x, 1.95, scr.z - 0.03, mats.wallTrim, 3.40, 1.45, 0.08);
    // 85" Ultra-HD Luminous Presentation Display (Facing Boardroom at z = 11.18)
    addVoxel(scr.x, 1.95, scr.z + 0.02, mats.boardScreen, 3.24, 1.32, 0.04);
    // High-End Integrated Conference Video Soundbar (Underneath screen)
    addVoxel(scr.x, 1.15, scr.z, mats.doorFrameDark, 2.20, 0.12, 0.14);
    addVoxel(scr.x, 1.15, scr.z + 0.06, mats.wallTrim, 2.10, 0.08, 0.03);
    // 4K Wide-Angle Conference AI Camera (Centered on top of screen)
    addVoxel(scr.x, 2.74, scr.z, mats.doorFrameDark, 0.36, 0.08, 0.12);
    addVoxel(scr.x, 2.74, scr.z + 0.06, mats.chairChrome, 0.08, 0.04, 0.03, false);

    // D. Relaxation & Coffee Lounge (Zone 4, Bottom-Right)
    const ra = OFFICE_3D_LAYOUT.REST_AREA;

    // 1. Emerald Velvet Sectional Sofa with Throw Pillows
    addVoxel(ra.sofa.x, 0.45, ra.sofa.z, mats.loungeSofa, ra.sofa.width, 0.45, ra.sofa.depth);
    addVoxel(ra.sofa.x, 0.85, ra.sofa.z - 0.45, mats.loungeSofaTrim, ra.sofa.width, 0.65, 0.3);
    addVoxel(ra.sofa.x - ra.sofa.width / 2 + 0.2, 0.65, ra.sofa.z, mats.loungeSofaTrim, 0.4, 0.5, ra.sofa.depth);
    addVoxel(ra.sofa.x + ra.sofa.width / 2 - 0.2, 0.65, ra.sofa.z, mats.loungeSofaTrim, 0.4, 0.5, ra.sofa.depth);
    // Gold/Cream Plush Throw Pillows
    addVoxel(ra.sofa.x - 1.6, 0.68, ra.sofa.z - 0.1, mats.trophy, 0.38, 0.38, 0.14);
    addVoxel(ra.sofa.x + 1.6, 0.68, ra.sofa.z - 0.1, mats.trophy, 0.38, 0.38, 0.14);

    // 2. Glass Coffee Table with Steaming Espresso Mugs & Design Magazine
    addVoxel(ra.coffeeTable.x, 0.35, ra.coffeeTable.z, mats.tableGlass, ra.coffeeTable.width, 0.25, ra.coffeeTable.depth);
    addVoxel(ra.coffeeTable.x - 0.9, 0.17, ra.coffeeTable.z, mats.wallTrim, 0.15, 0.35, 0.8);
    addVoxel(ra.coffeeTable.x + 0.9, 0.17, ra.coffeeTable.z, mats.wallTrim, 0.15, 0.35, 0.8);
    addVoxel(ra.coffeeTable.x - 0.5, 0.52, ra.coffeeTable.z, mats.whiteDesk, 0.18, 0.18, 0.18);
    addVoxel(ra.coffeeTable.x + 0.3, 0.52, ra.coffeeTable.z + 0.2, mats.espressoRed, 0.18, 0.18, 0.18);
    // Design Portfolio Catalog on Glass Table
    addVoxel(ra.coffeeTable.x + 0.6, 0.50, ra.coffeeTable.z - 0.15, mats.screenFigmaPink, 0.40, 0.04, 0.30);

    // 2B. NEW! COLLABORATIVE OAK & COGNAC LEATHER LAPTOP WORK BENCH (Bench 2)
    const wb = ra.workBench;
    // Bench Oak Wooden Frame / Base
    addVoxel(wb.x, 0.44, wb.z, mats.bookshelf, wb.width, 0.44, wb.depth);
    // Beveled golden oak top rim
    addVoxel(wb.x, 0.48, wb.z, mats.trophy, wb.width + 0.1, 0.04, wb.depth + 0.1);
    // Padded Cognac Leather Cushions (Seat 1 on left, Seat 2 on right)
    addVoxel(wb.x - 0.95, 0.54, wb.z, mats.sofaLeather, 1.5, 0.12, wb.depth - 0.1);
    addVoxel(wb.x + 0.95, 0.54, wb.z, mats.sofaLeather, 1.5, 0.12, wb.depth - 0.1);
    // Center brass power hub & USB-C station
    addVoxel(wb.x, 0.52, wb.z, mats.wallTrim, 0.4, 0.08, 0.4);
    addVoxel(wb.x, 0.56, wb.z, mats.screenCode, 0.15, 0.02, 0.15); // Luminous green charging LED
    // Sturdy steel legs with gold brass feet
    addVoxel(wb.x - 1.7, 0.22, wb.z, mats.wallTrim, 0.12, 0.44, 0.6);
    addVoxel(wb.x + 1.7, 0.22, wb.z, mats.wallTrim, 0.12, 0.44, 0.6);
    addVoxel(wb.x - 1.7, 0.04, wb.z, mats.goldAccent, 0.14, 0.08, 0.62);
    addVoxel(wb.x + 1.7, 0.04, wb.z, mats.goldAccent, 0.14, 0.08, 0.62);

    // Modern Wood Slat Acoustic Accent Wall behind Sofa (x: 23.2 to 26.8, z: 12.0)
    for (let sl = 23.2; sl <= 26.8; sl += 0.45) {
      addVoxel(sl, 1.4, 12.05, mats.bookshelf, 0.18, 2.4, 0.06);
    }

    // Warm Ambient Lounge Light for Cozy Boutique Aesthetic
    const loungeLight = new THREE.PointLight(0xffedd5, 2.2, 12, 1.8);
    loungeLight.position.set(25.4, 3.8, 16.5);
    scene.add(loungeLight);

    // 3. Espresso Bar Counter & Italian Chrome Machine with Barstools
    addVoxel(ra.espressoBar.x, 0.6, ra.espressoBar.z, mats.espressoCounter, ra.espressoBar.width, 1.2, ra.espressoBar.depth);
    addVoxel(ra.espressoBar.x, 1.22, ra.espressoBar.z, mats.espressoMarble, ra.espressoBar.width + 0.2, 0.08, ra.espressoBar.depth + 0.2);
    addVoxel(ra.espressoBar.x, 1.5, ra.espressoBar.z - 0.3, mats.espressoRed, 0.8, 0.5, 0.6);
    addVoxel(ra.espressoBar.x, 1.45, ra.espressoBar.z + 0.05, mats.whiteDesk, 0.6, 0.3, 0.15);
    addVoxel(ra.espressoBar.x, 1.35, ra.espressoBar.z + 0.15, mats.goldAccent, 0.4, 0.1, 0.15);
    // Swivel Barstools
    addVoxel(22.0, 0.45, 17.8, mats.chairFrameDark, 0.35, 0.08, 0.35);
    addVoxel(22.0, 0.22, 17.8, mats.chairChrome, 0.10, 0.40, 0.10);
    addVoxel(22.0, 0.45, 20.2, mats.chairFrameDark, 0.35, 0.08, 0.35);
    addVoxel(22.0, 0.22, 20.2, mats.chairChrome, 0.10, 0.40, 0.10);

    // 4. Retro Pixel Arcade Cabinet (glowing CRT screen & illuminated marquee)
    addVoxel(ra.arcadeCabinet.x, 1.1, ra.arcadeCabinet.z, mats.arcadeBody, 1.1, 2.2, 1.1);
    addVoxel(ra.arcadeCabinet.x, 1.05, ra.arcadeCabinet.z + 0.4, mats.deskTrim, 1.0, 0.15, 0.4);
    addVoxel(ra.arcadeCabinet.x - 0.2, 1.18, ra.arcadeCabinet.z + 0.4, mats.espressoRed, 0.08, 0.14, 0.08);
    addVoxel(ra.arcadeCabinet.x + 0.2, 1.14, ra.arcadeCabinet.z + 0.4, mats.goldAccent, 0.12, 0.06, 0.12);
    addVoxel(ra.arcadeCabinet.x, 1.55, ra.arcadeCabinet.z + 0.35, mats.arcadeScreen, 0.85, 0.7, 0.06);
    addVoxel(ra.arcadeCabinet.x, 2.05, ra.arcadeCabinet.z + 0.4, mats.arcadeMarquee, 0.95, 0.25, 0.12);

    // 5. Tall Potted Fig Tree in Corner
    addVoxel(ra.plant.x, 0.5, ra.plant.z, mats.potOrange, 0.9, 1.0, 0.9);
    addVoxel(ra.plant.x, 1.6, ra.plant.z, mats.plantGreen, 1.4, 1.6, 1.4);

    // E. ZONE 5A: GOURMET PANTRY & KITCHEN SUITE (Indoor: x: 1..8, z: 11..16)
    // 1. Double-Door Stainless Smart Refrigerator with Glass Water/Ice Dispenser (x: 1.6, z: 11.6)
    addVoxel(1.6, 1.25, 11.6, mats.kitchenStainless, 1.1, 2.5, 0.9);
    addVoxel(1.6, 1.25, 11.15, mats.wallTrim, 1.05, 2.4, 0.04);
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

    // 7. Panoramic Penthouse Glass Balustrade with Polished Chrome Handrail
    for (let rz = 16.5; rz <= 20.8; rz += 1.0) {
      addVoxel(0.9, 0.55, rz, mats.glassWall, 0.08, 1.10, 1.0);
      addVoxel(0.9, 1.12, rz, mats.chairChrome, 0.12, 0.05, 1.0);
    }
    for (let rx = 1.0; rx <= 7.8; rx += 1.0) {
      addVoxel(rx, 0.55, 21.05, mats.glassWall, 1.0, 1.10, 0.08);
      addVoxel(rx, 1.12, 21.05, mats.chairChrome, 1.0, 0.05, 0.12);
    }

    // --- 7. Spawn the 10 3D Characters (Dylan Ramos CEO + 9 Specialized Autonomous Agents) ---
    const characters: Record<string, VoxelCharacter3D> = {
      dylan: new VoxelCharacter3D(
        'dylan',
        'Dylan Ramos (CEO)',
        0x1e1b4b, // Designer dark navy suit
        0x5c3a21, // Styled brown hair
        OFFICE_3D_LAYOUT.CEO.chair.x,
        OFFICE_3D_LAYOUT.CEO.chair.z,
        OFFICE_3D_LAYOUT.CEO.chair.x,
        OFFICE_3D_LAYOUT.CEO.chair.z,
        OFFICE_3D_LAYOUT.BOARDROOM.seats.dylan.x,
        OFFICE_3D_LAYOUT.BOARDROOM.seats.dylan.z
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

    // --- 9. Camera Controls & Raycasting ---
    const raycaster = new THREE.Raycaster();
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let downPos = { x: 0, y: 0 };
    const panOffset = new THREE.Vector3(0, 0, 0);

    function updateCamera() {
      camera.position.set(
        centerPoint.x + panOffset.x + isoDistance,
        centerPoint.y + isoDistance * 1.15,
        centerPoint.z + panOffset.z + isoDistance
      );
      camera.lookAt(centerPoint.x + panOffset.x, centerPoint.y, centerPoint.z + panOffset.z);
    }

    const onPointerDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      downPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = (e.clientX - prevMouseX) * 0.05;
      const deltaY = (e.clientY - prevMouseY) * 0.05;

      panOffset.x += (deltaX - deltaY) * 0.5;
      panOffset.z += (deltaX + deltaY) * 0.5;

      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      updateCamera();
    };

    const onPointerUp = (e: MouseEvent) => {
      isDragging = false;
      const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);

      if (dist < 6) {
        // Clean Click: Raycast into scene
        const rect = dom.getBoundingClientRect();
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
          playSfx('click');
        } else if (groundHit && !isTileBlocked3D(groundHit.x, groundHit.z)) {
          // Player Click-to-Move for Dylan Ramos in 3D
          const dylan = characters.dylan;
          dylan.walkTo(groundHit.x, groundHit.z);
          setIsDylanSeated(false);
          playSfx('click');
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08;
      camera.zoom = Math.max(0.5, Math.min(camera.zoom * zoomFactor, 2.5));
      camera.updateProjectionMatrix();
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Keyboard WASD Controls for Dylan in 3D
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
        keysPressed.current.add(e.code);
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
    let lastCeoDoorState = 0;
    let lastBoardDoorState = 0;

    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

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

      const ceoTarget = ceoActive ? 1.0 : 0.0;
      const boardTarget = boardActive ? 1.0 : 0.0;

      if (ceoTarget !== lastCeoDoorState) {
        lastCeoDoorState = ceoTarget;
        playSfx('door');
      }
      if (boardTarget !== lastBoardDoorState) {
        lastBoardDoorState = boardTarget;
        playSfx('door');
      }

      ceoDoorProgress += (ceoTarget - ceoDoorProgress) * Math.min(1.0, delta * 4.8);
      boardDoorProgress += (boardTarget - boardDoorProgress) * Math.min(1.0, delta * 4.8);

      // Slide CEO door leaf along Z axis into wall pocket
      ceoDoorGroup.position.z = 8.5 + ceoDoorProgress * 1.85;

      // Bi-part slide Boardroom door leaves along X axis
      boardDoorLeftGroup.position.x = 17.56 - boardDoorProgress * 1.40;
      boardDoorRightGroup.position.x = 19.44 + boardDoorProgress * 1.40;

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

        if (char.id !== 'dylan' && !inMeetingModeRef.current && !inRestModeRef.current && !inKitchenGardenModeRef.current && char.pathQueue.length === 0) {
          if (char.waitTimer > 0) {
            char.waitTimer -= delta;
            if (char.waitTimer <= 0) {
              char.currentActivity = 'working';
              char.walkTo(char.deskX, char.deskZ);
              char.setSpeech('Back to work.');
            }
          } else {
            char.routineTimer -= delta;
            if (char.routineTimer <= 0) {
              char.routineTimer = 12 + Math.random() * 14;
              const act = Math.random();

              if (act < 0.14) {
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
                char.walkTo(OFFICE_3D_LAYOUT.REST_AREA.arcadeCabinet.x, OFFICE_3D_LAYOUT.REST_AREA.arcadeCabinet.z + 1.1);
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
                const restSeat = (OFFICE_3D_LAYOUT.REST_AREA.seats as Record<string, { x: number; z: number }>)[char.id] || { x: 25.0, z: 15.5 };
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
              } else if (act < 0.88) {
                // 6. Work in Boardroom Suite with Laptop at Conference Table!
                char.walkTo(char.seatX, char.seatZ);
                char.currentActivity = 'meeting';
                char.setSpeech('💻 Bringing my laptop to work at the boardroom table!');
                char.waitTimer = 9.0;
              } else if (act < 0.94) {
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

      // 2. Project 3D Overhead Coordinates to 2D Screen Space (100% Crisp HTML, Zero Blur!)
      const currentW = container.clientWidth || window.innerWidth;
      const currentH = container.clientHeight || window.innerHeight;
      const projVec = new THREE.Vector3();

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

      // 3. Render Pipeline: Crisp HD Direct Render OR Retro Low-Res Target
      if (isCrispModeRef.current) {
        renderer.setRenderTarget(null);
        renderer.render(scene, camera);
      } else {
        renderer.setRenderTarget(renderTarget);
        renderer.render(scene, camera);

        renderer.setRenderTarget(null);
        renderer.render(postScene, postCamera);
      }
    };

    animate(performance.now());

    // Window Resize
    const onResize = () => {
      if (!container) return;
      const newW = container.clientWidth || window.innerWidth;
      const newH = container.clientHeight || window.innerHeight;
      const newAspect = newW / newH;

      camera.left = (-frustumSize * newAspect) / 2;
      camera.right = (frustumSize * newAspect) / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
      camera.updateProjectionMatrix();

      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      sse.close();
      dom.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      renderer.dispose();
      renderTarget.dispose();
      if (dom.parentNode) {
        dom.parentNode.removeChild(dom);
      }
    };
  }, [playSfx]);

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
      {/* 3D HUD OVERLAY (Matches Pixel View Theme) */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '16px',
          right: '16px',
          zIndex: 20,
          background: 'rgba(15, 23, 42, 0.94)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(99, 115, 178, 0.35)',
          borderRadius: '8px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.65)',
        }}
      >
        {/* Left: Dylan Ramos Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#00f59b',
              boxShadow: '0 0 10px #00f59b',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '10px',
                color: '#ffbe0b',
                letterSpacing: '0.5px',
              }}
            >
              DYLAN RAMOS
            </span>
            <span style={{ fontSize: '9px', color: '#94a3b8', fontFamily: "'Fira Code', monospace" }}>
              3D Voxel HQ • {isDylanSeated ? '🪑 Seated at Desk' : '🚶 Roaming 3D Office'}
            </span>
          </div>

          <button
            onClick={handleToggleDylanSit}
            style={{
              background: isDylanSeated ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 190, 11, 0.25)',
              border: isDylanSeated ? '1px solid #00f0ff' : '1px solid #ffbe0b',
              color: isDylanSeated ? '#00f0ff' : '#ffbe0b',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '10px',
              fontFamily: "'Fira Code', monospace",
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {isDylanSeated ? '🚶 Stand Up' : '🪑 Sit at Desk'}
          </button>
        </div>

        {/* Center: Team Action Buttons & HD Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleAllWorkersStand}
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              borderRadius: '6px',
              padding: '5px 10px',
              fontSize: '10px',
              fontFamily: "'Press Start 2P', monospace",
              cursor: 'pointer',
            }}
          >
            🤸 WORKERS STAND
          </button>

          {/* Team Rest / Laptop Lounge Work Toggle */}
          <button
            onClick={handleToggleRestMode}
            title="Send team with laptops to work at the lounge sofa & collaborative oak bench"
            style={{
              background: inRestMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.15)',
              border: inRestMode ? '1px solid #10b981' : '1px solid #059669',
              color: inRestMode ? '#34d399' : '#10b981',
              borderRadius: '6px',
              padding: '5px 10px',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '10px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: inRestMode ? '0 0 12px rgba(16, 185, 129, 0.4)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{inRestMode ? '💼' : '🛋️'}</span>
            <span>{inRestMode ? 'DESK WORK' : 'LAPTOP LOUNGE'}</span>
          </button>

          {/* Kitchen & Outdoor Garden Work/Hangout Toggle */}
          <button
            onClick={handleToggleKitchenGarden}
            title="Send team with laptops to work & hang out in the Gourmet Kitchen & Outdoor Zen Garden"
            style={{
              background: inKitchenGardenMode ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.15)',
              border: inKitchenGardenMode ? '1px solid #f59e0b' : '1px solid #d97706',
              color: inKitchenGardenMode ? '#fbbf24' : '#f59e0b',
              borderRadius: '6px',
              padding: '5px 10px',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '10px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: inKitchenGardenMode ? '0 0 12px rgba(245, 158, 11, 0.4)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{inKitchenGardenMode ? '💼' : '☕🌿'}</span>
            <span>{inKitchenGardenMode ? 'DESK WORK' : 'KITCHEN & GARDEN'}</span>
          </button>

          <button
            onClick={handleToggleMeetingMode}
            style={{
              background: inMeetingMode ? 'rgba(255, 190, 11, 0.25)' : 'rgba(0, 240, 255, 0.15)',
              border: inMeetingMode ? '1px solid #ffbe0b' : '1px solid #00f0ff',
              color: inMeetingMode ? '#ffbe0b' : '#00f0ff',
              borderRadius: '6px',
              padding: '5px 10px',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            {inMeetingMode ? '💼 DISMISS TO DESKS' : '📢 ALL-HANDS MEETING'}
          </button>

          {/* Resolution Mode Switcher: Crisp HD vs Retro Pixel */}
          <button
            onClick={() => setIsCrispMode(!isCrispMode)}
            style={{
              background: isCrispMode ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 190, 11, 0.2)',
              border: isCrispMode ? '1px solid #00f0ff' : '1px solid #ffbe0b',
              color: isCrispMode ? '#00f0ff' : '#ffbe0b',
              borderRadius: '6px',
              padding: '5px 9px',
              fontFamily: "'Fira Code', monospace",
              fontSize: '10px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
            title="Toggle between Crisp High-Definition Voxel 3D and Retro Pixelated 3D"
          >
            {isCrispMode ? '✨ CRISP 3D HD' : '👾 RETRO PIXEL'}
          </button>
        </div>

        {/* Right: Audio Toggle & Control Tip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '10px', color: '#64748b', fontFamily: "'Fira Code', monospace" }}>
            Drag to Orbit/Pan • Scroll to Zoom
          </span>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              background: soundEnabled ? 'rgba(0, 245, 155, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: soundEnabled ? '1px solid #00f59b' : '1px solid rgba(255, 255, 255, 0.1)',
              color: soundEnabled ? '#00f59b' : '#64748b',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            {soundEnabled ? '🔊 ON' : '🔈 OFF'}
          </button>
        </div>
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

      {/* 3D CONTROLS TIP BANNER (Bottom Left) */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '20px',
          zIndex: 20,
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(99, 115, 178, 0.3)',
          borderRadius: '8px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '11px',
          fontFamily: "'Fira Code', monospace",
          color: '#94a3b8',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
        }}
      >
        <span>🕹️</span>
        <span>WASD / Arrow Keys to walk Dylan in 3D • Click floor to Move • Click Character to Inspect</span>
      </div>
    </div>
  );
}
