'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

// ============================================================================
// TYPES & DATA CONTRACTS
// ============================================================================
export interface PixelOfficeProps {
  selectedAgentId?: string | null;
  onSelectAgent?: (id: string | null) => void;
}

export interface Waypoint {
  x: number;
  y: number;
}

export interface CharacterEntity {
  id: string;
  name: string;
  role: string;
  currentX: number;
  currentY: number;
  deskX: number;
  deskY: number;
  seatX: number; // Boardroom chair
  seatY: number;
  path: Waypoint[];
  isWalking: boolean;
  isMeeting: boolean;
  isSeated: boolean;
  status: string;
  statusText: string;
  emoji: string;
  avatarColor: string;
  bubbleText?: string;
  bubbleTimer?: number;
  facing: 'up' | 'down' | 'left' | 'right';
  shirtColor: string;
  hairColor: string;
  routineTimer: number; // Seconds until next autonomous stand-up action
  waitTimer?: number;    // Seconds waiting at destination before walking back
  activity?:
    | 'idle'
    | 'working'
    | 'drinking_water'
    | 'drinking_coffee'
    | 'drinking_fridge'
    | 'playing_arcade'
    | 'playing_billiards'
    | 'kitchen_work'
    | 'garden_relax'
    | 'sofa_relax'
    | 'syncing'
    | 'reporting'
    | 'stretching'
    | 'meeting';
}

// 10 Full Tech Startup Team Members (Dylan CEO + 9 Autonomous Specialists)
const INITIAL_CHARACTERS: Record<string, CharacterEntity> = {
  dylan: {
    id: 'dylan',
    name: 'Dylan Ramos',
    role: 'CEO & Founder',
    currentX: 145,
    currentY: 76,
    deskX: 145,
    deskY: 76,
    seatX: 236,
    seatY: 424,
    path: [],
    isWalking: false,
    isMeeting: false,
    isSeated: true,
    status: 'working',
    statusText: 'You',
    emoji: '👑',
    avatarColor: '#ffbe0b',
    facing: 'down',
    shirtColor: '#1e1b4b', // Dark stylish designer blazer
    hairColor: '#5c3a21', // Styled brown hair
    routineTimer: 999999, // Dylan is human player controlled
  },
  // Row 1 (AI Researcher, Designer, Fullstack Developer)
  ray: {
    id: 'ray',
    name: 'Ray',
    role: 'Lead AI Researcher',
    currentX: 374,
    currentY: 104,
    deskX: 374,
    deskY: 104,
    seatX: 320,
    seatY: 372,
    path: [],
    isWalking: false,
    isMeeting: false,
    isSeated: true,
    status: 'idle',
    statusText: 'Deep focus',
    emoji: '🔍',
    avatarColor: '#38bdf8',
    facing: 'up',
    shirtColor: '#0284c7', // Tech blue
    hairColor: '#3e2723',
    routineTimer: 10,
  },
  maya: {
    id: 'maya',
    name: 'Maya',
    role: 'UI/UX & Product Designer',
    currentX: 544,
    currentY: 104,
    deskX: 544,
    deskY: 104,
    seatX: 420,
    seatY: 372,
    path: [],
    isWalking: false,
    isMeeting: false,
    isSeated: true,
    status: 'idle',
    statusText: 'Figma prototypes',
    emoji: '🎨',
    avatarColor: '#ec4899',
    facing: 'up',
    shirtColor: '#db2777', // Magenta pink
    hairColor: '#4a044e', // Plum styled bob
    routineTimer: 12,
  },
  alex: {
    id: 'alex',
    name: 'Alex',
    role: 'Lead Fullstack Developer',
    currentX: 714,
    currentY: 104,
    deskX: 714,
    deskY: 104,
    seatX: 520,
    seatY: 372,
    path: [],
    isWalking: false,
    isMeeting: false,
    isSeated: true,
    status: 'idle',
    statusText: 'Architecting APIs',
    emoji: '💻',
    avatarColor: '#f97316',
    facing: 'up',
    shirtColor: '#ea580c', // Dark orange hoodie
    hairColor: '#1c1917', // Jet black hair
    routineTimer: 14,
  },
  // Row 2 (Marketing Strategist, Cybersecurity)
  wendy: {
    id: 'wendy',
    name: 'Wendy',
    role: 'Marketing Strategist',
    currentX: 459,
    currentY: 218,
    deskX: 459,
    deskY: 218,
    seatX: 360,
    seatY: 462,
    path: [],
    isWalking: false,
    isMeeting: false,
    isSeated: true,
    status: 'idle',
    statusText: 'Drafting launch copy',
    emoji: '✍️',
    avatarColor: '#fb7185',
    facing: 'up',
    shirtColor: '#059669', // Emerald green
    hairColor: '#b45309', // Auburn hair
    routineTimer: 20,
  },
  zane: {
    id: 'zane',
    name: 'Zane',
    role: 'Cybersecurity Specialist',
    currentX: 629,
    currentY: 218,
    deskX: 629,
    deskY: 218,
    seatX: 470,
    seatY: 462,
    path: [],
    isWalking: false,
    isMeeting: false,
    isSeated: true,
    status: 'idle',
    statusText: 'Zero-trust audit',
    emoji: '🛡️',
    avatarColor: '#22c55e',
    facing: 'up',
    shirtColor: '#15803d', // Tactical military green
    hairColor: '#052e16', // Dark hair
    routineTimer: 11,
  },
};

// ============================================================================
// REALISTIC STARTUP ALL-HANDS & BANTER DIALOGUE SCRIPTS
// ============================================================================
export const MEETING_SCRIPT: Array<{ speaker: string; text: string }> = [
  { speaker: 'dylan', text: '📢 Team, let\'s review our Q4 AI roadmap & launch goals!' },
  { speaker: 'ray', text: '🔍 Model latency dropped 34%. Retrieval accuracy is at 98.7%!' },
  { speaker: 'alex', text: '💻 API caching is live. Streaming edge response is under 18ms.' },
  { speaker: 'maya', text: '🎨 Completed the new design tokens and interactive 3D layout.' },
  { speaker: 'wendy', text: '📢 Launch campaign drafted! ProductHunt teaser goes live tomorrow.' },
  { speaker: 'zane', text: '🛡️ Zero-trust security audit passed with zero vulnerabilities.' },
  { speaker: 'dylan', text: '👑 Stellar progress! Let\'s deploy to staging this afternoon.' },
  { speaker: 'alex', text: '🚀 Pushing commit to staging pipeline now!' },
  { speaker: 'maya', text: '✨ I\'ll inspect the live CSS typography and animations.' },
  { speaker: 'ray', text: '📊 Running automated regression evals alongside the build.' },
  { speaker: 'wendy', text: '🎯 Syncing marketing docs with latest release notes.' },
  { speaker: 'zane', text: '🔒 Monitoring live auth logs and WAF firewall metrics.' },
];

export const CASUAL_CONVERSATIONS: Array<{
  first: { speaker: string; text: string };
  reply: { speaker: string; text: string };
}> = [
  {
    first: { speaker: 'alex', text: 'Hey Maya, love the smooth button hover animations!' },
    reply: { speaker: 'maya', text: 'Thanks Alex! Added a 150ms cubic-bezier transition.' },
  },
  {
    first: { speaker: 'ray', text: 'Zane, can we open an egress port for vector embeddings?' },
    reply: { speaker: 'zane', text: 'Approved with mTLS and rotating API keys!' },
  },
  {
    first: { speaker: 'wendy', text: 'Dylan, beta signups just crossed 10,000 active users!' },
    reply: { speaker: 'dylan', text: 'Incredible milestone Wendy! Let\'s spotlight testimonials.' },
  },
  {
    first: { speaker: 'ray', text: 'Alex, token streaming response is blazing fast on Edge!' },
    reply: { speaker: 'alex', text: 'Awesome! The websocket buffer is handling chunks smoothly.' },
  },
  {
    first: { speaker: 'maya', text: 'Zane, how does the 2FA biometric modal feel to use?' },
    reply: { speaker: 'zane', text: 'Clean and frictionless. Passes all accessibility audits.' },
  },
  {
    first: { speaker: 'wendy', text: 'Alex, did we tag the analytics event on the pricing CTA?' },
    reply: { speaker: 'alex', text: 'Yes! Firing custom UTM parameters with zero latency.' },
  },
  {
    first: { speaker: 'ray', text: 'Maya, the dynamic confidence score graph looks gorgeous!' },
    reply: { speaker: 'maya', text: 'Thank you! Used harmonic color gradients for clarity.' },
  },
  {
    first: { speaker: 'dylan', text: 'How is the sprint velocity looking this morning team?' },
    reply: { speaker: 'alex', text: 'On track to close all 8 priority tickets today Dylan!' },
  },
  {
    first: { speaker: 'wendy', text: 'Working from the boardroom table is so productive.' },
    reply: { speaker: 'ray', text: 'Agreed! Perfect environment for deep literature review.' },
  },
];

// Helper to test if coordinates are within the executive boardroom suite
export const isBoardroomZone = (x: number, y: number) => x > 226 && x <= 590 && y > 280;

// ============================================================================
// SOLID COLLISION BOXES FOR SMOOTH HQ NAVIGATION
// ============================================================================
export function isWalkable(x: number, y: number): boolean {
  // Outer perimeter walls
  if (x < 24 || x > 816 || y < 24 || y > 498) return false;

  // Vertical Glass Wall between CEO Suite & Bullpen (x = 276, ONLY between y: 16..280!)
  // Wide open doorway is at y in [180, 260]
  if (x >= 272 && x <= 280 && y <= 280) {
    if (y < 180 || y > 260) return false;
  }

  // Horizontal Glass Wall between Bullpen & Boardroom (y = 280, x = 16..824)
  // Wide double doors are at x in [480, 550]
  if (y >= 276 && y <= 284) {
    if (x < 480 || x > 550) return false;
  }

  // Vertical Glass Divider between Kitchen & Boardroom (x = 226, y in [280, 504])
  // Doorway is at y in [310, 370]
  if (x >= 222 && x <= 230 && y >= 280 && y <= 504) {
    if (y < 310 || y > 370) return false;
  }

  // Vertical Glass Divider between Boardroom & Lounge (x = 590, y in [280, 504])
  // Doorway is at y in [310, 370]
  if (x >= 586 && x <= 594 && y >= 280 && y <= 504) {
    if (y < 310 || y > 370) return false;
  }

  // Horizontal Glass Wall & Sliding Door between Kitchen & Outdoor Garden (y = 398, x = 16..226)
  // Sliding doorway opening is at x in [85, 155]
  if (y >= 394 && y <= 402 && x >= 16 && x <= 226) {
    if (x < 85 || x > 155) return false;
  }

  // Kitchen Back Counter & Refrigerator (x: 20..180, y: 295..325)
  if (x >= 20 && x <= 180 && y >= 295 && y <= 325) return false;

  // Kitchen Island Table (x: 75..175, y: 350..375)
  if (x >= 75 && x <= 175 && y >= 350 && y <= 375) return false;

  // Outdoor Garden Patio Table (x: 80..170, y: 438..472)
  if (x >= 80 && x <= 170 && y >= 438 && y <= 472) return false;

  // Zen Stone Fountain in Garden (x: 20..45, y: 430..460)
  if (x >= 20 && x <= 45 && y >= 430 && y <= 460) return false;

  // Solid Furniture:
  // CEO Executive Desk (x: 72..228, y: 94..156)
  if (x >= 72 && x <= 228 && y >= 94 && y <= 156) return false;
  // CEO Bookshelf on left wall
  if (x >= 18 && x <= 46 && y >= 24 && y <= 128) return false;
  // CEO Sofa (x: 36..150, y: 232..272)
  if (x >= 36 && x <= 150 && y >= 232 && y <= 272) return false;

  // Bullpen 2x3 Workstation Desks Grid (Cols: 304..444, 474..614, 644..784; Rows: 46..96, 160..210)
  const isCol = (x >= 302 && x <= 446) || (x >= 472 && x <= 616) || (x >= 642 && x <= 786);
  const isRow = (y >= 44 && y <= 98) || (y >= 158 && y <= 212);
  if (isCol && isRow) return false;

  // Boardroom Conference Table (Table surface is x: 270..570, y: 390..458)
  // Collision box has generous clearance around all sides so characters never get stuck:
  if (x >= 272 && x <= 568 && y >= 392 && y <= 456) return false;

  // Relaxation & Coffee Lounge (Bottom-Right, x: 590..818, y: 290..504):
  // Velvet Lounge Sofa Back (x: 660..780, y: 334..348)
  if (x >= 660 && x <= 780 && y >= 334 && y <= 348) return false;
  // Glass Coffee Table (x: 686..758, y: 396..422)
  if (x >= 686 && x <= 758 && y >= 396 && y <= 422) return false;
  // Collaborative Work Bench (x: 668..780, y: 440..466)
  if (x >= 668 && x <= 780 && y >= 440 && y <= 466) return false;
  // Espresso Bar & Counter (x: 606..646, y: 424..490)
  if (x >= 606 && x <= 646 && y >= 424 && y <= 490) return false;
  // Arcade Cabinet (x: 778..808, y: 318..358)
  if (x >= 778 && x <= 808 && y >= 318 && y <= 358) return false;

  return true;
}

