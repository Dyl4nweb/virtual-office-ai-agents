'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

// ============================================================================
// TYPES & DATA CONTRACTS
// ============================================================================
export interface PixelOfficeProps {
  selectedAgentId?: string | null;
  onSelectAgent?: (id: string | null) => void;
  viewMode?: 'pixel' | 'voxel';
  onViewModeChange?: (mode: 'pixel' | 'voxel') => void;
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
    | 'eah_cooking'
    | 'eah_carrying_food'
    | 'eah_brewing_coffee'
    | 'eah_carrying_coffee'
    | 'eah_serving'
    | 'eah_petting_dog'
    | 'syncing'
    | 'reporting'
    | 'stretching'
    | 'meeting';
}

// ============================================================================
// 16-BIT RETRO RPG CHARACTER SPRITE PALETTES (4 Directions, 3-Frame Walk Cycles)
// ============================================================================
export interface SpritePalette {
  hairBase: string;
  hairLight: string;
  hairDark: string;
  skinBase: string;
  skinDark: string;
  eyeColor: string;
  shirtBase: string;
  shirtLight: string;
  shirtDark: string;
  pantsBase: string;
  pantsDark: string;
  shoeColor: string;
  soleColor: string;
  blushColor?: string;
}

export const CHARACTER_SPRITE_PALETTES: Record<string, SpritePalette> = {
  dylan: {
    hairBase: '#5c3a21',
    hairLight: '#8d532a',
    hairDark: '#382012',
    skinBase: '#ffdfba',
    skinDark: '#e2b892',
    eyeColor: '#78350f',
    shirtBase: '#1e1b4b',
    shirtLight: '#3730a3',
    shirtDark: '#0f0d26',
    pantsBase: '#1e293b',
    pantsDark: '#0f172a',
    shoeColor: '#9a3412',
    soleColor: '#fef3c7',
  },
  eah: {
    hairBase: '#1c1917',
    hairLight: '#44403c',
    hairDark: '#0c0a09',
    skinBase: '#ffe4d6',
    skinDark: '#fbcfe8',
    eyeColor: '#451a03',
    shirtBase: '#fb7185',
    shirtLight: '#fda4af',
    shirtDark: '#e11d48',
    pantsBase: '#334155',
    pantsDark: '#1e293b',
    shoeColor: '#f43f5e',
    soleColor: '#fff1f2',
    blushColor: 'rgba(244, 63, 94, 0.45)',
  },
  alex: {
    hairBase: '#1c1917',
    hairLight: '#334155',
    hairDark: '#0f172a',
    skinBase: '#fed7aa',
    skinDark: '#fdba74',
    eyeColor: '#0284c7',
    shirtBase: '#ea580c',
    shirtLight: '#f97316',
    shirtDark: '#9a3412',
    pantsBase: '#334155',
    pantsDark: '#1e293b',
    shoeColor: '#ea580c',
    soleColor: '#fff7ed',
  },
  maya: {
    hairBase: '#4a044e',
    hairLight: '#a21caf',
    hairDark: '#2e0234',
    skinBase: '#ffedd5',
    skinDark: '#fed7aa',
    eyeColor: '#9333ea',
    shirtBase: '#db2777',
    shirtLight: '#f472b6',
    shirtDark: '#9d174d',
    pantsBase: '#0f172a',
    pantsDark: '#020617',
    shoeColor: '#ec4899',
    soleColor: '#fdf2f8',
    blushColor: 'rgba(236, 72, 153, 0.4)',
  },
  ray: {
    hairBase: '#3e2723',
    hairLight: '#5d4037',
    hairDark: '#271714',
    skinBase: '#fed7aa',
    skinDark: '#fdba74',
    eyeColor: '#15803d',
    shirtBase: '#0284c7',
    shirtLight: '#38bdf8',
    shirtDark: '#0369a1',
    pantsBase: '#374151',
    pantsDark: '#1f2937',
    shoeColor: '#ffffff',
    soleColor: '#94a3b8',
  },
  wendy: {
    hairBase: '#b45309',
    hairLight: '#f59e0b',
    hairDark: '#78350f',
    skinBase: '#fed7aa',
    skinDark: '#fdba74',
    eyeColor: '#92400e',
    shirtBase: '#059669',
    shirtLight: '#34d399',
    shirtDark: '#047857',
    pantsBase: '#1e293b',
    pantsDark: '#0f172a',
    shoeColor: '#b45309',
    soleColor: '#fef3c7',
  },
  zane: {
    hairBase: '#052e16',
    hairLight: '#166534',
    hairDark: '#021e0e',
    skinBase: '#e2e8f0',
    skinDark: '#cbd5e1',
    eyeColor: '#475569',
    shirtBase: '#15803d',
    shirtLight: '#22c55e',
    shirtDark: '#14532d',
    pantsBase: '#0f172a',
    pantsDark: '#020617',
    shoeColor: '#15803d',
    soleColor: '#0f172a',
  },
};

// ============================================================================
// CHARACTER-SPECIFIC LAPTOP HARDWARE FINISHES (MacBook, Starlight, ThinkPad, Blade)
// ============================================================================
export interface LaptopStyle2D {
  baseColor: string;
  lidColor: string;
  kbColor: string;
  trackpadColor: string;
  logoColor: string;
  hasAppleLogo: boolean;
  hasTrackPoint: boolean; // Iconic IBM/Lenovo ThinkPad red nub
  accentGlow: string;
  screenBg: string;
  brandName: string;
}

export const LAPTOP_STYLES_2D: Record<string, LaptopStyle2D> = {
  dylan: {
    baseColor: '#cbd5e1',     // Apple Anodized Silver MacBook Pro
    lidColor: '#94a3b8',
    kbColor: '#1e293b',
    trackpadColor: '#94a3b8',
    logoColor: '#ffffff',
    hasAppleLogo: true,
    hasTrackPoint: false,
    accentGlow: '#00f0ff',
    screenBg: '#082f49',
    brandName: 'MacBook Pro Silver',
  },
  maya: {
    baseColor: '#ebe3d7',     // Apple Starlight (Pale Gold / Champagne Silver)
    lidColor: '#d6cbbd',
    kbColor: '#1e293b',
    trackpadColor: '#c4b5a5',
    logoColor: '#ffffff',
    hasAppleLogo: true,
    hasTrackPoint: false,
    accentGlow: '#ec4899',
    screenBg: '#2e1065',
    brandName: 'MacBook Air Starlight',
  },
  alex: {
    baseColor: '#475569',     // Space Gray / Dark Titanium Blade
    lidColor: '#334155',
    kbColor: '#0f172a',
    trackpadColor: '#1e293b',
    logoColor: '#f97316',
    hasAppleLogo: false,
    hasTrackPoint: false,
    accentGlow: '#f97316',
    screenBg: '#0f172a',
    brandName: 'Titanium Blade',
  },
  ray: {
    baseColor: '#e2e8f0',     // Raw Silver MacBook Pro
    lidColor: '#cbd5e1',
    kbColor: '#1e293b',
    trackpadColor: '#94a3b8',
    logoColor: '#ffffff',
    hasAppleLogo: true,
    hasTrackPoint: false,
    accentGlow: '#00f0ff',
    screenBg: '#022c22',
    brandName: 'MacBook Pro Silver',
  },
  wendy: {
    baseColor: '#1e293b',     // Apple Midnight Deep Blue MacBook Pro
    lidColor: '#0f172a',
    kbColor: '#0a0f1d',
    trackpadColor: '#334155',
    logoColor: '#ffffff',
    hasAppleLogo: true,
    hasTrackPoint: false,
    accentGlow: '#10b981',
    screenBg: '#064e3b',
    brandName: 'MacBook Pro Midnight',
  },
  zane: {
    baseColor: '#18181b',     // Matte Stealth Carbon Black ThinkPad X1
    lidColor: '#09090b',
    kbColor: '#000000',
    trackpadColor: '#27272a',
    logoColor: '#ef4444',     // Red dot ThinkPad lid LED
    hasAppleLogo: false,
    hasTrackPoint: true,      // Iconic Red TrackPoint nub
    accentGlow: '#22c55e',
    screenBg: '#021e0e',
    brandName: 'ThinkPad X1 Carbon',
  },
  eah: {
    baseColor: '#f8fafc',     // iPad Pro on White Magic Keyboard
    lidColor: '#e2e8f0',
    kbColor: '#f1f5f9',
    trackpadColor: '#cbd5e1',
    logoColor: '#ffffff',
    hasAppleLogo: true,
    hasTrackPoint: false,
    accentGlow: '#a855f7',
    screenBg: '#1e1b4b',
    brandName: 'iPad Pro Folio',
  },
};

/**
 * Renders an authentic high-end battle-station / workstation desktop PC tower (Lian Li O11 / NZXT style)
 * with dark titanium chassis, tempered glass side panel, illuminated AIO liquid cooling pump,
 * braided coolant tubes, RGB DDR5 RAM sticks, triple-slot RTX 4090 GPU with glowing logo strip,
 * front intake fan RGB rings, and top 360mm radiator exhaust.
 */
