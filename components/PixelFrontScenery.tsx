'use client';

import React, { useRef, useEffect, useState } from 'react';

interface CharacterSpriteData {
  id: string;
  name: string;
  role: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  speech: string;
  soundType: 'click' | 'chime' | 'coin' | 'bark' | 'meow';
}

interface PixelFrontSceneryProps {
  onPlaySound?: (type: 'click' | 'success' | 'error' | 'open' | 'chime' | 'bark' | 'meow' | 'coin') => void;
}

export default function PixelFrontScenery({ onPlaySound }: PixelFrontSceneryProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeSpeech, setActiveSpeech] = useState<{ id: string; text: string; x: number; y: number; color: string } | null>(null);
  const speechTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Registered interactive character hitboxes (in logical 960x540 coordinates)
  const charactersRef = useRef<CharacterSpriteData[]>([
    {
      id: 'dylan',
      name: 'Dylan Ramos',
      role: 'Founder & CEO',
      x: 750,
      y: 270,
      width: 44,
      height: 52,
      color: '#ffbe0b',
      speech: 'Roadmap sprint on track! Welcome to Avero HQ 👑✨',
      soundType: 'coin',
    },
    {
      id: 'eah',
      name: 'Eah',
      role: 'Executive Partner',
      x: 840,
      y: 360,
      width: 38,
      height: 48,
      color: '#fb7185',
      speech: 'Fresh espresso & warm snacks ready for Dylan! ☕💖',
      soundType: 'chime',
    },
    {
      id: 'alex',
      name: 'Alex',
      role: 'Fullstack Dev',
      x: 430,
      y: 280,
      width: 38,
      height: 48,
      color: '#f97316',
      speech: 'Shipping Next.js 15 & TypeScript architecture! ⚡👨‍💻',
      soundType: 'click',
    },
    {
      id: 'maya',
      name: 'Maya',
      role: 'UI/UX Designer',
      x: 520,
      y: 280,
      width: 38,
      height: 48,
      color: '#ec4899',
      speech: 'Polishing pixel-perfect UI & color tokens! 🎨✨',
      soundType: 'chime',
    },
    {
      id: 'ray',
      name: 'Ray',
      role: 'AI Researcher',
      x: 610,
      y: 280,
      width: 38,
      height: 48,
      color: '#38bdf8',
      speech: 'Benchmarking Gemini 2.0 multi-agent cognition! 🔬🤖',
      soundType: 'click',
    },
    {
      id: 'wendy',
      name: 'Wendy',
      role: 'Marketing',
      x: 430,
      y: 380,
      width: 38,
      height: 48,
      color: '#c084fc',
      speech: 'Viral launch campaign trending across social! 📣🚀',
      soundType: 'chime',
    },
    {
      id: 'zane',
      name: 'Zane',
      role: 'Cybersecurity',
      x: 530,
      y: 380,
      width: 38,
      height: 48,
      color: '#22c55e',
      speech: 'Zero-Trust server vault: 100% defense operational! 🛡️🔒',
      soundType: 'click',
    },
    {
      id: 'snowy',
      name: 'Snowy',
      role: 'White Cat',
      x: 690,
      y: 380,
      width: 34,
      height: 38,
      color: '#ffffff',
      speech: 'Purrrrrrr... Nyaa~ 💕 *soft purring & cozy headbonk*',
      soundType: 'meow',
    },
    {
      id: 'mochi',
      name: 'Mochi',
      role: 'Puppy',
      x: 750,
      y: 385,
      width: 34,
      height: 34,
      color: '#f59e0b',
      speech: 'Arf arf! 🐶💕 *happy puppy tail wag & kisses*',
      soundType: 'bark',
    },
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Logical retro canvas resolution: 960x540 (crisp 16:9 pixel grid)
    const W = 960;
    const H = 540;
    canvas.width = W;
    canvas.height = H;
    ctx.imageSmoothingEnabled = false;

    // 1. Drifting Garden Sakura Petals
    interface Petal {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      color: string;
      sway: number;
    }
    const petals: Petal[] = [];
    const petalColors = ['#fbcfe8', '#f472b6', '#fda4af', '#fff1f2'];
    for (let i = 0; i < 45; i++) {
      petals.push({
        x: Math.random() * 380,
        y: Math.random() * H,
        vx: 0.3 + Math.random() * 0.6,
        vy: 0.5 + Math.random() * 0.7,
        size: Math.random() < 0.6 ? 2 : 3,
        alpha: 0.7 + Math.random() * 0.3,
        color: petalColors[Math.floor(Math.random() * petalColors.length)],
        sway: Math.random() * Math.PI * 2,
      });
    }

    // 2. Parallax Sky Clouds
    const clouds = [
      { x: 30, y: 35, w: 90, h: 22, speed: 0.12 },
      { x: 280, y: 65, w: 120, h: 26, speed: 0.18 },
      { x: 580, y: 40, w: 140, h: 28, speed: 0.14 },
      { x: 820, y: 70, w: 95, h: 22, speed: 0.16 },
    ];

    // 3. Swimming Koi Fish in Zen Garden Pond
    let koiAngle = 0;

    let animId: number;
    let tick = 0;

    const render = () => {
      tick++;

      // ======================================================================
      // A. RETRO GRADIENT SKY (16-bit stepped pixel bands)
      // ======================================================================
      const skySteps = [
        { y: 0, h: 60, col: '#2563eb' },
        { y: 60, h: 50, col: '#3b82f6' },
        { y: 110, h: 50, col: '#60a5fa' },
        { y: 160, h: 50, col: '#93c5fd' },
        { y: 210, h: 40, col: '#bfdbfe' },
        { y: 250, h: 30, col: '#dbeafe' },
      ];
      skySteps.forEach((s) => {
        ctx.fillStyle = s.col;
        ctx.fillRect(0, s.y, W, s.h);
      });

      // Sun / Golden Hour Pixel Glow
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(160, 48, 44, 44);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(166, 54, 32, 32);

      // ======================================================================
      // B. PARALLAX PIXEL CLOUDS
      // ======================================================================
      clouds.forEach((c) => {
        c.x += c.speed;
        if (c.x > W + 40) c.x = -c.w - 40;

        ctx.fillStyle = '#ffffff';
        // Stepped chunky pixel cloud body
        ctx.fillRect(Math.floor(c.x), Math.floor(c.y), c.w, c.h);
        ctx.fillRect(Math.floor(c.x + 12), Math.floor(c.y - 8), c.w - 24, 8);
        ctx.fillRect(Math.floor(c.x + 24), Math.floor(c.y - 14), c.w - 48, 6);
        // Soft cloud shadow underbelly
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(Math.floor(c.x + 4), Math.floor(c.y + c.h - 4), c.w - 8, 4);
      });

      // ======================================================================
      // C. DISTANT SILHOUETTE SKYLINE & TELECOM TOWERS (Background)
      // ======================================================================
      const buildings = [
        { x: 30, w: 42, h: 110 },
        { x: 80, w: 55, h: 140 },
        { x: 145, w: 48, h: 95 },
        { x: 210, w: 60, h: 160, tower: true },
        { x: 285, w: 45, h: 120 },
        { x: 340, w: 52, h: 105 },
        { x: 410, w: 65, h: 150 },
        { x: 490, w: 50, h: 115 },
        { x: 555, w: 70, h: 175, tower: true },
        { x: 640, w: 45, h: 130 },
        { x: 700, w: 58, h: 100 },
        { x: 775, w: 64, h: 145 },
        { x: 855, w: 48, h: 120 },
        { x: 915, w: 50, h: 160 },
      ];

      // Skyline silhouette
      ctx.fillStyle = '#94a3b8';
      buildings.forEach((b) => {
        const by = 240 - b.h;
        ctx.fillRect(b.x, by, b.w, b.h);

        // Tower antenna with blinking red beacon LED
        if (b.tower) {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(b.x + Math.floor(b.w / 2) - 1, by - 26, 3, 26);
          // Blinking red beacon
          const isBlink = Math.floor(tick / 30) % 2 === 0;
          ctx.fillStyle = isBlink ? '#ef4444' : '#7f1d1d';
          ctx.fillRect(b.x + Math.floor(b.w / 2) - 2, by - 30, 5, 5);
          ctx.fillStyle = '#94a3b8';
        }

        // Tiny pixel window grids in skyscrapers
        ctx.fillStyle = '#cbd5e1';
        for (let wy = by + 12; wy < 230; wy += 14) {
          for (let wx = b.x + 6; wx < b.x + b.w - 6; wx += 9) {
            if ((wx + wy + tick * 0.05) % 7 > 2) {
              ctx.fillRect(wx, wy, 4, 6);
            }
          }
        }
        ctx.fillStyle = '#94a3b8';
      });

      // Utility Poles and Wires across horizon
      ctx.fillStyle = '#334155';
      ctx.fillRect(340, 150, 6, 90);
      ctx.fillRect(320, 165, 46, 4);
      ctx.fillRect(328, 180, 30, 3);
      ctx.fillRect(660, 150, 6, 90);
      ctx.fillRect(640, 165, 46, 4);

      // Drooping power cables
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(320, 165);
      ctx.quadraticCurveTo(490, 195, 640, 165);
      ctx.stroke();

      // ======================================================================
      // D. THE PIXELATED ZEN GARDEN ZONE (x: 0 to 370, y: 220 to 540)
      // ======================================================================
      // Garden Grass & Raked Sand Bed
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 240, 370, 300);

      // Lush grass pixel shading
      ctx.fillStyle = '#16a34a';
      for (let gy = 240; gy < 540; gy += 12) {
        for (let gx = 0; gx < 370; gx += 16) {
          if ((gx + gy) % 3 === 0) {
            ctx.fillRect(gx, gy, 8, 4);
          }
        }
      }

      // Wooden Zen Patio Deck (x: 0 to 110, y: 340 to 540)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 340, 110, 200);
      ctx.fillStyle = '#b45309';
      for (let dy = 340; dy < 540; dy += 14) {
        ctx.fillRect(0, dy, 110, 12);
        ctx.fillStyle = '#92400e';
        ctx.fillRect(0, dy + 11, 110, 2);
        // Wood grain planks
        ctx.fillStyle = '#d97706';
        ctx.fillRect(24, dy + 4, 32, 2);
        ctx.fillRect(72, dy + 7, 26, 2);
        ctx.fillStyle = '#b45309';
      }

      // Raked Zen Gravel Sand Garden (x: 130 to 350, y: 360 to 520)
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(130, 360, 220, 150);
      ctx.fillStyle = '#94a3b8';
      // Raked sand wave rings
      for (let ry = 368; ry < 500; ry += 12) {
        ctx.fillRect(134, ry, 212, 2);
      }

      // Zen Koi Pond (x: 170 to 310, y: 390 to 480)
      ctx.fillStyle = '#0f172a'; // Pond stone perimeter
      ctx.fillRect(166, 386, 148, 98);
      ctx.fillStyle = '#0284c7'; // Deep clear pond water
      ctx.fillRect(170, 390, 140, 90);
      ctx.fillStyle = '#38bdf8'; // Water highlights
      ctx.fillRect(174, 394, 132, 82);

      // Animated Water Glistening Tiles
      const shimmerFrame = Math.floor(tick / 15) % 4;
      ctx.fillStyle = '#bae6fd';
      for (let wy = 400; wy < 465; wy += 14) {
        const offX = ((wy * 7 + shimmerFrame * 12) % 60) - 20;
        ctx.fillRect(180 + offX, wy, 16, 2);
        ctx.fillRect(240 - offX, wy + 6, 12, 2);
      }

      // Animated Koi Fish Swimming in gentle circle
      koiAngle += 0.025;
      const koiCx = 240 + Math.cos(koiAngle) * 35;
      const koiCy = 435 + Math.sin(koiAngle) * 20;
      ctx.fillStyle = '#f97316'; // Orange Koi body
      ctx.fillRect(Math.floor(koiCx - 7), Math.floor(koiCy - 3), 14, 6);
      ctx.fillStyle = '#ffffff'; // White koi patches
      ctx.fillRect(Math.floor(koiCx - 2), Math.floor(koiCy - 3), 5, 6);
      // Wiggling koi tail
      const tailWiggle = Math.sin(tick * 0.3) * 3;
      ctx.fillStyle = '#fb923c';
      ctx.fillRect(Math.floor(koiCx - 11), Math.floor(koiCy - 2 + tailWiggle), 5, 4);

      // Water Lily Pads & Lotus Flower
      ctx.fillStyle = '#15803d';
      ctx.fillRect(190, 410, 14, 10);
      ctx.fillRect(270, 440, 16, 11);
      ctx.fillStyle = '#f472b6'; // Lotus bloom
      ctx.fillRect(194, 407, 6, 5);

      // Japanese Stone Pagoda Lantern (Tōrō) at (x: 125, y: 310)
      ctx.fillStyle = '#475569'; // Base
      ctx.fillRect(122, 350, 20, 8);
      ctx.fillRect(128, 334, 8, 16);
      // Lantern Fire Chamber (Glowing warm amber ember)
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(124, 320, 16, 14);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(128, 324, 8, 7);
      // Pagoda Tiered Roof
      ctx.fillStyle = '#334155';
      ctx.fillRect(118, 316, 28, 5);
      ctx.fillRect(122, 312, 20, 4);
      ctx.fillRect(128, 308, 8, 4);

      // MAGNIFICENT PIXEL CHERRY BLOSSOM TREE (Center x: 75, y: 220)
      // Dark Wooden Trunk and Branches
      ctx.fillStyle = '#3f1a04';
      ctx.fillRect(70, 240, 20, 90);
      ctx.fillRect(66, 290, 28, 40);
      // Sprawling branches
      ctx.fillRect(40, 210, 50, 14);
      ctx.fillRect(15, 180, 45, 12);
      ctx.fillRect(75, 195, 65, 14);
      ctx.fillRect(120, 175, 55, 12);

      // Layered Cherry Blossom Foliage (Clusters of pink sakura pixels)
      const sakuraBlobs = [
        { cx: 30, cy: 170, r: 38 },
        { cx: 75, cy: 155, r: 44 },
        { cx: 130, cy: 165, r: 40 },
        { cx: 165, cy: 190, r: 30 },
        { cx: 50, cy: 200, r: 32 },
        { cx: 105, cy: 185, r: 36 },
      ];

      // Base deep magenta/rose shadows
      ctx.fillStyle = '#db2777';
      sakuraBlobs.forEach((b) => {
        ctx.fillRect(b.cx - b.r, b.cy - b.r + 6, b.r * 2, b.r * 2);
      });
      // Midtone pink petals
      ctx.fillStyle = '#f472b6';
      sakuraBlobs.forEach((b) => {
        ctx.fillRect(b.cx - b.r + 4, b.cy - b.r, b.r * 2 - 8, b.r * 2 - 8);
      });
      // Bright light pink highlight blossoms
      ctx.fillStyle = '#fbcfe8';
      sakuraBlobs.forEach((b) => {
        ctx.fillRect(b.cx - b.r + 8, b.cy - b.r - 4, b.r * 2 - 16, b.r * 2 - 16);
      });
      // Delicate white sparkle flower centers
      ctx.fillStyle = '#ffffff';
      sakuraBlobs.forEach((b) => {
        ctx.fillRect(b.cx - 6, b.cy - 12, 6, 6);
        ctx.fillRect(b.cx + 10, b.cy - 4, 5, 5);
      });

      // Drifting Falling Sakura Petals Animation
      petals.forEach((p) => {
        p.sway += 0.04;
        p.x += p.vx + Math.sin(p.sway) * 0.4;
        p.y += p.vy;
        if (p.y > H || p.x > 380) {
          p.y = 120 + Math.random() * 50;
          p.x = 20 + Math.random() * 150;
        }
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
      });

      // ======================================================================
      // E. THE PIXELATED VIRTUAL OFFICE INTERIOR (x: 370 to 960, y: 200 to 540)
      // ======================================================================
      // Large Glass Partition Wall & Architectural Framing
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(366, 200, 10, 340); // Main dividing mullion
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(368, 200, 2, 340); // Blue glass reflection glint

      // Warm Maple Hardwood Flooring (Office Interior)
      ctx.fillStyle = '#d97706';
      ctx.fillRect(376, 240, W - 376, 300);
      // Floor plank lines
      ctx.fillStyle = '#b45309';
      for (let fy = 240; fy < 540; fy += 16) {
        ctx.fillRect(376, fy, W - 376, 2);
      }
      for (let fx = 376; fx < W; fx += 50) {
        ctx.fillRect(fx, 240, 2, 300);
      }

      // Executive Ceiling LED Troffers (Warm white modern panel lights)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(376, 200, W - 376, 40);
      ctx.fillStyle = '#fef08a';
      for (let lx = 420; lx < W - 60; lx += 110) {
        ctx.fillRect(lx, 210, 65, 10);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(lx + 4, 212, 57, 6);
        ctx.fillStyle = '#fef08a';
      }

      // Back Wall Boardroom Glass & Walnut Partition (x: 380 to 680, y: 220 to 260)
      ctx.fillStyle = '#78350f'; // Walnut frame
      ctx.fillRect(380, 230, 290, 8);
      ctx.fillRect(520, 238, 10, 40);
      // Boardroom text banner
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(430, 222, 130, 14);
      ctx.fillStyle = '#38bdf8';
      ctx.font = "7px 'Press Start 2P', monospace";
      ctx.fillText('BOARDROOM', 442, 232);

      // Server Vault Corner in Back-Right (x: 880 to 950, y: 230 to 330)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(870, 220, 90, 110);
      // 3 Server Racks with Blinking LEDs
      for (let sIdx = 0; sIdx < 3; sIdx++) {
        const sx = 878 + sIdx * 26;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(sx, 232, 22, 90);
        ctx.fillStyle = '#020617';
        ctx.fillRect(sx + 2, 236, 18, 82);

        // Blinking Status LEDs
        for (let ly = 240; ly < 310; ly += 8) {
          const isLedOn = (tick + ly * 3 + sIdx * 7) % 24 > 8;
          ctx.fillStyle = isLedOn ? (ly % 16 === 0 ? '#38bdf8' : ly % 24 === 0 ? '#ffbe0b' : '#00f59b') : '#064e3b';
          ctx.fillRect(sx + 4, ly, 4, 4);
          ctx.fillRect(sx + 10, ly, 4, 4);
        }
      }

      // Espresso Coffee Bar Counter (x: 810 to 865, y: 250 to 300)
      ctx.fillStyle = '#334155';
      ctx.fillRect(805, 255, 60, 35);
      // Chrome espresso machine
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(815, 238, 26, 20);
      ctx.fillStyle = '#00f0ff'; // Pressure gauge
      ctx.fillRect(832, 242, 4, 4);
      // Warm espresso cups with rising steam pixels
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(846, 248, 6, 7);
      const steamY = 244 - ((tick % 30) / 30) * 12;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillRect(848 + Math.sin(tick * 0.1) * 2, Math.floor(steamY), 2, 3);

      // ======================================================================
      // F. WORKING AI SPECIALISTS & DESKS
      // ======================================================================

      // HELPER: Draw a Modern Pixel Workstation Desk & Dual Monitors
      const drawWorkstation = (
        dx: number,
        dy: number,
        agentName: string,
        screenAccent: string,
        codeColor: string,
        itemType: 'laptop' | 'tablet' | 'matrix' | 'coffee' | 'duck'
      ) => {
        // Desk surface (Heavy white melamine standing desk)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(dx - 22, dy + 8, 44, 18);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(dx - 22, dy + 24, 44, 3);
        // Desk legs
        ctx.fillStyle = '#475569';
        ctx.fillRect(dx - 20, dy + 27, 4, 25);
        ctx.fillRect(dx + 16, dy + 27, 4, 25);

        // Dual Monitors
        // Left Monitor
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(dx - 20, dy - 18, 20, 24);
        ctx.fillStyle = '#020617';
        ctx.fillRect(dx - 18, dy - 16, 16, 20);
        // Right Monitor
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(dx + 2, dy - 18, 20, 24);
        ctx.fillStyle = '#020617';
        ctx.fillRect(dx + 4, dy - 16, 16, 20);
        // Monitor stand poles
        ctx.fillStyle = '#64748b';
        ctx.fillRect(dx - 11, dy + 6, 3, 4);
        ctx.fillRect(dx + 11, dy + 6, 3, 4);

        // Animated Screen Content (Scrolling code / wireframe / graphs)
        const scrollOffset = (tick * 0.4) % 12;
        ctx.fillStyle = screenAccent;
        for (let scY = dy - 14; scY < dy + 2; scY += 4) {
          const lineY = Math.floor(scY + scrollOffset) % 18 + (dy - 16);
          if (lineY >= dy - 15 && lineY <= dy + 1) {
            ctx.fillRect(dx - 16, lineY, 12, 2);
          }
        }
        ctx.fillStyle = codeColor;
        for (let scY2 = dy - 14; scY2 < dy + 2; scY2 += 4) {
          const lineY2 = Math.floor(scY2 + scrollOffset * 1.2) % 18 + (dy - 16);
          if (lineY2 >= dy - 15 && lineY2 <= dy + 1) {
            ctx.fillRect(dx + 6, lineY2, 12, 2);
          }
        }

        // Mechanical Keyboard
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(dx - 12, dy + 12, 24, 7);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(dx - 10, dy + 13, 20, 5);

        // Desktop Accessories
        if (itemType === 'duck') {
          // Iconic Yellow Debugging Duck
          ctx.fillStyle = '#facc15';
          ctx.fillRect(dx + 13, dy + 10, 7, 6);
          ctx.fillStyle = '#f97316'; // Beak
          ctx.fillRect(dx + 11, dy + 12, 3, 2);
        } else if (itemType === 'coffee') {
          // Coffee Mug
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(dx + 13, dy + 10, 6, 7);
        } else if (itemType === 'tablet') {
          // Digital Drawing Stylus Tablet
          ctx.fillStyle = '#9333ea';
          ctx.fillRect(dx - 20, dy + 11, 8, 10);
        }
      };

      // HELPER: Draw an Animated Working Character Sitting at Desk
      const drawCharacter = (
        cx: number,
        cy: number,
        hairColor: string,
        shirtColor: string,
        skinColor: string,
        isTyping: boolean,
        badgeText: string
      ) => {
        // Aeron-style Office Chair Backrest
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(cx - 10, cy - 8, 20, 24);

        // Character Head (bobbing slightly while typing)
        const bob = isTyping && Math.floor(tick / 12) % 2 === 0 ? 1 : 0;
        const hy = cy - 22 + bob;

        // Hair
        ctx.fillStyle = hairColor;
        ctx.fillRect(cx - 8, hy - 4, 16, 12);
        // Face
        ctx.fillStyle = skinColor;
        ctx.fillRect(cx - 6, hy + 2, 12, 10);
        // Eyes
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cx - 4, hy + 5, 2, 3);
        ctx.fillRect(cx + 2, hy + 5, 2, 3);

        // Body & Shirt
        ctx.fillStyle = shirtColor;
        ctx.fillRect(cx - 9, hy + 12, 18, 16);

        // Animated Arms / Hands Typing on Keyboard
        const armOffset = isTyping ? ((tick % 8) < 4 ? 1 : -1) : 0;
        ctx.fillStyle = skinColor;
        ctx.fillRect(cx - 8 + armOffset, hy + 20, 5, 5);
        ctx.fillRect(cx + 4 - armOffset, hy + 20, 5, 5);
      };

      // 1. ALEX (Senior Dev) at (430, 280)
      drawWorkstation(430, 280, 'Alex', '#22c55e', '#00f59b', 'coffee');
      drawCharacter(430, 274, '#1c1917', '#ea580c', '#fed7aa', true, 'Alex');

      // 2. MAYA (UI/UX Designer) at (520, 280)
      drawWorkstation(520, 280, 'Maya', '#ec4899', '#f472b6', 'tablet');
      drawCharacter(520, 274, '#4a044e', '#db2777', '#ffedd5', true, 'Maya');

      // 3. RAY (AI Researcher) at (610, 280)
      drawWorkstation(610, 280, 'Ray', '#38bdf8', '#0284c7', 'coffee');
      drawCharacter(610, 274, '#3e2723', '#0284c7', '#fed7aa', true, 'Ray');
      // Floating Holographic AI Neural Network Node above Ray's desk
      const rayGlow = (tick * 0.05) % (Math.PI * 2);
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(610 + Math.cos(rayGlow) * 14, 252 + Math.sin(rayGlow) * 8, 4, 4);
      ctx.fillRect(610 - Math.cos(rayGlow) * 14, 252 - Math.sin(rayGlow) * 8, 4, 4);

      // 4. WENDY (Marketing) at (430, 380)
      drawWorkstation(430, 380, 'Wendy', '#f59e0b', '#fbbf24', 'duck');
      drawCharacter(430, 374, '#b45309', '#059669', '#fed7aa', true, 'Wendy');

      // 5. ZANE (Cybersecurity) at (530, 380)
      drawWorkstation(530, 380, 'Zane', '#15803d', '#22c55e', 'coffee');
      drawCharacter(530, 374, '#052e16', '#15803d', '#e2e8f0', true, 'Zane');

      // 6. DYLAN RAMOS (CEO & Founder) Executive Suite at (750, 270)
      // Large Executive Mahogany Desk with Brass Trim
      ctx.fillStyle = '#451a03'; // Mahogany
      ctx.fillRect(720, 272, 60, 24);
      ctx.fillStyle = '#fbbf24'; // Brass accent trim
      ctx.fillRect(720, 294, 60, 2);
      ctx.fillStyle = '#291002'; // Desk Pedestals
      ctx.fillRect(722, 296, 12, 26);
      ctx.fillRect(766, 296, 12, 26);

      // Curved Ultrawide Executive 49" Display
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(732, 244, 38, 26);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(734, 246, 34, 22);
      // Live Stock / KPI Candlestick growth chart on Dylan's monitor
      const chartColors = ['#10b981', '#10b981', '#ef4444', '#10b981', '#10b981', '#10b981'];
      chartColors.forEach((col, idx) => {
        ctx.fillStyle = col;
        const barH = 5 + ((idx * 3 + Math.floor(tick / 20)) % 12);
        ctx.fillRect(737 + idx * 5, 264 - barH, 3, barH);
      });

      // Executive MacBook on Desk
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(742, 278, 16, 11);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(744, 280, 12, 7);

      // Hot Virtual Espresso with rising steam
      ctx.fillStyle = '#ffbe0b';
      ctx.fillRect(765, 276, 7, 8);
      const dylanSteamY = 272 - ((tick % 24) / 24) * 10;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillRect(767, Math.floor(dylanSteamY), 2, 3);

      // Dylan Ramos Character in Executive Aeron
      drawCharacter(750, 264, '#1c1917', '#1e1b4b', '#fde047', true, 'Dylan');
      // Gold Founder Crown Pin
      ctx.fillStyle = '#facc15';
      ctx.fillRect(748, 238, 4, 3);

      // 7. EAH (Executive Partner & Host) in Velvet Lounge at (840, 360)
      // Plush Midnight Rose Velvet Armchair
      ctx.fillStyle = '#be123c';
      ctx.fillRect(825, 345, 36, 40);
      ctx.fillStyle = '#881337'; // Armchair back
      ctx.fillRect(820, 332, 10, 48);
      ctx.fillStyle = '#f43f5e'; // Velvet cushion
      ctx.fillRect(828, 355, 30, 24);

      // Eah Character Sitting with Glowing iPad
      drawCharacter(840, 352, '#1c1917', '#fb7185', '#ffe4d6', false, 'Eah');
      // Glowing iPad in hands
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(835, 366, 12, 10);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(836, 367, 10, 8);

      // Mini Pedestal Table with Gourmet Breakfast Plate & Drink
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(866, 375, 18, 5);
      ctx.fillStyle = '#475569';
      ctx.fillRect(873, 380, 4, 18);
      // Breakfast pancakes
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(868, 370, 8, 4);
      ctx.fillStyle = '#ef4444'; // Strawberry topping
      ctx.fillRect(871, 368, 3, 2);

      // ======================================================================
      // G. THE LOVED OFFICE PETS (Snowy the White Cat & Mochi the Puppy)
      // ======================================================================

      // 1. SNOWY THE WHITE CAT (Cat Sanctuary at 690, 380)
      // Sisal Scratching Tree Post
      ctx.fillStyle = '#78350f';
      ctx.fillRect(682, 405, 24, 6); // Wooden base
      ctx.fillStyle = '#d97706'; // Sisal rope post
      ctx.fillRect(692, 375, 6, 30);
      ctx.fillStyle = '#38bdf8'; // Sky-blue elevated perch
      ctx.fillRect(682, 372, 26, 5);

      // Dangling pink yarn ball with string
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(686, 377);
      ctx.lineTo(686, 388 + Math.sin(tick * 0.1) * 3);
      ctx.stroke();
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(684, Math.floor(387 + Math.sin(tick * 0.1) * 3), 5, 5);

      // Pure White Cat (Snowy) sitting in sky-blue basket on floor
      ctx.fillStyle = '#38bdf8'; // Sky-blue velvet basket
      ctx.fillRect(678, 410, 32, 14);
      ctx.fillStyle = '#e0f2fe'; // Fluff cushion
      ctx.fillRect(681, 412, 26, 10);

      // Pure White Kitty Body
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(686, 402, 18, 14); // Body
      ctx.fillRect(692, 394, 12, 11); // Head
      // Pointed ears with soft pink inside
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(692, 390, 4, 5);
      ctx.fillRect(700, 390, 4, 5);
      ctx.fillStyle = '#fb7185';
      ctx.fillRect(693, 392, 2, 3);
      ctx.fillRect(701, 392, 2, 3);
      // Emerald Green Eyes with blink
      const catBlink = Math.floor(tick / 40) % 6 === 0;
      if (!catBlink) {
        ctx.fillStyle = '#10b981';
        ctx.fillRect(694, 397, 2, 3);
        ctx.fillRect(699, 397, 2, 3);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(694, 398, 2, 1);
        ctx.fillRect(699, 398, 2, 1);
      }
      // Pink Nose
      ctx.fillStyle = '#fb7185';
      ctx.fillRect(697, 400, 2, 2);
      // Sky-blue collar with silver bell
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(693, 404, 10, 2);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(697, 406, 2, 2);
      // Curling white tail swaying gently
      const catTailOffset = Math.sin(tick * 0.08) * 3;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(702, 407, 4, 4);
      ctx.fillRect(705, 404 + catTailOffset, 3, 5);
      ctx.fillRect(707, 401 + catTailOffset, 3, 4);

      // Porcelain milk saucer with white milk
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(714, 418, 12, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(716, 417, 8, 3);

      // 2. MOCHI THE PUPPY (750, 385)
      // Fluffy Dog Donut Bed
      ctx.fillStyle = '#b45309';
      ctx.fillRect(738, 410, 32, 16);
      ctx.fillStyle = '#fef3c7'; // Fluff cushion
      ctx.fillRect(742, 412, 24, 12);

      // Mochi Puppy Body (Warm golden brown shiba)
      ctx.fillStyle = '#d97706';
      ctx.fillRect(746, 402, 18, 14); // Body
      ctx.fillRect(751, 394, 13, 11); // Head
      // White muzzle blaze
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(753, 400, 9, 6);
      // Floppy brown ears
      ctx.fillStyle = '#b45309';
      ctx.fillRect(749, 394, 3, 7);
      ctx.fillRect(763, 394, 3, 7);
      // Shiny brown eyes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(754, 397, 2, 3);
      ctx.fillRect(759, 397, 2, 3);
      // Puppy nose & pink tongue
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(756, 401, 3, 2);
      const pupPanting = Math.floor(tick / 10) % 2 === 0;
      if (pupPanting) {
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(756, 403, 3, 3);
      }
      // Wagging puppy tail
      const pupTail = Math.sin(tick * 0.25) * 4;
      ctx.fillStyle = '#d97706';
      ctx.fillRect(742, 404 + pupTail, 5, 4);

      // Red rubber chew bone toy
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(730, 418, 8, 4);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  // Handle clicking on any character or pet
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 960 / rect.width;
    const scaleY = 540 / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Check hit test against characters
    for (const char of charactersRef.current) {
      if (
        clickX >= char.x - char.width / 2 &&
        clickX <= char.x + char.width / 2 &&
        clickY >= char.y - char.height / 2 &&
        clickY <= char.y + char.height / 2
      ) {
        // Trigger sound
        if (onPlaySound) {
          onPlaySound(char.soundType);
        }

        // Show Speech Bubble
        if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
        setActiveSpeech({
          id: char.id,
          text: char.speech,
          x: char.x,
          y: char.y - char.height / 2 - 14,
          color: char.color,
        });

        speechTimerRef.current = setTimeout(() => {
          setActiveSpeech(null);
        }, 4500);

        return;
      }
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        zIndex: 1,
        pointerEvents: 'auto',
      }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          imageRendering: 'pixelated',
          display: 'block',
          cursor: 'pointer',
        }}
      />

      {/* Floating Retro Speech Bubble overhead active character */}
      {activeSpeech && (
        <div
          style={{
            position: 'absolute',
            left: `${(activeSpeech.x / 960) * 100}%`,
            top: `${(activeSpeech.y / 540) * 100}%`,
            transform: 'translate(-50%, -100%)',
            background: '#0f172a',
            border: `2.5px solid ${activeSpeech.color}`,
            borderRadius: '8px',
            padding: '8px 14px',
            color: '#f8fafc',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '9px',
            lineHeight: 1.45,
            whiteSpace: 'nowrap',
            boxShadow: `0 6px 18px rgba(0, 0, 0, 0.7), 0 0 16px ${activeSpeech.color}60`,
            zIndex: 15,
            pointerEvents: 'none',
            animation: 'retroPopIn 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}
        >
          {activeSpeech.text}
          {/* Arrow */}
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: `6px solid ${activeSpeech.color}`,
            }}
          />
        </div>
      )}
    </div>
  );
}