// ============================================================================
// INTELLIGENT WAYPOINT ROUTER AROUND CORRIDORS & DOORS
// ============================================================================
export function generateSmartPath(startX: number, startY: number, destX: number, destY: number): Waypoint[] {
  const isCeoSuite = (x: number, y: number) => x <= 276 && y <= 280;
  const isBullpen = (x: number, y: number) => x > 276 && y <= 280;
  const isKitchen = (x: number, y: number) => x <= 226 && y > 280 && y <= 398;
  const isGarden = (x: number, y: number) => x <= 226 && y > 398;
  const isLounge = (x: number, y: number) => x > 590 && y > 280;
  const isBoardroom = (x: number, y: number) => x > 226 && x <= 590 && y > 280;

  const getZone = (x: number, y: number) => {
    if (isCeoSuite(x, y)) return 'ceo';
    if (isBullpen(x, y)) return 'bullpen';
    if (isKitchen(x, y)) return 'kitchen';
    if (isGarden(x, y)) return 'garden';
    if (isLounge(x, y)) return 'lounge';
    return 'boardroom';
  };

  const startZone = getZone(startX, startY);
  const destZone = getZone(destX, destY);

  // 1. Same zone navigation:
  if (startZone === destZone) {
    if (startZone === 'bullpen') {
      const midY = 155;
      if ((startY < midY && destY > midY) || (startY > midY && destY < midY)) {
        const aisleX = 508;
        return [
          { x: startX, y: midY },
          { x: aisleX, y: midY },
          { x: aisleX, y: destY },
          { x: destX, y: destY },
        ];
      }
    }
    if (startZone === 'boardroom') {
      if ((startX < 270 && destX >= 270) || (startX >= 270 && destX < 270)) {
        return [
          { x: startX < 270 ? 250 : startX, y: 340 },
          { x: destX < 270 ? 250 : destX, y: 340 },
          { x: destX, y: destY },
        ];
      }
      if ((startY < 390 && destY > 456) || (startY > 456 && destY < 390)) {
        return [
          { x: 250, y: startY },
          { x: 250, y: destY },
          { x: destX, y: destY },
        ];
      }
    }
    return [{ x: destX, y: destY }];
  }

  // 2. Cross-zone navigation through designated doorways:
  const ceoDoorway = { x: 276, y: 220 };
  const boardroomDoors = { x: 515, y: 280 };
  const kitchenDoorway = { x: 226, y: 340 };
  const gardenDoorway = { x: 120, y: 398 };
  const loungeDoorway = { x: 590, y: 340 };
  const path: Waypoint[] = [];

  // Exit starting zone into intermediate corridor
  if (startZone === 'ceo') {
    if (startY < 94) path.push({ x: 240, y: startY });
    path.push({ x: 240, y: 220 });
    path.push(ceoDoorway);
    path.push({ x: 330, y: 220 });
    if (destZone === 'bullpen') {
      path.push({ x: 330, y: 155 });
      path.push({ x: destX, y: 155 });
    } else {
      path.push({ x: 515, y: 220 });
      path.push(boardroomDoors);
      path.push({ x: 515, y: 340 });
    }
  } else if (startZone === 'bullpen') {
    path.push({ x: startX, y: 155 });
    if (destZone === 'ceo') {
      path.push({ x: 330, y: 155 });
      path.push({ x: 330, y: 220 });
      path.push(ceoDoorway);
      path.push({ x: 240, y: 220 });
      if (destY < 94) path.push({ x: 240, y: destY });
    } else {
      path.push({ x: 515, y: 155 });
      path.push(boardroomDoors);
      path.push({ x: 515, y: 340 });
    }
  } else if (startZone === 'kitchen') {
    if (destZone === 'garden') {
      path.push({ x: 120, y: 370 });
      path.push(gardenDoorway);
      path.push({ x: 120, y: 415 });
    } else {
      path.push({ x: startX, y: 340 });
      path.push(kitchenDoorway);
      path.push({ x: 250, y: 340 });
    }
  } else if (startZone === 'garden') {
    path.push({ x: 120, y: 415 });
    path.push(gardenDoorway);
    path.push({ x: 120, y: 370 });
    if (destZone !== 'kitchen') {
      path.push({ x: 120, y: 340 });
      path.push(kitchenDoorway);
      path.push({ x: 250, y: 340 });
    }
  } else if (startZone === 'lounge') {
    path.push({ x: 620, y: 340 });
    path.push(loungeDoorway);
    path.push({ x: 550, y: 340 });
  } else if (startZone === 'boardroom') {
    if (startX < 270) path.push({ x: 250, y: 340 });
    else path.push({ x: 515, y: 340 });
  }

  // Reach destination zone from common transit aisle:
  if (destZone === 'kitchen' && startZone !== 'garden') {
    path.push({ x: 250, y: 340 });
    path.push(kitchenDoorway);
    path.push({ x: 120, y: 340 });
  } else if (destZone === 'garden' && startZone !== 'kitchen') {
    path.push({ x: 250, y: 340 });
    path.push(kitchenDoorway);
    path.push({ x: 120, y: 340 });
    path.push(gardenDoorway);
    path.push({ x: 120, y: 415 });
  } else if (destZone === 'lounge') {
    path.push({ x: 550, y: 340 });
    path.push(loungeDoorway);
    path.push({ x: 620, y: 340 });
  } else if (destZone === 'ceo' && startZone !== 'bullpen') {
    path.push({ x: 515, y: 340 });
    path.push(boardroomDoors);
    path.push({ x: 515, y: 220 });
    path.push({ x: 330, y: 220 });
    path.push(ceoDoorway);
    path.push({ x: 240, y: 220 });
    if (destY < 94) path.push({ x: 240, y: destY });
  } else if (destZone === 'bullpen' && startZone !== 'ceo') {
    path.push({ x: 515, y: 340 });
    path.push(boardroomDoors);
    path.push({ x: 515, y: 155 });
    path.push({ x: destX, y: 155 });
  } else if (destZone === 'boardroom') {
    if (destX < 270) {
      path.push({ x: 250, y: 340 });
      path.push({ x: 250, y: destY });
    } else if (destY > 456) {
      path.push({ x: 250, y: 340 });
      path.push({ x: 250, y: 480 });
      path.push({ x: destX, y: 480 });
    }
  }

  path.push({ x: destX, y: destY });
  return path;
}