export function drawLegitPCTower2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number = 18,
  h: number = 38,
  frame: number = 0,
  theme: 'cyan' | 'orange' | 'emerald' | 'pink' = 'cyan'
) {
  const themeColors = {
    cyan: { primary: '#00f0ff', secondary: '#38bdf8', aio: '#00f0ff', gpu: '#38bdf8', ram: '#22d3ee' },
    orange: { primary: '#f97316', secondary: '#fb923c', aio: '#ea580c', gpu: '#f97316', ram: '#fdba74' },
    emerald: { primary: '#22c55e', secondary: '#4ade80', aio: '#15803d', gpu: '#22c55e', ram: '#86efac' },
    pink: { primary: '#ec4899', secondary: '#f472b6', aio: '#db2777', gpu: '#ec4899', ram: '#f9a8d4' },
  };
  const pal = themeColors[theme] || themeColors.cyan;
  const pulse = 0.7 + Math.sin(frame * 0.1) * 0.3;

  // Drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(x + 2, y + 3, w, h);

  // Outer Aluminum / Titanium Chassis
  ctx.fillStyle = '#090d16';
  ctx.fillRect(x, y, w, h);

  // Anti-vibration Rubber Feet
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x + 2, y + h - 2, 4, 2);
  ctx.fillRect(x + w - 6, y + h - 2, 4, 2);

  // Top 360mm Radiator Exhaust Mesh
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x + 2, y + 1, w - 4, 3);
  ctx.fillStyle = pal.primary;
  ctx.globalAlpha = 0.5 * pulse;
  ctx.fillRect(x + 3, y + 2, w - 6, 1);
  ctx.globalAlpha = 1.0;

  // Tempered Glass Main Side Window (Glass viewport: x + 2, y + 5, w - 4, h - 14)
  const gwX = x + 2;
  const gwY = y + 5;
  const gwW = w - 4;
  const gwH = h - 14;
  ctx.fillStyle = '#05070d';
  ctx.fillRect(gwX, gwY, gwW, gwH);

  // Motherboard tray background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(gwX + 1, gwY + 1, gwW - 2, gwH - 2);

  // 1. AIO Liquid CPU Cooler Pump Block (Upper Center)
  const pumpX = gwX + Math.floor(gwW / 2) - 3;
  const pumpY = gwY + 4;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(pumpX - 1, pumpY - 1, 7, 7);
  // Glowing circular RGB pump infinity mirror
  ctx.fillStyle = pal.aio;
  ctx.beginPath();
  ctx.arc(pumpX + 2.5, pumpY + 2.5, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(pumpX + 2, pumpY + 2, 1, 1); // Center logo dot

  // Braided Sleeved Coolant Tubes arching up to radiator
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pumpX, pumpY + 1);
  ctx.quadraticCurveTo(gwX + 2, gwY + 1, gwX + 4, gwY);
  ctx.moveTo(pumpX + 5, pumpY + 1);
  ctx.quadraticCurveTo(gwX + gwW - 2, gwY + 1, gwX + gwW - 4, gwY);
  ctx.stroke();

  // 2. High-Speed RGB DDR5 RAM Sticks (Right of CPU Pump)
  const ramX = pumpX + 6;
  const ramY = pumpY;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(ramX, ramY, 3, 7);
  // Dual glowing LED heatspreaders
  ctx.fillStyle = pal.ram;
  ctx.fillRect(ramX, ramY, 1, 6);
  ctx.fillStyle = pal.primary;
  ctx.fillRect(ramX + 2, ramY + 1, 1, 5);

  // 3. Triple-Slot RTX 4090 Workstation GPU (Lower half of chamber)
  const gpuX = gwX + 1;
  const gpuY = gwY + 13;
  const gpuW = gwW - 2;
  const gpuH = 6;
  // GPU backplate & heatsink fins
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(gpuX, gpuY, gpuW, gpuH);
  ctx.fillStyle = '#334155';
  ctx.fillRect(gpuX + 1, gpuY + 1, gpuW - 2, 1); // Metal edge bevel
  // Glowing Side Branding Logo Bar ("GEFORCE RTX / WORKSTATION")
  ctx.fillStyle = pal.gpu;
  ctx.fillRect(gpuX + 2, gpuY + 2, Math.max(4, gpuW - 4), 2);
  // GPU Axial Fan shroud intake vents underneath
  ctx.fillStyle = '#090d16';
  ctx.fillRect(gpuX + 2, gpuY + 4, 3, 1);
  ctx.fillRect(gpuX + 6, gpuY + 4, 3, 1);

  // 4. Tempered Glass Reflection Sheen (diagonal shine across glass panel)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(gwX + 2, gwY + 2);
  ctx.lineTo(gwX + gwW - 2, gwY + gwH - 4);
  ctx.stroke();

  // 5. Basement PSU Shroud Compartment (Bottom partition)
  const psuY = y + h - 8;
  ctx.fillStyle = '#090d16';
  ctx.fillRect(x + 2, psuY, w - 4, 6);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x + 3, psuY + 1, w - 6, 1);
  // Illuminated power badge
  ctx.fillStyle = pal.secondary;
  ctx.fillRect(x + 4, psuY + 3, 3, 2);

  // 6. Front Bezel with Power button LED
  ctx.fillStyle = (frame % 30 < 25) ? '#22c55e' : '#15803d';
  ctx.fillRect(x + 1, y + 2, 2, 2);
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
    seatX: 664,
    seatY: 398,
    path: [],
    isWalking: false,
    isMeeting: false,
    isSeated: true,
    status: 'working',
    statusText: 'Founder & CEO 👑',
    emoji: '👑',
    avatarColor: '#ffbe0b',
    facing: 'down',
    shirtColor: '#1e1b4b', // Dark stylish designer blazer
    hairColor: '#5c3a21', // Styled brown hair
    routineTimer: 999999, // Dylan is human player controlled
  },
  // CEO Suite Permanent Resident: Dylan's Partner Eah Ilagan
  eah: {
    id: 'eah',
    name: 'Eah Ilagan',
    role: "Executive Partner",
    currentX: 64,
    currentY: 175,
    deskX: 64,
    deskY: 175,
    seatX: 64,
    seatY: 175,
    path: [],
    isWalking: false,
    isMeeting: false,
    isSeated: true,
    status: 'working',
    statusText: 'With Dylan Ramos ✨',
    emoji: '💖',
    avatarColor: '#f43f5e',
    facing: 'right',
    shirtColor: '#fb7185', // Soft pastel blush rose top
    hairColor: '#1c1917', // Luscious dark hair
    routineTimer: 18, // Active autonomous caring cycles (cooking, coffee, Dylan delivery)
    activity: 'sofa_relax',
    bubbleText: 'Chilling on my iPad in our suite beside Dylan! ✨',
  },
  // Zone 6: High-Tech Cyber Security & Server Vault (Alex Fullstack + Zane Cybersec Together!)
  alex: {
    id: 'alex',
    name: 'Alex',
    role: 'Lead Fullstack Developer',
    currentX: 890,
    currentY: 220,
    deskX: 890,
    deskY: 220,
    seatX: 835,
    seatY: 348,
    path: [],
    isWalking: false,
    isMeeting: false,
    isSeated: true,
    status: 'idle',
    statusText: 'Fullstack & Edge architecture',
    emoji: '💻',
    avatarColor: '#f97316',
    facing: 'up',
    shirtColor: '#ea580c', // Dark orange hoodie
    hairColor: '#1c1917', // Jet black hair
    routineTimer: 14,
  },
  // Bullpen Row 1 (Maya Designer, Ray Researcher)
  maya: {
    id: 'maya',
    name: 'Maya',
    role: 'UI/UX & Product Designer',
    currentX: 470,
    currentY: 104,
    deskX: 470,
    deskY: 104,
    seatX: 775,
    seatY: 348,
    path: [],
    isWalking: false,
    isMeeting: false,
    isSeated: true,
    status: 'idle',
    statusText: 'Graphic tablet drawing',
    emoji: '🎨',
    avatarColor: '#ec4899',
    facing: 'up',
    shirtColor: '#db2777', // Magenta pink
    hairColor: '#4a044e', // Plum styled bob
    routineTimer: 12,
  },
  ray: {
    id: 'ray',
    name: 'Ray',
    role: 'Lead AI Researcher',
    currentX: 680,
    currentY: 104,
    deskX: 680,
    deskY: 104,
    seatX: 720,
    seatY: 348,
    path: [],
    isWalking: false,
    isMeeting: false,
    isSeated: true,
    status: 'idle',
    statusText: 'Terminal research & tea',
    emoji: '🔍',
    avatarColor: '#38bdf8',
    facing: 'up',
    shirtColor: '#0284c7', // Tech blue
    hairColor: '#3e2723',
    routineTimer: 10,
  },
  // Bullpen Row 2 (Marketing Strategist)
  wendy: {
    id: 'wendy',
    name: 'Wendy',
    role: 'Marketing Strategist',
    currentX: 575,
    currentY: 218,
    deskX: 575,
    deskY: 218,
    seatX: 745,
    seatY: 432,
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
  // Zone 6: High-Tech Cyber Security & Server Vault (Zane with Alex)
  zane: {
    id: 'zane',
    name: 'Zane',
    role: 'Cybersecurity Specialist',
    currentX: 970,
    currentY: 220,
    deskX: 970,
    deskY: 220,
    seatX: 805,
    seatY: 432,
    path: [],
    isWalking: false,
    isMeeting: false,
    isSeated: true,
    status: 'idle',
    statusText: 'Zero-trust SOC & cyber telemetry',
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
  {
    first: { speaker: 'dylan', text: 'Hey Eah, thank you for keeping me company today 💕' },
    reply: { speaker: 'eah', text: 'Always here for you Dylan! Chilling on my iPad ✨' },
  },
  {
    first: { speaker: 'eah', text: 'Dylan, don\'t forget to take a break, babe! 💖' },
    reply: { speaker: 'dylan', text: 'Will do babe! Having you here makes work so much better 🥰' },
  },
  {
    first: { speaker: 'eah', text: 'Found some great UI inspiration on my iPad! 📱✨' },
    reply: { speaker: 'dylan', text: 'Show me later babe! Your aesthetic taste is unmatched 💕' },
  },
];

// Helper to test if coordinates are within the executive boardroom suite (Zone 4: Right Wing)
export const isBoardroomZone = (x: number, y: number) => x > 560 && y > 280;
export const isLoungeZone = (x: number, y: number) => x > 226 && x <= 560 && y > 280;

// ============================================================================
// SOLID COLLISION BOXES FOR SMOOTH HQ NAVIGATION
// ============================================================================
export function isWalkable(x: number, y: number): boolean {
  // Outer perimeter walls (expanded to x = 1016)
  if (x < 24 || x > 1016 || y < 24 || y > 498) return false;

  // Vertical Glass Wall between CEO Suite & Bullpen (x = 276, ONLY between y: 16..280!)
  // Wide open doorway is at y in [180, 260]
  if (x >= 272 && x <= 280 && y <= 280) {
    if (y < 180 || y > 260) return false;
  }

  // Vertical Security Divider Wall between Bullpen & Server Room (x = 836, y in [16, 280])
  // Doorway is at y in [130, 185]
  if (x >= 832 && x <= 840 && y <= 280) {
    if (y < 130 || y > 185) return false;
  }

  // Horizontal Glass Wall between Bullpen & South Wing Suites (y = 280, x = 16..1024)
  // Double doors into Lounge are at x in [480, 550]
  if (y >= 276 && y <= 284) {
    if (x < 480 || x > 550) return false;
  }

  // Server Room 42U Server Racks (North wall: x in [848, 1016], y in [20, 68])
  if (x >= 848 && x <= 1016 && y >= 20 && y <= 68) return false;

  // Server Room Dual Command Pod (Alex & Zane + bridge: x in [850, 1012], y in [174, 220])
  if (x >= 850 && x <= 1012 && y >= 174 && y <= 220) return false;

  // Server Room Diagnostic Crash Cart (x in [848, 880], y in [96, 136])
  if (x >= 848 && x <= 880 && y >= 96 && y <= 136) return false;

  // Vertical Glass Divider between Kitchen & Lounge (x = 226, y in [280, 504])
  // Doorway is at y in [310, 370]
  if (x >= 222 && x <= 230 && y >= 280 && y <= 504) {
    if (y < 310 || y > 370) return false;
  }

  // Vertical Glass Divider between Lounge & Boardroom (x = 560, y in [280, 504])
  // Doorway is at y in [310, 370]
  if (x >= 556 && x <= 564 && y >= 280 && y <= 504) {
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

  // Bullpen Workstations: Row 1 (Maya: 410..550, Ray: 600..740, y: 44..98) & Row 2 (Wendy: 510..645, y: 158..212)
  const isRow1 = y >= 44 && y <= 98 && ((x >= 410 && x <= 550) || (x >= 600 && x <= 740));
  const isRow2 = y >= 158 && y <= 212 && (x >= 510 && x <= 645);
  if (isRow1 || isRow2) return false;

  // ZONE 3: Team Relaxation & Coffee Lounge (Center, x: 226..560, y: 280..504)
  // Top-Left Sectional Booth Backrest & Arm (x: 254..360, y: 314..328 and x: 254..268, y: 328..380)
  if (x >= 254 && x <= 360 && y >= 314 && y <= 328) return false;
  if (x >= 254 && x <= 268 && y >= 328 && y <= 380) return false;
  // Top Caramel Wooden Coffee Table (x: 286..330, y: 344..372)
  if (x >= 286 && x <= 330 && y >= 344 && y <= 372) return false;
  // Bottom-Right Sectional Booth Backrest & Arm (x: 390..496, y: 470..484 and x: 482..496, y: 404..470)
  if (x >= 390 && x <= 496 && y >= 470 && y <= 484) return false;
  if (x >= 482 && x <= 496 && y >= 404 && y <= 470) return false;
  // Bottom Caramel Wooden Coffee Table (x: 422..466, y: 422..450)
  if (x >= 422 && x <= 466 && y >= 422 && y <= 450) return false;
  // Cute Office Puppy Donut Pet Bed (x: 492..520, y: 328..352)
  if (x >= 492 && x <= 520 && y >= 328 && y <= 352) return false;
  // Espresso Bar & Refreshment Station (x: 234..268, y: 416..480)
  if (x >= 234 && x <= 268 && y >= 416 && y <= 480) return false;
  // Retro Arcade Cabinet (x: 234..268, y: 316..352)
  if (x >= 234 && x <= 268 && y >= 316 && y <= 352) return false;

  // ZONE 4: Grand Executive Boardroom & Meeting Suite (Right Wing, x: 560..1024, y: 280..504) - "MALUWAG"
  // Generous walking clearance around all 4 sides of the conference table!
  // Table surface is x: 685..895, y: 365..428
  if (x >= 685 && x <= 895 && y >= 365 && y <= 428) return false;
  // Strategy Whiteboard on East Wall (x: 920..1000, y: 310..350)
  if (x >= 920 && x <= 1000 && y >= 310 && y <= 350) return false;

  return true;
}

// ============================================================================
// INTELLIGENT WAYPOINT ROUTER AROUND CORRIDORS & DOORS
// ============================================================================
export function generateSmartPath(startX: number, startY: number, destX: number, destY: number): Waypoint[] {
  const isCeoSuite = (x: number, y: number) => x <= 276 && y <= 280;
  const isServerRoom = (x: number, y: number) => x > 836 && y <= 280;
  const isBullpen = (x: number, y: number) => x > 276 && x <= 836 && y <= 280;
  const isKitchen = (x: number, y: number) => x <= 226 && y > 280 && y <= 398;
  const isGarden = (x: number, y: number) => x <= 226 && y > 398;
  const isLounge = (x: number, y: number) => x > 226 && x <= 560 && y > 280;
  const isBoardroom = (x: number, y: number) => x > 560 && y > 280;

  const getZone = (x: number, y: number) => {
    if (isCeoSuite(x, y)) return 'ceo';
    if (isServerRoom(x, y)) return 'server';
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
    if (startZone === 'server') {
      return [
        { x: startX, y: 155 },
        { x: destX, y: 155 },
        { x: destX, y: destY },
      ];
    }
    if (startZone === 'boardroom') {
      // Ample walking perimeter around conference table (table: x: 645..875, y: 375..435)
      if ((startY < 375 && destY > 435) || (startY > 435 && destY < 375)) {
        const detourX = startX < 760 ? 600 : 910;
        return [
          { x: detourX, y: startY },
          { x: detourX, y: destY },
          { x: destX, y: destY },
        ];
      }
    }
    return [{ x: destX, y: destY }];
  }

  // 2. Cross-zone navigation through designated doorways:
  const ceoDoorway = { x: 276, y: 220 };
  const serverDoorway = { x: 836, y: 155 };
  const loungeDoors = { x: 515, y: 280 };
  const boardroomDoors = { x: 560, y: 340 };
  const kitchenDoorway = { x: 226, y: 340 };
  const gardenDoorway = { x: 120, y: 398 };
  const path: Waypoint[] = [];

  // Exit starting zone into intermediate corridor
  if (startZone === 'server') {
    path.push({ x: 880, y: 155 });
    path.push(serverDoorway);
    path.push({ x: 790, y: 155 });
    if (destZone === 'bullpen') {
      path.push({ x: destX, y: 155 });
      path.push({ x: destX, y: destY });
      return path;
    } else {
      path.push({ x: 515, y: 155 });
      path.push(loungeDoors);
      path.push({ x: 515, y: 340 });
    }
  } else if (startZone === 'ceo') {
    if (startY < 94) path.push({ x: 240, y: startY });
    path.push({ x: 240, y: 220 });
    path.push(ceoDoorway);
    path.push({ x: 330, y: 220 });
    if (destZone === 'bullpen') {
      path.push({ x: 330, y: 155 });
      path.push({ x: destX, y: 155 });
    } else if (destZone === 'server') {
      path.push({ x: 790, y: 155 });
      path.push(serverDoorway);
      path.push({ x: destX, y: 155 });
      path.push({ x: destX, y: destY });
      return path;
    } else {
      path.push({ x: 515, y: 220 });
      path.push(loungeDoors);
      path.push({ x: 515, y: 340 });
    }
  } else if (startZone === 'bullpen') {
    path.push({ x: startX, y: 155 });
    if (destZone === 'server') {
      path.push({ x: 790, y: 155 });
      path.push(serverDoorway);
      path.push({ x: destX, y: 155 });
      path.push({ x: destX, y: destY });
      return path;
    } else if (destZone === 'ceo') {
      path.push({ x: 330, y: 155 });
      path.push({ x: 330, y: 220 });
      path.push(ceoDoorway);
      path.push({ x: 240, y: 220 });
      if (destY < 94) path.push({ x: 240, y: destY });
    } else {
      path.push({ x: 515, y: 155 });
      path.push(loungeDoors);
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
    path.push({ x: startX, y: 340 });
    if (destZone === 'boardroom') {
      path.push({ x: 540, y: 340 });
      path.push(boardroomDoors);
      path.push({ x: 600, y: 340 });
    } else if (destZone === 'kitchen' || destZone === 'garden') {
      path.push({ x: 250, y: 340 });
      path.push(kitchenDoorway);
      path.push({ x: 120, y: 340 });
      if (destZone === 'garden') {
        path.push(gardenDoorway);
        path.push({ x: 120, y: 415 });
      }
    } else {
      path.push({ x: 515, y: 340 });
      path.push(loungeDoors);
      path.push({ x: 515, y: 155 });
    }
  } else if (startZone === 'boardroom') {
    path.push({ x: 600, y: 340 });
    path.push(boardroomDoors);
    path.push({ x: 540, y: 340 });
  }

  // Reach destination zone from transit aisle:
  if (destZone === 'server') {
    path.push({ x: 515, y: 155 });
    path.push({ x: 790, y: 155 });
    path.push(serverDoorway);
    path.push({ x: destX, y: 155 });
    path.push({ x: destX, y: destY });
    return path;
  }

  if (destZone === 'kitchen' && startZone !== 'garden' && startZone !== 'lounge') {
    path.push({ x: 250, y: 340 });
    path.push(kitchenDoorway);
    path.push({ x: 120, y: 340 });
  } else if (destZone === 'garden' && startZone !== 'kitchen' && startZone !== 'lounge') {
    path.push({ x: 250, y: 340 });
    path.push(kitchenDoorway);
    path.push({ x: 120, y: 340 });
    path.push(gardenDoorway);
    path.push({ x: 120, y: 415 });
  } else if (destZone === 'lounge' && startZone !== 'lounge') {
    if (startZone === 'boardroom') {
      path.push({ x: 515, y: 340 });
    } else if (startZone !== 'kitchen' && startZone !== 'garden') {
      path.push({ x: 515, y: 340 });
    }
  } else if (destZone === 'boardroom' && startZone !== 'boardroom') {
    path.push({ x: 540, y: 340 });
    path.push(boardroomDoors);
    path.push({ x: 600, y: 340 });
  } else if (destZone === 'ceo' && startZone !== 'bullpen') {
    path.push({ x: 515, y: 340 });
    path.push(loungeDoors);
    path.push({ x: 515, y: 220 });
    path.push({ x: 330, y: 220 });
    path.push(ceoDoorway);
    path.push({ x: 240, y: 220 });
    if (destY < 94) path.push({ x: 240, y: destY });
  } else if (destZone === 'bullpen' && startZone !== 'ceo') {
    path.push({ x: 515, y: 340 });
    path.push(loungeDoors);
    path.push({ x: 515, y: 155 });
    path.push({ x: destX, y: 155 });
  }

  path.push({ x: destX, y: destY });
  return path;
}

// ============================================================================
// MAIN VIRTUAL OFFICE COMPONENT
// ============================================================================
export default function PixelOffice({ selectedAgentId, onSelectAgent, viewMode = 'pixel', onViewModeChange }: PixelOfficeProps) {
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

  const handleStartDirectiveMeetingRef = useRef<((data: any) => void) | null>(null);
  const handleEndDirectiveMeetingRef = useRef<((data: any) => void) | null>(null);

  // Real-time dialogue sequencing refs for boardroom meetings & office banter
  const meetingDialogueTimerRef = useRef(3.5);
  const meetingDialogueIndexRef = useRef(0);
  const casualChatTimerRef = useRef(14.0);
  const pendingReplyRef = useRef<{ speaker: string; text: string; delay: number } | null>(null);

  // Autonomous Caring & Routine State Refs for Eah (Cooking, Coffee, Dylan Delivery, Puppy Visit)
  const eahRoutineStepRef = useRef<
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
    | 'return_armchair'
  >('relaxing');
  const eahCycleCountRef = useRef<number>(0);
  const servedDeskItemRef = useRef<'food' | 'coffee' | null>(null);
  const dogSpeechRef = useRef<{ text: string; timer: number } | null>(null);

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

    sse.addEventListener('office:meeting:start', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        handleStartDirectiveMeetingRef.current?.(data);
      } catch {}
    });

    sse.addEventListener('office:meeting:end', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        handleEndDirectiveMeetingRef.current?.(data);
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
        ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'Space', 'KeyE', 'KeyC', 'KeyB', 'ShiftLeft', 'ShiftRight'].includes(code)
      ) {
        e.preventDefault();
        keysPressed.current.add(code);

        if (code === 'ShiftLeft' || code === 'ShiftRight') {
          setIsSprinting(true);
        }

        // Direct shortcut keys for asking Eah to cook or brew coffee
        if (code === 'KeyC' || code === 'KeyB') {
          const d = charactersRef.current.dylan;
          const distToEah = charactersRef.current.eah
            ? Math.hypot(d.currentX - charactersRef.current.eah.currentX, d.currentY - charactersRef.current.eah.currentY)
            : 999;
          const eah = charactersRef.current.eah;
          if (distToEah < 56 && eah) {
            if (code === 'KeyC') {
              d.bubbleText = 'Eah, could you cook some breakfast for me, please? 🍳';
              d.bubbleTimer = 4.5;
              eah.bubbleText = 'Right away Dylan! Cooking something delicious for you! 🍳✨';
              eah.bubbleTimer = 4.5;
              eahRoutineStepRef.current = 'cook_walk';
              eah.isSeated = false;
              eah.activity = 'working';
              eah.path = generateSmartPath(eah.currentX, eah.currentY, 136, 350);
              eah.isWalking = true;
            } else {
              d.bubbleText = 'Eah, can you brew some hot coffee for me, please? ☕';
              d.bubbleTimer = 4.5;
              eah.bubbleText = 'Sure Dylan! Brewing your favorite caramel latte right away! ☕✨';
              eah.bubbleTimer = 4.5;
              eahRoutineStepRef.current = 'coffee_walk';
              eah.isSeated = false;
              eah.activity = 'working';
              eah.path = generateSmartPath(eah.currentX, eah.currentY, 275, 436);
              eah.isWalking = true;
            }
            playSfx('click');
            return;
          }
        }

        // Sit / Stand Toggle or Proximity Interact
        if (code === 'KeyE' || code === 'Space') {
          const d = charactersRef.current.dylan;
          const distToDesk = Math.hypot(d.currentX - d.deskX, d.currentY - d.deskY);
          const distToWater = Math.hypot(d.currentX - 780, d.currentY - 130);
          const distToFridge = Math.hypot(d.currentX - 120, d.currentY - 310);

          const distToEspresso = Math.hypot(d.currentX - 268, d.currentY - 436);
          const distToSofa = Math.hypot(d.currentX - 340, d.currentY - 340);
          const distToArcade = Math.hypot(d.currentX - 250, d.currentY - 335);
          const distToKitchen = Math.hypot(d.currentX - 120, d.currentY - 370);
          const distToGarden = Math.hypot(d.currentX - 120, d.currentY - 460);
          const distToDog = Math.hypot(d.currentX - 505, d.currentY - 340);
          const distToEah = charactersRef.current.eah
            ? Math.hypot(d.currentX - charactersRef.current.eah.currentX, d.currentY - charactersRef.current.eah.currentY)
            : 999;

          if (distToEah < 52) {
            d.facing = 'left';
            d.bubbleText = 'Hi Eah! ✨ Everything going smoothly with your iPad?';
            d.bubbleTimer = 4;
            const eahQuotes = [
              'Super cozy, Dylan! Browsing on my iPad ✨ Want me to cook for you? [Press C]',
              'Need some hot coffee, Dylan? [Press B] ☕',
              'Watching you lead our team as CEO is so inspiring, Dylan! 👑',
              'Taking notes on my iPad 💻 Always so proud of what we are building, Dylan! ✨',
              'You got this, Dylan! Always cheering for you as our CEO! 🚀',
            ];
            if (charactersRef.current.eah) {
              charactersRef.current.eah.bubbleText = eahQuotes[Math.floor(Math.random() * eahQuotes.length)];
              charactersRef.current.eah.bubbleTimer = 5;
            }
            playSfx('click');
          } else if (distToDog < 44) {
            d.bubbleText = 'Who\'s a good boy? 🐶 Fluffy office puppy!';
            d.bubbleTimer = 4.0;
            dogSpeechRef.current = { text: 'Arf arf! 🐶💕 *happy puppy tail wag*', timer: 5.0 };
            playSfx('click');
          } else if (distToDesk < 28) {
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
          } else if (d.currentX > 836 && d.currentY <= 280) {
            d.bubbleText = '🛡️ Zero-Trust Audit Complete: 4 Enterprise Racks 100% operational!';
            d.bubbleTimer = 5;
            const zane = charactersRef.current.zane;
            if (zane) {
              zane.bubbleText = 'Zero-trust perimeter locked down, Boss Dylan! Threat level 0. 🛡️⚡';
              zane.bubbleTimer = 5;
            }
            playSfx('click');
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
      dylan: { x: 275, y: 440, bubble: '👑 Founder espresso break in the boutique lounge!' },
      ray: { x: 300, y: 338, bubble: '🔍 Relaxing on the leather sectional booth!' },
      maya: { x: 335, y: 338, bubble: '🎨 Designing UI mockups in the sage-teal lounge!' },
      alex: { x: 415, y: 462, bubble: '💻 Relaxing on the lower leather booth!' },
      wendy: { x: 450, y: 462, bubble: '📢 Reviewing launch campaign from the lounge booth!' },
      zane: { x: 250, y: 358, bubble: '🕹️ Speedrunning retro arcade high score!' },
    };

    Object.values(chars).forEach((char) => {
      if (char.id === 'eah') {
        char.isMeeting = false;
        char.isWalking = false;
        char.path = [];
        char.isSeated = true;
        char.activity = 'sofa_relax';
        char.bubbleText = nextRest ? 'Cozy here on the sofa with my iPad 💕' : 'Chilling on my iPad in the CEO suite 💕';
        char.bubbleTimer = 5;
        return;
      }

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
      if (char.id === 'eah') {
        char.isMeeting = false;
        char.isWalking = false;
        char.path = [];
        char.isSeated = true;
        char.activity = 'sofa_relax';
        char.bubbleText = nextMeeting ? 'Good luck in the all-hands meeting, Dylan! 💕' : 'Welcome back to the office, babe! ✨';
        char.bubbleTimer = 4;
        return;
      }

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

  // Automated Directive Sprint Meeting in Boardroom (Pixel View)
  const handleStartDirectiveMeeting = useCallback((data: { topic?: string; leadAgent?: string }) => {
    playSfx('bell');
    setInMeetingMode(true);
    setInRestMode(false);

    const topic = data.topic ? (data.topic.length > 36 ? data.topic.slice(0, 36) + '...' : data.topic) : 'Executive Directive';
    const leadId = data.leadAgent || 'alex';

    const roleLines: Record<string, string> = {
      alex: '⚡ Fullstack arch & APIs ready!',
      maya: '🎨 Designing UI tokens & layouts!',
      ray: '🧠 Research & model patterns aligned!',
      wendy: '📈 Growth & launch messaging locked!',
      zane: '🛡️ Firewall & security verified!',
    };

    const chars = charactersRef.current;
    Object.values(chars).forEach((char) => {
      if (char.id === 'eah') {
        char.isMeeting = false;
        char.isWalking = false;
        char.path = [];
        char.isSeated = true;
        char.activity = 'sofa_relax';
        char.bubbleText = 'Good luck in the strategy meeting, Dylan! 💕';
        char.bubbleTimer = 5;
        return;
      }

      char.isMeeting = true;
      char.isSeated = false;
      char.activity = 'meeting';
      char.path = generateSmartPath(char.currentX, char.currentY, char.seatX, char.seatY);
      char.isWalking = true;
      char.statusText = 'In Meeting';
      char.emoji = '👥';

      if (char.id === 'dylan') {
        char.bubbleText = `📢 Dylan Ramos assigned: "${topic}"! Let's align!`;
        char.bubbleTimer = 5;
      } else if (char.id === leadId) {
        char.bubbleText = `💪 On it Dylan! Leading this sprint!`;
        char.bubbleTimer = 5;
      } else {
        char.bubbleText = roleLines[char.id] || 'Aligned for sprint!';
        char.bubbleTimer = 4;
      }
    });
  }, [playSfx]);

  const handleEndDirectiveMeeting = useCallback((data?: { leadAgent?: string }) => {
    playSfx('bell');
    setInMeetingMode(false);
    const leadId = data?.leadAgent;

    const chars = charactersRef.current;
    Object.values(chars).forEach((char) => {
      if (char.id === 'eah') return;

      char.isMeeting = false;
      char.isSeated = false;
      char.activity = 'idle';
      char.path = generateSmartPath(char.currentX, char.currentY, char.deskX, char.deskY);
      char.isWalking = true;
      char.statusText = char.id === 'dylan' ? 'You' : 'Deep focus';
      char.emoji = char.id === 'dylan' ? '🟢' : '💻';

      if (char.id === leadId) {
        char.bubbleText = 'Executing directive now! 💻🔥';
        char.bubbleTimer = 5;
      } else {
        char.bubbleText = 'Returning to desk...';
        char.bubbleTimer = 3;
      }
    });
  }, [playSfx]);

  handleStartDirectiveMeetingRef.current = handleStartDirectiveMeeting;
  handleEndDirectiveMeetingRef.current = handleEndDirectiveMeeting;

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

    const LOGICAL_W = 1040;
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
              } else if (Math.hypot(char.currentX - 250, char.currentY - 358) < 18) {
                // Playing Retro Arcade Cabinet: Firmly standing, facing directly UP into arcade screen!
                char.isSeated = false;
                char.facing = 'up';
                char.activity = 'playing_arcade';
              } else if (char.currentX >= 270 && char.currentX <= 370 && char.currentY >= 325 && char.currentY <= 360) {
                // Seated properly on Top Sectional Booth cushion
                char.isSeated = true;
                char.facing = 'down'; // Faces DOWN towards coffee table
                char.activity = 'sofa_relax';
              } else if (char.currentX >= 390 && char.currentX <= 490 && char.currentY >= 430 && char.currentY <= 470) {
                // Seated properly on Bottom Sectional Booth cushion
                char.isSeated = true;
                char.facing = 'up'; // Faces UP towards coffee table
                char.activity = 'sofa_relax';
              } else if (Math.hypot(char.currentX - 275, char.currentY - 440) < 18) {
                // Seated on Espresso Bar Stool
                char.isSeated = true;
                char.facing = 'left';
                char.activity = 'drinking_coffee';
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
            if (char.id === 'eah') {
              // Eah destination actions are advanced by the Eah State Machine below
            } else {
              // Once finished, walk back to personal desk!
              char.path = generateSmartPath(char.currentX, char.currentY, char.deskX, char.deskY);
              char.activity = 'working';
              char.bubbleText = 'Heading back to work.';
              char.bubbleTimer = 2.5;
            }
          }
        }

        // 3. Autonomous Periodic Stand-Up Cycle (every 10 - 20 seconds for bullpen workers & Eah's caring routines)
        if (char.id === 'eah') {
          const eahStep = eahRoutineStepRef.current;

          if (eahStep === 'relaxing') {
            char.isSeated = true;
            char.activity = 'sofa_relax';
            char.routineTimer -= 0.016;
            if (char.routineTimer <= 0) {
              eahCycleCountRef.current++;
              const cycle = eahCycleCountRef.current % 3;

              if (cycle === 1) {
                // ROUTINE 1: Cook breakfast/comfort food for Dylan!
                eahRoutineStepRef.current = 'cook_walk';
                char.isSeated = false;
                char.activity = 'working';
                char.bubbleText = 'Cooking a delicious hot meal for Dylan Ramos! 🍳🥓';
                char.bubbleTimer = 4.5;
                char.path = generateSmartPath(char.currentX, char.currentY, 136, 350);
                char.isWalking = true;
              } else if (cycle === 2) {
                // ROUTINE 2: Brew special espresso/latte for Dylan in the Lounge!
                eahRoutineStepRef.current = 'coffee_walk';
                char.isSeated = false;
                char.activity = 'working';
                char.bubbleText = 'Brewing a special hot coffee for CEO Dylan! ☕✨';
                char.bubbleTimer = 4.5;
                char.path = generateSmartPath(char.currentX, char.currentY, 275, 436);
                char.isWalking = true;
              } else {
                // ROUTINE 3: Visit puppy in Lounge!
                eahRoutineStepRef.current = 'puppy_walk';
                char.isSeated = false;
                char.activity = 'working';
                char.bubbleText = 'Taking a quick break to visit our puppy, Dylan! 🐶🐾';
                char.bubbleTimer = 4.5;
                char.path = generateSmartPath(char.currentX, char.currentY, 490, 346);
                char.isWalking = true;
              }
            }
          } else if (eahStep === 'cook_walk') {
            if (char.path.length === 0) {
              eahRoutineStepRef.current = 'cooking';
              char.activity = 'eah_cooking';
              char.facing = 'down';
              char.waitTimer = 7.5;
              char.bubbleText = 'Sizzling hot breakfast for Dylan! 🍳✨';
              char.bubbleTimer = 4.5;
            }
          } else if (eahStep === 'cooking') {
            if (!char.waitTimer || char.waitTimer <= 0) {
              eahRoutineStepRef.current = 'deliver_food_walk';
              char.activity = 'eah_carrying_food';
              char.bubbleText = 'Fresh and piping hot! Delivering to Dylan Ramos! 🍲✨';
              char.bubbleTimer = 4.0;
              char.path = generateSmartPath(char.currentX, char.currentY, 120, 116);
              char.isWalking = true;
            }
          } else if (eahStep === 'deliver_food_walk') {
            if (char.path.length === 0) {
              eahRoutineStepRef.current = 'serving_food';
              char.activity = 'eah_serving';
              char.facing = 'up';
              char.waitTimer = 5.0;
              char.bubbleText = 'Here you go Dylan, I cooked this specially for you! Enjoy! 🍲✨';
              char.bubbleTimer = 5.0;
              servedDeskItemRef.current = 'food';
              const dylan = charactersRef.current.dylan;
              if (dylan) {
                dylan.bubbleText = 'Thank you so much Eah! ✨ This looks delicious, you are the best! 🍳';
                dylan.bubbleTimer = 5.5;
              }
            }
          } else if (eahStep === 'coffee_walk') {
            if (char.path.length === 0) {
              eahRoutineStepRef.current = 'brewing';
              char.activity = 'eah_brewing_coffee';
              char.facing = 'up';
              char.waitTimer = 6.5;
              char.bubbleText = 'Freshly brewed latte with heart foam art for Dylan ☕✨';
              char.bubbleTimer = 4.0;
            }
          } else if (eahStep === 'brewing') {
            if (!char.waitTimer || char.waitTimer <= 0) {
              eahRoutineStepRef.current = 'deliver_coffee_walk';
              char.activity = 'eah_carrying_coffee';
              char.bubbleText = 'Delivering fresh hot coffee to Dylan Ramos! ☕✨';
              char.bubbleTimer = 4.0;
              char.path = generateSmartPath(char.currentX, char.currentY, 120, 116);
              char.isWalking = true;
            }
          } else if (eahStep === 'deliver_coffee_walk') {
            if (char.path.length === 0) {
              eahRoutineStepRef.current = 'serving_coffee';
              char.activity = 'eah_serving';
              char.facing = 'up';
              char.waitTimer = 5.0;
              char.bubbleText = "Here is your fresh hot coffee Dylan! ☕✨ Don't work too hard!";
              char.bubbleTimer = 5.0;
              servedDeskItemRef.current = 'coffee';
              const dylan = charactersRef.current.dylan;
              if (dylan) {
                dylan.bubbleText = "Thank you so much Eah! You're the best! ☕✨";
                dylan.bubbleTimer = 5.5;
              }
            }
          } else if (eahStep === 'puppy_walk') {
            if (char.path.length === 0) {
              eahRoutineStepRef.current = 'petting_puppy';
              char.activity = 'eah_petting_dog';
              char.facing = 'right';
              char.waitTimer = 6.0;
              char.bubbleText = 'You are the cutest puppy ever, Dylan will love you! 🐶✨';
              char.bubbleTimer = 4.5;
              dogSpeechRef.current = { text: 'Arf arf! 🐶💕 *happy puppy kisses for Dylan & Eah*', timer: 5.0 };
            }
          } else if (eahStep === 'serving_food' || eahStep === 'serving_coffee' || eahStep === 'petting_puppy') {
            if (!char.waitTimer || char.waitTimer <= 0) {
              eahRoutineStepRef.current = 'return_armchair';
              char.activity = 'working';
              char.bubbleText = 'Heading back to my cozy iPad nook beside Dylan ✨';
              char.bubbleTimer = 3.5;
              char.path = generateSmartPath(char.currentX, char.currentY, 64, 175);
              char.isWalking = true;
            }
          } else if (eahStep === 'return_armchair') {
            if (char.path.length === 0) {
              eahRoutineStepRef.current = 'relaxing';
              char.isSeated = true;
              char.activity = 'sofa_relax';
              char.facing = 'right';
              char.routineTimer = 22 + Math.random() * 14;
              char.bubbleText = 'Chilling on my iPad beside Dylan Ramos 💻✨';
              char.bubbleTimer = 4.5;
            }
          }
        } else if (char.id !== 'dylan' && !char.isMeeting && !inRestMode && char.path.length === 0 && !char.waitTimer) {
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
              char.path = generateSmartPath(char.currentX, char.currentY, 255, 335);
              char.waitTimer = 7.5;
            } else if (choice < 0.50) {
              // 4. Brew Fresh Artisanal Espresso at Coffee Bar
              char.isSeated = false;
              char.activity = 'drinking_coffee';
              char.bubbleText = '☕ Brewing a fresh hot espresso shot!';
              char.bubbleTimer = 4;
              char.path = generateSmartPath(char.currentX, char.currentY, 255, 440);
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
              // 5. Relax on Sofa or Collaborative Work Bench with Laptop in Lounge
              char.isSeated = false;
              const targetX = char.id === 'alex' || char.id === 'wendy' ? 440 : char.id === 'zane' ? 500 : 310;
              const targetY = char.id === 'alex' || char.id === 'wendy' ? 445 : char.id === 'zane' ? 346 : 355;
              if (char.id === 'alex' || char.id === 'wendy') {
                char.activity = 'working';
                char.bubbleText = '💻 Bringing my laptop to work on the lounge bench!';
              } else if (char.id === 'zane') {
                char.activity = 'playing_arcade';
                char.bubbleText = '🛡️ Running security audit from the arcade lounge!';
              } else {
                char.activity = 'sofa_relax';
                char.bubbleText = '🛋️ Sipping coffee and relaxing in the cozy lounge!';
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
      } else if (Math.hypot(dylan.currentX - 250, dylan.currentY - 440) < 36) {
        setNearbyPrompt('[E] Espresso Bar: Brew fresh coffee');
      } else if (Math.hypot(dylan.currentX - 250, dylan.currentY - 335) < 36) {
        setNearbyPrompt('[E] Play Retro Arcade Machine 🕹️');
      } else if (Math.hypot(dylan.currentX - 308, dylan.currentY - 350) < 40) {
        setNearbyPrompt('[E / Space] Relax in Top Leather Booth');
      } else if (Math.hypot(dylan.currentX - 444, dylan.currentY - 440) < 40) {
        setNearbyPrompt('[E / Space] Relax in Bottom Leather Booth');
      } else if (Math.hypot(dylan.currentX - 506, dylan.currentY - 340) < 42) {
        setNearbyPrompt('[Click / E] Pet Mochi the Office Puppy 🐶💕');
      } else if (Math.hypot(dylan.currentX - 300, dylan.currentY - 170) < 36) {
        setNearbyPrompt('[E] Mini Fridge: Grab energy drink');
      } else if (Math.hypot(dylan.currentX - 780, dylan.currentY - 130) < 36) {
        setNearbyPrompt('[E] Water Cooler: Drink cold water');
      } else if (chars.eah && Math.hypot(dylan.currentX - chars.eah.currentX, dylan.currentY - chars.eah.currentY) < 52) {
        setNearbyPrompt('[Click / E] Talk with Eah 💕 • [C] Cook Meal • [B] Brew Coffee');
      } else if (chars.ray && Math.hypot(dylan.currentX - chars.ray.currentX, dylan.currentY - chars.ray.currentY) < 40) {
        setNearbyPrompt('[Click / E] Consult Ray • Lead AI Researcher');
      } else if (chars.maya && Math.hypot(dylan.currentX - chars.maya.currentX, dylan.currentY - chars.maya.currentY) < 40) {
        setNearbyPrompt('[Click / E] Consult Maya • UI/UX & Product Designer');
      } else if (chars.alex && Math.hypot(dylan.currentX - chars.alex.currentX, dylan.currentY - chars.alex.currentY) < 40) {
        setNearbyPrompt('[Click / E] Consult Alex • Fullstack Dev & Architecture');
      } else if (chars.wendy && Math.hypot(dylan.currentX - chars.wendy.currentX, dylan.currentY - chars.wendy.currentY) < 40) {
        setNearbyPrompt('[Click / E] Consult Wendy • Marketing Strategist');
      } else if (dylan.currentX > 836 && dylan.currentY <= 280) {
        setNearbyPrompt('[Click / E] Server Vault & DevOps-SecOps Hub • Alex & Zane 💻🛡️');
      } else if (chars.zane && Math.hypot(dylan.currentX - chars.zane.currentX, dylan.currentY - chars.zane.currentY) < 40) {
        setNearbyPrompt('[Click / E] Consult Zane • Cybersecurity Specialist');
      } else if (dylan.currentY > 360 && Math.hypot(dylan.currentX - 625, dylan.currentY - 405) < 40) {
        setNearbyPrompt('[E] Take Head of Grand Boardroom Table');
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

      // Eah's Cozy Luxury Velvet Armchair & Side Table along the side wall (not too close to CEO desk)
      ctx.fillStyle = '#0f172a'; // Deep base shadow
      ctx.fillRect(52, 165, 24, 24);
      ctx.fillStyle = '#fb7185'; // Soft rose plush velvet seat
      ctx.fillRect(54, 167, 20, 20);
      ctx.fillStyle = '#f43f5e'; // Armchair backrest along wall
      ctx.fillRect(52, 165, 4, 24);
      ctx.fillStyle = '#fbbf24'; // Gold throw pillow
      ctx.fillRect(54, 167, 6, 6);
      // Small side pedestal table
      ctx.fillStyle = '#78350f';
      ctx.fillRect(58, 150, 12, 12);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(57, 149, 14, 2);

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

      // 1. Light, warm-toned (pale peach/beige) brick pattern background wall behind desks (y: 16..46)
      const brickWallH = 30;
      ctx.fillStyle = '#ede4db';
      ctx.fillRect(bullX, bullY, bullW, brickWallH);

      const bRowH = 6;
      const bColW = 16;
      for (let by = bullY; by < bullY + brickWallH; by += bRowH) {
        const isShift = Math.floor((by - bullY) / bRowH) % 2 === 1;
        const xOffset = isShift ? bColW / 2 : 0;
        for (let bx = bullX - bColW; bx < bullX + bullW; bx += bColW) {
          ctx.strokeStyle = '#dfd4c7';
          ctx.lineWidth = 1;
          ctx.strokeRect(bx + xOffset, by, bColW, bRowH);
        }
      }

      // Faded rounded title banner visible at top center: "Product team"
      const bannerW = 96;
      const bannerH = 16;
      const bannerX = 506;
      const bannerY = 19;
      ctx.fillStyle = 'rgba(252, 248, 242, 0.94)';
      ctx.beginPath();
      ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 8);
      ctx.fill();
      ctx.strokeStyle = '#d7cbbf';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#5b6275';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Product team', bannerX + bannerW / 2, bannerY + 11.5);

      // 2. Light and dark grey patterned tiled floor design (y: 46..280)
      const floorStartY = bullY + brickWallH;
      const floorH = bullH - brickWallH;
      ctx.fillStyle = '#7a8c99';
      ctx.fillRect(bullX, floorStartY, bullW, floorH);

      const tileW = 18;
      const tileH = 18;
      for (let fy = floorStartY; fy < bullY + bullH; fy += tileH) {
        for (let fx = bullX; fx < bullX + bullW; fx += tileW) {
          const isAlt = (Math.floor((fx - bullX) / tileW) + Math.floor((fy - floorStartY) / tileH)) % 2 === 0;
          ctx.fillStyle = isAlt ? '#8ca0ae' : '#738694';
          ctx.fillRect(fx, fy, tileW, tileH);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(fx, fy, tileW, tileH);
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

      // ======================================================================
      // ZONE 6: HIGH-TECH CYBER SECURITY OPERATIONS & SERVER VAULT (x: 836..1024, y: 16..280)
      // ======================================================================
      const srvX = 836;
      const srvY = 16;
      const srvW = 188;
      const srvH = 264;

      // Anti-Static Cyber Armor Grid Floor (Dark Navy / Emerald)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(srvX, srvY, srvW, srvH);

      // Glowing Emerald Anti-Static Floor Grid Lines
      ctx.strokeStyle = '#052e16';
      ctx.lineWidth = 1;
      for (let sx = srvX; sx < srvX + srvW; sx += 16) {
        ctx.beginPath();
        ctx.moveTo(sx, srvY);
        ctx.lineTo(sx, srvY + srvH);
        ctx.stroke();
      }
      for (let sy = srvY; sy < srvY + srvH; sy += 16) {
        ctx.beginPath();
        ctx.moveTo(srvX, sy);
        ctx.lineTo(srvX + srvW, sy);
        ctx.stroke();
      }

      // Vertical Security Partition Wall at x = 836 (with Doorway at y: 130..185)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.fillRect(srvX - 2, srvY, 4, 114); // Top segment (y: 16..130)
      ctx.fillRect(srvX - 2, 185, 4, srvH - (185 - srvY)); // Bottom segment (y: 185..280)

      // Wall Lintel & Steel Frame
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(srvX - 4, srvY, 8, 4);
      ctx.fillRect(srvX - 4, 126, 8, 4);
      ctx.fillRect(srvX - 4, 185, 8, 4);
      ctx.fillRect(srvX - 4, srvY + srvH - 4, 8, 4);

      // Continuous Overhead Header Track across doorway
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(srvX - 3, 128, 6, 58);

      // Biometric RFID Badge Reader on Wall facing Bullpen
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(srvX - 7, 142, 4, 12);
      ctx.fillStyle = '#00f59b';
      ctx.fillRect(srvX - 6, 144, 2, 3); // Active scanner diode
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(srvX - 6, 149, 2, 3); // Keypad LED

      // Horizontal Wall separating Server Room from South Wing (y = 280, x: 836..1024)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.fillRect(srvX, 278, srvW, 4);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(srvX, 280, srvW, 2);

      // Glowing Neon Header Plaque: "🛡️ SOC & SERVER VAULT (ZONE 6)"
      const srvPlaqueX = srvX + 20;
      const srvPlaqueY = srvY + 4;
      ctx.fillStyle = '#021e0e';
      ctx.fillRect(srvPlaqueX, srvPlaqueY, 148, 12);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1;
      ctx.strokeRect(srvPlaqueX, srvPlaqueY, 148, 12);
      ctx.fillStyle = '#00f59b';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('🛡️ SOC & SERVER VAULT (ZONE 6)', srvPlaqueX + 6, srvPlaqueY + 9);

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

      // ======================================================================
      // ZONE 3: TEAM RELAXATION & COFFEE LOUNGE (Center Suite, x: 226..560, y: 290..504)
      // MATCHES DESIGN: SAGE-TEAL RUG, DUAL DARK LEATHER BOOTHS, CARAMEL WOOD TABLES,
      // FLUFFY PUPPY MOCHI ON DONUT BED, RETRO ARCADE, ESPRESSO BAR, & FRAMED HEART PHOTO!
      // ======================================================================
      // 1. Grid Tile Border Floor
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(226, 290, 334, 214);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      for (let gx = 226; gx <= 560; gx += 16) {
        ctx.beginPath();
        ctx.moveTo(gx, 290);
        ctx.lineTo(gx, 504);
        ctx.stroke();
      }
      for (let gy = 290; gy <= 504; gy += 16) {
        ctx.beginPath();
        ctx.moveTo(226, gy);
        ctx.lineTo(560, gy);
        ctx.stroke();
      }

      // 2. Beautiful Soft Muted Sage-Teal Area Rug
      const rugX = 242;
      const rugY = 306;
      const rugW = 302;
      const rugH = 190;
      ctx.fillStyle = '#5b8586'; // Elegant sage-teal base
      ctx.beginPath();
      ctx.roundRect(rugX, rugY, rugW, rugH, 10);
      ctx.fill();
      ctx.strokeStyle = '#4a7273';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Subtle woven chat-bubble silhouette woven into center of sage-teal rug
      ctx.fillStyle = '#6f9b9c'; // Subtle tone-on-tone weave
      ctx.beginPath();
      ctx.roundRect(365, 368, 56, 44, 12);
      ctx.fill();
      // Small speech bubble pointer notch pointing towards center aisle
      ctx.beginPath();
      ctx.moveTo(377, 412);
      ctx.lineTo(387, 420);
      ctx.lineTo(389, 412);
      ctx.closePath();
      ctx.fill();

      // Top Header Neon Sign
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(320, 294, 150, 12);
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 7px monospace';
      ctx.fillText('☕ BOUTIQUE LOUNGE & PUPPY NOOK', 324, 303);

      // 3. TOP-LEFT SECTIONAL BOOTH (Dark Charcoal / Slate Leather + Caramel Wood Table)
      // Top backrest (spans x: 254..360, y: 314..328)
      ctx.fillStyle = '#1b2432';
      ctx.fillRect(254, 314, 106, 14);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(254, 314, 106, 2);
      // Left backrest / arm (spans x: 254..268, y: 328..380)
      ctx.fillStyle = '#1b2432';
      ctx.fillRect(254, 328, 14, 52);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(254, 328, 2, 52);

      // Slate leather cushions base with horizontal pleat stitching
      ctx.fillStyle = '#222d3d';
      ctx.fillRect(268, 328, 92, 52);
      ctx.fillStyle = '#283548';
      ctx.fillRect(270, 330, 88, 48);
      ctx.fillStyle = '#1b2432';
      ctx.fillRect(270, 344, 88, 2);
      ctx.fillRect(270, 358, 88, 2);
      // Gold velvet accent throw pillow at corner
      ctx.fillStyle = '#d97706';
      ctx.fillRect(270, 330, 10, 10);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(272, 332, 6, 6);

      // Top Caramel Wooden Coffee Table
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(292, 346, 44, 30);
      ctx.fillStyle = '#c67d4b';
      ctx.fillRect(290, 344, 44, 28);
      ctx.fillStyle = '#df905b';
      ctx.fillRect(290, 344, 44, 2);
      ctx.fillRect(290, 344, 2, 28);
      // Small ceramic coffee mug on top table
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(302, 352, 5, 6);
      ctx.fillStyle = '#3e2318';
      ctx.fillRect(303, 352, 3, 2);
      const tSteam = (frame * 0.25) % 6;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fillRect(304, 348 - tSteam, 2, 2);
      // Sketchpad / book on table
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(318, 354, 10, 8);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(320, 356, 6, 4);

      // 4. BOTTOM-RIGHT INVERTED SECTIONAL BOOTH
      // Bottom backrest (spans x: 390..496, y: 470..484)
      ctx.fillStyle = '#1b2432';
      ctx.fillRect(390, 470, 106, 14);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(390, 482, 106, 2);
      // Right backrest / arm (spans x: 482..496, y: 404..470)
      ctx.fillStyle = '#1b2432';
      ctx.fillRect(482, 404, 14, 66);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(494, 404, 2, 66);

      // Slate leather cushions base with horizontal pleat stitching
      ctx.fillStyle = '#222d3d';
      ctx.fillRect(392, 412, 90, 58);
      ctx.fillStyle = '#283548';
      ctx.fillRect(394, 414, 86, 54);
      ctx.fillStyle = '#1b2432';
      ctx.fillRect(394, 428, 86, 2);
      ctx.fillRect(394, 442, 86, 2);
      ctx.fillRect(394, 456, 86, 2);
      // Cream accent throw pillow
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(470, 458, 10, 10);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(472, 460, 6, 6);

      // Bottom Caramel Wooden Coffee Table
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(424, 424, 44, 30);
      ctx.fillStyle = '#c67d4b';
      ctx.fillRect(422, 422, 44, 28);
      ctx.fillStyle = '#df905b';
      ctx.fillRect(422, 422, 44, 2);
      ctx.fillRect(422, 422, 2, 28);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(436, 430, 5, 6);
      ctx.fillStyle = '#3e2318';
      ctx.fillRect(437, 430, 3, 2);
      const bSteam = (frame * 0.28) % 6;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fillRect(438, 426 - bSteam, 2, 2);

      // 5. ADORABLE FLUFFY OFFICE DOG (HUSKY/SHIBA PUPPY MOCHI) PET SANCTUARY CORNER
      const dogBedX = 506;
      const dogBedY = 340;

      // Plush Braided Woven Oval Rug under Dog Bed
      ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
      ctx.beginPath();
      ctx.ellipse(dogBedX, dogBedY + 3, 26, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(dogBedX, dogBedY + 2, 25, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#fef9c3';
      ctx.beginPath();
      ctx.ellipse(dogBedX, dogBedY + 2, 20, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Donut Pet Bed Base & Cushion
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(dogBedX + 2, dogBedY + 2, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c27845';
      ctx.beginPath();
      ctx.arc(dogBedX, dogBedY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a85d2b';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(dogBedX, dogBedY, 12, 0, Math.PI * 2);
      ctx.fill();

      // Stainless Steel Water Bowl with Animated Fresh Ripples (Left of bed)
      const wBowlX = dogBedX - 22;
      const wBowlY = dogBedY + 8;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
      ctx.beginPath();
      ctx.ellipse(wBowlX + 1, wBowlY + 1, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8'; // Stainless rim
      ctx.beginPath();
      ctx.ellipse(wBowlX, wBowlY, 5.5, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8'; // Clear fresh water
      ctx.beginPath();
      ctx.ellipse(wBowlX, wBowlY, 4, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      const ripple = (frame * 0.15) % 2.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(wBowlX, wBowlY, 1 + ripple, 0, Math.PI * 2);
      ctx.stroke();

      // Ceramic Pet Food Bowl with Golden Crunchy Kibble
      const fBowlX = dogBedX - 22;
      const fBowlY = dogBedY - 4;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
      ctx.beginPath();
      ctx.ellipse(fBowlX + 1, fBowlY + 1, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444'; // Red ceramic bowl
      ctx.beginPath();
      ctx.ellipse(fBowlX, fBowlY, 5.5, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b45309'; // Golden brown kibbles
      ctx.fillRect(fBowlX - 3, fBowlY - 1, 2, 2);
      ctx.fillRect(fBowlX, fBowlY - 2, 2, 2);
      ctx.fillRect(fBowlX + 1, fBowlY, 2, 2);
      ctx.fillRect(fBowlX - 2, fBowlY + 1, 2, 1);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(fBowlX - 1, fBowlY - 1, 2, 2);

      // Red Rubber Dog Chew Bone Toy (Right of bed)
      const boneX = dogBedX + 17;
      const boneY = dogBedY + 10;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
      ctx.fillRect(boneX - 4, boneY + 2, 10, 3);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(boneX - 4, boneY, 8, 3); // Middle shaft
      ctx.beginPath();
      ctx.arc(boneX - 4, boneY - 1, 2, 0, Math.PI * 2); // Left top knuckle
      ctx.arc(boneX - 4, boneY + 3, 2, 0, Math.PI * 2); // Left bottom knuckle
      ctx.arc(boneX + 4, boneY - 1, 2, 0, Math.PI * 2); // Right top knuckle
      ctx.arc(boneX + 4, boneY + 3, 2, 0, Math.PI * 2); // Right bottom knuckle
      ctx.fill();

      // Cute Puppy (Mochi)
      const dogBreathe = Math.sin(frame * 0.08) * 1.2;
      const tailWag = Math.sin(frame * 0.32) * 4;
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.arc(dogBedX + 7 + tailWag, dogBedY - 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(dogBedX + 9 + tailWag, dogBedY - 6, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.ellipse(dogBedX, dogBedY, 9, 7 + dogBreathe, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(dogBedX - 2, dogBedY + 1, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.arc(dogBedX - 2, dogBedY - 3, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(dogBedX - 4, dogBedY - 1, 3.5, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(dogBedX - 6, dogBedY - 2, 2, 2);
      // Ears
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.moveTo(dogBedX - 6, dogBedY - 7); ctx.lineTo(dogBedX - 3, dogBedY - 12); ctx.lineTo(dogBedX - 1, dogBedY - 7);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.moveTo(dogBedX - 5, dogBedY - 7); ctx.lineTo(dogBedX - 3, dogBedY - 10); ctx.lineTo(dogBedX - 2, dogBedY - 7);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.moveTo(dogBedX, dogBedY - 7); ctx.lineTo(dogBedX + 3, dogBedY - 12); ctx.lineTo(dogBedX + 5, dogBedY - 7);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.moveTo(dogBedX + 1, dogBedY - 7); ctx.lineTo(dogBedX + 3, dogBedY - 10); ctx.lineTo(dogBedX + 4, dogBedY - 7);
      ctx.closePath(); ctx.fill();
      // Eyes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(dogBedX - 4, dogBedY - 5, 2, 2);
      ctx.fillRect(dogBedX, dogBedY - 5, 2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(dogBedX - 4, dogBedY - 5, 1, 1);
      ctx.fillRect(dogBedX, dogBedY - 5, 1, 1);
      // Cheeks & Tongue
      ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
      ctx.fillRect(dogBedX - 6, dogBedY - 3, 2, 1);
      ctx.fillRect(dogBedX + 2, dogBedY - 3, 2, 1);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(dogBedX - 5, dogBedY, 3, 2);
      if (frame % 80 < 35) {
        ctx.fillStyle = '#fb7185';
        ctx.font = 'bold 7px monospace';
        ctx.fillText('💕', dogBedX + 10, dogBedY - 10);
      }

      // 6. FRAMED HEART PHOTO & MINIATURE SUCCULENT
      const frameX = 356;
      const frameY = 466;
      ctx.fillStyle = '#78350f';
      ctx.fillRect(frameX - 1, frameY + 12, 14, 2);
      ctx.fillRect(frameX + 5, frameY + 14, 2, 6);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(frameX, frameY, 12, 14);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(frameX, frameY, 12, 14);
      ctx.fillStyle = '#ffe4e6';
      ctx.fillRect(frameX + 2, frameY + 2, 8, 10);
      ctx.fillStyle = '#e11d48';
      ctx.font = 'bold 6px monospace';
      ctx.fillText('❤️', frameX + 2, frameY + 9);
      // Mini succulent pot
      ctx.fillStyle = '#b45309';
      ctx.fillRect(frameX + 16, frameY + 8, 8, 8);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(frameX + 15, frameY + 7, 10, 2);
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(frameX + 20, frameY + 5, 4, 0, Math.PI * 2);
      ctx.arc(frameX + 17, frameY + 4, 3, 0, Math.PI * 2);
      ctx.arc(frameX + 23, frameY + 4, 3, 0, Math.PI * 2);
      ctx.fill();

      // 7. ESPRESSO BAR & REFRESHMENT STATION (West Wall beside Kitchen)
      ctx.fillStyle = '#334155';
      ctx.fillRect(236, 426, 32, 54);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(234, 424, 36, 14);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(238, 404, 18, 20);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(240, 406, 14, 8);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(242, 416, 3, 4);
      ctx.fillRect(249, 416, 3, 4);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(256, 410, 4, 12);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(262, 410, 4, 12);

      // 8. RETRO ARCADE CABINET (West Wall, Top - Clearly distinct from Lounge & Dog Corner!)
      const arcX = 236;
      const arcY = 318;
      // Grounding shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(arcX + 2, arcY + 34, 28, 4);

      // Cabinet Outer Housing (Deep Obsidian Navy with Neon Cyan & Magenta Bevels)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(arcX, arcY, 28, 36);
      ctx.fillStyle = '#ec4899'; // Left magenta neon side edge
      ctx.fillRect(arcX, arcY, 2, 36);
      ctx.fillStyle = '#06b6d4'; // Right cyan neon side edge
      ctx.fillRect(arcX + 26, arcY, 2, 36);

      // Illuminated Retro Marquee Header
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(arcX + 2, arcY + 2, 24, 7);
      ctx.fillStyle = frame % 30 < 15 ? '#ffbe0b' : '#f59e0b';
      ctx.fillRect(arcX + 2, arcY + 2, 24, 1); // Top glow strip
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 4.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('★ ARCADE ★', arcX + 14, arcY + 7);

      // Curved Glass CRT Bezel & Screen
      ctx.fillStyle = '#020617';
      ctx.fillRect(arcX + 2, arcY + 10, 24, 15);
      // Screen interior
      ctx.fillStyle = '#050c1e';
      ctx.fillRect(arcX + 3, arcY + 11, 22, 13);

      // Animated 8-bit Space Invader on CRT
      const alienShift = Math.sin(frame * 0.15) * 3;
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(arcX + 11 + alienShift, arcY + 13, 6, 4);
      ctx.fillRect(arcX + 12 + alienShift, arcY + 12, 4, 1);
      ctx.fillStyle = '#050c1e';
      ctx.fillRect(arcX + 12 + alienShift, arcY + 14, 1, 1); // Eye left
      ctx.fillRect(arcX + 15 + alienShift, arcY + 14, 1, 1); // Eye right

      // Firing laser blast on screen
      const laserY = (frame * 1.2) % 8;
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(arcX + 13, arcY + 21 - laserY, 2, 3);

      // Player 8-bit space ship at bottom of screen
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(arcX + 11, arcY + 22, 6, 2);
      ctx.fillRect(arcX + 13, arcY + 21, 2, 1);

      // CRT Scanline Filter effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(arcX + 3, arcY + 13, 22, 1);
      ctx.fillRect(arcX + 3, arcY + 16, 22, 1);
      ctx.fillRect(arcX + 3, arcY + 19, 22, 1);

      // Slanted Control Console Deck
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(arcX + 2, arcY + 25, 24, 5);
      ctx.fillStyle = '#334155';
      ctx.fillRect(arcX + 2, arcY + 25, 24, 1); // Deck bevel

      // Red Ball Joystick (Left)
      ctx.fillStyle = '#64748b';
      ctx.fillRect(arcX + 6, arcY + 26, 2, 3);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(arcX + 5, arcY + 25, 4, 2);

      // Arcade Action Buttons (Right)
      ctx.fillStyle = '#38bdf8'; // Blue button
      ctx.fillRect(arcX + 13, arcY + 27, 2, 2);
      ctx.fillStyle = '#eab308'; // Yellow button
      ctx.fillRect(arcX + 17, arcY + 27, 2, 2);
      ctx.fillStyle = '#ef4444'; // Red button
      ctx.fillRect(arcX + 21, arcY + 27, 2, 2);

      // Coin Doors & Dual LED 25¢ Insertion Slots
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(arcX + 4, arcY + 30, 20, 5);
      ctx.fillStyle = '#f97316'; // Illuminated orange 25¢ insert slots
      ctx.fillRect(arcX + 8, arcY + 31, 3, 1);
      ctx.fillRect(arcX + 17, arcY + 31, 3, 1);
      ctx.fillStyle = '#475569'; // Coin return cups
      ctx.fillRect(arcX + 8, arcY + 33, 3, 1.5);
      ctx.fillRect(arcX + 17, arcY + 33, 3, 1.5);

      // Potted plants in Lounge
      ctx.fillStyle = '#78350f';
      ctx.fillRect(534, 464, 12, 18);
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(540, 452, 12, 0, Math.PI * 2);
      ctx.arc(534, 444, 9, 0, Math.PI * 2);
      ctx.arc(546, 444, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#334155';
      ctx.fillRect(274, 474, 10, 14);
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(279, 470, 7, 0, Math.PI * 2);
      ctx.fill();

      // ======================================================================
      // ZONE 4: GRAND EXECUTIVE BOARDROOM & ALL-HANDS MEETING SUITE (Right Wing, x: 560..1024, y: 290..504)
      // "MALUWAG" / EXTRA SPACIOUS: MASSIVE 464PX WIDE EXECUTIVE WING, 85" ULTRA-HD PRESENTATION SCREEN,
      // EXPANSIVE MAHOGANY CONFERENCE TABLE WITH TONS OF WALKING CLEARANCE, KANBAN STRATEGY WALL & PLANTS!
      // ======================================================================
      // 1. Dark Mahogany Herringbone Parquet Wood Floor
      ctx.fillStyle = '#2d1810';
      ctx.fillRect(560, 290, 464, 214);
      ctx.strokeStyle = '#3e2318';
      ctx.lineWidth = 1;
      for (let bx = 560; bx <= 1024; bx += 18) {
        ctx.beginPath();
        ctx.moveTo(bx, 290);
        ctx.lineTo(bx, 504);
        ctx.stroke();
      }
      for (let by = 296; by < 504; by += 16) {
        ctx.beginPath();
        ctx.moveTo(560, by);
        ctx.lineTo(1024, by);
        ctx.stroke();
      }

      // 2. 85" Ultra-HD Smart Presentation Screen on North Glass Wall (x: 710..870, y: 294..336)
      const bScrX = 710;
      const bScrY = 294;
      const bScrW = 160;
      const bScrH = 42;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(bScrX + 3, bScrY + 3, bScrW, bScrH);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(bScrX, bScrY, bScrW, bScrH);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(bScrX, bScrY, bScrW, bScrH);

      // Dark digital screen interior
      ctx.fillStyle = '#02182b';
      ctx.fillRect(bScrX + 2, bScrY + 2, bScrW - 4, bScrH - 4);
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 6.5px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('⚡ GLOBAL AI ROADMAP & SPRINT METRICS', bScrX + 6, bScrY + 11);

      // Glowing live telemetry line chart
      ctx.strokeStyle = '#00f59b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bScrX + 8, bScrY + 28);
      ctx.lineTo(bScrX + 28, bScrY + 22);
      ctx.lineTo(bScrX + 48, bScrY + 25);
      ctx.lineTo(bScrX + 72, bScrY + 17);
      ctx.lineTo(bScrX + 96, bScrY + 20);
      ctx.lineTo(bScrX + 116, bScrY + 15);
      ctx.stroke();
      // Glowing pulse point on chart
      ctx.fillStyle = '#00f59b';
      ctx.beginPath();
      ctx.arc(bScrX + 116, bScrY + 15, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Metric progress bars on right of screen
      ctx.fillStyle = '#9d4edd';
      ctx.fillRect(bScrX + 124, bScrY + 16, 26, 8);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(bScrX + 124, bScrY + 26, 26, 8);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 5px monospace';
      ctx.fillText('REV +48%', bScrX + 125, bScrY + 22);
      ctx.fillText('SLA 99.9%', bScrX + 125, bScrY + 32);

      // 3. Grand Executive Mahogany Conference Table ("MALUWAG" / EXTRA SPACIOUS)
      // Has generous walking clearance around all 4 sides!
      const tableX = 690;
      const tableY = 368;
      const tableW = 200;
      const tableH = 58;

      // Table drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(tableX + 4, tableY + 6, tableW, tableH);
      // Rich solid mahogany outer rim
      ctx.fillStyle = '#2d1810';
      ctx.fillRect(tableX, tableY, tableW, tableH);
      // High-gloss polished mahogany top surface
      ctx.fillStyle = '#3e2318';
      ctx.fillRect(tableX + 3, tableY + 3, tableW - 6, tableH - 6);
      // Inlaid warm mahogany center veneer
      ctx.fillStyle = '#4a2c1e';
      ctx.fillRect(tableX + 20, tableY + 12, tableW - 40, tableH - 24);

      // Inlaid gold brass perimeter accent pinstripe
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1;
      ctx.strokeRect(tableX + 10, tableY + 7, tableW - 20, tableH - 14);

      // Central omnidirectional conference speakerphone puck with glowing cyan ring
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(tableX + tableW / 2, tableY + tableH / 2, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(tableX + tableW / 2 - 1.5, tableY + tableH / 2 - 1.5, 3, 3);

      // Dual pop-up charging stations with brushed brass covers
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(tableX + 45, tableY + tableH / 2 - 3, 10, 6);
      ctx.fillRect(tableX + tableW - 55, tableY + tableH / 2 - 3, 10, 6);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(tableX + 46, tableY + tableH / 2 - 2, 8, 4);
      ctx.fillRect(tableX + tableW - 54, tableY + tableH / 2 - 2, 8, 4);

      // 4. 6 Executive Aeron Chairs around Table
      // (Dylan CEO Head of Table on West + 3 Specialists North + 2 Specialists South)
      const confChairs = [
        { x: tableX - 26, y: tableY + 18, label: 'DYLAN (CEO)' },
        // North side (Ray, Maya, Alex)
        { x: tableX + 25, y: tableY - 20, label: 'RAY' },
        { x: tableX + 80, y: tableY - 20, label: 'MAYA' },
        { x: tableX + 140, y: tableY - 20, label: 'ALEX' },
        // South side (Wendy, Zane)
        { x: tableX + 50, y: tableY + tableH + 4, label: 'WENDY' },
        { x: tableX + 110, y: tableY + tableH + 4, label: 'ZANE' },
      ];

      confChairs.forEach((cc) => {
        // Chair shadow & base
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cc.x, cc.y, 22, 18);
        // Slate mesh contoured cushion
        ctx.fillStyle = '#334155';
        ctx.fillRect(cc.x + 2, cc.y + 2, 18, 14);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.strokeRect(cc.x + 2, cc.y + 2, 18, 14);
      });

      // 5. East Wall Executive Strategy Whiteboard / Kanban Board (x: 924..996, y: 335..435)
      const wbX = 924;
      const wbY = 335;
      const wbW = 74;
      const wbH = 96;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(wbX + 3, wbY + 3, wbW, wbH);
      // Frosted tempered glass whiteboard panel
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(wbX, wbY, wbW, wbH);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(wbX, wbY, wbW, wbH);

      // Title header
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 5px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('SPRINT GOALS', wbX + 6, wbY + 10);

      // 3 Kanban Columns
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(wbX + 24, wbY + 14); ctx.lineTo(wbX + 24, wbY + wbH - 8);
      ctx.moveTo(wbX + 48, wbY + 14); ctx.lineTo(wbX + 48, wbY + wbH - 8);
      ctx.stroke();

      // Colorful Kanban Sticky Notes
      // Column 1: Backlog (Yellow & Pink notes)
      ctx.fillStyle = '#fef08a'; ctx.fillRect(wbX + 4, wbY + 18, 14, 10);
      ctx.fillStyle = '#fbcfe8'; ctx.fillRect(wbX + 4, wbY + 32, 14, 10);
      ctx.fillStyle = '#fef08a'; ctx.fillRect(wbX + 4, wbY + 46, 14, 10);
      // Column 2: In Progress (Cyan notes)
      ctx.fillStyle = '#bae6fd'; ctx.fillRect(wbX + 28, wbY + 18, 16, 10);
      ctx.fillStyle = '#bae6fd'; ctx.fillRect(wbX + 28, wbY + 32, 16, 10);
      // Column 3: Done (Green notes!)
      ctx.fillStyle = '#bbf7d0'; ctx.fillRect(wbX + 52, wbY + 18, 16, 10);
      ctx.fillStyle = '#bbf7d0'; ctx.fillRect(wbX + 52, wbY + 32, 16, 10);
      ctx.fillStyle = '#bbf7d0'; ctx.fillRect(wbX + 52, wbY + 46, 16, 10);

      // Marker tray at bottom of whiteboard
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(wbX + 10, wbY + wbH - 4, wbW - 20, 3);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(wbX + 16, wbY + wbH - 6, 6, 2);
      ctx.fillStyle = '#3b82f6'; ctx.fillRect(wbX + 26, wbY + wbH - 6, 6, 2);
      ctx.fillStyle = '#10b981'; ctx.fillRect(wbX + 36, wbY + wbH - 6, 6, 2);

      // 6. Luxury Potted Indoor Ficus & Bird of Paradise Plants in Boardroom Corners
      // Bottom-right corner plant
      ctx.fillStyle = '#78350f';
      ctx.fillRect(994, 465, 16, 18);
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(1002, 452, 14, 0, Math.PI * 2);
      ctx.arc(994, 442, 10, 0, Math.PI * 2);
      ctx.arc(1010, 442, 10, 0, Math.PI * 2);
      ctx.fill();
      // Top-right corner plant
      ctx.fillStyle = '#78350f';
      ctx.fillRect(994, 305, 14, 16);
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(1001, 296, 12, 0, Math.PI * 2);
      ctx.fill();
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

      // Horizontal Glass Wall between Bullpen & Lounge / Boardroom (y = 280)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.fillRect(16, 280, 464, 8);  // Left wall segment (x: 16..480)
      ctx.fillRect(550, 280, 140, 8); // Wall segment (x: 550..690)
      ctx.fillRect(760, 280, 264, 8); // Right wall segment (x: 760..1024)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(16, 280, 464, 8);
      ctx.strokeRect(550, 280, 140, 8);
      ctx.strokeRect(760, 280, 264, 8);

      // Continuous floor threshold plate & guide track for Lounge doorway (x: 480..550)
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

      // Lounge Illuminated Acrylic Sign
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(484, 264, 62, 12);
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 1;
      ctx.strokeRect(484, 264, 62, 12);
      ctx.fillStyle = '#ec4899';
      ctx.font = 'bold 7px monospace';
      ctx.fillText('LOUNGE', 497, 273);

      // Lounge Bi-Parting Double Sliding Glass Doors (meeting in center x = 515)
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

      // Vertical Glass Divider between Kitchen & Lounge (x = 226, y in [280, 504])
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
      ctx.fillRect(195, 290, 58, 10);
      ctx.fillStyle = '#ec4899';
      ctx.font = 'bold 5.5px monospace';
      ctx.fillText('LOUNGE W', 200, 297);

      // Vertical Glass Divider between Lounge & Grand Boardroom (x = 560, y in [280, 504])
      ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.fillRect(560, 288, 8, 22);  // Top wall segment (y: 288..310)
      ctx.fillRect(560, 370, 8, 134); // Bottom wall segment (y: 370..504)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(560, 288, 8, 22);
      ctx.strokeRect(560, 370, 8, 134);
      // Floor guide track / threshold across doorway (y: 310..370)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(558, 310, 12, 60);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(557, 308, 14, 4); // Top jamb
      ctx.fillRect(557, 368, 14, 4); // Bottom jamb
      // Frosted Sliding Door Leaf / Open Portal
      ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
      ctx.fillRect(560, 312, 8, 56);
      ctx.fillStyle = 'rgba(224, 242, 254, 0.6)';
      ctx.fillRect(561, 334, 6, 12);
      // East Divider Plaque
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(564, 290, 64, 10);
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 5.5px monospace';
      ctx.fillText('BOARDROOM', 568, 297);

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

      // Liquid-Cooled Workstation Battle-Station Tower (Lian Li Dual-Chamber)
      drawLegitPCTower2D(ctx, dDeskX + 6, dDeskY + 10, 18, 38, frame, 'cyan');

      // Open Executive Apple Silver MacBook Pro on Desk (Facing Dylan)
      const dylLap = LAPTOP_STYLES_2D.dylan;
      ctx.fillStyle = dylLap.baseColor;
      ctx.fillRect(dDeskX + 8, dDeskY + 12, 18, 10);
      ctx.fillStyle = dylLap.kbColor;
      ctx.fillRect(dDeskX + 10, dDeskY + 13, 14, 5); // Keyboard
      ctx.fillStyle = dylLap.trackpadColor;
      ctx.fillRect(dDeskX + 14, dDeskY + 19, 6, 2);  // Trackpad
      // Display lid with screen facing north towards Dylan
      ctx.fillStyle = dylLap.lidColor;
      ctx.fillRect(dDeskX + 8, dDeskY + 22, 18, 8);
      ctx.fillStyle = dylLap.screenBg;
      ctx.fillRect(dDeskX + 9, dDeskY + 22, 16, 5);
      // Glowing white Apple logo on back of lid
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(dDeskX + 16, dDeskY + 28, 2, 2);
      // Active code & telemetry lines on laptop screen
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(dDeskX + 10, dDeskY + 23, 8, 1);
      ctx.fillRect(dDeskX + 10, dDeskY + 25, 12, 1);
      if (frame % 24 < 12) {
        ctx.fillStyle = '#ffffff'; // Blinking prompt cursor
        ctx.fillRect(dDeskX + 23, dDeskY + 25, 1, 2);
      }

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
      ctx.fillStyle = '#090d16';
      ctx.fillRect(dDeskX + 32, dDeskY + 24, 56, 18);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(dDeskX + 33, dDeskY + 25, 54, 16);
      // Metallic dual monitor arm stand
      ctx.fillStyle = '#64748b';
      ctx.fillRect(dDeskX + 57, dDeskY + 38, 6, 4);

      // Active 49" Glowing Screen (facing up towards Dylan) with Live Candlestick & Telemetry
      ctx.fillStyle = '#030712';
      ctx.fillRect(dDeskX + 34, dDeskY + 20, 52, 6);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1;
      ctx.strokeRect(dDeskX + 34, dDeskY + 20, 52, 6);

      // Live High-Frequency Trading Candlesticks & Upward Revenue Trendline
      for (let ci = 0; ci < 7; ci++) {
        const cX = dDeskX + 36 + ci * 5;
        const wave = Math.sin(frame * 0.06 + ci * 0.9);
        const isUp = wave > -0.1;
        const barH = 2 + Math.floor(Math.abs(wave) * 3);
        ctx.fillStyle = isUp ? '#22c55e' : '#ef4444';
        ctx.fillRect(cX, dDeskY + 24 - barH, 3, barH);
        // Wick
        ctx.fillStyle = isUp ? '#4ade80' : '#f87171';
        ctx.fillRect(cX + 1, dDeskY + 24 - barH - 1, 1, barH + 2);
      }
      // Pulsing cyan KPI badge on right edge of 49" display
      ctx.fillStyle = (frame % 28 < 14) ? '#00f0ff' : '#0284c7';
      ctx.fillRect(dDeskX + 73, dDeskY + 21, 11, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(dDeskX + 75, dDeskY + 22, 7, 1);

      // Secondary Vertical Metrics Monitor (w = 24, h = 26)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(dDeskX + 92, dDeskY + 18, 24, 26);
      ctx.fillStyle = '#030712';
      ctx.fillRect(dDeskX + 94, dDeskY + 16, 20, 26);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.strokeRect(dDeskX + 94, dDeskY + 16, 20, 26);

      // Active Vertical Telemetry Cards: ARR, Active Agents, System Health
      const kpiProg1 = 4 + Math.floor((Math.sin(frame * 0.04) + 1) * 6);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(dDeskX + 96, dDeskY + 18, kpiProg1, 3);
      const kpiProg2 = 4 + Math.floor((Math.cos(frame * 0.05) + 1) * 5);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(dDeskX + 96, dDeskY + 24, kpiProg2, 3);
      const kpiProg3 = 8 + Math.floor((Math.sin(frame * 0.03 + 2) + 1) * 4);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(dDeskX + 96, dDeskY + 30, kpiProg3, 3);
      // Blinking operational heartbeat dot
      ctx.fillStyle = (frame % 30 < 15) ? '#22c55e' : '#14532d';
      ctx.fillRect(dDeskX + 110, dDeskY + 37, 2, 2);

      // WARM BREAKFAST / FRESH ARTISANAL COFFEE SERVED BY EAH ON DYLAN'S DESK
      if (servedDeskItemRef.current === 'food') {
        // White porcelain plate with golden breakfast, sunny-side eggs & herbs
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(dDeskX + 118, dDeskY + 36, 16, 12);
        ctx.fillStyle = '#fbbf24';
        ctx.strokeRect(dDeskX + 118, dDeskY + 36, 16, 12);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(dDeskX + 120, dDeskY + 38, 7, 6); // Sunny egg white/golden
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(dDeskX + 122, dDeskY + 40, 3, 3); // Orange yolk
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(dDeskX + 128, dDeskY + 39, 4, 5); // Crispy bacon/ham
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(dDeskX + 127, dDeskY + 38, 2, 2); // Fresh herb garnish
        // Tiny cutlery
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(dDeskX + 115, dDeskY + 38, 2, 8); // Fork
        ctx.fillRect(dDeskX + 135, dDeskY + 38, 2, 8); // Knife
        // Gentle steam curls rising
        const fSteam = (frame * 0.25) % 6;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(dDeskX + 124, dDeskY + 33 - fSteam, 2, 2);
        ctx.fillRect(dDeskX + 128, dDeskY + 31 - fSteam, 2, 2);
      } else if (servedDeskItemRef.current === 'coffee') {
        // Ceramic Mug with Heart Latte Art
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(dDeskX + 122, dDeskY + 36, 10, 10);
        ctx.fillStyle = '#fb7185';
        ctx.fillRect(dDeskX + 122, dDeskY + 36, 10, 2); // Rose gold rim
        ctx.fillStyle = '#3e2318';
        ctx.fillRect(dDeskX + 124, dDeskY + 38, 6, 4); // Rich coffee
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(dDeskX + 126, dDeskY + 39, 2, 2); // Heart foam art
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(dDeskX + 132, dDeskY + 39, 2, 4); // Handle
        // Steaming curls rising
        const cSteam = (frame * 0.3) % 7;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.fillRect(dDeskX + 126, dDeskY + 33 - cSteam, 2, 2);
      }

      // ======================================================================
      // 3. WORKSTATION DESKS & PERMANENT CHAIRS
      // ======================================================================
      // ROW 1: PRODUCT TEAM (2 Long White Desks Placed with Ample Walking Room)
      // Middle: Maya (Dual Monitors, Graphic Tablet with Stylus, Notepad & Phone, Dark Keyboard, Mouse)
      // Right: Ray (Succulent in Orange Pot, Laptop Terminal, Retro Warm Lamp, Green Backpack)
      const productDesks = [
        { id: 'maya', x: 380, y: 46, w: 180, h: 54 },
        { id: 'ray', x: 600, y: 46, w: 180, h: 54 },
      ];

      productDesks.forEach((d) => {
        // Drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.fillRect(d.x + 4, d.y + 6, d.w, d.h);

        // Long white desk top surface
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(d.x, d.y, d.w, d.h - 8);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(d.x, d.y, d.w, d.h - 8);

        // Front edge bevel line
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(d.x, d.y + d.h - 9, d.w, 1);

        // Dark grey-blue front modesty skirt / panel
        ctx.fillStyle = '#556075';
        ctx.fillRect(d.x, d.y + d.h - 8, d.w, 8);
        ctx.strokeStyle = '#334155';
        ctx.strokeRect(d.x, d.y + d.h - 8, d.w, 8);

        // Dark sturdy corner legs
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(d.x + 4, d.y + d.h, 6, 8);
        ctx.fillRect(d.x + d.w - 10, d.y + d.h, 6, 8);

        // Dark grey rolling office chair facing upward
        const chairX = d.x + d.w / 2 - 14;
        const chairY = d.y + d.h + 8;
        // Five-star spider rolling caster base
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(chairX - 2, chairY + 14, 32, 3);
        ctx.fillRect(chairX - 4, chairY + 15, 3, 3);
        ctx.fillRect(chairX + 29, chairY + 15, 3, 3);
        ctx.fillRect(chairX + 12, chairY + 6, 4, 10);
        // Mesh contoured seat & backrest facing upward
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.roundRect(chairX, chairY, 28, 14, 3);
        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Inner backrest mesh accent
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(chairX + 4, chairY + 2, 20, 3);
        // Left & right armrests
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(chairX - 3, chairY + 2, 3, 10);
        ctx.fillRect(chairX + 28, chairY + 2, 3, 10);

        // --------------------------------------------------------------------
        // DISTINCT HARDWARE & PROPS FOR EACH OF THE 3 DESKS
        // --------------------------------------------------------------------
        if (d.id === 'alex') {
          // ==================================================================
          // DESK 1 (LEFT): DEVELOPER / GAMER SETUP
          // ==================================================================
          // A. PC Tower on far left of desk
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(d.x + 10, d.y + 6, 16, 36);
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1;
          ctx.strokeRect(d.x + 10, d.y + 6, 16, 36);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(d.x + 12, d.y + 8, 12, 10);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(d.x + 14, d.y + 18, 3, 20); // Glowing vertical blue LED strip
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(d.x + 18, d.y + 10, 4, 2);

          // B. Gamepad / Controller below PC tower
          const gpX = d.x + 8;
          const gpY = d.y + 36;
          ctx.fillStyle = '#2d3748';
          ctx.beginPath();
          ctx.roundRect(gpX, gpY, 20, 12, 4);
          ctx.fill();
          ctx.strokeStyle = '#1a202c';
          ctx.lineWidth = 1;
          ctx.stroke();
          // D-pad on left
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(gpX + 3, gpY + 5, 5, 2);
          ctx.fillRect(gpX + 4.5, gpY + 3.5, 2, 5);
          // Action buttons on right (ABXY)
          ctx.fillStyle = '#38bdf8'; ctx.fillRect(gpX + 13, gpY + 4, 2, 2);
          ctx.fillStyle = '#f43f5e'; ctx.fillRect(gpX + 16, gpY + 5.5, 2, 2);
          ctx.fillStyle = '#fbbf24'; ctx.fillRect(gpX + 11.5, gpY + 6.5, 2, 2);
          ctx.fillStyle = '#10b981'; ctx.fillRect(gpX + 14, gpY + 8, 2, 2);
          // Analog thumbsticks
          ctx.fillStyle = '#1a202c';
          ctx.beginPath(); ctx.arc(gpX + 7, gpY + 9, 2, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(gpX + 13, gpY + 9, 2, 0, Math.PI * 2); ctx.fill();

          // C. Main Monitor (Horizontal) - Synthwave / Vaporwave Scene
          const m1X = d.x + 32;
          const m1Y = d.y + 5;
          const m1W = 44;
          const m1H = 26;
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(m1X + m1W / 2 - 6, m1Y + m1H, 12, 5); // Desktop stand
          ctx.fillRect(m1X + m1W / 2 - 2, m1Y + m1H - 4, 4, 5);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(m1X, m1Y, m1W, m1H);
          ctx.strokeStyle = '#0f172a';
          ctx.strokeRect(m1X, m1Y, m1W, m1H);

          // Synthwave Screen (Purple twilight sky, pink sun, perspective cyan/pink grid)
          const s1X = m1X + 2;
          const s1Y = m1Y + 2;
          const s1W = m1W - 4;
          const s1H = m1H - 4;
          ctx.fillStyle = '#2e0854';
          ctx.fillRect(s1X, s1Y, s1W, s1H * 0.55);
          ctx.fillStyle = '#581c87';
          ctx.fillRect(s1X, s1Y + 4, s1W, s1H * 0.35);
          // Neon pink sun on horizon
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(s1X + s1W / 2, s1Y + s1H * 0.55, 6, Math.PI, 0);
          ctx.fill();
          ctx.fillStyle = '#fb7185';
          ctx.fillRect(s1X + s1W / 2 - 5, s1Y + s1H * 0.55 - 2, 10, 1);
          // Distant mountains
          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath();
          ctx.moveTo(s1X + 2, s1Y + s1H * 0.55);
          ctx.lineTo(s1X + 10, s1Y + s1H * 0.38);
          ctx.lineTo(s1X + 18, s1Y + s1H * 0.55);
          ctx.lineTo(s1X + s1W - 12, s1Y + s1H * 0.35);
          ctx.lineTo(s1X + s1W - 2, s1Y + s1H * 0.55);
          ctx.fill();
          // Wireframe neon grid
          const gY = s1Y + Math.floor(s1H * 0.55);
          const gH = s1H - Math.floor(s1H * 0.55);
          ctx.fillStyle = '#0a0a1a';
          ctx.fillRect(s1X, gY, s1W, gH);
          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(s1X, gY + 2, s1W, 1);
          ctx.fillRect(s1X, gY + 5, s1W, 1);
          ctx.fillRect(s1X, gY + 8, s1W, 1);
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(s1X + s1W / 2, gY); ctx.lineTo(s1X + 2, s1Y + s1H);
          ctx.moveTo(s1X + s1W / 2, gY); ctx.lineTo(s1X + 8, s1Y + s1H);
          ctx.moveTo(s1X + s1W / 2, gY); ctx.lineTo(s1X + s1W / 2, s1Y + s1H);
          ctx.moveTo(s1X + s1W / 2, gY); ctx.lineTo(s1X + s1W - 8, s1Y + s1H);
          ctx.moveTo(s1X + s1W / 2, gY); ctx.lineTo(s1X + s1W - 2, s1Y + s1H);
          ctx.stroke();

          // D. Vertical Secondary Monitor on right (dark interface with colorful spots)
          const m2X = d.x + 80;
          const m2Y = d.y + 6;
          const m2W = 22;
          const m2H = 34;
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(m2X, m2Y, m2W, m2H);
          ctx.strokeStyle = '#0f172a';
          ctx.strokeRect(m2X, m2Y, m2W, m2H);
          ctx.fillStyle = '#090d16';
          ctx.fillRect(m2X + 2, m2Y + 2, m2W - 4, m2H - 4);
          const spotColors = ['#f43f5e', '#38bdf8', '#fbbf24', '#34d399', '#a855f7', '#fb7185', '#38bdf8', '#fbbf24'];
          for (let spi = 0; spi < 8; spi++) {
            const rowY = m2Y + 5 + spi * 3.2;
            ctx.fillStyle = spotColors[spi % spotColors.length];
            ctx.fillRect(m2X + 4, rowY, 3, 2);
            ctx.fillStyle = spotColors[(spi + 2) % spotColors.length];
            ctx.fillRect(m2X + 9, rowY, 5, 2);
            if (spi % 2 === 0) {
              ctx.fillStyle = spotColors[(spi + 4) % spotColors.length];
              ctx.fillRect(m2X + 15, rowY, 3, 2);
            }
          }

          // E. Blue Mechanical Keyboard
          const kbX = d.x + 36;
          const kbY = d.y + 36;
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(kbX, kbY, 34, 11);
          ctx.strokeStyle = '#0369a1';
          ctx.strokeRect(kbX, kbY, 34, 11);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(kbX + 2, kbY + 2, 30, 2);
          ctx.fillRect(kbX + 2, kbY + 5, 30, 2);
          ctx.fillStyle = '#bae6fd';
          ctx.fillRect(kbX + 8, kbY + 8, 16, 2);

          // F. Dark Mouse
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(d.x + 74, d.y + 37, 7, 10);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(d.x + 76, d.y + 39, 3, 2);

        } else if (d.id === 'maya') {
          // ==================================================================
          // DESK 2 (MIDDLE): DESIGNER / ARTIST SETUP (MAYA)
          // ==================================================================
          // Legit Liquid-Cooled Lian Li Workstation PC Tower (Designer Pink/White RGB)
          drawLegitPCTower2D(ctx, d.x + 130, d.y + 8, 18, 38, frame, 'pink');

          // A. Dual Monitor Setup: Figma Canvas + Design System Tokens
          // Monitor 1: Wider Monitor on left (Active Figma App UI with Animated Selection Box)
          const mm1X = d.x + 8;
          const mm1Y = d.y + 6;
          const mm1W = 42;
          const mm1H = 26;
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(mm1X + mm1W / 2 - 5, mm1Y + mm1H, 10, 5);
          ctx.fillStyle = '#090d16';
          ctx.fillRect(mm1X, mm1Y, mm1W, mm1H);
          ctx.strokeStyle = '#ec4899';
          ctx.lineWidth = 1;
          ctx.strokeRect(mm1X, mm1Y, mm1W, mm1H);

          // Figma Top Toolbar
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(mm1X + 1, mm1Y + 1, mm1W - 2, 3);
          ctx.fillStyle = '#ec4899'; ctx.fillRect(mm1X + 3, mm1Y + 2, 2, 1);
          ctx.fillStyle = '#38bdf8'; ctx.fillRect(mm1X + 7, mm1Y + 2, 2, 1);
          ctx.fillStyle = '#a855f7'; ctx.fillRect(mm1X + 11, mm1Y + 2, 2, 1);

          // Figma Canvas background
          ctx.fillStyle = '#18181b';
          ctx.fillRect(mm1X + 1, mm1Y + 4, mm1W - 2, mm1H - 5);

          // Mobile App Wireframe Frame (Artboard)
          const abX = mm1X + 10;
          const abY = mm1Y + 6;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(abX, abY, 18, 14);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(abX + 2, abY + 2, 14, 3); // Header
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(abX + 2, abY + 6, 14, 4); // Card
          ctx.fillStyle = '#ec4899';
          ctx.fillRect(abX + 4, abY + 11, 10, 2); // Primary CTA Button

          // Animated Pulsing Figma Selection Marquee Box around Card
          if (frame % 30 < 18) {
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 1;
            ctx.strokeRect(abX + 1, abY + 5, 16, 6);
            // 4 corner handles
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(abX, abY + 4, 2, 2);
            ctx.fillRect(abX + 16, abY + 4, 2, 2);
            ctx.fillRect(abX, abY + 10, 2, 2);
            ctx.fillRect(abX + 16, abY + 10, 2, 2);
          }

          // Monitor 2: Vertical Design Tokens & Color Palette Monitor
          const mm2X = d.x + 52;
          const mm2Y = d.y + 6;
          const mm2W = 18;
          const mm2H = 32;
          ctx.fillStyle = '#090d16';
          ctx.fillRect(mm2X, mm2Y, mm2W, mm2H);
          ctx.strokeStyle = '#8b5cf6';
          ctx.lineWidth = 1;
          ctx.strokeRect(mm2X, mm2Y, mm2W, mm2H);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(mm2X + 1, mm2Y + 1, mm2W - 2, mm2H - 2);

          // Design tokens & animated property slider
          const dColors = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e'];
          for (let di = 0; di < dColors.length; di++) {
            ctx.fillStyle = dColors[di];
            ctx.fillRect(mm2X + 3, mm2Y + 3 + di * 4, 4, 2);
            ctx.fillStyle = '#64748b';
            ctx.fillRect(mm2X + 9, mm2Y + 3 + di * 4, 6, 2);
          }
          // Animated slider thumb moving
          const sPos = 3 + Math.floor((Math.sin(frame * 0.08) + 1) * 5);
          ctx.fillStyle = '#ec4899';
          ctx.fillRect(mm2X + 3, mm2Y + 27, 12, 2);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(mm2X + sPos, mm2Y + 26, 3, 4);

          // B. Artist's Graphic Tablet with Stylus (Wacom pen display)
          const tabX = d.x + 72;
          const tabY = d.y + 8;
          const tabW = 34;
          const tabH = 24;
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(tabX, tabY, tabW, tabH);
          ctx.strokeStyle = '#0f172a';
          ctx.strokeRect(tabX, tabY, tabW, tabH);
          // Express keys on left bezel
          ctx.fillStyle = '#334155';
          ctx.fillRect(tabX + 2, tabY + 3, 2, 3);
          ctx.fillRect(tabX + 2, tabY + 8, 2, 3);
          ctx.fillRect(tabX + 2, tabY + 13, 2, 3);
          // Screen with checkerboard canvas
          const scrX = tabX + 5;
          const scrY = tabY + 2;
          const scrW = tabW - 7;
          const scrH = tabH - 4;
          for (let cy = scrY; cy < scrY + scrH; cy += 4) {
            for (let cx = scrX; cx < scrX + scrW - 4; cx += 4) {
              const isChk = (Math.floor((cx - scrX) / 4) + Math.floor((cy - scrY) / 4)) % 2 === 0;
              ctx.fillStyle = isChk ? '#cbd5e1' : '#ffffff';
              ctx.fillRect(cx, cy, 4, 4);
            }
          }
          // Color picker palette on right edge of tablet display
          const palX = scrX + scrW - 4;
          ctx.fillStyle = '#ec4899'; ctx.fillRect(palX, scrY + 2, 3, 3);
          ctx.fillStyle = '#10b981'; ctx.fillRect(palX, scrY + 6, 3, 3);
          ctx.fillStyle = '#3b82f6'; ctx.fillRect(palX, scrY + 10, 3, 3);
          ctx.fillStyle = '#f59e0b'; ctx.fillRect(palX, scrY + 14, 3, 3);

          // C. Open Apple Starlight MacBook Air on Desk
          const mayLap = LAPTOP_STYLES_2D.maya;
          const mlX = d.x + 108;
          const mlY = d.y + 12;
          ctx.fillStyle = mayLap.baseColor;
          ctx.fillRect(mlX, mlY, 18, 10);
          ctx.fillStyle = mayLap.kbColor;
          ctx.fillRect(mlX + 2, mlY + 1, 14, 5);
          ctx.fillStyle = mayLap.trackpadColor;
          ctx.fillRect(mlX + 6, mlY + 7, 6, 2);
          // Upright lid facing Maya
          ctx.fillStyle = mayLap.lidColor;
          ctx.fillRect(mlX, mlY - 8, 18, 9);
          ctx.fillStyle = mayLap.screenBg;
          ctx.fillRect(mlX + 1, mlY - 7, 16, 7);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(mlX + 8, mlY - 4, 2, 2); // Apple Logo
          ctx.fillStyle = '#ec4899';
          ctx.fillRect(mlX + 3, mlY - 6, 8, 2);
          ctx.fillRect(mlX + 3, mlY - 3, 10, 2);

          // D. Stylus pen standing upright in desktop stand
          const stX = d.x + 108;
          const stY = d.y + 26;
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(stX + 4, stY + 6, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ec4899';
          ctx.fillRect(stX + 3, stY - 2, 2, 8);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(stX + 3, stY - 2, 2, 2);

          // E. Dark Mechanical Keyboard and Mouse
          const dkbX = d.x + 28;
          const dkbY = d.y + 36;
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(dkbX, dkbY, 30, 10);
          ctx.strokeStyle = '#ec4899';
          ctx.lineWidth = 1;
          ctx.strokeRect(dkbX, dkbY, 30, 10);
          ctx.fillStyle = '#ec4899';
          ctx.fillRect(dkbX + 2, dkbY + 2, 26, 2);
          ctx.fillRect(dkbX + 2, dkbY + 5, 26, 2);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(d.x + 62, d.y + 37, 6, 8);

        } else if (d.id === 'ray') {
          // ==================================================================
          // DESK 3 (RIGHT): AI RESEARCHER SETUP (RAY)
          // ==================================================================
          // Legit Liquid-Cooled AI Deep Learning Monster Rig (Dual GPU Cyan RGB)
          drawLegitPCTower2D(ctx, d.x + 130, d.y + 8, 18, 38, frame, 'cyan');

          // A. Small potted succulent in orange pot on far left
          const potX = d.x + 8;
          const potY = d.y + 12;
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(potX + 2, potY + 16, 16, 14);
          ctx.fillStyle = '#f97316';
          ctx.fillRect(potX, potY + 14, 20, 4);
          ctx.fillStyle = '#c2410c';
          ctx.fillRect(potX + 3, potY + 28, 14, 2);
          ctx.fillStyle = '#451a03';
          ctx.fillRect(potX + 2, potY + 14, 16, 2);
          // Pointed succulent leaves
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.moveTo(potX + 4, potY + 14); ctx.lineTo(potX - 1, potY + 6); ctx.lineTo(potX + 6, potY + 14);
          ctx.moveTo(potX + 16, potY + 14); ctx.lineTo(potX + 21, potY + 6); ctx.lineTo(potX + 14, potY + 14);
          ctx.fill();
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.moveTo(potX + 6, potY + 14); ctx.lineTo(potX + 3, potY + 2); ctx.lineTo(potX + 9, potY + 14);
          ctx.moveTo(potX + 14, potY + 14); ctx.lineTo(potX + 17, potY + 2); ctx.lineTo(potX + 11, potY + 14);
          ctx.fill();

          // B. High-End 32" Curved AI Research Display (Stepped Loss Curve & Epoch Progress)
          const mAiX = d.x + 32;
          const mAiY = d.y + 6;
          const mAiW = 46;
          const mAiH = 26;
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(mAiX + mAiW / 2 - 5, mAiY + mAiH, 10, 5);
          ctx.fillStyle = '#090d16';
          ctx.fillRect(mAiX, mAiY, mAiW, mAiH);
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 1;
          ctx.strokeRect(mAiX, mAiY, mAiW, mAiH);

          // Screen Content: TensorBoard / Deep Learning Terminal
          ctx.fillStyle = '#050c18';
          ctx.fillRect(mAiX + 1, mAiY + 1, mAiW - 2, mAiH - 2);

          // 1. Stepped Loss Descent Curve (Cyan Polyline flattening down)
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(mAiX + 4, mAiY + 6);
          ctx.lineTo(mAiX + 9, mAiY + 12);
          ctx.lineTo(mAiX + 15, mAiY + 15);
          ctx.lineTo(mAiX + 22, mAiY + 16);
          ctx.lineTo(mAiX + 28, mAiY + 17);
          ctx.stroke();

          // 2. Dynamic Filling Epoch Training Progress Bar
          const epochProg = Math.floor(((frame * 0.4) % 100) / 100 * 24);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(mAiX + 4, mAiY + 19, 24, 3);
          ctx.fillStyle = '#10b981';
          ctx.fillRect(mAiX + 4, mAiY + 19, epochProg, 3);

          // 3. 3x3 Self-Attention Heatmap Weights
          for (let hy = 0; hy < 3; hy++) {
            for (let hx = 0; hx < 3; hx++) {
              const weightVal = (Math.sin(frame * 0.08 + hx * 1.5 + hy * 2.1) + 1) * 0.5;
              ctx.fillStyle = weightVal > 0.6 ? '#00f0ff' : (weightVal > 0.3 ? '#0284c7' : '#0f172a');
              ctx.fillRect(mAiX + 31 + hx * 4, mAiY + 5 + hy * 4, 3, 3);
            }
          }

          // Blinking Terminal Prompt Cursor
          if (frame % 24 < 12) {
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(mAiX + 4, mAiY + 23, 3, 1);
          }

          // C. Open Apple Silver MacBook Pro (Ray's Laptop)
          const rayLap = LAPTOP_STYLES_2D.ray;
          const rlX = d.x + 84;
          const rlY = d.y + 12;
          ctx.fillStyle = rayLap.baseColor;
          ctx.fillRect(rlX, rlY, 20, 11);
          ctx.fillStyle = rayLap.kbColor;
          ctx.fillRect(rlX + 2, rlY + 1, 16, 6);
          ctx.fillStyle = rayLap.trackpadColor;
          ctx.fillRect(rlX + 7, rlY + 8, 6, 2);
          // Upright lid facing Ray
          ctx.fillStyle = rayLap.lidColor;
          ctx.fillRect(rlX, rlY - 9, 20, 10);
          ctx.fillStyle = rayLap.screenBg;
          ctx.fillRect(rlX + 1, rlY - 8, 18, 8);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(rlX + 9, rlY - 5, 2, 2); // Glowing Apple Logo
          // Live cyan neural network streams on laptop screen
          ctx.fillStyle = '#00f0ff';
          ctx.fillRect(rlX + 3, rlY - 7, 10, 1);
          ctx.fillRect(rlX + 3, rlY - 5, 14, 1);
          ctx.fillRect(rlX + 3, rlY - 3, 8, 1);

          // D. Mechanical Keyboard & Mouse
          const rkbX = d.x + 36;
          const rkbY = d.y + 36;
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(rkbX, rkbY, 32, 10);
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 1;
          ctx.strokeRect(rkbX, rkbY, 32, 10);
          ctx.fillStyle = '#00f0ff';
          ctx.fillRect(rkbX + 2, rkbY + 2, 28, 2);
          ctx.fillRect(rkbX + 2, rkbY + 5, 28, 2);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(d.x + 72, d.y + 37, 6, 8);

          // C. Retro-style table lamp with warm yellow glow on far right
          const lmpX = d.x + 120;
          const lmpY = d.y + 6;
          // Ambient warm glow radiating onto desk
          ctx.fillStyle = 'rgba(251, 191, 36, 0.22)';
          ctx.beginPath();
          ctx.arc(lmpX + 12, lmpY + 16, 22, 0, Math.PI * 2);
          ctx.fill();
          // Turned wooden base
          ctx.fillStyle = '#78350f';
          ctx.fillRect(lmpX + 7, lmpY + 30, 10, 4);
          ctx.fillStyle = '#92400e';
          ctx.fillRect(lmpX + 9, lmpY + 20, 6, 10);
          // Pleated amber lampshade
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.moveTo(lmpX + 6, lmpY + 20);
          ctx.lineTo(lmpX + 18, lmpY + 20);
          ctx.lineTo(lmpX + 22, lmpY + 6);
          ctx.lineTo(lmpX + 2, lmpY + 6);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(lmpX + 8, lmpY + 7, 2, 12);
          ctx.fillRect(lmpX + 14, lmpY + 7, 2, 12);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(lmpX + 11, lmpY + 3, 2, 3);

          // D. Green backpack / luggage on the floor on the left side of this desk
          const bpX = d.x + 4;
          const bpY = d.y + 54;
          const bpW = 20;
          const bpH = 28;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.fillRect(bpX + 2, bpY + 2, bpW, bpH);
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.roundRect(bpX, bpY, bpW, bpH, 4);
          ctx.fill();
          ctx.strokeStyle = '#15803d';
          ctx.lineWidth = 1;
          ctx.stroke();
          // Luggage handle
          ctx.fillStyle = '#14532d';
          ctx.fillRect(bpX + 6, bpY - 4, 8, 4);
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(bpX + 7, bpY - 3, 6, 2);
          // Front pocket & zipper
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(bpX + 3, bpY + 8, bpW - 6, 14);
          ctx.strokeStyle = '#14532d';
          ctx.strokeRect(bpX + 3, bpY + 8, bpW - 6, 14);
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(bpX + bpW / 2 - 2, bpY + 10, 4, 2);
        }
      });

      // ROW 2: MARKETING CREATIVE SUITE (Wendy)
      const row2Desks = [
        { id: 'wendy', x: 474, y: 160, w: 140, h: 50 },
      ];

      row2Desks.forEach((d) => {
        const w = d.w;
        const h = d.h;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.fillRect(d.x + 4, d.y + 6, w, h);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(d.x, d.y, w, h);
        ctx.fillStyle = '#334155';
        ctx.fillRect(d.x, d.y + h - 5, w, 5);

        // Extended desk pad
        ctx.fillStyle = '#0f172a';
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

        // Elevated Aluminum Laptop Stand
        ctx.fillStyle = '#64748b';
        ctx.fillRect(d.x + 48, d.y + 8, 44, 20);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(d.x + 50, d.y + 10, 40, 16);

        // Open 16" Apple Midnight Deep Blue MacBook Pro
        const wenLap = LAPTOP_STYLES_2D.wendy;
        ctx.fillStyle = wenLap.baseColor;
        ctx.fillRect(d.x + 48, d.y + 6, 44, 18);
        ctx.fillStyle = wenLap.screenBg;
        ctx.fillRect(d.x + 50, d.y + 8, 40, 14);

        // Active Marketing Conversion Funnel on Screen
        // Stage 1: Impressions / Top of funnel (Emerald)
        ctx.fillStyle = '#10b981';
        ctx.fillRect(d.x + 53, d.y + 10, 34, 2);
        // Stage 2: Click-throughs / Consideration (Cyan)
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(d.x + 56, d.y + 13, 28, 2);
        // Stage 3: Signups / Conversions (Amber)
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(d.x + 59, d.y + 16, 22, 2);
        // Stage 4: Retention / MRR (Rose)
        ctx.fillStyle = '#fb7185';
        ctx.fillRect(d.x + 63, d.y + 19, 14, 2);

        // Blinking KPI Growth Ticker
        if (frame % 28 < 14) {
          ctx.fillStyle = '#34d399';
          ctx.fillRect(d.x + 80, d.y + 19, 7, 2);
        }

        // Keyboard base on stand in front of screen
        ctx.fillStyle = wenLap.baseColor;
        ctx.fillRect(d.x + 48, d.y + 24, 44, 10);
        ctx.fillStyle = wenLap.kbColor;
        ctx.fillRect(d.x + 51, d.y + 25, 38, 5);
        ctx.fillStyle = wenLap.trackpadColor;
        ctx.fillRect(d.x + 65, d.y + 31, 10, 2);

        // Wireless Silver Magic Keyboard & Mouse
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(d.x + 48, d.y + 38, 32, 6);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(d.x + 50, d.y + 39, 28, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(d.x + 84, d.y + 38, 6, 7);

        // Yellow rubber duck
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(d.x + 104, d.y + 20, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f97316';
        ctx.fillRect(d.x + 107, d.y + 19, 3, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(d.x + 104, d.y + 32, 8, 10);
      });

      // ======================================================================
      // ZONE 6: ENTERPRISE SERVER VAULT & CYBER SECURITY COMMAND EQUIPMENT
      // ======================================================================

      // 1. 4x Enterprise 42U Server Cabinets (Along North Wall: x: 848..1020, y: 22..70)
      const srvRacks = [
        { id: 'rack1', name: 'DB-PROD', x: 852, y: 22, w: 38, h: 48 },
        { id: 'rack2', name: 'GPU-AI', x: 896, y: 22, w: 38, h: 48 },
        { id: 'rack3', name: 'FIREWALL', x: 940, y: 22, w: 38, h: 48 },
        { id: 'rack4', name: 'ZERO-TRUST', x: 984, y: 22, w: 38, h: 48 },
      ];

      srvRacks.forEach((rack, rIdx) => {
        // Shadow & Black Matte Steel Chassis
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(rack.x + 3, rack.y + 3, rack.w, rack.h);
        ctx.fillStyle = '#0b0f17';
        ctx.fillRect(rack.x, rack.y, rack.w, rack.h);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.strokeRect(rack.x, rack.y, rack.w, rack.h);

        // Smoked Glass Door Interior Panel
        ctx.fillStyle = '#111827';
        ctx.fillRect(rack.x + 3, rack.y + 6, rack.w - 6, rack.h - 8);

        // 4 Individual 2U Server Blades inside rack
        for (let b = 0; b < 4; b++) {
          const by = rack.y + 8 + b * 9;
          ctx.fillStyle = '#090d16';
          ctx.fillRect(rack.x + 5, by, rack.w - 10, 7);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(rack.x + 5, by, rack.w - 10, 7);

          // Intake vents
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(rack.x + 7, by + 2, 10, 3);

          // Dynamic Blinking Server Activity LEDs
          const blinkSeed = (frame + rIdx * 8 + b * 6) % 36;
          const led1 = blinkSeed < 24 ? '#00f59b' : '#052e16'; // Active green
          const led2 = blinkSeed % 8 < 5 ? '#00f0ff' : '#083344'; // Sync cyan
          const led3 = (rIdx === 2 && b === 3) ? '#f59e0b' : (blinkSeed < 18 ? '#00f59b' : '#021e0e');

          ctx.fillStyle = led1;
          ctx.fillRect(rack.x + 20, by + 2, 2, 2);
          ctx.fillStyle = led2;
          ctx.fillRect(rack.x + 24, by + 2, 2, 2);
          ctx.fillStyle = led3;
          ctx.fillRect(rack.x + 28, by + 2, 2, 2);
        }

        // Top Illuminated Server Name Label
        ctx.fillStyle = '#021e0e';
        ctx.fillRect(rack.x + 4, rack.y + 2, rack.w - 8, 4);
        ctx.fillStyle = '#00f59b';
        ctx.font = 'bold 4px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(rack.name, rack.x + rack.w / 2, rack.y + 5.5);
      });

      // 2. Overhead Metallic Cable Tray across Server Racks (y = 16)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(848, 16, 176, 5);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(848, 16, 176, 5);
      // Glowing Cyan & Emerald Fiber Optic Network Bundles
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(850, 17, 172, 1.5);
      ctx.fillStyle = '#00f59b';
      ctx.fillRect(850, 19, 172, 1.5);

      // 3. Massive SOC Cyber Threat Map Wall Display (x = 886, y = 84, w = 114, h = 46)
      const tmW = 114;
      const tmH = 46;
      const tmX = 886;
      const tmY = 84;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(tmX + 3, tmY + 3, tmW, tmH);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(tmX, tmY, tmW, tmH);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1;
      ctx.strokeRect(tmX, tmY, tmW, tmH);

      // Dark Matrix Screen
      ctx.fillStyle = '#021e0e';
      ctx.fillRect(tmX + 2, tmY + 2, tmW - 4, tmH - 4);

      // Vector Continents (Emerald glowing pixel shapes)
      ctx.fillStyle = 'rgba(34, 197, 94, 0.35)';
      ctx.fillRect(tmX + 10, tmY + 12, 22, 12); // America
      ctx.fillRect(tmX + 16, tmY + 26, 14, 12);
      ctx.fillRect(tmX + 44, tmY + 10, 18, 10); // Europe
      ctx.fillRect(tmX + 46, tmY + 22, 16, 14); // Africa
      ctx.fillRect(tmX + 68, tmY + 8, 30, 16);  // Asia
      ctx.fillRect(tmX + 80, tmY + 28, 18, 10); // Oceania

      // Red Attack Vector Arc Lines & Shield Defense Node
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(tmX + 22, tmY + 18);
      ctx.lineTo(tmX + 54, tmY + 22);
      ctx.lineTo(tmX + 78, tmY + 18);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash

      // Target Enterprise Shield Node at center
      ctx.fillStyle = '#00f59b';
      ctx.beginPath();
      ctx.arc(tmX + 56, tmY + 22, 4, 0, Math.PI * 2);
      ctx.fill();

      // Top Status HUD Text
      ctx.fillStyle = '#00f59b';
      ctx.font = 'bold 5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GLOBAL SOC THREAT TELEMETRY • ACTIVE SHIELD', tmX + tmW / 2, tmY + 8);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('INTRUSIONS BLOCKED: 1,420 • UPTIME: 99.99%', tmX + tmW / 2, tmY + tmH - 4);

      // 4. Mobile Diagnostic Crash Cart (x = 850, y = 96, w = 26, h = 34)
      const ccX = 850;
      const ccY = 96;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(ccX + 2, ccY + 2, 26, 34);
      // Stainless steel frame
      ctx.fillStyle = '#475569';
      ctx.fillRect(ccX, ccY + 6, 26, 28);
      ctx.fillStyle = '#334155';
      ctx.fillRect(ccX + 2, ccY + 8, 22, 24);
      // Wheels
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ccX + 1, ccY + 34, 4, 4);
      ctx.fillRect(ccX + 21, ccY + 34, 4, 4);
      // Diagnostic Terminal CRT Screen
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ccX + 3, ccY, 20, 16);
      ctx.fillStyle = '#00f59b';
      ctx.fillRect(ccX + 5, ccY + 2, 16, 12);
      ctx.fillStyle = '#021e0e';
      ctx.fillRect(ccX + 6, ccY + 4, 14, 2);
      ctx.fillRect(ccX + 6, ccY + 7, 10, 2);
      ctx.fillRect(ccX + 6, ccY + 10, 12, 2);
      // Yellow caution diagnostic cable to Rack 1
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ccX + 12, ccY);
      ctx.lineTo(868, 70);
      ctx.stroke();

      // 5. Zone 6: High-Tech Cyber Security & Server Vault (Alex Fullstack + Zane Cybersec Together!)
      // A. Alex's Lead Fullstack Developer Station (x = 852, y = 176, w = 70, h = 48)
      const adX = 852;
      const adY = 176;
      const adW = 70;
      const adH = 48;

      // Desk Shadow & Surface
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(adX + 3, adY + 5, adW, adH);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(adX, adY, adW, adH);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(adX + 2, adY + 2, adW - 4, adH - 6);
      ctx.fillStyle = '#431407'; // Deep warm orange desk mat
      ctx.fillRect(adX + 8, adY + 8, adW - 16, adH - 16);
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 1;
      ctx.strokeRect(adX + 8, adY + 8, adW - 16, adH - 16);

      // Herman Miller Ergonomic Aeron Chair behind Alex's desk (Facing up)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(adX + adW / 2 - 12, adY + adH + 14, 24, 3);
      ctx.fillRect(adX + adW / 2 - 14, adY + adH + 15, 3, 3);
      ctx.fillRect(adX + adW / 2 + 11, adY + adH + 15, 3, 3);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(adX + adW / 2 - 10, adY + adH + 2, 20, 12);
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 1;
      ctx.strokeRect(adX + adW / 2 - 8, adY + adH + 4, 16, 8);

      // Alex's Legit Liquid-Cooled Fullstack Battle-Station Tower (Neon Orange/Violet RGB)
      drawLegitPCTower2D(ctx, adX + adW - 19, adY + 6, 18, 38, frame, 'orange');

      // Alex's Open Space Gray Titanium Blade Laptop on Left Desk Corner
      const alxLap = LAPTOP_STYLES_2D.alex;
      const alX = adX + 6;
      const alY = adY + 22;
      ctx.fillStyle = alxLap.baseColor;
      ctx.fillRect(alX, alY, 16, 9);
      ctx.fillStyle = alxLap.kbColor;
      ctx.fillRect(alX + 1, alY + 1, 14, 5);
      ctx.fillStyle = alxLap.trackpadColor;
      ctx.fillRect(alX + 5, alY + 6, 5, 2);
      // Upright lid facing Alex
      ctx.fillStyle = alxLap.lidColor;
      ctx.fillRect(alX, alY - 7, 16, 8);
      ctx.fillStyle = alxLap.screenBg;
      ctx.fillRect(alX + 1, alY - 6, 14, 6);
      ctx.fillStyle = alxLap.logoColor;
      ctx.fillRect(alX + 7, alY - 4, 2, 2); // Glowing Blade Logo
      ctx.fillStyle = '#f97316';
      ctx.fillRect(alX + 2, alY - 5, 8, 1);
      ctx.fillRect(alX + 2, alY - 3, 10, 1);

      // Alex's Dual Monitors (VS Code Fullstack IDE + Active Streaming Server Terminal)
      // Monitor 1: Synthwave VS Code IDE (w = 26, h = 18)
      const am1X = adX + 8;
      const am1Y = adY + 2;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(am1X - 1, am1Y - 1, 28, 18);
      ctx.fillStyle = '#111827';
      ctx.fillRect(am1X, am1Y, 26, 16);
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1;
      ctx.strokeRect(am1X, am1Y, 26, 16);

      // VS Code Syntax Highlighted Code Lines
      ctx.fillStyle = '#f43f5e'; ctx.fillRect(am1X + 2, am1Y + 2, 8, 2);  // import / keyword
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(am1X + 11, am1Y + 2, 8, 2); // module name
      ctx.fillStyle = '#c084fc'; ctx.fillRect(am1X + 4, am1Y + 5, 10, 2); // function async
      ctx.fillStyle = '#22c55e'; ctx.fillRect(am1X + 4, am1Y + 8, 14, 2); // stream response
      ctx.fillStyle = '#fbbf24'; ctx.fillRect(am1X + 6, am1Y + 11, 8, 2); // return json
      // Active Blinking Cursor on current code line
      if (frame % 24 < 12) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(am1X + 15, am1Y + 11, 2, 2);
      }
      // Right code minimap bar
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(am1X + 22, am1Y + 2, 3, 12);

      // Monitor 2: Live Server Cluster Logs & Express/Next.js Port 3000
      const am2X = adX + 36;
      const am2Y = adY + 2;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(am2X - 1, am2Y - 1, 24, 18);
      ctx.fillStyle = '#090d16';
      ctx.fillRect(am2X, am2Y, 22, 16);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1;
      ctx.strokeRect(am2X, am2Y, 22, 16);

      // Streaming Server HTTP Log Lines
      const logScroll = (frame * 0.4) % 6;
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(am2X + 2, am2Y + 2, 14, 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(am2X + 2, am2Y + 5, 16, 2);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(am2X + 2, am2Y + 8, 12, 2);
      // Green "PORT 3000 READY" pill badge
      ctx.fillStyle = '#052e16';
      ctx.fillRect(am2X + 2, am2Y + 11, 18, 4);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(am2X + 3, am2Y + 12, 3, 2);
      ctx.fillStyle = '#86efac';
      ctx.fillRect(am2X + 7, am2Y + 12, 11, 2);

      // Alex's RGB Mechanical Keyboard & Mouse
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(adX + 22, adY + 26, 22, 8);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(adX + 23, adY + 28, 20, 2);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(adX + 46, adY + 27, 5, 7);

      // B. Central 100GbE Fiber Switch & Patch Bridge Console (x = 924, y = 176, w = 12, h = 48)
      const fbX = 924;
      const fbY = 176;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(fbX, fbY, 12, 48);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(fbX + 1, fbY + 2, 10, 44);
      // Pulsing fiber switch LEDs
      ctx.fillStyle = '#22c55e'; ctx.fillRect(fbX + 3, fbY + 8, 6, 2);
      ctx.fillStyle = '#00f0ff'; ctx.fillRect(fbX + 3, fbY + 14, 6, 2);
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(fbX + 3, fbY + 20, 6, 2);
      ctx.fillStyle = '#00f0ff'; ctx.fillRect(fbX + 3, fbY + 26, 6, 2);

      // Glowing fiber optic conduit running to top racks
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(fbX + 6, fbY);
      ctx.lineTo(fbX + 6, 68);
      ctx.stroke();

      // C. Zane's Cyber Security SOC Command Station (x = 938, y = 176, w = 76, h = 48)
      const zdX = 938;
      const zdY = 176;
      const zdW = 76;
      const zdH = 48;

      // Desk Shadow & Surface
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(zdX + 3, zdY + 5, zdW, zdH);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(zdX, zdY, zdW, zdH);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(zdX + 2, zdY + 2, zdW - 4, zdH - 6);
      ctx.fillStyle = '#052e16'; // Deep emerald desk mat
      ctx.fillRect(zdX + 8, zdY + 8, zdW - 16, zdH - 16);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1;
      ctx.strokeRect(zdX + 8, zdY + 8, zdW - 16, zdH - 16);

      // Zane's Legit Liquid-Cooled SOC Cyber Fortress PC Tower (Stealth Black / Emerald RGB)
      drawLegitPCTower2D(ctx, zdX + zdW - 19, zdY + 6, 18, 38, frame, 'emerald');

      // Herman Miller Ergonomic Aeron Chair behind desk (Facing up)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(zdX + zdW / 2 - 12, zdY + zdH + 14, 24, 3);
      ctx.fillRect(zdX + zdW / 2 - 14, zdY + zdH + 15, 3, 3);
      ctx.fillRect(zdX + zdW / 2 + 11, zdY + zdH + 15, 3, 3);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(zdX + zdW / 2 - 10, zdY + zdH + 2, 20, 12);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1;
      ctx.strokeRect(zdX + zdW / 2 - 8, zdY + zdH + 4, 16, 8);

      // Triple Curved Cyber Security Display Array
      // Center Display: 34" Ultrawide IDS Radar with Range Rings & Blinking Threat Blips
      const cDispX = zdX + zdW / 2 - 17;
      const cDispY = zdY + 2;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cDispX - 1, cDispY - 1, 34, 16);
      ctx.fillStyle = '#021e0e';
      ctx.fillRect(cDispX, cDispY, 32, 14);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1;
      ctx.strokeRect(cDispX, cDispY, 32, 14);

      // Concentric Radar Rings
      ctx.strokeStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(cDispX + 16, cDispY + 7, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#166534';
      ctx.beginPath();
      ctx.arc(cDispX + 16, cDispY + 7, 3, 0, Math.PI * 2);
      ctx.stroke();

      // Sweeping radar scan line animated with frame
      const scanAngle = frame * 0.08;
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cDispX + 16, cDispY + 7);
      ctx.lineTo(cDispX + 16 + Math.cos(scanAngle) * 6, cDispY + 7 + Math.sin(scanAngle) * 6);
      ctx.stroke();

      // Blinking Red Threat Intercept Blips
      if (frame % 36 < 20) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(cDispX + 21, cDispY + 4, 2, 2);
        ctx.fillRect(cDispX + 11, cDispY + 9, 2, 2);
      }

      // Left Display: Cascading Matrix Waterfall Code Stream (w = 11, h = 18)
      const lDispX = zdX + 6;
      const lDispY = zdY + 1;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(lDispX - 1, lDispY - 1, 13, 18);
      ctx.fillStyle = '#021e0e';
      ctx.fillRect(lDispX, lDispY, 11, 16);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1;
      ctx.strokeRect(lDispX, lDispY, 11, 16);

      // Animated cascading matrix glyphs
      const mOffset = (frame * 0.5) % 8;
      ctx.fillStyle = '#4ade80'; ctx.fillRect(lDispX + 2, lDispY + 2 + mOffset, 2, 2);
      ctx.fillStyle = '#22c55e'; ctx.fillRect(lDispX + 5, lDispY + 6 - mOffset / 2, 2, 2);
      ctx.fillStyle = '#86efac'; ctx.fillRect(lDispX + 7, lDispY + 10 - mOffset, 2, 2);

      // Right Display: Server Cluster Telemetry & DDoS Mitigation (w = 12, h = 18)
      const rDispX = zdX + 44;
      const rDispY = zdY + 1;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(rDispX - 1, rDispY - 1, 14, 18);
      ctx.fillStyle = '#083344';
      ctx.fillRect(rDispX, rDispY, 12, 16);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(rDispX, rDispY, 12, 16);
      // DDoS Throughput packet bars fluctuating
      const ddBar1 = 4 + Math.floor((Math.sin(frame * 0.08) + 1) * 3);
      ctx.fillStyle = '#00f0ff'; ctx.fillRect(rDispX + 2, rDispY + 3, ddBar1, 2);
      const ddBar2 = 3 + Math.floor((Math.cos(frame * 0.07) + 1) * 3);
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(rDispX + 2, rDispY + 7, ddBar2, 2);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(rDispX + 2, rDispY + 11, 7, 2);

      // Open Lenovo ThinkPad X1 Carbon Stealth Cyber Laptop on Desk
      const znLap = LAPTOP_STYLES_2D.zane;
      const zLapX = zdX + 6;
      const zLapY = zdY + 22;
      ctx.fillStyle = znLap.baseColor;
      ctx.fillRect(zLapX, zLapY, 18, 10);
      ctx.fillStyle = znLap.kbColor;
      ctx.fillRect(zLapX + 1, zLapY + 1, 16, 5);
      // Iconic Red TrackPoint Nub in center of keyboard!
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(zLapX + 8, zLapY + 3, 2, 2);
      // Trackpad
      ctx.fillStyle = znLap.trackpadColor;
      ctx.fillRect(zLapX + 6, zLapY + 7, 6, 2);
      // Upright lid facing Zane
      ctx.fillStyle = znLap.lidColor;
      ctx.fillRect(zLapX, zLapY - 8, 18, 9);
      ctx.fillStyle = znLap.screenBg;
      ctx.fillRect(zLapX + 1, zLapY - 7, 16, 7);
      // ThinkPad diagonal red LED logo on top corner
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(zLapX + 14, zLapY - 6, 2, 2);
      // Live green matrix code stream on ThinkPad screen
      ctx.fillStyle = '#00f59b';
      ctx.fillRect(zLapX + 3, zLapY - 5, 10, 1);
      ctx.fillRect(zLapX + 3, zLapY - 3, 12, 1);

      // RGB Cyber Mechanical Keyboard & Mouse
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(zdX + 26, zdY + 26, 22, 8);
      ctx.fillStyle = '#00f59b';
      ctx.fillRect(zdX + 28, zdY + 28, 18, 2);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(zdX + 50, zdY + 27, 5, 7);

      // Hardware YubiKey Security Dongle on Desk
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(zdX + 32, zdY + 36, 5, 3);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(zdX + 39, zdY + 36, 2, 3);

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

        // --------------------------------------------------------------------
        // AUTHENTIC 16-BIT RPG SPRITE ENGINE (4 Directions, 3-Frame Stride Cycles)
        // --------------------------------------------------------------------
        const palette = CHARACTER_SPRITE_PALETTES[char.id] || {
          hairBase: char.hairColor || '#451a03',
          hairLight: '#8d532a',
          hairDark: '#271406',
          skinBase: '#ffdfba',
          skinDark: '#e2b892',
          eyeColor: '#1e293b',
          shirtBase: char.shirtColor || '#2563eb',
          shirtLight: '#60a5fa',
          shirtDark: '#1d4ed8',
          pantsBase: '#1e293b',
          pantsDark: '#0f172a',
          shoeColor: '#9a3412',
          soleColor: '#ffffff',
        };

        // 4-Phase Walk Cycle (0: Left Step -> 1: Neutral Standing -> 2: Right Step -> 1: Neutral Standing)
        const rawStep = Math.floor((frame * 0.22) % 4);
        const walkStep = char.isWalking ? (rawStep === 3 ? 1 : rawStep) : 1;
        const stepBob = char.isWalking && (walkStep === 0 || walkStep === 2) ? 1 : 0;
        const sY = drawY + stepBob;

        // Grounding Drop Shadow (Matching 16-bit RPG sprite reference - only when standing/walking!)
        if (!char.isSeated) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
          ctx.beginPath();
          ctx.ellipse(drawX, drawY + 17, 9, 3.5, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Direction Handling: 'left' uses horizontal mirror of 'right' profile
        const isFacingLeft = char.facing === 'left';
        const facingDir = isFacingLeft ? 'right' : (char.facing || 'down');

        if (isFacingLeft) {
          ctx.save();
          ctx.translate(drawX, 0);
          ctx.scale(-1, 1);
          ctx.translate(-drawX, 0);
        }

        if (facingDir === 'up') {
          // ==================================================================
          // DIRECTION: UP (Full Back View - Row 1 of Reference Sheet)
          // ==================================================================
          // 1. Legs & Pants (Back View)
          if (char.isWalking) {
            if (walkStep === 0) {
              // Left leg forward / raised, right leg grounded back
              ctx.fillStyle = palette.pantsBase;
              ctx.fillRect(drawX - 5, sY + 7, 4, 8);
              ctx.fillRect(drawX + 1, sY + 8, 4, 8);
              ctx.fillStyle = palette.pantsDark;
              ctx.fillRect(drawX - 1, sY + 7, 2, 7);
              // Shoes
              ctx.fillStyle = palette.shoeColor;
              ctx.fillRect(drawX - 6, sY + 14, 5, 2);
              ctx.fillRect(drawX + 1, sY + 16, 5, 2);
              ctx.fillStyle = palette.soleColor;
              ctx.fillRect(drawX - 6, sY + 16, 5, 1);
              ctx.fillRect(drawX + 1, sY + 18, 5, 1);
            } else if (walkStep === 2) {
              // Right leg forward / raised, left leg grounded back
              ctx.fillStyle = palette.pantsBase;
              ctx.fillRect(drawX - 5, sY + 8, 4, 8);
              ctx.fillRect(drawX + 1, sY + 7, 4, 8);
              ctx.fillStyle = palette.pantsDark;
              ctx.fillRect(drawX - 1, sY + 7, 2, 7);
              // Shoes
              ctx.fillStyle = palette.shoeColor;
              ctx.fillRect(drawX - 6, sY + 16, 5, 2);
              ctx.fillRect(drawX + 1, sY + 14, 5, 2);
              ctx.fillStyle = palette.soleColor;
              ctx.fillRect(drawX - 6, sY + 18, 5, 1);
              ctx.fillRect(drawX + 1, sY + 16, 5, 1);
            } else {
              // Neutral back standing
              ctx.fillStyle = palette.pantsBase;
              ctx.fillRect(drawX - 5, sY + 8, 4, 8);
              ctx.fillRect(drawX + 1, sY + 8, 4, 8);
              ctx.fillStyle = palette.pantsDark;
              ctx.fillRect(drawX - 1, sY + 8, 2, 7);
              ctx.fillStyle = palette.shoeColor;
              ctx.fillRect(drawX - 6, sY + 16, 5, 2);
              ctx.fillRect(drawX + 1, sY + 16, 5, 2);
              ctx.fillStyle = palette.soleColor;
              ctx.fillRect(drawX - 6, sY + 18, 5, 1);
              ctx.fillRect(drawX + 1, sY + 18, 5, 1);
            }
          } else if (!char.isSeated) {
            // Standing idle legs & shoes firmly planted
            ctx.fillStyle = palette.pantsBase;
            ctx.fillRect(drawX - 5, sY + 8, 4, 8);
            ctx.fillRect(drawX + 1, sY + 8, 4, 8);
            ctx.fillStyle = palette.pantsDark;
            ctx.fillRect(drawX - 1, sY + 8, 2, 7);
            ctx.fillStyle = palette.shoeColor;
            ctx.fillRect(drawX - 6, sY + 16, 5, 2);
            ctx.fillRect(drawX + 1, sY + 16, 5, 2);
            ctx.fillStyle = palette.soleColor;
            ctx.fillRect(drawX - 6, sY + 18, 5, 1);
            ctx.fillRect(drawX + 1, sY + 18, 5, 1);
          } else {
            // Seated facing up (e.g. at desk workstation or bottom lounge booth)
            // Cushion contact grounding shadow
            ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
            ctx.beginPath();
            ctx.ellipse(drawX, sY + 9, 8, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            // Firmly grounded pants base resting on seat
            ctx.fillStyle = palette.pantsBase;
            ctx.fillRect(drawX - 5, sY + 7, 10, 4);
            ctx.fillStyle = palette.pantsDark;
            ctx.fillRect(drawX - 5, sY + 9, 10, 2);
            // Tucked shoe heels at cushion base
            ctx.fillStyle = palette.shoeColor;
            ctx.fillRect(drawX - 5, sY + 10, 3, 2);
            ctx.fillRect(drawX + 2, sY + 10, 3, 2);
          }

          // 2. Torso & Arms (Back View)
          ctx.fillStyle = palette.shirtBase;
          ctx.fillRect(drawX - 6, sY + 1, 12, 8);
          // Shoulder highlight band
          ctx.fillStyle = palette.shirtLight;
          ctx.fillRect(drawX - 6, sY + 1, 12, 2);
          // Lower hem shadow
          ctx.fillStyle = palette.shirtDark;
          ctx.fillRect(drawX - 6, sY + 8, 12, 1);
          // Back collar opening hint
          ctx.fillStyle = palette.skinDark;
          ctx.fillRect(drawX - 2, sY, 4, 1);

          // Arms at sides swinging in counter-rhythm
          const armSwing = char.isWalking ? (walkStep === 0 ? 1 : walkStep === 2 ? -1 : 0) : 0;
          ctx.fillStyle = palette.shirtBase;
          ctx.fillRect(drawX - 8, sY + 2 + armSwing, 2, 5);
          ctx.fillRect(drawX + 6, sY + 2 - armSwing, 2, 5);
          ctx.fillStyle = palette.skinBase;
          ctx.fillRect(drawX - 8, sY + 7 + armSwing, 2, 2);
          ctx.fillRect(drawX + 6, sY + 7 - armSwing, 2, 2);

          // 3. Volumetric Head & Hair (Full Back of Head with Highlights)
          ctx.fillStyle = palette.hairBase;
          ctx.fillRect(drawX - 6, sY - 12, 12, 4); // Crown top
          ctx.fillStyle = palette.hairLight;
          ctx.fillRect(drawX - 5, sY - 12, 10, 2); // Crown light band
          ctx.fillStyle = palette.hairBase;
          ctx.fillRect(drawX - 7, sY - 9, 14, 8); // Full back dome
          ctx.fillStyle = palette.hairDark;
          ctx.fillRect(drawX - 5, sY - 1, 10, 2); // Nape shadow

          // Eah Special: Cascading Silk Hair Down Back & Rose Clip
          if (char.id === 'eah') {
            ctx.fillStyle = palette.hairBase;
            ctx.fillRect(drawX - 6, sY - 1, 12, 11);
            ctx.fillStyle = palette.hairLight;
            ctx.fillRect(drawX - 4, sY + 2, 8, 2);
            // Rose clip
            ctx.fillStyle = '#f43f5e';
            ctx.fillRect(drawX + 3, sY - 11, 4, 3);
            ctx.fillStyle = '#fff1f2';
            ctx.fillRect(drawX + 4, sY - 10, 2, 1);
          }

        } else if (facingDir === 'right') {
          // ==================================================================
          // DIRECTION: RIGHT (Side Profile - Rows 2 & 4 of Reference Sheet)
          // ==================================================================
          // 1. Legs & Shoes (Side Profile Stride)
          if (char.isWalking) {
            if (walkStep === 0) {
              // Stride: Front leg forward, rear leg trailing back
              ctx.fillStyle = palette.pantsBase;
              ctx.fillRect(drawX, sY + 8, 4, 8);
              ctx.fillRect(drawX - 5, sY + 7, 4, 7);
              // Shoes
              ctx.fillStyle = palette.shoeColor;
              ctx.fillRect(drawX, sY + 16, 6, 2);
              ctx.fillRect(drawX - 5, sY + 14, 5, 2);
              ctx.fillStyle = palette.soleColor;
              ctx.fillRect(drawX, sY + 18, 6, 1);
              ctx.fillRect(drawX - 5, sY + 16, 5, 1);
            } else if (walkStep === 2) {
              // Stride reversed
              ctx.fillStyle = palette.pantsBase;
              ctx.fillRect(drawX, sY + 7, 4, 7);
              ctx.fillRect(drawX - 5, sY + 8, 4, 8);
              // Shoes
              ctx.fillStyle = palette.shoeColor;
              ctx.fillRect(drawX, sY + 14, 6, 2);
              ctx.fillRect(drawX - 5, sY + 16, 5, 2);
              ctx.fillStyle = palette.soleColor;
              ctx.fillRect(drawX, sY + 16, 6, 1);
              ctx.fillRect(drawX - 5, sY + 18, 5, 1);
            } else {
              // Neutral side standing
              ctx.fillStyle = palette.pantsBase;
              ctx.fillRect(drawX - 2, sY + 8, 5, 8);
              ctx.fillStyle = palette.shoeColor;
              ctx.fillRect(drawX - 2, sY + 16, 6, 2);
              ctx.fillStyle = palette.soleColor;
              ctx.fillRect(drawX - 2, sY + 18, 6, 1);
            }
          } else if (!char.isSeated) {
            // Standing idle side profile
            ctx.fillStyle = palette.pantsBase;
            ctx.fillRect(drawX - 2, sY + 8, 5, 8);
            ctx.fillStyle = palette.shoeColor;
            ctx.fillRect(drawX - 2, sY + 16, 6, 2);
            ctx.fillStyle = palette.soleColor;
            ctx.fillRect(drawX - 2, sY + 18, 6, 1);
          } else {
            // Seated profile (e.g. espresso barstool / side sofa)
            // Cushion/seat contact grounding shadow
            ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
            ctx.beginPath();
            ctx.ellipse(drawX + 1, sY + 9, 6, 2.5, 0, 0, Math.PI * 2);
            ctx.fill();
            // Thigh bent forward horizontally on seat
            ctx.fillStyle = palette.pantsBase;
            ctx.fillRect(drawX - 2, sY + 8, 6, 4);
            ctx.fillStyle = palette.pantsDark;
            ctx.fillRect(drawX - 2, sY + 10, 6, 2);
            // Lower leg dropping down vertically
            ctx.fillStyle = palette.pantsBase;
            ctx.fillRect(drawX + 2, sY + 11, 3, 4);
            // Shoe planted on footrest / floor
            ctx.fillStyle = palette.shoeColor;
            ctx.fillRect(drawX + 2, sY + 15, 5, 2);
            ctx.fillStyle = palette.soleColor;
            ctx.fillRect(drawX + 2, sY + 16, 5, 1);
          }

          // 2. Torso & Arm (Side Profile)
          ctx.fillStyle = palette.shirtBase;
          ctx.fillRect(drawX - 4, sY + 1, 8, 8);
          ctx.fillStyle = palette.shirtLight;
          ctx.fillRect(drawX - 4, sY + 1, 7, 2);
          ctx.fillStyle = palette.shirtDark;
          ctx.fillRect(drawX - 4, sY + 8, 8, 1);

          // Side arm swinging
          const sideArmShift = char.isWalking ? (walkStep === 0 ? 1 : walkStep === 2 ? -1 : 0) : 0;
          ctx.fillStyle = palette.shirtBase;
          ctx.fillRect(drawX - 2 + sideArmShift, sY + 2, 3, 5);
          ctx.fillStyle = palette.skinBase;
          ctx.fillRect(drawX - 1 + sideArmShift, sY + 7, 2, 2);

          // 3. Head & Face (Side Profile Silhouette with Nose & Anime Eye)
          ctx.fillStyle = palette.skinBase;
          ctx.fillRect(drawX - 4, sY - 8, 8, 7); // Base skull
          ctx.fillRect(drawX + 4, sY - 6, 2, 2); // 16-bit Nose tip protrusion!
          ctx.fillRect(drawX + 2, sY - 3, 3, 2); // Chin contour
          ctx.fillStyle = palette.skinDark;
          ctx.fillRect(drawX - 2, sY - 5, 2, 3); // Ear

          // Single Expressive Profile Anime Eye
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(drawX + 1, sY - 5, 3, 1); // Upper lash
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(drawX + 1, sY - 4, 3, 2); // Sclera
          ctx.fillStyle = palette.eyeColor;
          ctx.fillRect(drawX + 2, sY - 4, 2, 2); // Iris
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(drawX + 2, sY - 4, 1, 1); // Sparkle highlight!

          // Side Blush
          if (palette.blushColor) {
            ctx.fillStyle = palette.blushColor;
            ctx.fillRect(drawX + 1, sY - 2, 3, 1);
          }

          // Side Hair Volume & Bangs
          ctx.fillStyle = palette.hairBase;
          ctx.fillRect(drawX - 6, sY - 12, 10, 4); // Crown top
          ctx.fillStyle = palette.hairLight;
          ctx.fillRect(drawX - 5, sY - 12, 8, 2); // Crown light
          ctx.fillStyle = palette.hairBase;
          ctx.fillRect(drawX - 6, sY - 9, 4, 8); // Back of head
          ctx.fillStyle = palette.hairDark;
          ctx.fillRect(drawX - 5, sY - 2, 3, 2); // Nape
          // Bangs sweeping across forehead
          ctx.fillStyle = palette.hairBase;
          ctx.fillRect(drawX - 2, sY - 10, 5, 4);
          ctx.fillStyle = palette.hairLight;
          ctx.fillRect(drawX + 2, sY - 8, 2, 2);

          // Eah Special Hair Mane & Rose Clip
          if (char.id === 'eah') {
            ctx.fillStyle = palette.hairBase;
            ctx.fillRect(drawX - 6, sY - 3, 4, 13);
            ctx.fillStyle = palette.hairLight;
            ctx.fillRect(drawX - 5, sY, 2, 9);
            // Rose clip
            ctx.fillStyle = '#f43f5e';
            ctx.fillRect(drawX + 1, sY - 11, 4, 3);
            ctx.fillStyle = '#fff1f2';
            ctx.fillRect(drawX + 2, sY - 10, 2, 1);
          }

        } else {
          // ==================================================================
          // DIRECTION: DOWN (Front View - Row 3 of Reference Sheet)
          // ==================================================================
          // 1. Legs & Shoes (Front View Stride)
          if (char.isWalking) {
            if (walkStep === 0) {
              // Left leg forward, right leg back
              ctx.fillStyle = palette.pantsBase;
              ctx.fillRect(drawX - 5, sY + 8, 4, 8);
              ctx.fillRect(drawX + 1, sY + 7, 4, 7);
              ctx.fillStyle = palette.pantsDark;
              ctx.fillRect(drawX - 1, sY + 7, 2, 7);
              // Shoes
              ctx.fillStyle = palette.shoeColor;
              ctx.fillRect(drawX - 6, sY + 16, 5, 2);
              ctx.fillRect(drawX + 1, sY + 14, 5, 2);
              ctx.fillStyle = palette.soleColor;
              ctx.fillRect(drawX - 6, sY + 18, 5, 1);
              ctx.fillRect(drawX + 1, sY + 16, 5, 1);
            } else if (walkStep === 2) {
              // Right leg forward, left leg back
              ctx.fillStyle = palette.pantsBase;
              ctx.fillRect(drawX - 5, sY + 7, 4, 7);
              ctx.fillRect(drawX + 1, sY + 8, 4, 8);
              ctx.fillStyle = palette.pantsDark;
              ctx.fillRect(drawX - 1, sY + 7, 2, 7);
              // Shoes
              ctx.fillStyle = palette.shoeColor;
              ctx.fillRect(drawX - 6, sY + 14, 5, 2);
              ctx.fillRect(drawX + 1, sY + 16, 5, 2);
              ctx.fillStyle = palette.soleColor;
              ctx.fillRect(drawX - 6, sY + 16, 5, 1);
              ctx.fillRect(drawX + 1, sY + 18, 5, 1);
            } else {
              // Neutral front standing
              ctx.fillStyle = palette.pantsBase;
              ctx.fillRect(drawX - 5, sY + 8, 4, 8);
              ctx.fillRect(drawX + 1, sY + 8, 4, 8);
              ctx.fillStyle = palette.pantsDark;
              ctx.fillRect(drawX - 1, sY + 8, 2, 7);
              ctx.fillStyle = palette.shoeColor;
              ctx.fillRect(drawX - 6, sY + 16, 5, 2);
              ctx.fillRect(drawX + 1, sY + 16, 5, 2);
              ctx.fillStyle = palette.soleColor;
              ctx.fillRect(drawX - 6, sY + 18, 5, 1);
              ctx.fillRect(drawX + 1, sY + 18, 5, 1);
            }
          } else if (!char.isSeated) {
            // Standing idle front view
            ctx.fillStyle = palette.pantsBase;
            ctx.fillRect(drawX - 5, sY + 8, 4, 8);
            ctx.fillRect(drawX + 1, sY + 8, 4, 8);
            ctx.fillStyle = palette.pantsDark;
            ctx.fillRect(drawX - 1, sY + 8, 2, 7);
            ctx.fillStyle = palette.shoeColor;
            ctx.fillRect(drawX - 6, sY + 16, 5, 2);
            ctx.fillRect(drawX + 1, sY + 16, 5, 2);
            ctx.fillStyle = palette.soleColor;
            ctx.fillRect(drawX - 6, sY + 18, 5, 1);
            ctx.fillRect(drawX + 1, sY + 18, 5, 1);
          } else {
            // Seated facing down (front view, e.g. top sofa booth)
            // Cushion contact grounding shadow
            ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
            ctx.beginPath();
            ctx.ellipse(drawX, sY + 9, 8, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            // Folded thighs resting comfortably on cushion
            ctx.fillStyle = palette.pantsBase;
            ctx.fillRect(drawX - 5, sY + 8, 4, 4);
            ctx.fillRect(drawX + 1, sY + 8, 4, 4);
            ctx.fillStyle = palette.pantsDark;
            ctx.fillRect(drawX - 1, sY + 8, 2, 4);
            // Lower legs dropping down over cushion edge
            ctx.fillStyle = palette.pantsDark;
            ctx.fillRect(drawX - 5, sY + 11, 4, 3);
            ctx.fillRect(drawX + 1, sY + 11, 4, 3);
            // Shoes resting naturally on floor
            ctx.fillStyle = palette.shoeColor;
            ctx.fillRect(drawX - 5, sY + 14, 4, 2);
            ctx.fillRect(drawX + 1, sY + 14, 4, 2);
            ctx.fillStyle = palette.soleColor;
            ctx.fillRect(drawX - 5, sY + 15, 4, 1);
            ctx.fillRect(drawX + 1, sY + 15, 4, 1);
          }

          // 2. Torso & Arms (Front View)
          ctx.fillStyle = palette.shirtBase;
          ctx.fillRect(drawX - 6, sY + 1, 12, 8);
          // Shoulder highlight band
          ctx.fillStyle = palette.shirtLight;
          ctx.fillRect(drawX - 6, sY + 1, 12, 2);
          // Lower hem shadow
          ctx.fillStyle = palette.shirtDark;
          ctx.fillRect(drawX - 6, sY + 8, 12, 1);
          // Front collar notch
          ctx.fillStyle = palette.skinBase;
          ctx.fillRect(drawX - 2, sY + 1, 4, 2);

          // Arms at sides swinging in counter-rhythm
          const armSwing = char.isWalking ? (walkStep === 0 ? 1 : walkStep === 2 ? -1 : 0) : 0;
          ctx.fillStyle = palette.shirtBase;
          ctx.fillRect(drawX - 8, sY + 2 + armSwing, 2, 5);
          ctx.fillRect(drawX + 6, sY + 2 - armSwing, 2, 5);
          ctx.fillStyle = palette.skinBase;
          ctx.fillRect(drawX - 8, sY + 7 + armSwing, 2, 2);
          ctx.fillRect(drawX + 6, sY + 7 - armSwing, 2, 2);

          // 3. Head & Face (Front View - Expressive Anime Eyes)
          ctx.fillStyle = palette.skinBase;
          ctx.fillRect(drawX - 5, sY - 8, 10, 8); // Face area
          ctx.fillRect(drawX - 6, sY - 6, 12, 5); // Cheeks
          ctx.fillStyle = palette.skinDark;
          ctx.fillRect(drawX - 7, sY - 5, 1, 3); // Left ear
          ctx.fillRect(drawX + 6, sY - 5, 1, 3); // Right ear

          // Left Expressive Eye
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(drawX - 4, sY - 4, 3, 1); // Lash
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(drawX - 4, sY - 3, 3, 2); // Sclera
          ctx.fillStyle = palette.eyeColor;
          ctx.fillRect(drawX - 4, sY - 3, 2, 2); // Iris
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(drawX - 4, sY - 2, 1, 1); // Pupil
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(drawX - 3, sY - 3, 1, 1); // Sparkle highlight

          // Right Expressive Eye
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(drawX + 1, sY - 4, 3, 1); // Lash
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(drawX + 1, sY - 3, 3, 2); // Sclera
          ctx.fillStyle = palette.eyeColor;
          ctx.fillRect(drawX + 2, sY - 3, 2, 2); // Iris
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(drawX + 3, sY - 2, 1, 1); // Pupil
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(drawX + 2, sY - 3, 1, 1); // Sparkle highlight

          // Cute Cheek Blush
          if (palette.blushColor) {
            ctx.fillStyle = palette.blushColor;
            ctx.fillRect(drawX - 5, sY - 1, 2, 1);
            ctx.fillRect(drawX + 3, sY - 1, 2, 1);
          }

          // Hair (Crown, Sides, and Bangs)
          ctx.fillStyle = palette.hairBase;
          ctx.fillRect(drawX - 6, sY - 12, 12, 4); // Top crown
          ctx.fillStyle = palette.hairLight;
          ctx.fillRect(drawX - 5, sY - 12, 10, 2); // Crown light
          ctx.fillStyle = palette.hairBase;
          ctx.fillRect(drawX - 7, sY - 10, 2, 5); // Left temple
          ctx.fillRect(drawX + 5, sY - 10, 2, 5); // Right temple
          ctx.fillRect(drawX - 5, sY - 9, 10, 4); // Forehead bangs
          // Center bangs notch exposing forehead
          ctx.fillStyle = palette.skinBase;
          ctx.fillRect(drawX - 1, sY - 6, 2, 1);

          // Eah Special: Flowing Twin Hair Locks & Rose Hairclip
          if (char.id === 'eah') {
            ctx.fillStyle = palette.hairBase;
            ctx.fillRect(drawX - 8, sY - 4, 3, 14); // Left flowing lock
            ctx.fillRect(drawX + 5, sY - 4, 3, 14); // Right flowing lock
            ctx.fillStyle = palette.hairLight;
            ctx.fillRect(drawX - 7, sY - 2, 1, 11);
            ctx.fillRect(drawX + 6, sY - 2, 1, 11);
            // Rose clip
            ctx.fillStyle = '#f43f5e';
            ctx.fillRect(drawX + 3, sY - 11, 4, 3);
            ctx.fillStyle = '#fff1f2';
            ctx.fillRect(drawX + 4, sY - 10, 2, 1);
            // Extra blush glow
            ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
            ctx.fillRect(drawX - 4, sY - 1, 3, 2);
            ctx.fillRect(drawX + 1, sY - 1, 3, 2);
          }
        }

        // Character Signature Highlights (Dylan Founder Pin, Alex Hoodie, Zane Undercut)
        if (char.id === 'dylan') {
          // Executive hair styling accent
          ctx.fillStyle = palette.hairLight;
          ctx.fillRect(drawX - 2, sY - 13, 5, 2);
          // Gold CEO pin on lapel
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(drawX - 4, sY + 3, 2, 2);
        } else if (char.id === 'alex') {
          // Tech hoodie drawstrings
          ctx.fillStyle = '#fed7aa';
          ctx.fillRect(drawX - 1, sY + 4, 2, 3);
        } else if (char.id === 'zane') {
          // Tactical stealth side fade
          ctx.fillStyle = '#020617';
          ctx.fillRect(drawX - 6, sY - 6, 1, 3);
          ctx.fillRect(drawX + 5, sY - 6, 1, 3);
        }

        // Restore context if horizontally flipped for left-facing
        if (isFacingLeft) {
          ctx.restore();
        }

        // ====================================================================
        // MULTI-ACTIVITY PROCEDURAL ANIMATION SYSTEM (Kitchen, Garden, Arcade, Sofa, Drinks, Meeting, & Laptops)
        // ====================================================================
        const isAtKitchen = drawX <= 220 && drawY >= 280 && drawY <= 398 && !char.isWalking;
        const isAtGarden = drawX <= 220 && drawY > 398 && drawY <= 504 && !char.isWalking;
        const isAtArcade = drawX >= 230 && drawX <= 280 && drawY >= 310 && drawY <= 365 && !char.isWalking;
        const isAtSofa = drawX >= 270 && drawX <= 490 && drawY >= 320 && drawY <= 470 && !char.isWalking;
        const isAtWater = drawX >= 760 && drawX <= 820 && drawY >= 100 && drawY <= 150 && !char.isWalking;
        const isAtCoffee = drawX >= 230 && drawX <= 290 && drawY >= 410 && drawY <= 475 && !char.isWalking;
        const isAtWorkBench = drawX >= 390 && drawX <= 490 && drawY >= 430 && drawY <= 475 && !char.isWalking;
        const isNearBoardroomSeat = Math.hypot(char.currentX - char.seatX, char.currentY - char.seatY) < 32 && (char.seatX >= 640 && char.seatX <= 920 && char.seatY >= 330 && char.seatY <= 460);
        const isAtBoardroom = (!char.isWalking && (isNearBoardroomSeat || (drawX >= 640 && drawX <= 920 && drawY >= 330 && drawY <= 465))) || char.isMeeting;
        const isInLoungeArea = drawX > 226 && drawX <= 560 && drawY >= 280;

        if (char.id === 'eah' && (char.activity === 'eah_cooking' || (isAtKitchen && eahRoutineStepRef.current === 'cooking'))) {
          // ================================================================
          // EAH: SIZZLING SKILLET COOKING FOR DYLAN (Pan, Spatula, Steam, & Hearts)
          // ================================================================
          // Cast iron frying pan held in left hand
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(drawX - 16, drawY - 3, 14, 10);
          ctx.fillStyle = '#334155';
          ctx.fillRect(drawX - 15, drawY - 2, 12, 8);
          // Pan handle in left hand
          ctx.fillStyle = '#64748b';
          ctx.fillRect(drawX - 7, drawY + 1, 5, 3);
          ctx.fillStyle = '#ffdfba';
          ctx.fillRect(drawX - 8, drawY, 3, 4);

          // Sizzling Sunny-Side Eggs & Savory Bacon in Pan
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(drawX - 14, drawY - 1, 5, 5);
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(drawX - 13, drawY, 3, 3);
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(drawX - 12, drawY + 1, 1, 1);
          // Crispy savory bacon strip
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(drawX - 9, drawY, 5, 3);

          // Spatula in Right Hand actively flipping
          const spatFlip = Math.sin(frame * 0.45) * 3;
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(drawX + 4, drawY - 4 + spatFlip, 2, 8);
          ctx.fillRect(drawX + 2, drawY - 6 + spatFlip, 6, 3);
          ctx.fillStyle = '#ffdfba';
          ctx.fillRect(drawX + 3, drawY + 2, 4, 3);

          // Steam & Sizzle particles rising
          const sY = (frame * 0.3) % 8;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fillRect(drawX - 13, drawY - 5 - sY, 2, 2);
          ctx.fillRect(drawX - 9, drawY - 7 - sY, 2, 2);

          // Cute cooking heart sparkle floating from pan
          if (frame % 40 < 22) {
            ctx.fillStyle = '#fb7185';
            ctx.font = 'bold 8px monospace';
            ctx.fillText('🍳💕', drawX - 16, drawY - 10);
          }

        } else if (char.id === 'eah' && (char.activity === 'eah_carrying_food' || (char.isWalking && eahRoutineStepRef.current === 'deliver_food_walk'))) {
          // ================================================================
          // EAH: WALKING & CARRYING GOURMET SERVING TRAY FOR DYLAN
          // ================================================================
          // Both arms brought forward holding silver platter
          ctx.fillStyle = char.shirtColor;
          ctx.fillRect(drawX - 8, drawY + 2, 3, 5);
          ctx.fillRect(drawX + 5, drawY + 2, 3, 5);
          ctx.fillStyle = '#ffdfba';
          ctx.fillRect(drawX - 7, drawY + 6, 3, 3);
          ctx.fillRect(drawX + 4, drawY + 6, 3, 3);

          // Silver Platter / Serving Tray
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(drawX - 10, drawY + 5, 20, 4);
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(drawX - 9, drawY + 5, 18, 1);

          // Hot Gourmet Breakfast Plate
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(drawX - 5, drawY + 2, 10, 4);
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(drawX - 4, drawY + 3, 4, 2); // Golden food
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(drawX, drawY + 3, 2, 2); // Fresh herb garnish

          // Rising steam curls
          const sY = (frame * 0.25) % 6;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          ctx.fillRect(drawX - 1, drawY - 1 - sY, 2, 2);

          if (frame % 50 < 25) {
            ctx.fillStyle = '#fb7185';
            ctx.font = 'bold 7px monospace';
            ctx.fillText('🍲💕', drawX + 8, drawY - 8);
          }

        } else if (char.id === 'eah' && (char.activity === 'eah_brewing_coffee' || (isAtCoffee && eahRoutineStepRef.current === 'brewing'))) {
          // ================================================================
          // EAH: BREWING ARTISANAL ESPRESSO & HEART LATTE ART AT COFFEE BAR
          // ================================================================
          // Holding stainless steel milk steaming pitcher in left hand
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(drawX - 9, drawY + 2, 5, 6);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(drawX - 8, drawY + 1, 3, 2); // Foamy white milk
          ctx.fillStyle = '#ffdfba';
          ctx.fillRect(drawX - 6, drawY + 4, 3, 3);

          // Right hand adjusting espresso group head
          ctx.fillStyle = '#ffdfba';
          ctx.fillRect(drawX + 3, drawY + 2, 4, 3);

          // Rich coffee aroma steam curls
          const sY = (frame * 0.28) % 8;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fillRect(drawX - 6, drawY - 2 - sY, 2, 2);
          ctx.fillRect(drawX + 4, drawY - 4 - sY, 2, 2);

          if (frame % 40 < 22) {
            ctx.fillStyle = '#fb7185';
            ctx.font = 'bold 8px monospace';
            ctx.fillText('☕💕', drawX - 2, drawY - 12);
          }

        } else if (char.id === 'eah' && (char.activity === 'eah_carrying_coffee' || (char.isWalking && eahRoutineStepRef.current === 'deliver_coffee_walk'))) {
          // ================================================================
          // EAH: WALKING & CARRYING STEAMING HOT COFFEE MUG FOR DYLAN
          // ================================================================
          // Both arms forward holding warm ceramic mug
          ctx.fillStyle = char.shirtColor;
          ctx.fillRect(drawX - 6, drawY + 2, 3, 5);
          ctx.fillRect(drawX + 3, drawY + 2, 3, 5);
          ctx.fillStyle = '#ffdfba';
          ctx.fillRect(drawX - 5, drawY + 6, 3, 3);
          ctx.fillRect(drawX + 2, drawY + 6, 3, 3);

          // Ceramic Mug with Heart Latte Art
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(drawX - 4, drawY + 3, 8, 7);
          ctx.fillStyle = '#fb7185';
          ctx.fillRect(drawX - 4, drawY + 3, 8, 1); // Rose pink rim
          ctx.fillStyle = '#3e2318';
          ctx.fillRect(drawX - 3, drawY + 4, 6, 2); // Dark roast coffee
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(drawX - 1, drawY + 4, 2, 2); // Heart foam art
          // Mug handle
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(drawX + 4, drawY + 5, 2, 3);

          // Rising steam curls
          const sY = (frame * 0.28) % 7;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          ctx.fillRect(drawX - 1, drawY + 1 - sY, 2, 2);

          if (frame % 50 < 25) {
            ctx.fillStyle = '#fb7185';
            ctx.font = 'bold 7px monospace';
            ctx.fillText('☕💖', drawX + 6, drawY - 8);
          }

        } else if (char.id === 'eah' && (char.activity === 'eah_serving' || eahRoutineStepRef.current === 'serving_food' || eahRoutineStepRef.current === 'serving_coffee')) {
          // ================================================================
          // EAH: SERVING AT DYLAN'S DESK WITH LOVING HEART BURST
          // ================================================================
          // Gentle forward leaning stance
          ctx.fillStyle = char.shirtColor;
          ctx.fillRect(drawX - 7, drawY + 2, 4, 6);
          ctx.fillRect(drawX + 3, drawY + 2, 4, 6);
          ctx.fillStyle = '#ffdfba';
          ctx.fillRect(drawX - 6, drawY + 6, 3, 3);
          ctx.fillRect(drawX + 3, drawY + 6, 3, 3);

          // Glowing heart burst between Dylan and Eah
          ctx.fillStyle = '#fb7185';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('💖🥰', drawX + 5, drawY - 9);

        } else if (char.id === 'eah' && (char.activity === 'eah_petting_dog' || eahRoutineStepRef.current === 'petting_puppy')) {
          // ================================================================
          // EAH: CROUCHING & PETTING THE ADORABLE OFFICE PUPPY
          // ================================================================
          // Lowered torso pose
          ctx.fillStyle = char.shirtColor;
          ctx.fillRect(drawX - 7, drawY + 5, 14, 8);
          // Right arm reaching forward petting puppy head
          const petMotion = Math.sin(frame * 0.3) * 2;
          ctx.fillStyle = char.shirtColor;
          ctx.fillRect(drawX + 4, drawY + 5, 6, 3);
          ctx.fillStyle = '#ffdfba';
          ctx.fillRect(drawX + 9, drawY + 5 + petMotion, 4, 3);

          // Loving hearts bursting between Eah and Puppy
          ctx.fillStyle = '#fb7185';
          ctx.font = 'bold 9px monospace';
          ctx.fillText('🐶💕', drawX + 7, drawY - 6);

        } else if (char.activity === 'kitchen_work' || isAtKitchen) {
          // A. GOURMET KITCHEN ISLAND WORKING & SNACKING
          const lStyle = LAPTOP_STYLES_2D[char.id] || LAPTOP_STYLES_2D.dylan;
          const lapGlow = lStyle.accentGlow;
          const type = Math.sin(frame * 0.45) * 2;

          // Character-Specific Laptop Base on marble island counter
          ctx.fillStyle = lStyle.baseColor;
          ctx.fillRect(drawX - 9, drawY - 14, 18, 7);
          ctx.fillStyle = lStyle.kbColor;
          ctx.fillRect(drawX - 8, drawY - 13, 16, 5);
          ctx.fillStyle = lStyle.trackpadColor;
          ctx.fillRect(drawX - 3, drawY - 9, 6, 2);

          // ThinkPad Iconic Red TrackPoint Nub
          if (lStyle.hasTrackPoint) {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(drawX - 1, drawY - 12, 2, 2);
          }

          // Angled glowing screen lid facing character
          ctx.fillStyle = lStyle.lidColor;
          ctx.fillRect(drawX - 9, drawY - 22, 18, 8);
          ctx.fillStyle = lStyle.screenBg;
          ctx.fillRect(drawX - 8, drawY - 21, 16, 6);

          // Apple Logo / Lid Logo on back
          if (lStyle.hasAppleLogo) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(drawX - 1, drawY - 24, 2, 2);
          } else if (lStyle.hasTrackPoint) {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(drawX + 5, drawY - 24, 2, 2);
          }

          // Active Code / Document Telemetry on screen
          ctx.fillStyle = lapGlow;
          ctx.fillRect(drawX - 6, drawY - 20, 10, 1);
          ctx.fillRect(drawX - 6, drawY - 18, 12, 1);
          ctx.fillRect(drawX - 6, drawY - 16, 7, 1);
          // Blinking cursor
          if (frame % 20 < 10) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(drawX + 2, drawY - 16, 2, 1);
          }

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
          const lStyle = LAPTOP_STYLES_2D[char.id] || LAPTOP_STYLES_2D.dylan;
          const lapGlow = lStyle.accentGlow;
          const type = Math.sin(frame * 0.4) * 2;

          // Character-Specific Laptop Base on honey teak outdoor table
          ctx.fillStyle = lStyle.baseColor;
          ctx.fillRect(drawX - 9, drawY - 6, 18, 7);
          ctx.fillStyle = lStyle.kbColor;
          ctx.fillRect(drawX - 8, drawY - 5, 16, 5);
          ctx.fillStyle = lStyle.trackpadColor;
          ctx.fillRect(drawX - 3, drawY - 2, 6, 2);

          // ThinkPad Iconic Red TrackPoint Nub
          if (lStyle.hasTrackPoint) {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(drawX - 1, drawY - 4, 2, 2);
          }

          // Angled glowing screen lid facing character
          ctx.fillStyle = lStyle.lidColor;
          ctx.fillRect(drawX - 9, drawY - 14, 18, 8);
          ctx.fillStyle = lStyle.screenBg;
          ctx.fillRect(drawX - 8, drawY - 13, 16, 6);

          // Apple Logo / Lid Logo on back
          if (lStyle.hasAppleLogo) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(drawX - 1, drawY - 16, 2, 2);
          } else if (lStyle.hasTrackPoint) {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(drawX + 5, drawY - 16, 2, 2);
          }

          // Active Code lines on display with blinking cursor
          ctx.fillStyle = lapGlow;
          ctx.fillRect(drawX - 6, drawY - 12, 11, 1);
          ctx.fillRect(drawX - 6, drawY - 10, 8, 1);
          if (frame % 20 < 10) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(drawX + 3, drawY - 10, 2, 1);
          }

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
          // B. LEGIT RETRO ARCADE GAMING ANIMATION (Facing UP directly into the arcade cabinet!)
          char.facing = 'up';
          char.isSeated = false;
          const gameBob = Math.abs(Math.sin(frame * 0.4)) * 2;
          
          // Both arms raised forward/up towards the arcade control deck
          ctx.fillStyle = char.shirtColor;
          ctx.fillRect(drawX - 8, drawY - 2 - gameBob, 3, 5); // Left arm
          ctx.fillRect(drawX + 5, drawY - 2 - gameBob, 3, 5); // Right arm

          // Left hand actively steering red ball joystick
          const jX = Math.sin(frame * 0.5) * 3;
          const jY = Math.cos(frame * 0.5) * 2;
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(drawX - 5, drawY - 5, 2, 4); // Joystick shaft
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(drawX - 6 + jX, drawY - 8 + jY, 4, 4); // Red ball top
          ctx.fillStyle = '#ffdfba';
          ctx.fillRect(drawX - 7 + jX, drawY - 7 + jY, 3, 3); // Left hand gripping joystick

          // Right hand rapidly hammering arcade push-buttons
          const bTap = Math.sin(frame * 0.9) * 2;
          ctx.fillStyle = '#ffdfba';
          ctx.fillRect(drawX + 3, drawY - 6 + bTap, 4, 3); // Right hand tapping buttons

          // Dynamic CRT screen flash reflecting on character's back of head & shoulders
          ctx.fillStyle = frame % 16 < 8 ? 'rgba(236, 72, 153, 0.35)' : 'rgba(0, 240, 255, 0.35)';
          ctx.fillRect(drawX - 6, drawY - 14, 12, 4);

          // Retro 8-bit particle spark above head
          ctx.fillStyle = frame % 12 < 6 ? '#ffbe0b' : '#00f59b';
          ctx.fillRect(drawX + 6, drawY - 18 - gameBob, 2, 2);

        } else if (char.activity === 'sofa_relax' || (isAtSofa && !isAtWorkBench)) {
          // C. LUXURY VELVET SOFA RELAXATION POSE
          if (char.id === 'eah') {
            // ================================================================
            // EAH: DEDICATED APPLE IPAD / TABLET EXPERIENCE (Both Hands + Active Tapping)
            // ================================================================
            // Both arms brought forward, holding the iPad securely
            // Left arm & hand holding left edge of iPad
            ctx.fillStyle = char.shirtColor;
            ctx.fillRect(drawX - 9, drawY + 2, 4, 6);
            ctx.fillStyle = '#ffdfba';
            ctx.fillRect(drawX - 8, drawY + 6, 3, 3);

            // Right arm & hand holding right edge of iPad
            ctx.fillStyle = char.shirtColor;
            ctx.fillRect(drawX + 5, drawY + 2, 4, 6);
            ctx.fillStyle = '#ffdfba';
            ctx.fillRect(drawX + 5, drawY + 6, 3, 3);

            // Sleek Metallic Rose Gold / Silver iPad chassis on lap
            ctx.fillStyle = '#fda4af';
            ctx.fillRect(drawX - 8, drawY + 4, 16, 11);
            ctx.strokeStyle = '#fb7185';
            ctx.lineWidth = 1;
            ctx.strokeRect(drawX - 8, drawY + 4, 16, 11);

            // Ultra-thin Dark Bezel
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(drawX - 7, drawY + 5, 14, 9);

            // Liquid Retina Display (Deep dark theme with vibrant UI cards)
            ctx.fillStyle = '#1e1b4b';
            ctx.fillRect(drawX - 6, drawY + 6, 12, 7);

            // Mini top status bar (battery / time / wifi)
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(drawX - 5, drawY + 6, 10, 1);

            // Vibrant colorful app interface & widgets (social feed, Figma design mockups)
            ctx.fillStyle = '#fb7185';
            ctx.fillRect(drawX - 5, drawY + 8, 4, 2);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(drawX, drawY + 8, 4, 2);
            ctx.fillStyle = '#a855f7';
            ctx.fillRect(drawX - 5, drawY + 11, 4, 1);
            ctx.fillStyle = '#34d399';
            ctx.fillRect(drawX, drawY + 11, 4, 1);

            // Dynamic tapping finger / stylus interaction
            const isTapping = Math.sin(frame * 0.45) > 0.15;
            if (isTapping) {
              // Tapping fingertip
              ctx.fillStyle = '#ffdfba';
              ctx.fillRect(drawX + 1, drawY + 8, 2, 2);
              // Neon touch pulse ripple
              ctx.fillStyle = 'rgba(251, 113, 133, 0.75)';
              ctx.fillRect(drawX, drawY + 7, 4, 4);
            }

            // Magnetic Apple Pencil docked at the top edge of the iPad
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(drawX - 5, drawY + 3, 10, 1);
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(drawX + 3, drawY + 3, 2, 1);

            // Soft glowing ambient light reflecting from screen onto face/lap
            ctx.fillStyle = 'rgba(251, 113, 133, 0.16)';
            ctx.fillRect(drawX - 6, drawY + 2, 12, 3);

            // Floating cute status indicator
            if (frame % 60 < 25) {
              ctx.fillStyle = '#fb7185';
              ctx.font = 'bold 7px monospace';
              ctx.fillText(frame % 120 < 60 ? '📱' : '💕', drawX + 10, drawY - 9);
            }
          } else {
            // ================================================================
            // SPECIALISTS: SIGNATURE LAPTOPS IN LAPTOP LOUNGE (Open Display + Active Typing)
            // ================================================================
            const lapTheme = char.id === 'maya'
              ? { chassis: '#f8fafc', trim: '#cbd5e1', well: '#1e1b4b', screen: '#ec4899', code: ['#ec4899', '#f472b6', '#cbd5e1'], glow: 'rgba(236, 72, 153, 0.22)', icon: '🎨' }
              : char.id === 'alex'
              ? { chassis: '#1e293b', trim: '#334155', well: '#0f172a', screen: '#f97316', code: ['#f97316', '#fb923c', '#fed7aa'], glow: 'rgba(249, 115, 22, 0.22)', icon: '💻' }
              : char.id === 'wendy'
              ? { chassis: '#f8fafc', trim: '#94a3b8', well: '#064e3b', screen: '#34d399', code: ['#34d399', '#4ade80', '#bbf7d0'], glow: 'rgba(52, 211, 153, 0.22)', icon: '📢' }
              : char.id === 'ray'
              ? { chassis: '#e2e8f0', trim: '#94a3b8', well: '#0c4a6e', screen: '#38bdf8', code: ['#38bdf8', '#00f0ff', '#bae6fd'], glow: 'rgba(56, 189, 248, 0.22)', icon: '🔬' }
              : { chassis: '#e2e8f0', trim: '#94a3b8', well: '#090d16', screen: '#00f0ff', code: ['#ffbe0b', '#00f0ff', '#38bdf8'], glow: 'rgba(0, 240, 255, 0.22)', icon: '⚡' };

            // 1. Laptop Base / Chassis resting on lap
            ctx.fillStyle = lapTheme.chassis;
            ctx.fillRect(drawX - 8, drawY + 4, 16, 5); // Unibody aluminum slab
            ctx.fillStyle = lapTheme.trim;
            ctx.fillRect(drawX - 8, drawY + 8, 16, 1); // Front chamfer edge
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(drawX - 2, drawY + 6, 4, 2); // Precision glass trackpad

            // Recessed keyboard deck
            ctx.fillStyle = lapTheme.well;
            ctx.fillRect(drawX - 7, drawY + 4, 14, 2);
            // Glowing keyboard underglow / active key row
            ctx.fillStyle = lapTheme.screen;
            ctx.fillRect(drawX - 6, drawY + 4, 12, 1);

            // 2. Upright Open Display Lid
            ctx.fillStyle = '#0f172a'; // Bezel
            ctx.fillRect(drawX - 7, drawY - 4, 14, 8);
            ctx.fillStyle = '#030712'; // Retina screen display
            ctx.fillRect(drawX - 6, drawY - 3, 12, 6);

            // Screen Top Header Bar
            ctx.fillStyle = lapTheme.screen;
            ctx.fillRect(drawX - 5, drawY - 3, 10, 1);

            // Animated Code Telemetry & UI Lines
            const codeCycle = Math.floor(frame * 0.15) % 3;
            lapTheme.code.forEach((col, idx) => {
              const lineW = 3 + ((idx * 3 + codeCycle * 2) % 6);
              ctx.fillStyle = col;
              ctx.fillRect(drawX - 5, drawY - 1 + idx * 1.5, Math.min(8, lineW), 1);
            });

            // Blinking cursor on screen
            if (frame % 30 < 15) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(drawX + 4, drawY, 1, 1);
            }

            // Screen glow reflecting onto lap & torso
            ctx.fillStyle = lapTheme.glow;
            ctx.fillRect(drawX - 8, drawY - 4, 16, 12);

            // 3. Active Typing Hands on Keyboard
            const typeTick = Math.sin(frame * 0.5) > 0;
            // Left arm and tapping hand
            ctx.fillStyle = char.shirtColor;
            ctx.fillRect(drawX - 9, drawY + 1, 3, 4);
            ctx.fillStyle = '#ffdfba';
            ctx.fillRect(drawX - 7, drawY + 4 + (typeTick ? 0 : 1), 3, 2);

            // Right arm and tapping hand
            ctx.fillStyle = char.shirtColor;
            ctx.fillRect(drawX + 6, drawY + 1, 3, 4);
            ctx.fillStyle = '#ffdfba';
            ctx.fillRect(drawX + 4, drawY + 4 + (typeTick ? 1 : 0), 3, 2);

            // 4. Artisanal Coffee Mug Resting on Side Table
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(drawX + 11, drawY + 2, 5, 5); // Ceramic cup
            ctx.fillStyle = '#3e2318';
            ctx.fillRect(drawX + 12, drawY + 2, 3, 2); // Rich dark coffee
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(drawX + 15, drawY + 3, 2, 3); // Handle

            // Subtle rising steam curl
            const sY = (frame * 0.25) % 6;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.fillRect(drawX + 13, drawY - sY, 1, 2);

            // Cute occasional telemetry / focus icon
            if (frame % 80 < 30) {
              ctx.fillStyle = lapTheme.screen;
              ctx.font = 'bold 7px monospace';
              ctx.fillText(lapTheme.icon, drawX + 9, drawY - 8);
            }
          }

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
          const lStyle = LAPTOP_STYLES_2D[char.id] || LAPTOP_STYLES_2D.dylan;
          const lapGlow = lStyle.accentGlow;
          const type = Math.sin(frame * 0.45) * 2;

          if (char.id === 'dylan' || drawX < 685) {
            // 1. DYLAN AT HEAD OF TABLE (Left side, facing right towards mahogany conference table)
            // Apple Silver MacBook Pro Base on Table Surface (Table starts at x = 690)
            ctx.fillStyle = lStyle.baseColor;
            ctx.fillRect(drawX + 28, drawY - 6, 12, 14);
            ctx.fillStyle = lStyle.kbColor;
            ctx.fillRect(drawX + 29, drawY - 5, 9, 12);
            ctx.fillStyle = lStyle.trackpadColor;
            ctx.fillRect(drawX + 35, drawY - 2, 2, 6);

            // Angled Screen Lid facing Dylan
            ctx.fillStyle = lStyle.lidColor;
            ctx.fillRect(drawX + 38, drawY - 9, 3, 18);
            ctx.fillStyle = lStyle.screenBg;
            ctx.fillRect(drawX + 37, drawY - 8, 2, 16);
            // Glowing white Apple logo on back of lid
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(drawX + 41, drawY - 1, 1, 2);

            // Active executive code / KPI telemetry on Dylan's screen
            ctx.fillStyle = '#00f0ff';
            ctx.fillRect(drawX + 37, drawY - 6, 2, 4);
            ctx.fillRect(drawX + 37, drawY, 2, 5);

            // Dylan's hands actively typing on laptop keyboard
            ctx.fillStyle = '#ffdfba';
            ctx.fillRect(drawX + 24, drawY - 4 + type, 6, 3);
            ctx.fillRect(drawX + 24, drawY + 2 - type, 6, 3);

            // White ceramic demitasse coffee cup with steam on table
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(drawX + 32, drawY - 14, 5, 5);
            ctx.fillStyle = '#3e2318';
            ctx.fillRect(drawX + 33, drawY - 14, 3, 2);
            const sY = (frame * 0.25) % 6;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.fillRect(drawX + 34, drawY - 16 - sY, 2, 2);

          } else if (drawY < 400) {
            // 2. NORTH CHAIRS (Ray, Maya, Alex facing down towards table)
            // Character-Specific Laptop Base placed on mahogany table in front of character
            ctx.fillStyle = lStyle.baseColor;
            ctx.fillRect(drawX - 9, drawY + 18, 18, 8);
            ctx.fillStyle = lStyle.kbColor;
            ctx.fillRect(drawX - 8, drawY + 19, 16, 6);
            ctx.fillStyle = lStyle.trackpadColor;
            ctx.fillRect(drawX - 3, drawY + 22, 6, 2);

            // ThinkPad Iconic Red TrackPoint Nub
            if (lStyle.hasTrackPoint) {
              ctx.fillStyle = '#ef4444';
              ctx.fillRect(drawX - 1, drawY + 20, 2, 2);
            }

            // Upright Screen Lid facing character
            ctx.fillStyle = lStyle.lidColor;
            ctx.fillRect(drawX - 9, drawY + 11, 18, 8);
            ctx.fillStyle = lStyle.screenBg;
            ctx.fillRect(drawX - 8, drawY + 12, 16, 6);

            // Apple logo or lid emblem on back
            if (lStyle.hasAppleLogo) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(drawX - 1, drawY + 9, 2, 2);
            } else if (lStyle.hasTrackPoint) {
              ctx.fillStyle = '#ef4444';
              ctx.fillRect(drawX + 5, drawY + 9, 2, 2);
            }

            // Miniature active code lines on display with blinking cursor
            ctx.fillStyle = lapGlow;
            ctx.fillRect(drawX - 6, drawY + 13, 8, 1);
            ctx.fillRect(drawX - 6, drawY + 15, 12, 1);
            ctx.fillRect(drawX - 6, drawY + 17, 6, 1);
            if (frame % 20 < 10) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(drawX + 1, drawY + 17, 2, 1);
            }

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
            // Character-Specific Laptop Base placed on mahogany table in front of character
            ctx.fillStyle = lStyle.baseColor;
            ctx.fillRect(drawX - 9, drawY - 8, 18, 7);
            ctx.fillStyle = lStyle.kbColor;
            ctx.fillRect(drawX - 8, drawY - 7, 16, 5);
            ctx.fillStyle = lStyle.trackpadColor;
            ctx.fillRect(drawX - 3, drawY - 4, 6, 2);

            // ThinkPad Iconic Red TrackPoint Nub
            if (lStyle.hasTrackPoint) {
              ctx.fillStyle = '#ef4444';
              ctx.fillRect(drawX - 1, drawY - 6, 2, 2);
            }

            // Upright Screen Lid facing character
            ctx.fillStyle = lStyle.lidColor;
            ctx.fillRect(drawX - 9, drawY - 17, 18, 9);
            ctx.fillStyle = lStyle.screenBg;
            ctx.fillRect(drawX - 8, drawY - 16, 16, 7);

            // Apple logo or lid emblem on back
            if (lStyle.hasAppleLogo) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(drawX - 1, drawY - 19, 2, 2);
            } else if (lStyle.hasTrackPoint) {
              ctx.fillStyle = '#ef4444';
              ctx.fillRect(drawX + 5, drawY - 19, 2, 2);
            }

            // Miniature text / terminal lines with blinking cursor
            ctx.fillStyle = lapGlow;
            ctx.fillRect(drawX - 6, drawY - 15, 10, 1);
            ctx.fillRect(drawX - 6, drawY - 13, 12, 1);
            ctx.fillRect(drawX - 6, drawY - 11, 7, 1);
            if (frame % 20 < 10) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(drawX + 2, drawY - 11, 2, 1);
            }

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
          const lStyle = LAPTOP_STYLES_2D[char.id] || LAPTOP_STYLES_2D.dylan;
          const lapGlow = lStyle.accentGlow;

          // Laptop Base resting on lap / work bench
          ctx.fillStyle = lStyle.baseColor;
          ctx.fillRect(drawX - 8, drawY - 2, 16, 5);
          ctx.fillStyle = lStyle.kbColor;
          ctx.fillRect(drawX - 7, drawY - 1, 14, 3);

          // ThinkPad Red TrackPoint Nub
          if (lStyle.hasTrackPoint) {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(drawX - 1, drawY, 2, 1);
          }

          // Upright Screen Lid facing character
          ctx.fillStyle = lStyle.lidColor;
          ctx.fillRect(drawX - 8, drawY - 9, 16, 7);
          ctx.fillStyle = lStyle.screenBg;
          ctx.fillRect(drawX - 7, drawY - 8, 14, 5);

          // Active mini code lines on screen
          ctx.fillStyle = lapGlow;
          ctx.fillRect(drawX - 5, drawY - 7, 9, 1);
          ctx.fillRect(drawX - 5, drawY - 5, 7, 1);
          if (frame % 20 < 10) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(drawX + 3, drawY - 5, 2, 1);
          }

          // Animated typing hands clicking on keyboard
          const type = Math.sin(frame * 0.45) * 2;
          ctx.fillStyle = '#ffdfba';
          ctx.fillRect(drawX - 5, drawY - 2 + type, 3, 3);
          ctx.fillRect(drawX + 2, drawY - 2 - type, 3, 3);

        } else if ((isInLoungeArea || isAtBoardroom || char.isMeeting || char.activity === 'working') && char.isWalking) {
          // Smoothly carrying folded laptop under arm with natural walking stride bobbing & arm grip
          const carryBob = Math.sin(frame * 0.45) * 2;
          const lStyle = LAPTOP_STYLES_2D[char.id] || LAPTOP_STYLES_2D.dylan;

          // Character's shirt arm bent holding laptop against body
          ctx.fillStyle = char.shirtColor;
          ctx.fillRect(drawX + 4, drawY - 1 + carryBob, 4, 7);

          // Folded Character-Specific Laptop Chassis under arm
          ctx.fillStyle = lStyle.baseColor;
          ctx.fillRect(drawX + 6, drawY + 1 + carryBob, 5, 9);
          // Dark edge / keyboard crease
          ctx.fillStyle = lStyle.kbColor;
          ctx.fillRect(drawX + 7, drawY + 2 + carryBob, 3, 7);
          // Outer lid role-colored glowing logo or Apple logo
          if (lStyle.hasAppleLogo) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(drawX + 8, drawY + 4 + carryBob, 2, 2);
          } else if (lStyle.hasTrackPoint) {
            ctx.fillStyle = '#ef4444'; // Red dot ThinkPad LED
            ctx.fillRect(drawX + 9, drawY + 3 + carryBob, 1, 1);
          } else {
            ctx.fillStyle = lStyle.logoColor;
            ctx.fillRect(drawX + 8, drawY + 4 + carryBob, 2, 2);
          }

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
        const pillW = char.id === 'dylan' ? 108 : char.id === 'eah' ? 128 : 118;
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
          ctx.fillText('Dylan Ramos 👑', pillX + 23, pillY + 11);
          ctx.fillStyle = '#00f59b';
          ctx.beginPath();
          ctx.arc(pillX + 94, pillY + 8, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#94a3b8';
          ctx.font = '8px monospace';
          ctx.fillText(char.isSeated ? '🪑 Seated' : '🚶 Roaming', pillX + 23, pillY + 20);
        } else if (char.id === 'eah') {
          ctx.fillStyle = '#fda4af';
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText('Eah Ilagan ✨', pillX + 23, pillY + 11);
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(pillX + 114, pillY + 8, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fb7185';
          ctx.font = '8px monospace';
          ctx.fillText('With Dylan Ramos 💻', pillX + 23, pillY + 20);
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
          const bW = Math.max(90, Math.min(240, textMetrics.width + 18));
          const bH = 24;
          const bX = Math.max(16, Math.min(LOGICAL_W - bW - 16, drawX - bW / 2));
          const bY = Math.max(16, drawY - 68);

          // Subtle shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.beginPath();
          ctx.roundRect(bX + 1, bY + 2, bW, bH, 6);
          ctx.fill();

          // Bubble background with cyan (or rose-pink for Eah) border
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(bX, bY, bW, bH, 6);
          ctx.fill();
          ctx.strokeStyle = char.id === 'eah' ? '#f43f5e' : '#00f0ff';
          ctx.lineWidth = char.id === 'eah' ? 1.6 : 1.2;
          ctx.stroke();

          // Downward pointer beak toward character head (clamped within bubble bounds)
          const beakX = Math.max(bX + 8, Math.min(bX + bW - 8, drawX));
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(beakX - 4, bY + bH);
          ctx.lineTo(beakX + 4, bY + bH);
          ctx.lineTo(beakX, bY + bH + 4);
          ctx.closePath();
          ctx.fill();

          // Speech text with dynamic font scaling to ensure zero clipping
          let fontSize = 8.5;
          if (textMetrics.width > bW - 16) {
            fontSize = Math.max(7, Math.floor(8.5 * ((bW - 16) / textMetrics.width)));
          }
          ctx.fillStyle = '#0f172a';
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(char.bubbleText, bX + bW / 2, bY + 15);
        }
      });

      // Dog Speech Bubble Render (Arf arf! 🐶💕)
      if (dogSpeechRef.current && dogSpeechRef.current.timer > 0) {
        dogSpeechRef.current.timer -= 0.016;
        const dX = 766;
        const dY = 318;
        ctx.font = 'bold 9px monospace';
        const textW = ctx.measureText(dogSpeechRef.current.text).width;
        const bubW = textW + 18;
        const bubH = 20;
        const bubX = dX - bubW / 2;
        const bubY = dY - bubH - 8;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.beginPath();
        ctx.roundRect(bubX, bubY, bubW, bubH, 6);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = '#fef3c7';
        ctx.textAlign = 'center';
        ctx.fillText(dogSpeechRef.current.text, dX, bubY + 13);
      }
    };

    render();

    // Click Detection on Canvas (Select Agent OR Click-to-Move Dylan)
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = LOGICAL_W / rect.width;
      const scaleY = LOGICAL_H / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      // Click on Puppy
      if (Math.hypot(clickX - 766, clickY - 338) < 26) {
        dogSpeechRef.current = { text: 'Arf arf! 🐶💕 *happy puppy tail wag*', timer: 5.0 };
        playSfx('click');
        return;
      }

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
        if (hitId === 'eah') {
          const eahQuotes = [
            'Hi Dylan 💕 Chilling on my iPad here! [Press C to cook / B for coffee]',
            'Don\'t stress yourself too much, babe 💖 Luto kita? [C]',
            'I love keeping you company in the CEO suite 🥰',
            'Coffee delivery for my CEO anytime! ☕💕 [B]',
            'Cheering for you always Dylan! 📱💕',
          ];
          const quote = eahQuotes[Math.floor(Math.random() * eahQuotes.length)];
          const eah = charactersRef.current.eah;
          if (eah) {
            eah.bubbleText = quote;
            eah.bubbleTimer = 5;
          }
        }
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
          flexWrap: 'wrap',
          rowGap: '8px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.65)',
        }}
      >
        {/* Left: View Mode Toggle & Dylan Ramos CEO Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* View Mode Toggle */}
          {onViewModeChange && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(10, 12, 20, 0.8)',
                border: '1px solid rgba(0, 240, 255, 0.35)',
                borderRadius: '6px',
                padding: '3px',
                gap: '3px',
              }}
            >
              <button
                onClick={() => onViewModeChange('pixel')}
                style={{
                  background: viewMode === 'pixel' ? '#00f0ff' : 'transparent',
                  color: viewMode === 'pixel' ? '#0a0c14' : '#94a3b8',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px 8px',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: viewMode === 'pixel' ? '0 0 10px rgba(0, 240, 255, 0.5)' : 'none',
                }}
                title="Currently on 2D Pixel Office View"
              >
                🕹️ PIXEL
              </button>
              <button
                onClick={() => onViewModeChange('voxel')}
                style={{
                  background: viewMode === 'voxel' ? '#00f0ff' : 'transparent',
                  color: viewMode === 'voxel' ? '#0a0c14' : '#94a3b8',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px 8px',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: viewMode === 'voxel' ? '0 0 10px rgba(0, 240, 255, 0.5)' : 'none',
                }}
                title="Switch to 3D Voxel Office View"
              >
                🧊 3D VOXEL
              </button>
            </div>
          )}

          <div style={{ width: '1px', height: '22px', background: 'rgba(255, 255, 255, 0.15)', margin: '0 2px' }} />

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Stand & Stretch Button */}
          <button
            onClick={handleAllWorkersStand}
            title="Make all workers stand up and stretch"
            style={{
              background: 'rgba(56, 189, 248, 0.18)',
              border: '1.5px solid #38bdf8',
              color: '#38bdf8',
              borderRadius: '8px',
              padding: '9px 16px',
              height: '42px',
              fontSize: '13px',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: '16px' }}>🤸</span>
            <span>WORKERS STAND</span>
          </button>

          {/* Team Rest / Laptop Lounge Work Toggle */}
          <button
            onClick={handleToggleRestMode}
            title="Send team with laptops to work at the lounge sofa & collaborative oak bench"
            style={{
              background: inRestMode ? 'rgba(236, 72, 153, 0.3)' : 'rgba(245, 158, 11, 0.18)',
              border: inRestMode ? '1.5px solid #ec4899' : '1.5px solid #f59e0b',
              color: inRestMode ? '#ec4899' : '#f59e0b',
              borderRadius: '8px',
              padding: '9px 16px',
              height: '42px',
              fontSize: '13px',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: '16px' }}>{inRestMode ? '💼' : '🛋️'}</span>
            <span>{inRestMode ? 'DESK WORK' : 'LAPTOP LOUNGE'}</span>
          </button>

          {/* All-Hands Meeting Toggle */}
          <button
            onClick={handleToggleMeetingMode}
            style={{
              background: inMeetingMode ? 'rgba(255, 190, 11, 0.3)' : 'rgba(0, 240, 255, 0.18)',
              border: inMeetingMode ? '1.5px solid #ffbe0b' : '1.5px solid #00f0ff',
              color: inMeetingMode ? '#ffbe0b' : '#00f0ff',
              borderRadius: '8px',
              padding: '9px 16px',
              height: '42px',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
            }}
          >
            <span style={{ fontSize: '16px' }}>{inMeetingMode ? '💼' : '📢'}</span>
            <span>{inMeetingMode ? 'DISMISS TO DESKS' : 'ALL-HANDS MEETING'}</span>
          </button>
        </div>

        {/* Right: Audio & Sprint Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsSprinting(!isSprinting)}
            title="Toggle Sprint Speed"
            style={{
              background: isSprinting ? 'rgba(236, 72, 153, 0.28)' : 'rgba(255, 255, 255, 0.06)',
              border: isSprinting ? '1.5px solid #ec4899' : '1.5px solid rgba(255, 255, 255, 0.15)',
              color: isSprinting ? '#ec4899' : '#cbd5e1',
              borderRadius: '8px',
              padding: '7px 14px',
              height: '40px',
              fontSize: '12px',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {isSprinting ? '⚡ SPRINT 2X' : '🚶 WALK'}
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title="Toggle SFX"
            style={{
              background: soundEnabled ? 'rgba(0, 245, 155, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              border: soundEnabled ? '1.5px solid #00f59b' : '1.5px solid rgba(255, 255, 255, 0.15)',
              color: soundEnabled ? '#00f59b' : '#94a3b8',
              borderRadius: '8px',
              padding: '7px 14px',
              height: '40px',
              fontSize: '13px',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 700,
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
          width={1040}
          height={520}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            aspectRatio: '1040 / 520',
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