// ============================================================================
// MAIN VIRTUAL OFFICE COMPONENT
// ============================================================================
export default function PixelOffice({ selectedAgentId, onSelectAgent }: PixelOfficeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mutable Game State Ref (enables pure 60 FPS loop without React lag or timer reset bugs!)
  const charactersRef = useRef<Record<string, CharacterEntity>>(INITIAL_CHARACTERS);

  // React state for UI triggers & displays
  const [inMeetingMode, setInMeetingMode] = useState(false);
  const [inRestMode, setInRestMode] = useState(false);
  const [dylanStatus, setDylanStatus] = useState<'You' | 'Deep focus' | 'Coffee break' | 'Shipping'>('You');
  const [isDylanSeated, setIsDylanSeated] = useState(true);
  const [isSprinting, setIsSprinting] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [nearbyPrompt, setNearbyPrompt] = useState<string | null>(null);
  const [clickRipple, setClickRipple] = useState<{ x: number; y: number; time: number } | null>(null);

  // Continuous key tracker for WASD / Arrow Keys
  const keysPressed = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const inMeetingModeRef = useRef(inMeetingMode);
  inMeetingModeRef.current = inMeetingMode;
  const inRestModeRef = useRef(inRestMode);
  inRestModeRef.current = inRestMode;

  // Real-time dialogue sequencing refs for boardroom meetings & office banter
  const meetingDialogueTimerRef = useRef(3.5);
  const meetingDialogueIndexRef = useRef(0);
  const casualChatTimerRef = useRef(10.0);
  const pendingReplyRef = useRef<{ speaker: string; text: string; delay: number } | null>(null);

  // Virtual D-pad directional hold state
  const dpadDirRef = useRef<{ up: boolean; down: boolean; left: boolean; right: boolean }>({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  const playSfx = useCallback((type: 'click' | 'drink' | 'bell' | 'step' | 'door') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(480 + Math.random() * 200, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.05);
      } else if (type === 'drink') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(580, now + 0.12);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.14);
      } else if (type === 'bell') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
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
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
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

  // 1. Synchronize with Real-Time Backend SSE Stream
  useEffect(() => {
    let isMounted = true;

    fetch('/api/state')
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted || !data.agents) return;
        data.agents.forEach((a: any) => {
          if (charactersRef.current[a.id]) {
            charactersRef.current[a.id].status = a.status;
            charactersRef.current[a.id].statusText = a.bubble_text || (a.status === 'working' ? 'Deep focus' : 'Available');
            if (a.bubble_text) {
              charactersRef.current[a.id].bubbleText = a.bubble_text;
              charactersRef.current[a.id].bubbleTimer = 6;
            }
          }
        });
      })
      .catch(() => {});

    const sse = new EventSource('/api/stream');
    sse.addEventListener('agent:status', (e: MessageEvent) => {
      try {
        const update = JSON.parse(e.data);
        if (update.agentId && charactersRef.current[update.agentId]) {
          const char = charactersRef.current[update.agentId];
          if (update.status !== undefined) char.status = update.status;
          if (update.bubbleText) {
            char.bubbleText = update.bubbleText;
            char.bubbleTimer = 6;
            char.statusText = update.bubbleText;
            // Stand up and show excitement when assigned an active ticket!
            if (char.isSeated && Math.random() < 0.6) {
              char.isSeated = false;
              char.activity = 'stretching';
              char.waitTimer = 3;
            }
          }
        }
      } catch {}
    });

    return () => {
      isMounted = false;
      sse.close();
    };
  }, []);

  // 2. Keyboard Event Listeners for Dylan Ramos (Player WASD / Arrows / E / Space)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      const code = e.code;
      if (
        ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'Space', 'KeyE', 'ShiftLeft', 'ShiftRight'].includes(code)
      ) {
        e.preventDefault();
        keysPressed.current.add(code);

        if (code === 'ShiftLeft' || code === 'ShiftRight') {
          setIsSprinting(true);
        }

        // Sit / Stand Toggle or Proximity Interact
        if (code === 'KeyE' || code === 'Space') {
          const d = charactersRef.current.dylan;
          const distToDesk = Math.hypot(d.currentX - d.deskX, d.currentY - d.deskY);
          const distToWater = Math.hypot(d.currentX - 780, d.currentY - 130);
          const distToFridge = Math.hypot(d.currentX - 300, d.currentY - 170);

          const distToEspresso = Math.hypot(d.currentX - 626, d.currentY - 450);
          const distToSofa = Math.hypot(d.currentX - 710, d.currentY - 370);
          const distToArcade = Math.hypot(d.currentX - 792, d.currentY - 370);
          const distToKitchen = Math.hypot(d.currentX - 120, d.currentY - 370);
          const distToGarden = Math.hypot(d.currentX - 120, d.currentY - 460);

          if (distToDesk < 28) {
            const nextSeated = !d.isSeated;
            d.isSeated = nextSeated;
            d.isWalking = false;
            d.path = [];
            d.currentX = d.deskX;
            d.currentY = d.deskY;
            d.facing = 'down';
            d.activity = nextSeated ? 'working' : 'idle';
            d.bubbleText = nextSeated ? '💻 Seated at CEO Command Station.' : '🚶 Standing up & roaming HQ.';
            d.bubbleTimer = 4;
            setIsDylanSeated(nextSeated);
            playSfx('click');
          } else if (distToKitchen < 46) {
            d.isSeated = true;
            d.currentX = 120;
            d.currentY = 380;
            d.facing = 'up';
            d.activity = 'kitchen_work';
            d.bubbleText = '🍳 Working on my laptop at the kitchen island bar!';
            d.bubbleTimer = 5;
            playSfx('click');
          } else if (distToGarden < 46) {
            d.isSeated = true;
            d.currentX = 120;
            d.currentY = 470;
            d.facing = 'down';
            d.activity = 'garden_relax';
            d.bubbleText = '🌿 Outdoor terrace breeze is refreshing! Working on laptop at the patio table.';
            d.bubbleTimer = 5;
            playSfx('click');
          } else if (distToEspresso < 40) {
            d.activity = 'drinking_coffee';
            d.bubbleText = '☕ Fresh hazelnut espresso brewed! Delicious.';
            d.bubbleTimer = 4;
            playSfx('drink');
          } else if (distToArcade < 40) {
            d.activity = 'playing_arcade';
            d.bubbleText = '🕹️ High score unlocked on Retro Arcade: 120,500 pts!';
            d.bubbleTimer = 4;
            playSfx('click');
          } else if (distToSofa < 40) {
            d.activity = 'sofa_relax';
            d.bubbleText = '🛋️ Kicking back on the velvet sofa with warm espresso.';
            d.bubbleTimer = 4;
            playSfx('click');
          } else if (distToFridge < 38) {
            d.activity = 'drinking_fridge';
            d.bubbleText = '⚡ Grabbed an ice cold energy drink!';
            d.bubbleTimer = 4;
            playSfx('drink');
          } else if (distToWater < 38) {
            d.activity = 'drinking_water';
            d.bubbleText = '🥤 Pure cold mountain water. Refreshed!';
            d.bubbleTimer = 4;
            playSfx('drink');
          } else {
            // Stand up if seated
            if (d.isSeated) {
              d.isSeated = false;
              d.activity = 'idle';
              d.currentY = d.deskY;
              d.facing = 'down';
              setIsDylanSeated(false);
              playSfx('click');
            }
          }
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        setIsSprinting(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [playSfx]);

  // 3. UI Action: Toggle Dylan Sit / Stand
  const handleToggleDylanSit = () => {
    playSfx('click');
    const d = charactersRef.current.dylan;
    if (d.isSeated) {
      d.isSeated = false;
      d.currentY = d.deskY + 16;
      d.bubbleText = '🚶 Ready to inspect the team!';
      d.bubbleTimer = 3;
      setIsDylanSeated(false);
    } else {
      // Walk back to desk and sit down
      d.path = generateSmartPath(d.currentX, d.currentY, d.deskX, d.deskY);
      d.isWalking = true;
      d.bubbleText = 'Walking back to CEO station...';
      d.bubbleTimer = 3;
    }
  };

  // 4. UI Action: Trigger All Workers to Stand Up & Stretch
  const handleAllWorkersStand = () => {
    playSfx('bell');
    const chars = charactersRef.current;
    ['ray', 'maya', 'alex', 'wendy', 'zane'].forEach((id) => {
      const char = chars[id];
      if (char) {
        char.isSeated = false;
        char.activity = 'stretching';
        char.waitTimer = 5;
        char.path = [];
        char.currentY = char.deskY + 14;
        const cheers = [
          '🙆‍♂️ Standing up & stretching!',
          '⚡ Energized and checking tasks!',
          '☕ Ready for action, Boss Dylan!',
          '💡 New breakthrough in progress!',
          '🚀 Sprint goals on track!',
        ];
        char.bubbleText = cheers[Math.floor(Math.random() * cheers.length)];
        char.bubbleTimer = 5;
      }
    });
  };

  // 5. UI Action: Team Rest & Lounge Break
  const handleToggleRestMode = () => {
    playSfx('drink');
    const nextRest = !inRestMode;
    setInRestMode(nextRest);

    const chars = charactersRef.current;
    const restSpots: Record<string, { x: number; y: number; bubble: string }> = {
      dylan: { x: 620, y: 440, bubble: '👑 Founder laptop session at the espresso bar!' },
      ray: { x: 676, y: 356, bubble: '🔍 Researching with laptop on the velvet sofa!' },
      maya: { x: 712, y: 356, bubble: '🎨 Designing UI mockups on laptop in the lounge!' },
      alex: { x: 692, y: 444, bubble: '💻 Coding APIs on the lounge collaborative work bench!' },
      wendy: { x: 742, y: 444, bubble: '📢 Drafting launch copy on the sunny work bench!' },
      zane: { x: 785, y: 375, bubble: '🛡️ Running security audit from the lounge bench!' },
    };

    Object.values(chars).forEach((char) => {
      if (nextRest) {
        char.isMeeting = false;
        char.isSeated = false;
        if (char.id === 'dylan') char.activity = 'drinking_coffee';
        else if (char.id === 'zane') char.activity = 'playing_arcade';
        else if (char.id === 'ray' || char.id === 'maya') char.activity = 'sofa_relax';
        else char.activity = 'working';
        const spot = restSpots[char.id] || { x: 700, y: 380, bubble: 'Taking a rest break!' };
        char.path = generateSmartPath(char.currentX, char.currentY, spot.x, spot.y);
        char.isWalking = true;
        char.statusText = 'Lounge Break';
        char.emoji = '🛋️';
        char.bubbleText = spot.bubble;
        char.bubbleTimer = 6;
      } else {
        char.isMeeting = false;
        char.isSeated = false;
        char.activity = 'idle';
        char.path = generateSmartPath(char.currentX, char.currentY, char.deskX, char.deskY);
        char.isWalking = true;
        char.statusText = char.id === 'dylan' ? 'You' : 'Deep focus';
        char.emoji = char.id === 'dylan' ? '🟢' : '💻';
        char.bubbleText = 'Recharged! Back to desk.';
        char.bubbleTimer = 3;
      }
    });
  };

  // 6. UI Action: Call All-Hands Meeting in Boardroom
  const handleToggleMeetingMode = () => {
    playSfx('bell');
    const nextMeeting = !inMeetingMode;
    setInMeetingMode(nextMeeting);

    const chars = charactersRef.current;
    Object.values(chars).forEach((char) => {
      if (nextMeeting) {
        char.isMeeting = true;
        char.isSeated = false;
        char.activity = 'meeting';
        char.path = generateSmartPath(char.currentX, char.currentY, char.seatX, char.seatY);
        char.isWalking = true;
        char.statusText = 'In Meeting';
        char.emoji = '👥';
        char.bubbleText = char.id === 'dylan' ? '📢 All-hands assembled!' : 'Walking to boardroom...';
        char.bubbleTimer = 4;
      } else {
        char.isMeeting = false;
        char.isSeated = false;
        char.activity = 'idle';
        char.path = generateSmartPath(char.currentX, char.currentY, char.deskX, char.deskY);
        char.isWalking = true;
        char.statusText = char.id === 'dylan' ? 'You' : 'Deep focus';
        char.emoji = char.id === 'dylan' ? '🟢' : '💻';
        char.bubbleText = 'Returning to desk...';
        char.bubbleTimer = 3;
      }
    });
  };

  // Change Dylan's live status pill
  const handleDylanStatusChange = (status: 'You' | 'Deep focus' | 'Coffee break' | 'Shipping') => {
    playSfx('click');
    setDylanStatus(status);
    const emojiMap = {
      You: '🟢',
      'Deep focus': '🎯',
      'Coffee break': '☕',
      Shipping: '🚀',
    };
    const d = charactersRef.current.dylan;
    d.statusText = status;
    d.emoji = emojiMap[status];
    d.bubbleText = `Status updated: ${status}`;
    d.bubbleTimer = 3;
  };

  // ==========================================================================
  // 7. MAIN 60 FPS RENDER & WORKER ROUTINE ENGINE LOOP
  // ==========================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let frame = 0;
    let ceoDoorProgress = 0;
    let boardDoorProgress = 0;
    let lastCeoDoorState = 0;
    let lastBoardDoorState = 0;

    const LOGICAL_W = 840;
    const LOGICAL_H = 520;

    const render = () => {
      frame++;
      animId = requestAnimationFrame(render);
      ctx.imageSmoothingEnabled = false;

      const chars = charactersRef.current;
      const dylan = chars.dylan;

      // Update dynamic door sensor detection
      let ceoDoorActive = false;
      if (Math.hypot(dylan.currentX - 276, dylan.currentY - 220) < 64) {
        ceoDoorActive = true;
      } else {
        for (const char of Object.values(chars)) {
          if (Math.hypot(char.currentX - 276, char.currentY - 220) < 56) {
            ceoDoorActive = true;
            break;
          }
        }
      }

      let boardDoorActive = inMeetingModeRef.current;
      if (!boardDoorActive) {
        if (Math.hypot(dylan.currentX - 515, dylan.currentY - 280) < 68) {
          boardDoorActive = true;
        } else {
          for (const char of Object.values(chars)) {
            if (Math.hypot(char.currentX - 515, char.currentY - 280) < 60) {
              boardDoorActive = true;
              break;
            }
          }
        }
      }

      const ceoTarget = ceoDoorActive ? 1 : 0;
      const boardTarget = boardDoorActive ? 1 : 0;

      if (ceoTarget !== lastCeoDoorState) {
        lastCeoDoorState = ceoTarget;
        playSfx('door');
      }
      if (boardTarget !== lastBoardDoorState) {
        lastBoardDoorState = boardTarget;
        playSfx('door');
      }

      ceoDoorProgress += (ceoTarget - ceoDoorProgress) * 0.14;
      boardDoorProgress += (boardTarget - boardDoorProgress) * 0.14;

      // ----------------------------------------------------------------------
      // A. DYLAN'S REAL-TIME PLAYER CONTROLS (WASD, Arrows, & D-Pad)
      // ----------------------------------------------------------------------
      const speed = isSprinting ? 4.2 : 2.8;
      let mx = 0;
      let my = 0;

      if (keysPressed.current.has('KeyW') || keysPressed.current.has('ArrowUp') || dpadDirRef.current.up) my -= speed;
      if (keysPressed.current.has('KeyS') || keysPressed.current.has('ArrowDown') || dpadDirRef.current.down) my += speed;
      if (keysPressed.current.has('KeyA') || keysPressed.current.has('ArrowLeft') || dpadDirRef.current.left) mx -= speed;
      if (keysPressed.current.has('KeyD') || keysPressed.current.has('ArrowRight') || dpadDirRef.current.right) mx += speed;

      if (mx !== 0 || my !== 0) {
        dylan.path = []; // Cancel any click-to-move path
        dylan.isSeated = false;
        dylan.isWalking = true;
        setIsDylanSeated(false);

        // Normalize diagonal speed
        if (mx !== 0 && my !== 0) {
          mx *= 0.7071;
          my *= 0.7071;
        }

        // Sliding collision detection (allows gliding along walls smoothly)
        const nextX = dylan.currentX + mx;
        const nextY = dylan.currentY + my;

        if (isWalkable(nextX, dylan.currentY)) {
          dylan.currentX = nextX;
        }
        if (isWalkable(dylan.currentX, nextY)) {
          dylan.currentY = nextY;
        }

        if (Math.abs(mx) > Math.abs(my)) {
          dylan.facing = mx > 0 ? 'right' : 'left';
        } else {
          dylan.facing = my > 0 ? 'down' : 'up';
        }
      } else if (dylan.path.length === 0 && dylan.isWalking && !keysPressed.current.size) {
        dylan.isWalking = false;
        // Check if Dylan returned to his desk chair
        if (Math.hypot(dylan.currentX - dylan.deskX, dylan.currentY - dylan.deskY) < 14) {
          dylan.isSeated = true;
          dylan.facing = 'down';
          setIsDylanSeated(true);
        }
      }

      // ----------------------------------------------------------------------
      // LIVE CONVERSATION & MEETING DIALOGUE SEQUENCER
      // ----------------------------------------------------------------------
      // A. Process pending conversation replies (2nd turn in 2-person banter)
      if (pendingReplyRef.current) {
        pendingReplyRef.current.delay -= 0.016;
        if (pendingReplyRef.current.delay <= 0) {
          const replyChar = chars[pendingReplyRef.current.speaker];
          if (replyChar) {
            replyChar.bubbleText = pendingReplyRef.current.text;
            replyChar.bubbleTimer = 4.2;
          }
          pendingReplyRef.current = null;
        }
      }

      // B. Sequenced Boardroom All-Hands Discussion
      if (inMeetingModeRef.current) {
        meetingDialogueTimerRef.current -= 0.016;
        if (meetingDialogueTimerRef.current <= 0) {
          meetingDialogueTimerRef.current = 5.0;
          const scriptItem = MEETING_SCRIPT[meetingDialogueIndexRef.current];
          const speakerChar = chars[scriptItem.speaker];
          if (speakerChar) {
            speakerChar.bubbleText = scriptItem.text;
            speakerChar.bubbleTimer = 4.6;
          }
          meetingDialogueIndexRef.current = (meetingDialogueIndexRef.current + 1) % MEETING_SCRIPT.length;
        }
      } else if (!inRestModeRef.current) {
        // C. Spontaneous Cross-Desk & Office Banter (every 12 - 18s)
        casualChatTimerRef.current -= 0.016;
        if (casualChatTimerRef.current <= 0) {
          casualChatTimerRef.current = 13.0 + Math.random() * 8.0;
          const convo = CASUAL_CONVERSATIONS[Math.floor(Math.random() * CASUAL_CONVERSATIONS.length)];
          const char1 = chars[convo.first.speaker];
          const char2 = chars[convo.reply.speaker];
          if (char1 && char2 && !char1.bubbleText && !char2.bubbleText) {
            char1.bubbleText = convo.first.text;
            char1.bubbleTimer = 4.0;
            pendingReplyRef.current = {
              speaker: convo.reply.speaker,
              text: convo.reply.text,
              delay: 2.2,
            };
          }
        }
      }

      // ----------------------------------------------------------------------
      // B. WORKERS' AUTONOMOUS STAND-UP ROUTINES & PATH WALKING
      // ----------------------------------------------------------------------
      Object.values(chars).forEach((char) => {
        // Decrement speech bubble timer
        if (char.bubbleTimer && char.bubbleTimer > 0) {
          char.bubbleTimer -= 0.016;
          if (char.bubbleTimer <= 0) {
            char.bubbleText = undefined;
          }
        }

        // 1. Waypoint Progression
        if (char.path.length > 0) {
          char.isSeated = false;
          char.isWalking = true;
          const target = char.path[0];
          const dx = target.x - char.currentX;
          const dy = target.y - char.currentY;
          const dist = Math.hypot(dx, dy);
          const walkSpeed = 2.4;

          if (dist <= walkSpeed) {
            char.currentX = target.x;
            char.currentY = target.y;
            char.path.shift();
            if (char.path.length === 0) {
              char.isWalking = false;

              // If arrived at desk, sit back down
              if (Math.hypot(char.currentX - char.deskX, char.currentY - char.deskY) < 12) {
                char.isSeated = true;
                char.facing = char.id === 'dylan' ? 'down' : 'up';
                char.activity = 'idle';
              } else if (
                (char.isMeeting || isBoardroomZone(char.currentX, char.currentY)) &&
                Math.hypot(char.currentX - char.seatX, char.currentY - char.seatY) < 18
              ) {
                // Seated at Boardroom Table with laptop
                char.isSeated = true;
                if (char.id === 'dylan') char.facing = 'right';
                else char.facing = char.seatY < 400 ? 'down' : 'up';
              } else if (Math.hypot(char.currentX - 120, char.currentY - 380) < 20) {
                // Seated at Kitchen Island with laptop & snacks
                char.isSeated = true;
                char.facing = 'up';
                char.activity = 'kitchen_work';
              } else if (Math.hypot(char.currentX - 120, char.currentY - 470) < 20) {
                // Seated at Outdoor Garden Patio with laptop
                char.isSeated = true;
                char.facing = 'down';
                char.activity = 'garden_relax';
              }
            }
          } else {
            char.currentX += (dx / dist) * walkSpeed;
            char.currentY += (dy / dist) * walkSpeed;
            if (Math.abs(dx) > Math.abs(dy)) {
              char.facing = dx > 0 ? 'right' : 'left';
            } else {
              char.facing = dy > 0 ? 'down' : 'up';
            }
          }
        }

        // 2. Wait Timer at Destinations (e.g. drinking water, chatting with colleague)
        if (char.waitTimer && char.waitTimer > 0 && char.path.length === 0) {
          char.waitTimer -= 0.016;
          if (char.waitTimer <= 0) {
            // Once finished, walk back to personal desk!
            char.path = generateSmartPath(char.currentX, char.currentY, char.deskX, char.deskY);
            char.activity = 'working';
            char.bubbleText = 'Heading back to work.';
            char.bubbleTimer = 2.5;
          }
        }

        // 3. Autonomous Periodic Stand-Up Cycle (every 10 - 20 seconds)
        if (char.id !== 'dylan' && !char.isMeeting && !inRestMode && char.path.length === 0 && !char.waitTimer) {
          char.routineTimer -= 0.016;
          if (char.routineTimer <= 0) {
            char.routineTimer = 12 + Math.random() * 14; // Next routine in 12-26s
            const choice = Math.random();

            if (choice < 0.14) {
              // 1. Work & Snack at Kitchen Island in Zone 5A
              char.isSeated = false;
              char.activity = 'kitchen_work';
              char.bubbleText = '🍳 Grabbing a snack & working at the kitchen island!';
              char.bubbleTimer = 4;
              char.path = generateSmartPath(char.currentX, char.currentY, 120, 380);
              char.waitTimer = 8.5;
            } else if (choice < 0.26) {
              // 2. Work & Relax at Outdoor Garden Patio in Zone 5B
              char.isSeated = false;
              char.activity = 'garden_relax';
              char.bubbleText = '🌿 Taking my laptop to work on the garden patio!';
              char.bubbleTimer = 4;
              char.path = generateSmartPath(char.currentX, char.currentY, 120, 470);
              char.waitTimer = 9.0;
            } else if (choice < 0.38) {
              // 3. Play Retro Arcade Machine in Lounge
              char.isSeated = false;
              char.activity = 'playing_arcade';
              char.bubbleText = '🕹️ Speedrunning retro arcade high score!';
              char.bubbleTimer = 4;
              char.path = generateSmartPath(char.currentX, char.currentY, 785, 365);
              char.waitTimer = 7.5;
            } else if (choice < 0.50) {
              // 4. Brew Fresh Artisanal Espresso at Coffee Bar
              char.isSeated = false;
              char.activity = 'drinking_coffee';
              char.bubbleText = '☕ Brewing a fresh hot espresso shot!';
              char.bubbleTimer = 4;
              char.path = generateSmartPath(char.currentX, char.currentY, 620, 440);
              char.waitTimer = 6.0;
            } else if (choice < 0.62) {
              // 5. Hydration Break at Water Cooler
              char.isSeated = false;
              char.activity = 'drinking_water';
              char.bubbleText = '🥤 Chilled mountain water hydration break!';
              char.bubbleTimer = 3;
              char.path = generateSmartPath(char.currentX, char.currentY, 770, 130);
              char.waitTimer = 5.0;
            } else if (choice < 0.74) {
              // 5. Relax on Sofa or Collaborative Work Bench with Laptop
              char.isSeated = false;
              const targetX = char.id === 'alex' || char.id === 'wendy' ? 710 : char.id === 'zane' ? 785 : 690;
              const targetY = char.id === 'alex' || char.id === 'wendy' ? 444 : char.id === 'zane' ? 375 : 356;
              if (char.id === 'alex' || char.id === 'wendy') {
                char.activity = 'working';
                char.bubbleText = '💻 Bringing my laptop to work on the lounge bench!';
              } else if (char.id === 'zane') {
                char.activity = 'playing_arcade';
                char.bubbleText = '🛡️ Running security audit from the arcade lounge!';
              } else {
                char.activity = 'sofa_relax';
                char.bubbleText = '🛋️ Sipping coffee and relaxing on the velvet sofa!';
              }
              char.bubbleTimer = 4;
              char.path = generateSmartPath(char.currentX, char.currentY, targetX, targetY);
              char.waitTimer = 7.5;
            } else if (choice < 0.88) {
              // 6. Work in Boardroom Suite with Laptop at Conference Table!
              char.isSeated = false;
              char.activity = 'working';
              char.statusText = 'Boardroom Focus';
              char.emoji = '💼';
              char.bubbleText = '💻 Bringing my laptop to work at the boardroom table!';
              char.bubbleTimer = 4;
              char.path = generateSmartPath(char.currentX, char.currentY, char.seatX, char.seatY);
              char.waitTimer = 9.0;
            } else if (choice < 0.94) {
              // 7. Stand up and visit colleague's desk for collaboration
              char.isSeated = false;
              char.activity = 'syncing';
              const targetX = char.id === 'ray' ? 714 : 544;
              const targetY = 155;
              char.bubbleText = 'Quick sync on ticket!';
              char.bubbleTimer = 3;
              char.path = generateSmartPath(char.currentX, char.currentY, targetX, targetY);
              char.waitTimer = 3.5;
            } else {
              // 8. Stand up and stretch at desk
              char.isSeated = false;
              char.activity = 'stretching';
              char.currentY = char.deskY + 14;
              char.bubbleText = '🙆‍♂️ Stretching & reviewing queue.';
              char.bubbleTimer = 4;
              char.waitTimer = 4.0;
            }
          }
        }

        // 4. Proximity Greeting Reaction: If Dylan walks close, agent turns to face Dylan!
        if (char.id !== 'dylan') {
          const distToDylan = Math.hypot(char.currentX - dylan.currentX, char.currentY - dylan.currentY);
          if (distToDylan < 48) {
            // Turn toward Dylan
            if (Math.abs(dylan.currentX - char.currentX) > Math.abs(dylan.currentY - char.currentY)) {
              char.facing = dylan.currentX > char.currentX ? 'right' : 'left';
            } else {
              char.facing = dylan.currentY > char.currentY ? 'down' : 'up';
            }
            if (!char.bubbleText) {
              const greetings: Record<string, string> = {
                ray: '👋 Hey Dylan! Research benchmarks ready.',
                maya: '👋 Hey Dylan! UI mockups and prototypes ready.',
                alex: '👋 Dylan! Backend architecture and endpoints ready.',
                wendy: '👋 Morning Dylan! Drafting marketing launch copy.',
                zane: '👋 Dylan! Zero-trust security perimeter locked down.',
              };
              char.bubbleText = greetings[char.id] || '👋 Hello Dylan!';
              char.bubbleTimer = 3;
            }
          }
        }
      });

      // ----------------------------------------------------------------------
      // C. PROXIMITY HUD PROMPTS FOR DYLAN
      // ----------------------------------------------------------------------
      if (Math.hypot(dylan.currentX - dylan.deskX, dylan.currentY - dylan.deskY) < 24) {
        setNearbyPrompt(dylan.isSeated ? '[E / Space] Stand up & Roam' : '[E / Space] Sit at CEO Station');
      } else if (dylan.currentX < 226 && dylan.currentY > 280 && dylan.currentY <= 398) {
        setNearbyPrompt('[E / Space] Work & Snack at Kitchen Island');
      } else if (dylan.currentX < 226 && dylan.currentY > 398) {
        setNearbyPrompt('[E / Space] Work & Relax at Outdoor Garden Patio');
      } else if (Math.hypot(dylan.currentX - 626, dylan.currentY - 450) < 36) {
        setNearbyPrompt('[E] Espresso Bar: Brew fresh coffee');
      } else if (Math.hypot(dylan.currentX - 710, dylan.currentY - 370) < 40) {
        setNearbyPrompt('[E / Space] Relax on Lounge Velvet Sofa');
      } else if (Math.hypot(dylan.currentX - 720, dylan.currentY - 450) < 36) {
        setNearbyPrompt('[E / Space] Work on Collaborative Oak Bench');
      } else if (Math.hypot(dylan.currentX - 792, dylan.currentY - 370) < 36) {
        setNearbyPrompt('[E] Retro Arcade: Play high-score game');
      } else if (Math.hypot(dylan.currentX - 300, dylan.currentY - 170) < 36) {
        setNearbyPrompt('[E] Mini Fridge: Grab energy drink');
      } else if (Math.hypot(dylan.currentX - 780, dylan.currentY - 130) < 36) {
        setNearbyPrompt('[E] Water Cooler: Drink cold water');
      } else if (chars.ray && Math.hypot(dylan.currentX - chars.ray.currentX, dylan.currentY - chars.ray.currentY) < 40) {
        setNearbyPrompt('[Click / E] Consult Ray • Lead AI Researcher');
      } else if (chars.maya && Math.hypot(dylan.currentX - chars.maya.currentX, dylan.currentY - chars.maya.currentY) < 40) {
        setNearbyPrompt('[Click / E] Consult Maya • UI/UX & Product Designer');
      } else if (chars.alex && Math.hypot(dylan.currentX - chars.alex.currentX, dylan.currentY - chars.alex.currentY) < 40) {
        setNearbyPrompt('[Click / E] Consult Alex • Fullstack Dev & Architecture');
      } else if (chars.wendy && Math.hypot(dylan.currentX - chars.wendy.currentX, dylan.currentY - chars.wendy.currentY) < 40) {
        setNearbyPrompt('[Click / E] Consult Wendy • Marketing Strategist');
      } else if (chars.zane && Math.hypot(dylan.currentX - chars.zane.currentX, dylan.currentY - chars.zane.currentY) < 40) {
        setNearbyPrompt('[Click / E] Consult Zane • Cybersecurity Specialist');
      } else if (dylan.currentY > 360 && Math.hypot(dylan.currentX - 236, dylan.currentY - 424) < 36) {
        setNearbyPrompt('[E] Take Head of Boardroom Table');
      } else {
        setNearbyPrompt(null);
      }

      // ======================================================================
      // 1. BASE FLOOR PLAN & DISTINCT ZONAL CARPETS
      // ======================================================================
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

      // Outer Birch Wood Border
      ctx.fillStyle = '#f3e3c3';
      ctx.fillRect(8, 8, LOGICAL_W - 16, LOGICAL_H - 16);
      ctx.strokeStyle = '#dfccaa';
      ctx.lineWidth = 1;
      for (let py = 16; py < LOGICAL_H - 16; py += 16) {
        ctx.beginPath();
        ctx.moveTo(8, py);
        ctx.lineTo(LOGICAL_W - 8, py);
        ctx.stroke();
      }

      // ZONE 1: CEO PRIVATE EXECUTIVE SUITE (Top-Left)
      ctx.fillStyle = '#161e2e';
      ctx.fillRect(16, 16, 260, 264);

      // Deep Navy Luxury Carpet
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(44, 46, 204, 180);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.strokeRect(44, 46, 204, 180);
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.strokeRect(50, 52, 192, 168);

      // Mahogany Bookshelf on Left Wall
      ctx.fillStyle = '#451a03';
      ctx.fillRect(22, 28, 24, 100);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(24, 30, 20, 96);
      const bookColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
      for (let bi = 0; bi < 8; bi++) {
        ctx.fillStyle = bookColors[bi % bookColors.length];
        ctx.fillRect(26, 36 + bi * 11, 14, 8);
      }
      ctx.fillStyle = '#fbbf24'; // Startup Trophy
      ctx.fillRect(29, 102, 10, 8);
      ctx.fillRect(32, 96, 4, 6);

      // Executive Leather Lounge Couch
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(40, 234, 110, 36);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(44, 238, 102, 28);
      ctx.fillStyle = '#334155';
      ctx.fillRect(48, 244, 44, 18);
      ctx.fillRect(98, 244, 44, 18);

      // Glass Coffee Table
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.fillRect(160, 240, 48, 26);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.strokeRect(160, 240, 48, 26);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(174, 246, 6, 8);

      // Ficus Palm Plant in CEO Corner
      ctx.fillStyle = '#78350f';
      ctx.fillRect(242, 26, 18, 22);
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(251, 20, 10, 0, Math.PI * 2);
      ctx.arc(245, 14, 8, 0, Math.PI * 2);
      ctx.arc(258, 16, 8, 0, Math.PI * 2);
      ctx.fill();

      // ZONE 2: TEAM OPEN BULLPEN WORKSPACE (Top-Right)
      const bullX = 284;
      const bullY = 16;
      const bullW = 540;
      const bullH = 264;

      ctx.fillStyle = '#7a969e';
      ctx.fillRect(bullX, bullY, bullW, bullH);

      const chv = 14;
      for (let cy = bullY; cy < bullY + bullH; cy += chv) {
        for (let cx = bullX; cx < bullX + bullW; cx += chv * 2) {
          const alt = Math.floor((cy - bullY) / chv) % 2 === 0;
          ctx.fillStyle = alt ? '#86a2aa' : '#6f8b93';
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + chv, cy + chv);
          ctx.lineTo(cx + chv, cy + chv - 4);
          ctx.lineTo(cx, cy - 4);
          ctx.fill();

          ctx.fillStyle = alt ? '#728e96' : '#8aa6ae';
          ctx.beginPath();
          ctx.moveTo(cx + chv, cy + chv);
          ctx.lineTo(cx + chv * 2, cy);
          ctx.lineTo(cx + chv * 2, cy - 4);
          ctx.lineTo(cx + chv, cy + chv - 4);
          ctx.fill();
        }
      }

      // Water Cooler Station
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(800, 110, 16, 32);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(802, 94, 12, 16);
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(808, 94, 6, Math.PI, 0);
      ctx.fill();

      // ZONE 5A: GOURMET PANTRY & KITCHEN (Indoor, x: 16..226, y: 290..398)
      // Checkered slate & marble kitchen floor
      for (let kx = 16; kx < 226; kx += 15) {
        for (let ky = 290; ky < 398; ky += 15) {
          const isAlt = (Math.floor(kx / 15) + Math.floor(ky / 15)) % 2 === 0;
          ctx.fillStyle = isAlt ? '#334155' : '#1e293b';
          ctx.fillRect(kx, ky, 15, 15);
        }
      }

      // Modern Acrylic Sign: "☕ GOURMET PANTRY & KITCHEN"
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(36, 294, 154, 12);
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 7px monospace';
      ctx.fillText('☕ GOURMET PANTRY & KITCHEN', 40, 303);

      // Back Kitchen Cabinet Suite against North Wall (x: 24..180, y: 296..326)
      // Lower & upper dark charcoal oak cabinets
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(26, 306, 154, 20);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(26, 308, 154, 2);

      // Double-door Stainless Steel Smart Refrigerator (x: 28, y: 295, w: 26, h: 32)
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(28, 294, 26, 33);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(29, 295, 12, 31);
      ctx.fillRect(42, 295, 11, 31);
      // Handles
      ctx.fillStyle = '#475569';
      ctx.fillRect(39, 306, 2, 10);
      ctx.fillRect(43, 306, 2, 10);
      // Smart touch display screen on right door
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(44, 299, 7, 5);

      // White Quartz Countertop with Undermount Sink
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(56, 314, 124, 12);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(56, 325, 124, 2);
      // Stainless Steel Double Sink & Matte Black Gooseneck Faucet
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(80, 316, 22, 9);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(82, 317, 9, 7);
      ctx.fillRect(92, 317, 9, 7);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(90, 314, 2, 4); // Faucet

      // Built-in Countertop Appliances: Microwave & Coffee Station
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(112, 315, 16, 10);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(122, 317, 4, 2); // Digital microwave display
      // Espresso Coffee Machine & Ceramic Cups
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(136, 315, 12, 10);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(152, 318, 5, 5);
      ctx.fillRect(160, 318, 5, 5);
      // Fresh Fruit Basket with apples & oranges
      ctx.fillStyle = '#78350f';
      ctx.beginPath(); ctx.arc(172, 320, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(170, 318, 2, 2);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(173, 319, 2, 2);

      // Gourmet Waterfall Kitchen Island Bar (x: 75..175, y: 350..376)
      // Island drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(77, 354, 98, 24);
      // Dark fluted oak base
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(79, 356, 94, 18);
      for (let fx = 83; fx < 170; fx += 6) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(fx, 358, 2, 14);
      }
      // Pure White Quartz Waterfall Countertop
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(75, 348, 102, 10);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(75, 358, 4, 16); // Left waterfall slab
      ctx.fillRect(173, 358, 4, 16); // Right waterfall slab
      // Center brass power pop-up strip & fruit bowl on island
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(122, 350, 8, 3);

      // 2 Modern Barstools at Kitchen Island (x: 95, y: 382 and x: 155, y: 382)
      [95, 155].forEach((bx) => {
        // Chrome pedestal & footrest
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(bx - 1, 380, 2, 8);
        ctx.fillRect(bx - 4, 385, 8, 2);
        // Cognac leather cushion
        ctx.fillStyle = '#9a3412';
        ctx.beginPath(); ctx.arc(bx, 378, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#b45309';
        ctx.beginPath(); ctx.arc(bx, 378, 4, 0, Math.PI * 2); ctx.fill();
      });

      // Suspended Minimalist Linear Brass LED Chandelier overhead
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(85, 338, 82, 2);
      ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
      ctx.fillRect(80, 340, 92, 6);

      // ======================================================================
      // DIVIDING PATIO GLASS ACCORDION WALL & SLIDING DOOR (y = 398, x: 16..226)
      // ======================================================================
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(16, 396, 210, 5); // Main black aluminum lintel frame
      // Left glass panel (x: 16..84)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.fillRect(16, 397, 68, 3);
      // Right glass panel (x: 156..226)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.fillRect(156, 397, 70, 3);
      // Silver sliding terrace door threshold track in center doorway (x: 84..156)
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(84, 397, 72, 3);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(84, 398, 72, 1);

      // ======================================================================
      // ZONE 5B: OUTDOOR ZEN GARDEN & PATIO TERRACE (Outdoor, x: 16..226, y: 402..504)
      // ======================================================================
      // 1. Lush Green Lawn along border perimeter
      ctx.fillStyle = '#15803d';
      ctx.fillRect(16, 402, 210, 102);
      // Subtle grass texture & tiny white lawn flowers
      ctx.fillStyle = '#166534';
      for (let gx = 22; gx < 220; gx += 18) {
        for (let gy = 408; gy < 500; gy += 14) {
          ctx.fillRect(gx, gy, 2, 3);
        }
      }
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(34, 485, 2, 2);
      ctx.fillRect(195, 435, 2, 2);
      ctx.fillRect(180, 480, 2, 2);
      ctx.fillRect(45, 420, 2, 2);

      // 2. Warm Honey Teak Wooden Patio Decking in Center (x: 60..186, y: 404..498)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(62, 406, 126, 94);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(60, 404, 126, 94);
      ctx.fillStyle = '#b45309';
      for (let py = 408; py < 498; py += 10) {
        ctx.fillRect(62, py, 122, 8);
      }

      // Stone Paver Stepping Path from patio door to outdoor table
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(112, 408, 16, 8);
      ctx.fillRect(114, 420, 14, 8);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(113, 409, 14, 6);
      ctx.fillRect(115, 421, 12, 6);

      // Wooden Sign: "🌿 OUTDOOR GARDEN & PATIO"
      ctx.fillStyle = '#451a03';
      ctx.fillRect(36, 404, 150, 12);
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 7px monospace';
      ctx.fillText('🌿 OUTDOOR GARDEN & PATIO', 40, 413);

      // 3. Zen Stacked Stone Water Fountain in Garden Corner (x: 24, y: 432, w: 26, h: 32)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(26, 436, 24, 28);
      // Slate tiered stone basin
      ctx.fillStyle = '#334155';
      ctx.fillRect(24, 444, 26, 18);
      ctx.fillStyle = '#475569';
      ctx.fillRect(27, 436, 20, 12);
      ctx.fillRect(31, 430, 12, 8);
      // Aqua crystalline fountain pool with water ripples
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(26, 448, 22, 10);
      const rip = (frame * 0.2) % 6;
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(30 + rip, 452, 6, 2);

      // 4. Outdoor Teak Dining & Work Table (x: 80..168, y: 440..472)
      // Table drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(82, 444, 86, 30);
      // Teak wood table legs
      ctx.fillStyle = '#451a03';
      ctx.fillRect(84, 442, 6, 6);
      ctx.fillRect(158, 442, 6, 6);
      ctx.fillRect(84, 464, 6, 6);
      ctx.fillRect(158, 464, 6, 6);
      // Teak Slatted Tabletop
      ctx.fillStyle = '#78350f';
      ctx.fillRect(80, 438, 88, 30);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(82, 440, 84, 26);
      for (let tx = 86; tx < 162; tx += 12) {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(tx, 440, 2, 26);
      }

      // 2 Outdoor Woven Teak Armchairs (x: 95, y: 474 and x: 153, y: 474)
      [95, 153].forEach((ax) => {
        // Chair frame
        ctx.fillStyle = '#451a03';
        ctx.fillRect(ax - 7, 470, 14, 14);
        // Cream woven cushion
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(ax - 5, 472, 10, 10);
      });

      // Giant Sun Umbrella / Patio Parasol overhead
      // Umbrella Pole
      ctx.fillStyle = '#451a03';
      ctx.fillRect(123, 428, 4, 18);
      // Cream Canvas Hexagonal Canopy casting gentle translucent shade
      ctx.fillStyle = 'rgba(254, 243, 199, 0.85)';
      ctx.beginPath();
      ctx.moveTo(125, 412); // Top apex
      ctx.lineTo(175, 428); // Right
      ctx.lineTo(165, 448); // Bottom-right
      ctx.lineTo(85, 448);  // Bottom-left
      ctx.lineTo(75, 428);  // Left
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 5. Overhead Cedar Pergola Beams with Glowing Bistro String Lights
      ctx.fillStyle = '#78350f';
      ctx.fillRect(58, 404, 4, 96);
      ctx.fillRect(184, 404, 4, 96);
      ctx.fillRect(58, 406, 130, 3);
      ctx.fillRect(58, 450, 130, 3);
      ctx.fillRect(58, 494, 130, 3);
      // Warm glowing yellow bistro fairy lights suspended between beams
      const lightPulse = Math.sin(frame * 0.1) * 0.15;
      ctx.fillStyle = '#fef08a';
      [75, 100, 125, 150, 170].forEach((lx) => {
        ctx.fillRect(lx, 408 + Math.sin(lx) * 3, 3, 3);
        ctx.fillRect(lx, 452 + Math.cos(lx) * 3, 3, 3);
      });

      // 6. Tropical Planter Boxes & Potted Ficus Trees along Balustrade
      // Left flower boxes
      ctx.fillStyle = '#78350f';
      ctx.fillRect(18, 480, 24, 10);
      ctx.fillStyle = '#ec4899'; // Blooming pink roses
      ctx.fillRect(20, 478, 4, 4);
      ctx.fillRect(28, 477, 4, 4);
      ctx.fillRect(36, 478, 4, 4);
      // Right potted palm
      ctx.fillStyle = '#c2410c';
      ctx.fillRect(196, 465, 12, 10);
      ctx.fillStyle = '#15803d';
      ctx.beginPath(); ctx.arc(202, 460, 10, 0, Math.PI * 2); ctx.fill();

      // Modern Frameless Safety Glass Balustrade on Left & Bottom Terrace Rim
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.fillRect(16, 402, 3, 102); // Left edge glass
      ctx.fillRect(16, 502, 210, 3); // Bottom edge glass
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(16, 402, 3, 2);
      ctx.fillRect(16, 503, 210, 2);

      // ZONE 3: THE ENCLOSED EXECUTIVE BOARDROOM SUITE (Center, x: 226..590, y: 290..504)
      ctx.fillStyle = '#543d2b';
      ctx.fillRect(226, 290, 364, 214);
      ctx.strokeStyle = '#3f2c1d';
      ctx.lineWidth = 1;
      for (let by = 296; by < 504; by += 16) {
        ctx.beginPath();
        ctx.moveTo(226, by);
        ctx.lineTo(590, by);
        ctx.stroke();
      }

      // Presentation Smart Screen on Boardroom Wall (Sleek 150px display at x: 295..445, completely clear of doorway at 480..550)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(295, 296, 150, 42);
      ctx.fillStyle = '#02182b';
      ctx.fillRect(298, 299, 144, 36);
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 7px monospace';
      ctx.fillText('⚡ AI AGENTS EXECUTIVE BOARDROOM', 304, 311);
      ctx.strokeStyle = '#00f59b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(306, 327);
      ctx.lineTo(322, 321);
      ctx.lineTo(338, 324);
      ctx.lineTo(358, 316);
      ctx.lineTo(378, 319);
      ctx.stroke();
      ctx.fillStyle = '#9d4edd';
      ctx.fillRect(390, 315, 20, 11);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(414, 315, 20, 11);

      // Boardroom Mahogany Conference Table
      const tableX = 270;
      const tableY = 390;
      const tableW = 300;
      const tableH = 68;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(tableX + 4, tableY + 6, tableW, tableH);
      ctx.fillStyle = '#2d1810';
      ctx.fillRect(tableX, tableY, tableW, tableH);
      ctx.fillStyle = '#3e2318';
      ctx.fillRect(tableX + 4, tableY + 4, tableW - 8, tableH - 8);

      ctx.fillStyle = '#4a2c1e';
      ctx.fillRect(tableX + 30, tableY + 16, tableW - 60, tableH - 32);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(tableX + tableW / 2, tableY + tableH / 2, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(tableX + tableW / 2 - 2, tableY + tableH / 2 - 2, 4, 4);

      // 6 Conference Chairs around Table (Dylan Head of Table + 3 North + 2 South)
      const confChairs = [
        { x: tableX - 22, y: tableY + 24 }, // Dylan CEO seat (Head of Table)
        // North side (Ray, Maya, Alex)
        { x: tableX + 40, y: tableY - 18 },
        { x: tableX + 130, y: tableY - 18 },
        { x: tableX + 220, y: tableY - 18 },
        // South side (Wendy, Zane)
        { x: tableX + 80, y: tableY + tableH + 4 },
        { x: tableX + 190, y: tableY + tableH + 4 },
      ];

      confChairs.forEach((cc) => {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(cc.x, cc.y, 22, 18);
        ctx.fillStyle = '#334155';
        ctx.fillRect(cc.x + 2, cc.y + 2, 18, 14);
      });

      // ======================================================================
      // REST AREA & TEAM RELAXATION / WORK LOUNGE (Bottom-Right, x: 596..818, y: 298..500)
      // ======================================================================
      // 1. Cozy Lounge Carpet / Dark Slate Planks
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(596, 298, 222, 202);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(602, 304, 210, 190);

      // Acoustic Vertical Wood Slat Accent Wall (Luxury modern office backdrop)
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(648, 298, 154, 30);
      for (let wx = 650; wx < 800; wx += 6) {
        ctx.fillStyle = '#78350f'; // Warm oak slat
        ctx.fillRect(wx, 299, 4, 28);
        ctx.fillStyle = '#92400e'; // Highlight
        ctx.fillRect(wx + 1, 299, 1, 28);
      }

      // Decorative Warm Indigo Rug under Sofa, Table & Bench
      ctx.fillStyle = '#312e81';
      ctx.fillRect(648, 326, 152, 148);
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 1;
      ctx.strokeRect(648, 326, 152, 148);

      // Neon Sign: "☕ RELAX & WORK LOUNGE"
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(650, 298, 144, 14);
      ctx.fillStyle = '#ec4899';
      ctx.font = 'bold 7px monospace';
      ctx.fillText('☕ RELAX & WORK LOUNGE', 654, 308);

      // 2. Velvet Emerald Green Lounge Sectional Sofa
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(664, 334, 116, 12); // Backrest
      ctx.fillStyle = '#047857';
      ctx.fillRect(664, 346, 116, 22); // Cushion Base
      ctx.fillStyle = '#059669';
      ctx.fillRect(668, 348, 34, 18);
      ctx.fillRect(705, 348, 34, 18);
      ctx.fillRect(742, 348, 34, 18);
      ctx.fillStyle = '#065f46';
      ctx.fillRect(658, 336, 8, 32); // Left armrest
      ctx.fillRect(778, 336, 8, 32); // Right armrest
      // Gold Velvet Accent Throw Pillows
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(666, 340, 8, 8);
      ctx.fillRect(770, 340, 8, 8);

      // 3. Modern Glass Coffee Table with Steaming Mugs & Design Magazine
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(690, 396, 68, 24);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(688, 392, 68, 22);
      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(690, 394, 64, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(700, 398, 5, 7); // Mug 1
      ctx.fillStyle = '#ffbe0b';
      ctx.fillRect(726, 398, 5, 7); // Mug 2
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      const lSteam = (frame * 0.4) % 6;
      ctx.fillRect(702, 394 - lSteam, 2, 2);
      ctx.fillRect(728, 394 - lSteam, 2, 2);
      // Tech Magazine on table
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(738, 398, 10, 8);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(740, 400, 6, 4);

      // 3B. NEW! COLLABORATIVE OAK & COGNAC LEATHER LAPTOP WORK BENCH (Bench 2)
      // Solid Natural White Oak Base Frame
      ctx.fillStyle = '#78350f';
      ctx.fillRect(670, 440, 110, 24);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(672, 442, 106, 20);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(672, 442, 106, 2); // Golden oak top beveled bevel

      // Cognac Padded Leather Cushion Pads (Seat 1 on left, Seat 2 on right)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(675, 446, 46, 14);
      ctx.fillRect(729, 446, 46, 14);
      ctx.fillStyle = '#92400e'; // Rich cognac leather cushion
      ctx.fillRect(676, 447, 44, 12);
      ctx.fillRect(730, 447, 44, 12);

      // Center Integrated Brass Power Hub & USB-C Station
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(722, 447, 6, 12);
      ctx.fillStyle = '#10b981'; // Green active charging LED
      ctx.fillRect(724, 451, 2, 2);

      // Brass-Capped Sturdy Metal Legs
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(673, 464, 4, 6);
      ctx.fillRect(773, 464, 4, 6);
      ctx.fillStyle = '#fbbf24'; // Polished gold brass foot caps
      ctx.fillRect(673, 468, 4, 2);
      ctx.fillRect(773, 468, 4, 2);

      // Soft ambient LED underglow under the new bench
      ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
      ctx.fillRect(672, 466, 106, 2);

      // 4. Espresso Bar & Refreshment Station
      ctx.fillStyle = '#334155';
      ctx.fillRect(608, 426, 38, 66);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(606, 424, 40, 16);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(610, 404, 18, 22);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(612, 406, 14, 8);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(614, 418, 3, 4);
      ctx.fillRect(621, 418, 3, 4);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(632, 412, 4, 12);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(638, 412, 4, 12);

      // 5. Retro Pixel Arcade Cabinet
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(780, 318, 26, 44);
      ctx.fillStyle = '#4338ca';
      ctx.fillRect(782, 320, 22, 10);
      ctx.fillStyle = '#ffbe0b';
      ctx.font = 'bold 6px monospace';
      ctx.fillText('ARCADE', 783, 328);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(782, 332, 22, 18);
      ctx.fillStyle = frame % 30 < 15 ? '#ec4899' : '#00f0ff';
      ctx.fillRect(786, 336, 6, 6);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(794, 340, 4, 4);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(786, 352, 3, 3);
      ctx.fillStyle = '#00f59b';
      ctx.fillRect(792, 352, 2, 2);
      ctx.fillRect(796, 352, 2, 2);

      // 6. Lush Potted Fiddle-Leaf Fig Tree & Monstera Plant
      ctx.fillStyle = '#78350f';
      ctx.fillRect(804, 464, 12, 18);
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(810, 452, 12, 0, Math.PI * 2);
      ctx.arc(804, 444, 9, 0, Math.PI * 2);
      ctx.arc(816, 444, 9, 0, Math.PI * 2);
      ctx.fill();

      // Second Planter: Potted Golden Pothos next to Espresso Bar
      ctx.fillStyle = '#334155';
      ctx.fillRect(648, 474, 10, 14);
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(653, 470, 7, 0, Math.PI * 2);
      ctx.fill();

      // ======================================================================
      // 2. GLASS PARTITION WALLS & ARCHITECTURAL SLIDING DOORS
      // ======================================================================
      // Vertical Glass Wall between CEO Suite & Bullpen (x = 276)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.fillRect(276, 16, 8, 164); // Top segment (y: 16..180)
      ctx.fillRect(276, 260, 8, 20);  // Bottom segment (y: 260..280)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.strokeRect(276, 16, 8, 164);
      ctx.strokeRect(276, 260, 8, 20);

      // Continuous overhead lintel header & floor threshold plate for CEO doorway (y: 180..260)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(274, 180, 12, 80); // Recessed floor threshold guide track
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(273, 178, 14, 4);  // Top jamb post
      ctx.fillRect(273, 258, 14, 4);  // Bottom jamb post

      // PIR Motion Presence Sensor Box & Dynamic LED
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(272, 172, 16, 6);
      ctx.fillStyle = ceoDoorProgress > 0.08 ? '#10b981' : '#0284c7';
      ctx.fillRect(278, 174, 4, 2);

      // Executive Brass Plaque for CEO Dylan Ramos
      ctx.fillStyle = '#d97706';
      ctx.fillRect(208, 16, 68, 14);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(210, 17, 64, 12);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 7px monospace';
      ctx.fillText('DYLAN RAMOS | CEO', 213, 26);

      // CEO Sliding Glass Door Leaf (spans y: 182..258, height 76, slides down into wall pocket)
      const ceoSlideOffset = Math.round(ceoDoorProgress * 54);
      const ceoDoorY = 182 + ceoSlideOffset;
      const ceoDoorH = 76 - Math.round(ceoDoorProgress * 16);

      // Door glass panel
      ctx.fillStyle = 'rgba(56, 189, 248, 0.40)';
      ctx.fillRect(276, ceoDoorY, 8, ceoDoorH);
      // Aluminum perimeter frame
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(276, ceoDoorY, 8, ceoDoorH);
      // Frosted privacy manifestation band across glass panel
      ctx.fillStyle = 'rgba(224, 242, 254, 0.75)';
      ctx.fillRect(277, ceoDoorY + Math.round(ceoDoorH * 0.42), 6, 12);
      // Chrome architectural pull handles (inner & outer)
      ctx.fillStyle = '#cfd8dc';
      ctx.fillRect(275, ceoDoorY + Math.round(ceoDoorH * 0.38), 2, 16);
      ctx.fillRect(283, ceoDoorY + Math.round(ceoDoorH * 0.38), 2, 16);

      // Horizontal Glass Wall between Bullpen & Boardroom (y = 280)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.fillRect(16, 280, 464, 8);  // Left wall segment (x: 16..480)
      ctx.fillRect(550, 280, 274, 8); // Right wall segment (x: 550..824)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(16, 280, 464, 8);
      ctx.strokeRect(550, 280, 274, 8);

      // Continuous floor threshold plate & guide track for Boardroom doorway (x: 480..550)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(480, 278, 70, 12); // Threshold plate
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(478, 277, 4, 14);  // Left jamb post
      ctx.fillRect(548, 277, 4, 14);  // Right jamb post

      // Overhead Center Motion Sensor Box & Dynamic LED
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(509, 273, 12, 5);
      ctx.fillStyle = boardDoorProgress > 0.08 ? '#10b981' : '#00f0ff';
      ctx.fillRect(513, 274, 4, 2);

      // Boardroom Illuminated Acrylic Sign
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(476, 264, 78, 12);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(476, 264, 78, 12);
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 7px monospace';
      ctx.fillText('BOARDROOM', 484, 273);

      // Boardroom Bi-Parting Double Sliding Glass Doors (meeting in center x = 515)
      const boardSlideOffset = Math.round(boardDoorProgress * 28);
      // Left leaf: normal closed x = 480, width = 35. Slides left!
      const leftDoorX = 480 - boardSlideOffset;
      // Right leaf: normal closed x = 515, width = 35. Slides right!
      const rightDoorX = 515 + boardSlideOffset;

      // Draw Left Leaf
      ctx.fillStyle = 'rgba(56, 189, 248, 0.40)';
      ctx.fillRect(leftDoorX, 280, 35, 8);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(leftDoorX, 280, 35, 8);
      // Frosted privacy manifestation band
      ctx.fillStyle = 'rgba(224, 242, 254, 0.75)';
      ctx.fillRect(leftDoorX + 3, 282, 28, 4);
      // Center meeting seal & Chrome vertical pull handle near meeting edge
      ctx.fillStyle = '#090d16';
      ctx.fillRect(leftDoorX + 33, 280, 2, 8);
      ctx.fillStyle = '#cfd8dc';
      ctx.fillRect(leftDoorX + 29, 278, 2, 4);
      ctx.fillRect(leftDoorX + 29, 286, 2, 4);

      // Draw Right Leaf
      ctx.fillStyle = 'rgba(56, 189, 248, 0.40)';
      ctx.fillRect(rightDoorX, 280, 35, 8);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(rightDoorX, 280, 35, 8);
      // Frosted privacy manifestation band
      ctx.fillStyle = 'rgba(224, 242, 254, 0.75)';
      ctx.fillRect(rightDoorX + 3, 282, 28, 4);
      // Center meeting seal & Chrome vertical pull handle near meeting edge
      ctx.fillStyle = '#090d16';
      ctx.fillRect(rightDoorX, 280, 2, 8);
      ctx.fillStyle = '#cfd8dc';
      ctx.fillRect(rightDoorX + 4, 278, 2, 4);
      ctx.fillRect(rightDoorX + 4, 286, 2, 4);

      // Vertical Glass Divider between Billiards Lounge & Boardroom (x = 226, y in [280, 504])
      ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.fillRect(226, 288, 8, 22);  // Top wall segment (y: 288..310)
      ctx.fillRect(226, 370, 8, 134); // Bottom wall segment (y: 370..504)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(226, 288, 8, 22);
      ctx.strokeRect(226, 370, 8, 134);
      // Floor guide track / threshold across doorway (y: 310..370)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(224, 310, 12, 60);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(223, 308, 14, 4); // Top jamb
      ctx.fillRect(223, 368, 14, 4); // Bottom jamb
      // Frosted Sliding Door Leaf / Open Portal
      ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
      ctx.fillRect(226, 312, 8, 56);
      ctx.fillStyle = 'rgba(224, 242, 254, 0.6)';
      ctx.fillRect(227, 334, 6, 12);
      // West Divider Plaque
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(200, 290, 54, 10);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 5.5px monospace';
      ctx.fillText('BOARDROOM W', 202, 297);

      // Vertical Glass Divider between Boardroom & Rest Lounge (x = 590, y in [280, 504])
      ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.fillRect(590, 288, 8, 22);  // Top wall segment (y: 288..310)
      ctx.fillRect(590, 370, 8, 134); // Bottom wall segment (y: 370..504)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(590, 288, 8, 22);
      ctx.strokeRect(590, 370, 8, 134);
      // Floor guide track / threshold across doorway (y: 310..370)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(588, 310, 12, 60);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(587, 308, 14, 4); // Top jamb
      ctx.fillRect(587, 368, 14, 4); // Bottom jamb
      // Frosted Sliding Door Leaf / Open Portal
      ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
      ctx.fillRect(590, 312, 8, 56);
      ctx.fillStyle = 'rgba(224, 242, 254, 0.6)';
      ctx.fillRect(591, 334, 6, 12);
      // East Divider Plaque
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(594, 290, 52, 10);
      ctx.fillStyle = '#ec4899';
      ctx.font = 'bold 5.5px monospace';
      ctx.fillText('LOUNGE EAST', 596, 297);

      // ======================================================================
      // 3. WORKSTATION DESKS & PERMANENT CHAIRS
      // ======================================================================
      // CEO Executive Desk (Dylan Ramos) - Dark Walnut & Brass Inlay (Facing the Door)
      const dDeskX = 75;
      const dDeskY = 96;
      const dDeskW = 150;
      const dDeskH = 58;

      // Herman Miller Ergonomic Chair at Dylan's Desk (Placed BEHIND desk at y = 62, facing DOWN)
      // Five-star spider base & caster wheels
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(128, 58, 34, 3);
      ctx.fillRect(126, 59, 4, 3);
      ctx.fillRect(160, 59, 4, 3);
      // Executive contoured headrest behind Dylan
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(138, 54, 14, 5);
      // Contoured mesh backrest & lumbar spine
      ctx.fillStyle = '#111827';
      ctx.fillRect(131, 58, 28, 16);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(133, 60, 24, 12);
      // 3D adjustable armrests
      ctx.fillStyle = '#334155';
      ctx.fillRect(125, 62, 5, 14);
      ctx.fillRect(160, 62, 5, 14);

      // Now draw Executive Desk (In FRONT of Dylan, between Dylan and the door)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(dDeskX + 4, dDeskY + 6, dDeskW, dDeskH);
      // Dark walnut executive desk finish
      ctx.fillStyle = '#2e180d';
      ctx.fillRect(dDeskX, dDeskY, dDeskW, dDeskH);

      // Executive Brass Modesty Panel at front of desk facing door (bottom edge)
      ctx.fillStyle = '#1c0f08';
      ctx.fillRect(dDeskX + 6, dDeskY + dDeskH - 14, dDeskW - 12, 10);
      ctx.fillStyle = '#d97706'; // Brushed brass inlay borders
      ctx.fillRect(dDeskX + 8, dDeskY + dDeskH - 12, dDeskW - 16, 2);
      ctx.fillRect(dDeskX + 8, dDeskY + dDeskH - 6, dDeskW - 16, 2);

      // Black Leather Executive Desk Pad on Dylan's side (top edge)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(dDeskX + 28, dDeskY + 6, 94, 34);

      // Liquid-Cooled Gaming Tower
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(dDeskX + 6, dDeskY + 10, 18, 38);
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(dDeskX + 10, dDeskY + 16, 3, 26);

      // Open Executive MacBook Pro on Desk (Facing Dylan)
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(dDeskX + 8, dDeskY + 12, 18, 10);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(dDeskX + 10, dDeskY + 13, 14, 5); // Keyboard
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(dDeskX + 14, dDeskY + 19, 6, 2);  // Trackpad
      // Display lid with screen facing north towards Dylan
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(dDeskX + 8, dDeskY + 22, 18, 8);
      ctx.fillStyle = '#00f0ff'; // Executive cyan glowing screen facing Dylan
      ctx.fillRect(dDeskX + 9, dDeskY + 22, 16, 4);

      // Mechanical Keyboard & Precision Mouse (in front of Dylan, on desk pad)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(dDeskX + 42, dDeskY + 10, 38, 12);
      ctx.fillStyle = '#ffbe0b';
      ctx.fillRect(dDeskX + 44, dDeskY + 12, 34, 2);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(dDeskX + 84, dDeskY + 12, 6, 8);

      // Dylan Dual Monitors: 49" Panoramic Ultrawide + Vertical KPI Display
      // (Screen faces North/up towards Dylan, sleek black casing faces South/down towards door)
      // Casing back (facing down towards door)
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(dDeskX + 32, dDeskY + 24, 56, 18);
      // Active glowing screen (facing up towards Dylan)
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(dDeskX + 34, dDeskY + 22, 52, 4);
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(dDeskX + 42, dDeskY + 22, 24, 2);

      // Secondary Vertical Metrics Monitor
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(dDeskX + 92, dDeskY + 18, 24, 26);
      ctx.fillStyle = '#0a0c14';
      ctx.fillRect(dDeskX + 94, dDeskY + 16, 20, 6);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(dDeskX + 96, dDeskY + 16, 14, 2);

      // Bullpen Desks (5 Specialists: 3 Row 1, 2 Row 2)
      const bpDesks = [
        // Row 1 (AI Researcher, Designer, Fullstack Dev)
        { id: 'ray', x: 304, y: 46 },
        { id: 'maya', x: 474, y: 46 },
        { id: 'alex', x: 644, y: 46 },
        // Row 2 (Marketing, Cybersecurity)
        { id: 'wendy', x: 389, y: 160 },
        { id: 'zane', x: 559, y: 160 },
      ];

      bpDesks.forEach((d) => {
        const w = 140;
        const h = 50;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(d.x + 4, d.y + 6, w, h);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(d.x, d.y, w, h);
        ctx.fillStyle = '#334155';
        ctx.fillRect(d.x, d.y + h - 5, w, 5);

        // Extended desk pad with role-tailored color
        const padColors: Record<string, string> = {
          ray: '#083344',
          maya: '#500724',
          alex: '#431407',
          wendy: '#0f172a',
          zane: '#052e16',
        };
        ctx.fillStyle = padColors[d.id] || '#0f172a';
        ctx.fillRect(d.x + 20, d.y + 10, 98, 36);

        // Herman Miller Ergonomic Aeron Chair behind desk
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(d.x + w / 2 - 14, d.y + h + 16, 28, 3);
        ctx.fillRect(d.x + w / 2 - 16, d.y + h + 17, 4, 3);
        ctx.fillRect(d.x + w / 2 + 12, d.y + h + 17, 4, 3);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(d.x + w / 2 - 12, d.y + h + 2, 24, 14);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(d.x + w / 2 - 10, d.y + h + 4, 20, 10);
        // Armrests
        ctx.fillStyle = '#334155';
        ctx.fillRect(d.x + w / 2 - 14, d.y + h + 4, 3, 8);
        ctx.fillRect(d.x + w / 2 + 11, d.y + h + 4, 3, 8);

        // --------------------------------------------------------------------
        // DISTINCT WORKSTATION HARDWARE CONFIGURATIONS (Dual, Single, Laptop)
        // --------------------------------------------------------------------
        if (d.id === 'alex' || d.id === 'ray') {
          // 1. DUAL 27" MONITORS (Desktop Developer / Researcher - NO LAPTOP)
          // Monitor 1 (Left)
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(d.x + 22, d.y + 4, 38, 24);
          // Monitor 2 (Right)
          ctx.fillRect(d.x + 64, d.y + 4, 38, 24);

          if (d.id === 'alex') {
            // Alex: Dark VSCode with orange syntax + Terminal
            ctx.fillStyle = '#f97316';
            ctx.fillRect(d.x + 26, d.y + 8, 14, 2);
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(d.x + 42, d.y + 8, 12, 2);
            ctx.fillStyle = '#34d399';
            ctx.fillRect(d.x + 26, d.y + 14, 26, 2);
            ctx.fillStyle = '#00f0ff';
            ctx.fillRect(d.x + 68, d.y + 8, 22, 2);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(d.x + 68, d.y + 14, 26, 2);
            // Insulated orange flask
            ctx.fillStyle = '#ea580c';
            ctx.fillRect(d.x + 106, d.y + 16, 8, 14);
          } else {
            // Ray: PyTorch Research paper + Loss graph
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(d.x + 26, d.y + 8, 28, 2);
            ctx.fillRect(d.x + 26, d.y + 14, 20, 2);
            ctx.strokeStyle = '#00f59b';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(d.x + 66, d.y + 22);
            ctx.lineTo(d.x + 74, d.y + 15);
            ctx.lineTo(d.x + 84, d.y + 19);
            ctx.lineTo(d.x + 94, d.y + 10);
            ctx.stroke();
            // Research notebook & white mug
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(d.x + 104, d.y + 18, 14, 16);
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(d.x + 106, d.y + 36, 8, 8);
          }

          // RGB Tower PC on right side
          const towerRgb = d.id === 'alex' ? '#f97316' : '#00f0ff';
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(d.x + 120, d.y + 8, 16, 32);
          ctx.fillStyle = towerRgb;
          ctx.fillRect(d.x + 123, d.y + 14, 3, 20);

          // Mechanical Keyboard & Mouse
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(d.x + 44, d.y + 34, 32, 8);
          ctx.fillRect(d.x + 80, d.y + 34, 6, 6);



        } else if (d.id === 'wendy') {
          // 3. LAPTOP-ONLY WORKSTATION (Marketing Strategist - NO BIG DESKTOP MONITORS!)
          // Elevated Aluminum Laptop Stand
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(d.x + 48, d.y + 8, 44, 20);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(d.x + 50, d.y + 10, 40, 16);

          // Open 16" MacBook Pro resting on stand - SCREEN FACING WENDY (downwards)!
          // Upright screen lid at top (screen faces south/down towards Wendy)
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(d.x + 48, d.y + 6, 44, 18);
          // Glowing screen with green marketing copy text
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(d.x + 50, d.y + 8, 40, 14);
          ctx.fillStyle = '#34d399';
          ctx.fillRect(d.x + 53, d.y + 11, 28, 2);
          ctx.fillRect(d.x + 53, d.y + 15, 34, 2);
          ctx.fillRect(d.x + 53, d.y + 19, 22, 2);

          // Keyboard base on stand in front of screen
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(d.x + 48, d.y + 24, 44, 10);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(d.x + 51, d.y + 25, 38, 5);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(d.x + 65, d.y + 31, 10, 2); // Trackpad

          // Wireless Magic Keyboard & Mouse on desk in front of stand
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(d.x + 48, d.y + 38, 32, 6);
          ctx.fillRect(d.x + 84, d.y + 38, 5, 6);

          // Iconic yellow debugging duck & coffee mug
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(d.x + 104, d.y + 20, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f97316';
          ctx.fillRect(d.x + 107, d.y + 19, 3, 2); // Duck beak
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(d.x + 104, d.y + 32, 8, 10);

        } else if (d.id === 'maya') {
          // 4. SINGLE 32" 4K MONITOR + OPEN MACBOOK ON LEFT (UI/UX Designer)
          // Center 32" 4K Figma Canvas Display
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(d.x + 44, d.y + 4, 48, 24);
          ctx.fillStyle = '#ec4899';
          ctx.fillRect(d.x + 48, d.y + 8, 18, 16);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(d.x + 70, d.y + 8, 18, 16);

          // Open 16" MacBook Pro on Left Side - SCREEN FACING MAYA (downwards)!
          // Display lid (bezel + glowing mobile design preview)
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(d.x + 8, d.y + 14, 22, 12);
          ctx.fillStyle = '#ec4899';
          ctx.fillRect(d.x + 10, d.y + 16, 18, 8);
          // Keyboard base in front of screen
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(d.x + 8, d.y + 26, 22, 10);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(d.x + 10, d.y + 27, 18, 5);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(d.x + 16, d.y + 33, 6, 2); // Trackpad

          // Wacom Intuos Drawing Tablet & Pantone tokens
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(d.x + 98, d.y + 18, 16, 18);
          ctx.fillStyle = '#ec4899';
          ctx.fillRect(d.x + 100, d.y + 20, 12, 14);
          const swatches = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981'];
          for (let si = 0; si < 4; si++) {
            ctx.fillStyle = swatches[si];
            ctx.fillRect(d.x + 98 + si * 4, d.y + 10, 3, 4);
          }

          // Pink RGB Tower PC
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(d.x + 120, d.y + 8, 16, 32);
          ctx.fillStyle = '#ec4899';
          ctx.fillRect(d.x + 123, d.y + 14, 3, 20);

          // Keyboard & Mouse
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(d.x + 48, d.y + 34, 30, 8);
          ctx.fillRect(d.x + 82, d.y + 34, 6, 6);

        } else if (d.id === 'zane') {
          // 5. SINGLE 32" SECURITY SOC DISPLAY + THINKPAD ON LEFT (Cybersecurity)
          // Center Security Display: Threat Radar
          ctx.fillStyle = '#052e16';
          ctx.fillRect(d.x + 44, d.y + 4, 48, 24);
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(d.x + 68, d.y + 16, 9, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(d.x + 67, d.y + 15, 2, 2);

          // Open ThinkPad Stealth Security Laptop on Left Side - SCREEN FACING ZANE (downwards)!
          // Display lid with Matrix green firewall log
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(d.x + 8, d.y + 14, 22, 12);
          ctx.fillStyle = '#052e16';
          ctx.fillRect(d.x + 10, d.y + 16, 18, 8);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(d.x + 12, d.y + 18, 14, 2);
          ctx.fillRect(d.x + 12, d.y + 21, 10, 2);
          // Keyboard base in front of screen
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(d.x + 8, d.y + 26, 22, 10);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(d.x + 10, d.y + 27, 18, 5);
          ctx.fillStyle = '#ef4444'; // Red TrackPoint
          ctx.fillRect(d.x + 18, d.y + 29, 2, 2);

          // Hardware YubiKey USB token + Tumbler
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(d.x + 104, d.y + 18, 6, 10);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(d.x + 104, d.y + 32, 8, 12);

          // Stealth Green RGB Tower PC
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(d.x + 120, d.y + 8, 16, 32);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(d.x + 123, d.y + 14, 3, 20);

          // Keyboard & Mouse
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(d.x + 48, d.y + 34, 30, 8);
          ctx.fillRect(d.x + 82, d.y + 34, 6, 6);
        }
      });

      // ======================================================================
      // 4. CLICK RIPPLE TARGET ANIMATION
      // ======================================================================
      if (clickRipple) {
        const age = (Date.now() - clickRipple.time) / 1000;
        if (age < 0.8) {
          const r = 6 + age * 24;
          const alpha = 1 - age / 0.8;
          ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(clickRipple.x, clickRipple.y, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = `rgba(0, 240, 255, ${alpha * 0.4})`;
          ctx.beginPath();
          ctx.arc(clickRipple.x, clickRipple.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ======================================================================
      // 5. RENDER CHARACTERS (Standing, Walking, or Seated with typing hands)
      // ======================================================================
      Object.values(chars).forEach((char) => {
        const isSelected = selectedAgentId === char.id;
        const breath = char.isWalking ? Math.sin(frame * 0.4) * 2 : Math.sin(frame * 0.08) * 1.2;
        const drawX = char.currentX;
        const drawY = char.currentY + breath;

        // Selection highlight ring on carpet
        if (isSelected) {
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(drawX, drawY + 12, 14, 6, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Character-Tailored Shoes & Soles for Clear Stepping Animation
        const shoeColor =
          char.id === 'dylan'
            ? '#9a3412' // Cognac leather
            : char.id === 'ray'
            ? '#ffffff' // Crisp white sneakers
            : char.id === 'maya'
            ? '#ec4899' // Pink designer sneakers
            : char.id === 'alex'
            ? '#ea580c' // Orange skate sneakers
            : char.id === 'zane'
            ? '#15803d' // Tactical boots
            : '#b45309'; // Caramel leather
        const soleColor =
          char.id === 'dylan'
            ? '#fef3c7'
            : char.id === 'maya'
            ? '#fdf2f8'
            : char.id === 'alex'
            ? '#fff7ed'
            : char.id === 'zane'
            ? '#0f172a'
            : '#ffffff';

        // Animated Walking Legs & Shoes (Active whenever moving)
        if (char.isWalking) {
          const legSwing = Math.sin(frame * 0.45) * 6;
          const leftLift = Math.max(0, legSwing) * 0.5;
          const rightLift = Math.max(0, -legSwing) * 0.5;

          // Left Leg & Stepping Shoe
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(drawX - 6, drawY + 9 + legSwing - leftLift, 4, 7);
          ctx.fillStyle = shoeColor;
          ctx.fillRect(drawX - 7, drawY + 16 + legSwing - leftLift, 6, 3);
          ctx.fillStyle = soleColor;
          ctx.fillRect(drawX - 7, drawY + 19 + legSwing - leftLift, 6, 1);

          // Right Leg & Stepping Shoe
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(drawX + 2, drawY + 9 - legSwing - rightLift, 4, 7);
          ctx.fillStyle = shoeColor;
          ctx.fillRect(drawX + 1, drawY + 16 - legSwing - rightLift, 6, 3);
          ctx.fillStyle = soleColor;
          ctx.fillRect(drawX + 1, drawY + 19 - legSwing - rightLift, 6, 1);
        } else if (!char.isSeated) {
          // Standing idle legs & shoes firmly planted
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(drawX - 6, drawY + 9, 4, 7);
          ctx.fillRect(drawX + 2, drawY + 9, 4, 7);

          // Shoes with contrasting soles
          ctx.fillStyle = shoeColor;
          ctx.fillRect(drawX - 7, drawY + 16, 6, 3);
          ctx.fillRect(drawX + 1, drawY + 16, 6, 3);
          ctx.fillStyle = soleColor;
          ctx.fillRect(drawX - 7, drawY + 19, 6, 1);
          ctx.fillRect(drawX + 1, drawY + 19, 6, 1);
        }

        // Character Torso
        ctx.fillStyle = char.shirtColor;
        ctx.fillRect(drawX - 9, drawY + 2, 18, 10);

        // Character Head & Hair
        ctx.fillStyle = char.hairColor;
        ctx.beginPath();
        ctx.arc(drawX, drawY - 4, 8, 0, Math.PI * 2);
        ctx.fill();

        // Directional Facing indicator
        if (char.facing === 'down') {
          ctx.fillStyle = '#ffdfba'; // Face showing
          ctx.fillRect(drawX - 5, drawY - 3, 10, 6);
        }

        // Dylan Founder Accent
        if (char.id === 'dylan') {
          ctx.fillStyle = '#5c3a21';
          ctx.fillRect(drawX - 4, drawY - 14, 8, 4);
        }

        // ====================================================================
        // MULTI-ACTIVITY PROCEDURAL ANIMATION SYSTEM (Kitchen, Garden, Arcade, Sofa, Drinks, Meeting, & Laptops)
        // ====================================================================
        const isAtKitchen = drawX <= 220 && drawY >= 280 && drawY <= 398 && !char.isWalking;
        const isAtGarden = drawX <= 220 && drawY > 398 && drawY <= 504 && !char.isWalking;
        const isAtArcade = drawX >= 772 && drawX <= 812 && drawY >= 335 && drawY <= 380 && !char.isWalking;
        const isAtSofa = drawX >= 660 && drawX <= 785 && drawY >= 340 && drawY <= 375 && !char.isWalking;
        const isAtWater = drawX >= 760 && drawX <= 820 && drawY >= 100 && drawY <= 150 && !char.isWalking;
        const isAtCoffee = drawX >= 600 && drawX <= 648 && drawY >= 415 && drawY <= 480 && !char.isWalking;
        const isAtWorkBench = drawX >= 660 && drawX <= 785 && drawY >= 430 && drawY <= 468 && !char.isWalking;
        const isNearBoardroomSeat = Math.hypot(char.currentX - char.seatX, char.currentY - char.seatY) < 24 && (char.seatX >= 230 && char.seatX <= 530 && char.seatY >= 370 && char.seatY <= 470);
        const isAtBoardroom = (!char.isWalking && (isNearBoardroomSeat || (drawX >= 230 && drawX <= 585 && drawY >= 360 && drawY <= 495))) || char.isMeeting;
        const isInLoungeArea = drawX >= 596 && drawY >= 310;

        if (char.activity === 'kitchen_work' || isAtKitchen) {
          // A. GOURMET KITCHEN ISLAND WORKING & SNACKING
          const screenColors: Record<string, string> = {
            dylan: '#00f0ff',
            alex: '#f97316',
            maya: '#ec4899',
            wendy: '#10b981',
            ray: '#38bdf8',
            zane: '#22c55e',
          };
          const lapGlow = screenColors[char.id] || '#00f0ff';
          const type = Math.sin(frame * 0.45) * 2;

          // Laptop Base on marble island counter
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(drawX - 9, drawY - 14, 18, 7);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(drawX - 8, drawY - 13, 16, 5);

          // Angled glowing screen lid facing character
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(drawX - 9, drawY - 22, 18, 8);
          ctx.fillStyle = lapGlow;
          ctx.fillRect(drawX - 8, drawY - 21, 16, 6);

          // Code/document lines on screen
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(drawX - 6, drawY - 20, 10, 1);
          ctx.fillRect(drawX - 6, drawY - 18, 12, 1);
          ctx.fillRect(drawX - 6, drawY - 16, 7, 1);

          // Animated typing hands on keyboard
          ctx.fillStyle = '#ffdfba';
          ctx.fillRect(drawX - 6, drawY - 14 + type, 4, 3);
          ctx.fillRect(drawX + 2, drawY - 14 - type, 4, 3);

          // Fresh snack plate with golden buttery croissant on island counter
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(drawX + 13, drawY - 15, 10, 8);
          ctx.fillStyle = '#d97706';
          ctx.fillRect(drawX + 15, drawY - 14, 6, 5);
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(drawX + 16, drawY - 13, 4, 3);

          // Hot cappuccino demitasse with steam
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(drawX - 22, drawY - 15, 6, 6);
          ctx.fillStyle = '#3e2318';
          ctx.fillRect(drawX - 21, drawY - 15, 4, 2);
          const sY = (frame * 0.28) % 6;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.fillRect(drawX - 20, drawY - 18 - sY, 2, 2);

        } else if (char.activity === 'garden_relax' || isAtGarden) {
          // B. OUTDOOR ZEN GARDEN PATIO WORKING & HANGING OUT ("TUMAMBAY")
          const screenColors: Record<string, string> = {
            dylan: '#00f0ff',
            alex: '#f97316',
            maya: '#ec4899',
            wendy: '#10b981',
            ray: '#38bdf8',
            zane: '#22c55e',
          };
          const lapGlow = screenColors[char.id] || '#00f0ff';
          const type = Math.sin(frame * 0.4) * 2;

          // Laptop Base on honey teak outdoor table
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(drawX - 9, drawY - 6, 18, 7);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(drawX - 8, drawY - 5, 16, 5);

          // Angled glowing screen lid facing character
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(drawX - 9, drawY - 14, 18, 8);
          ctx.fillStyle = lapGlow;
          ctx.fillRect(drawX - 8, drawY - 13, 16, 6);

          // Code lines on display
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(drawX - 6, drawY - 12, 11, 1);
          ctx.fillRect(drawX - 6, drawY - 10, 8, 1);

          // Animated typing hands on keyboard
          ctx.fillStyle = '#ffdfba';
          ctx.fillRect(drawX - 6, drawY - 6 + type, 4, 3);
          ctx.fillRect(drawX + 2, drawY - 6 - type, 4, 3);

          // Tall iced tumbler with lemon slice & green straw
          ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
          ctx.fillRect(drawX + 13, drawY - 9, 6, 10);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(drawX + 14, drawY - 8, 4, 3); // Lemon slice
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(drawX + 16, drawY - 13, 1, 7); // Straw

          // Floating garden blossom / leaf drift in the fresh outdoor air
          const driftX = Math.sin(frame * 0.12) * 8;
          ctx.fillStyle = '#4ade80';
          ctx.fillRect(drawX + 18 + driftX, drawY - 20, 3, 2);

        } else if (char.activity === 'playing_arcade' || isAtArcade) {
          // B. LEGIT RETRO ARCADE GAMING ANIMATION (Vigorous Joystick + Rapid Button Tapping + Body Bob)
          const gameBob = Math.abs(Math.sin(frame * 0.4)) * 2;
          
          // Left hand actively steering red ball joystick
          const jX = Math.sin(frame * 0.5) * 3;
          const jY = Math.cos(frame * 0.5) * 2;
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(drawX - 5, drawY - 4, 2, 4); // Joystick shaft
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(drawX - 6 + jX, drawY - 7 + jY, 4, 4); // Red ball top
          ctx.fillStyle = '#ffdfba';
          ctx.fillRect(drawX - 7 + jX, drawY - 6 + jY, 3, 3); // Left hand

          // Right hand rapidly hammering arcade push-buttons
          const bTap = Math.sin(frame * 0.9) * 2;
          ctx.fillStyle = '#ffdfba';
          ctx.fillRect(drawX + 3, drawY - 5 + bTap, 4, 3);

          // Dynamic CRT screen flash reflecting on character's face & hair
          ctx.fillStyle = frame % 16 < 8 ? 'rgba(236, 72, 153, 0.4)' : 'rgba(0, 240, 255, 0.4)';
          ctx.fillRect(drawX - 4, drawY - 8, 8, 4);

          // Retro 8-bit particle spark above head
          ctx.fillStyle = frame % 12 < 6 ? '#ffbe0b' : '#00f59b';
          ctx.fillRect(drawX + 6, drawY - 14 - gameBob, 2, 2);

        } else if (char.activity === 'sofa_relax' || (isAtSofa && !isAtWorkBench)) {
          // C. LUXURY VELVET SOFA RELAXATION POSE
          // Left arm draped along top of emerald sofa backrest
          ctx.fillStyle = char.shirtColor;
          ctx.fillRect(drawX - 12, drawY - 4, 8, 3);
          ctx.fillStyle = '#ffdfba';
          ctx.fillRect(drawX - 14, drawY - 4, 3, 3); // Hand resting relaxed

          // Right hand holding ceramic espresso coffee mug
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(drawX + 5, drawY - 2, 6, 6); // White ceramic cup
          ctx.fillStyle = '#3e2318';
          ctx.fillRect(drawX + 6, drawY - 2, 4, 2); // Rich dark roast espresso
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(drawX + 11, drawY - 1, 2, 4); // Handle
          ctx.fillStyle = '#ffdfba';
          ctx.fillRect(drawX + 4, drawY - 1, 3, 4); // Hand holding mug

          // Gentle rising steam curls wafting up
          const sY = (frame * 0.28) % 8;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
          ctx.fillRect(drawX + 7, drawY - 4 - sY, 2, 2);
          ctx.fillRect(drawX + 8, drawY - 7 - sY, 2, 2);

        } else if (char.activity === 'drinking_water' || isAtWater) {
          // D. DRINKING CHILLED WATER ANIMATION
          const drinkCycle = (frame * 0.1) % (Math.PI * 2);
          const sipLift = Math.pow(Math.max(0, Math.sin(drinkCycle)), 3) * 6;

          // Clear icy-cyan cup
          ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
          ctx.fillRect(drawX + 2, drawY - 2 - sipLift, 6, 7);
          // White ice cube glint
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(drawX + 3, drawY - 1 - sipLift, 2, 2);
          // Holding hand
          ctx.fillStyle = '#ffdfba';
          ctx.fillRect(drawX + 1, drawY - sipLift, 3, 4);

          // Thirst-quenching droplet effect
          if (sipLift > 3) {
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 8px monospace';
            ctx.fillText('💧', drawX - 4, drawY - 13);
          }

        } else if (char.activity === 'drinking_coffee' || isAtCoffee) {
          // E. DRINKING ARTISANAL ESPRESSO COFFEE ANIMATION
          const coffeeCycle = (frame * 0.09) % (Math.PI * 2);
          const sipLift = Math.pow(Math.max(0, Math.sin(coffeeCycle)), 3) * 6;

          // Ceramic espresso demitasse
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(drawX + 2, drawY - 2 - sipLift, 6, 6);
          ctx.fillStyle = '#3e2318';
          ctx.fillRect(drawX + 3, drawY - 2 - sipLift, 4, 2);
          // Handle
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(drawX + 8, drawY - 1 - sipLift, 2, 3);
          // Hand lifting cup
          ctx.fillStyle = '#ffdfba';
          ctx.fillRect(drawX + 1, drawY - sipLift, 3, 4);

          // Steaming curls
          const sY = (frame * 0.32) % 8;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.fillRect(drawX + 4, drawY - 4 - sipLift - sY, 2, 2);

          if (sipLift > 3) {
            ctx.fillStyle = '#f59e0b';
            ctx.font = 'bold 8px monospace';
            ctx.fillText('☕', drawX - 4, drawY - 13);
          }

        } else if (char.activity === 'meeting' || isAtBoardroom) {
          // F. EXECUTIVE BOARDROOM CONFERENCE SEATED POSTURE WITH VISIBLE LAPTOP ON TABLE!
          const screenColors: Record<string, string> = {
            dylan: '#00f0ff',
            alex: '#f97316',
            maya: '#ec4899',
            wendy: '#10b981',
            ray: '#38bdf8',
            zane: '#22c55e',
          };
          const lapGlow = screenColors[char.id] || '#00f0ff';
          const type = Math.sin(frame * 0.45) * 2;

          if (drawX <= 260) {
            // 1. DYLAN AT HEAD OF TABLE (Left side, facing right towards mahogany conference table)
            // Aluminum Laptop Base on Table Surface (Table starts at x = 270)
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(drawX + 34, drawY - 4, 12, 14);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(drawX + 35, drawY - 3, 9, 12);

            // Angled Screen Lid facing Dylan
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(drawX + 45, drawY - 7, 3, 18);
            ctx.fillStyle = '#00f0ff';
            ctx.fillRect(drawX + 44, drawY - 6, 2, 16);

            // Dylan's hands actively typing on laptop keyboard
            ctx.fillStyle = '#ffdfba';
            ctx.fillRect(drawX + 30, drawY - 2 + type, 6, 3);
            ctx.fillRect(drawX + 30, drawY + 4 - type, 6, 3);

            // White ceramic demitasse coffee cup with steam on table
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(drawX + 38, drawY - 12, 5, 5);
            ctx.fillStyle = '#3e2318';
            ctx.fillRect(drawX + 39, drawY - 12, 3, 2);
            const sY = (frame * 0.25) % 6;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.fillRect(drawX + 40, drawY - 14 - sY, 2, 2);

          } else if (drawY < 410) {
            // 2. NORTH CHAIRS (Ray, Maya, Alex facing down towards table)
            // Aluminum Laptop Base placed on mahogany table in front of character
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(drawX - 9, drawY + 18, 18, 8);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(drawX - 8, drawY + 19, 16, 6);

            // Upright Screen Lid facing character
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(drawX - 9, drawY + 11, 18, 8);
            // Role-colored glowing display
            ctx.fillStyle = lapGlow;
            ctx.fillRect(drawX - 8, drawY + 12, 16, 6);
            // Miniature active code lines on display
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(drawX - 6, drawY + 13, 8, 1);
            ctx.fillRect(drawX - 6, drawY + 15, 12, 1);
            ctx.fillRect(drawX - 6, drawY + 17, 6, 1);

            // Animated typing hands clicking on keys
            ctx.fillStyle = '#ffdfba';
            ctx.fillRect(drawX - 6, drawY + 18 + type, 4, 3);
            ctx.fillRect(drawX + 2, drawY + 18 - type, 4, 3);

            // Clear chilled water tumbler with ice beside laptop
            ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
            ctx.fillRect(drawX + 11, drawY + 19, 5, 6);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(drawX + 12, drawY + 20, 2, 2);

          } else {
            // 3. SOUTH CHAIRS (Wendy, Zane facing up towards table)
            // Aluminum Laptop Base placed on mahogany table in front of character
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(drawX - 9, drawY - 8, 18, 7);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(drawX - 8, drawY - 7, 16, 5);

            // Upright Screen Lid facing character
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(drawX - 9, drawY - 17, 18, 9);
            // Role-colored glowing display
            ctx.fillStyle = lapGlow;
            ctx.fillRect(drawX - 8, drawY - 16, 16, 7);
            // Miniature text / terminal lines
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(drawX - 6, drawY - 15, 10, 1);
            ctx.fillRect(drawX - 6, drawY - 13, 12, 1);
            ctx.fillRect(drawX - 6, drawY - 11, 7, 1);

            // Animated typing hands on keyboard
            ctx.fillStyle = '#ffdfba';
            ctx.fillRect(drawX - 6, drawY - 8 + type, 4, 3);
            ctx.fillRect(drawX + 2, drawY - 8 - type, 4, 3);

            // Executive briefing notepad with stylus beside laptop
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(drawX - 18, drawY - 7, 7, 6);
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(drawX - 17, drawY - 6, 5, 1);
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(drawX - 12, drawY - 8, 1, 5);
          }

        } else if (isAtWorkBench || (isInLoungeArea && !char.isWalking)) {
          // G. COLLABORATIVE OAK BENCH / LOUNGE LAPTOP WORKING
          const screenColors: Record<string, string> = {
            dylan: '#00f0ff',
            alex: '#f97316',
            maya: '#ec4899',
            wendy: '#10b981',
            ray: '#38bdf8',
            zane: '#22c55e',
          };
          const lapGlow = screenColors[char.id] || '#00f0ff';

          // Laptop Base resting on lap / work bench
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(drawX - 8, drawY - 2, 16, 5);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(drawX - 7, drawY - 1, 14, 3);

          // Upright Screen Lid facing character
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(drawX - 8, drawY - 9, 16, 7);
          ctx.fillStyle = lapGlow;
          ctx.fillRect(drawX - 7, drawY - 8, 14, 5);

          // Animated typing hands clicking on keyboard
          const type = Math.sin(frame * 0.45) * 2;
          ctx.fillStyle = '#ffdfba';
          ctx.fillRect(drawX - 5, drawY - 2 + type, 3, 3);
          ctx.fillRect(drawX + 2, drawY - 2 - type, 3, 3);

        } else if ((isInLoungeArea || isAtBoardroom || char.isMeeting || char.activity === 'working') && char.isWalking) {
          // Smoothly carrying folded laptop under arm with natural walking stride bobbing & arm grip
          const carryBob = Math.sin(frame * 0.45) * 2;
          const screenColors: Record<string, string> = {
            dylan: '#00f0ff',
            alex: '#f97316',
            maya: '#ec4899',
            wendy: '#10b981',
            ray: '#38bdf8',
            zane: '#22c55e',
          };

          // Character's shirt arm bent holding laptop against body
          ctx.fillStyle = char.shirtColor;
          ctx.fillRect(drawX + 4, drawY - 1 + carryBob, 4, 7);

          // Folded Aluminum Laptop Chassis under arm
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(drawX + 6, drawY + 1 + carryBob, 5, 9);
          // Dark edge / keyboard crease
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(drawX + 7, drawY + 2 + carryBob, 3, 7);
          // Outer lid role-colored glowing logo
          ctx.fillStyle = screenColors[char.id] || '#00f0ff';
          ctx.fillRect(drawX + 8, drawY + 4 + carryBob, 2, 2);

          // Hand gripping bottom edge of laptop securely
          ctx.fillStyle = '#ffdfba';
          ctx.fillRect(drawX + 5, drawY + 7 + carryBob, 4, 3);

        } else if (char.isSeated && !char.isWalking && (char.id === 'dylan' || char.status === 'working' || char.activity === 'idle')) {
          // Standard typing hands animation at main desk
          const type = Math.sin(frame * 0.4) * 2;
          ctx.fillStyle = '#ffdfba';
          ctx.fillRect(drawX - 7, drawY - 6 + type, 3, 3);
          ctx.fillRect(drawX + 4, drawY - 6 - type, 3, 3);
        }

        // Floating Status Badge Pill
        const pillW = char.id === 'dylan' ? 94 : 118;
        const pillH = 24;
        const pillX = drawX - pillW / 2;
        const pillY = drawY - 36;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 12);
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#00f0ff' : 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = char.avatarColor;
        ctx.beginPath();
        ctx.arc(pillX + 12, pillY + 12, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(char.name.charAt(0), pillX + 12, pillY + 15);

        ctx.textAlign = 'left';
        if (char.id === 'dylan') {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText('Dylan (You)', pillX + 23, pillY + 11);
          ctx.fillStyle = '#00f59b';
          ctx.beginPath();
          ctx.arc(pillX + 80, pillY + 8, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#94a3b8';
          ctx.font = '8px monospace';
          ctx.fillText(char.isSeated ? '🪑 Seated' : '🚶 Roaming', pillX + 23, pillY + 20);
        } else {
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 8px sans-serif';
          ctx.fillText(char.name, pillX + 23, pillY + 10);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '8px sans-serif';
          const txt = char.isSeated ? char.statusText || 'Available' : '🚶 Active';
          ctx.fillText(`${char.emoji} ${txt.slice(0, 14)}`, pillX + 23, pillY + 20);
        }

        // Live Dynamic Speech Bubble (with auto-sizing, pointer, and high-visibility styling)
        if (char.bubbleText) {
          ctx.font = 'bold 8.5px sans-serif';
          const textMetrics = ctx.measureText(char.bubbleText);
          const bW = Math.max(100, Math.min(230, textMetrics.width + 18));
          const bH = 24;
          const bX = Math.max(12, Math.min(LOGICAL_W - bW - 12, drawX - bW / 2));
          const bY = drawY - 68;

          // Subtle shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.beginPath();
          ctx.roundRect(bX + 1, bY + 2, bW, bH, 6);
          ctx.fill();

          // Bubble background with cyan border
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(bX, bY, bW, bH, 6);
          ctx.fill();
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Downward pointer beak toward character head
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(drawX - 4, bY + bH);
          ctx.lineTo(drawX + 4, bY + bH);
          ctx.lineTo(drawX, bY + bH + 4);
          ctx.closePath();
          ctx.fill();

          // Speech text
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 8.5px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(char.bubbleText, bX + bW / 2, bY + 15);
        }
      });
    };

    render();

    // Click Detection on Canvas (Select Agent OR Click-to-Move Dylan)
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = LOGICAL_W / rect.width;
      const scaleY = LOGICAL_H / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      let hitId: string | null = null;
      for (const char of Object.values(charactersRef.current)) {
        if (Math.hypot(clickX - char.currentX, clickY - char.currentY) < 32) {
          hitId = char.id;
          break;
        }
      }

      playSfx('click');

      if (hitId) {
        onSelectAgent?.(hitId);
      } else if (isWalkable(clickX, clickY)) {
        // Player Click-to-Move for Dylan Ramos
        const dylan = charactersRef.current.dylan;
        dylan.isSeated = false;
        dylan.path = generateSmartPath(dylan.currentX, dylan.currentY, clickX, clickY);
        dylan.isWalking = true;
        setIsDylanSeated(false);
        setClickRipple({ x: clickX, y: clickY, time: Date.now() });
      }
    };

    canvas.addEventListener('click', handleCanvasClick);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [selectedAgentId, isSprinting, onSelectAgent, playSfx]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0a0c14',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* CEO COMMAND BAR OVERLAY (Top Header) */}
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
        {/* Left: Dylan Ramos CEO Badge */}
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
              CEO & Founder • {isDylanSeated ? '🪑 Seated' : '🚶 Roaming HQ'}
            </span>
          </div>

          {/* Quick Sit/Stand Button */}
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
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {isDylanSeated ? '🚶 Stand Up [E]' : '🪑 Sit at Desk [E]'}
          </button>
        </div>

        {/* Center: Team Work & Stand-Up Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Stand & Stretch Button */}
          <button
            onClick={handleAllWorkersStand}
            title="Make all workers stand up and stretch"
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              borderRadius: '6px',
              padding: '5px 10px',
              fontSize: '10px',
              fontFamily: "'Press Start 2P', monospace",
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🤸</span>
            <span>WORKERS STAND</span>
          </button>

          {/* Team Rest / Laptop Lounge Work Toggle */}
          <button
            onClick={handleToggleRestMode}
            title="Send team with laptops to work at the lounge sofa & collaborative oak bench"
            style={{
              background: inRestMode ? 'rgba(236, 72, 153, 0.25)' : 'rgba(245, 158, 11, 0.15)',
              border: inRestMode ? '1px solid #ec4899' : '1px solid #f59e0b',
              color: inRestMode ? '#ec4899' : '#f59e0b',
              borderRadius: '6px',
              padding: '5px 10px',
              fontSize: '10px',
              fontFamily: "'Press Start 2P', monospace",
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>{inRestMode ? '💼' : '🛋️'}</span>
            <span>{inRestMode ? 'DESK WORK' : 'LAPTOP LOUNGE'}</span>
          </button>

          {/* All-Hands Meeting Toggle */}
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
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{inMeetingMode ? '💼' : '📢'}</span>
            <span>{inMeetingMode ? 'DISMISS TO DESKS' : 'ALL-HANDS MEETING'}</span>
          </button>
        </div>

        {/* Right: Audio & Sprint Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsSprinting(!isSprinting)}
            title="Toggle Sprint Speed"
            style={{
              background: isSprinting ? 'rgba(236, 72, 153, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              border: isSprinting ? '1px solid #ec4899' : '1px solid rgba(255, 255, 255, 0.1)',
              color: isSprinting ? '#ec4899' : '#94a3b8',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '10px',
              fontFamily: "'Fira Code', monospace",
              cursor: 'pointer',
            }}
          >
            {isSprinting ? '⚡ SPRINT 2X' : '🚶 WALK'}
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title="Toggle SFX"
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

      {/* PROXIMITY INTERACTION BANNER (Bottom Left) */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '20px',
          zIndex: 20,
          background: nearbyPrompt ? 'rgba(0, 240, 255, 0.22)' : 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(8px)',
          border: nearbyPrompt ? '1px solid #00f0ff' : '1px solid rgba(99, 115, 178, 0.3)',
          borderRadius: '8px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '11px',
          fontFamily: "'Fira Code', monospace",
          color: nearbyPrompt ? '#00f0ff' : '#94a3b8',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
          transition: 'all 0.2s ease',
        }}
      >
        <span style={{ fontSize: '14px' }}>🕹️</span>
        {nearbyPrompt ? (
          <span style={{ fontWeight: 700, color: '#00f59b' }}>{nearbyPrompt}</span>
        ) : (
          <span>WASD / Arrow Keys or D-Pad • Click floor to Move • [E / Space] Sit/Stand</span>
        )}
      </div>

      {/* VIRTUAL D-PAD & MOVEMENT CONTROLS FOR DYLAN (Bottom Right) */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '20px',
          zIndex: 20,
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(99, 115, 178, 0.35)',
          borderRadius: '12px',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.7)',
        }}
      >
        <button
          onMouseDown={() => (dpadDirRef.current.up = true)}
          onMouseUp={() => (dpadDirRef.current.up = false)}
          onTouchStart={() => (dpadDirRef.current.up = true)}
          onTouchEnd={() => (dpadDirRef.current.up = false)}
          style={{
            width: '32px',
            height: '28px',
            background: 'rgba(0, 240, 255, 0.15)',
            border: '1px solid #00f0ff',
            color: '#00f0ff',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ▲
        </button>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onMouseDown={() => (dpadDirRef.current.left = true)}
            onMouseUp={() => (dpadDirRef.current.left = false)}
            onTouchStart={() => (dpadDirRef.current.left = true)}
            onTouchEnd={() => (dpadDirRef.current.left = false)}
            style={{
              width: '32px',
              height: '28px',
              background: 'rgba(0, 240, 255, 0.15)',
              border: '1px solid #00f0ff',
              color: '#00f0ff',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ◀
          </button>
          <button
            onClick={handleToggleDylanSit}
            title="Sit or Stand"
            style={{
              width: '32px',
              height: '28px',
              background: isDylanSeated ? 'rgba(0, 245, 155, 0.25)' : 'rgba(255, 190, 11, 0.25)',
              border: isDylanSeated ? '1px solid #00f59b' : '1px solid #ffbe0b',
              color: isDylanSeated ? '#00f59b' : '#ffbe0b',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isDylanSeated ? '🪑' : '🚶'}
          </button>
          <button
            onMouseDown={() => (dpadDirRef.current.right = true)}
            onMouseUp={() => (dpadDirRef.current.right = false)}
            onTouchStart={() => (dpadDirRef.current.right = true)}
            onTouchEnd={() => (dpadDirRef.current.right = false)}
            style={{
              width: '32px',
              height: '28px',
              background: 'rgba(0, 240, 255, 0.15)',
              border: '1px solid #00f0ff',
              color: '#00f0ff',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ▶
          </button>
        </div>
        <button
          onMouseDown={() => (dpadDirRef.current.down = true)}
          onMouseUp={() => (dpadDirRef.current.down = false)}
          onTouchStart={() => (dpadDirRef.current.down = true)}
          onTouchEnd={() => (dpadDirRef.current.down = false)}
          style={{
            width: '32px',
            height: '28px',
            background: 'rgba(0, 240, 255, 0.15)',
            border: '1px solid #00f0ff',
            color: '#00f0ff',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ▼
        </button>
      </div>

      {/* PIXEL CANVAS VIEWPORT */}
      <div
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
        <canvas
          ref={canvasRef}
          width={840}
          height={520}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            aspectRatio: '840 / 520',
            imageRendering: 'pixelated',
            boxShadow: '0 16px 64px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(99, 115, 178, 0.25)',
            borderRadius: '12px',
            cursor: 'crosshair',
          }}
        />
      </div>
    </div>
  );
}
