'use client';

import React, { useRef, useEffect } from 'react';

interface PixelTechFrontSceneryProps {
  onPlaySound?: (type: 'click' | 'success' | 'error' | 'open' | 'chime' | 'bark' | 'meow' | 'coin') => void;
}

export default function PixelTechFrontScenery({ onPlaySound }: PixelTechFrontSceneryProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    let animationFrameId: number;
    let tick = 0;

    // Animated clouds data matching reference
    const clouds = [
      { x: 30, y: 30, width: 150, height: 46, speed: 0.14 },
      { x: 250, y: 65, width: 120, height: 38, speed: 0.20 },
      { x: 440, y: 25, width: 190, height: 50, speed: 0.11 },
      { x: 710, y: 60, width: 140, height: 42, speed: 0.17 },
      { x: 910, y: 35, width: 170, height: 46, speed: 0.13 },
      { x: -100, y: 75, width: 130, height: 36, speed: 0.18 },
    ];

    // Stepped pixel art foliage clump drawing function (100% Rectangles - NO CIRLCES / HINDI BILOG!)
    const drawPixelFoliageClump = (
      cx: number,
      cy: number,
      w: number,
      h: number,
      darkColor: string,
      midColor: string,
      lightColor: string,
      highlightColor?: string
    ) => {
      const p = 4; // 4px pixel art grid step

      // 1. Dark base outline (stepped pixel cluster)
      ctx.fillStyle = darkColor;
      ctx.fillRect(cx - Math.floor(w * 0.35), cy - Math.floor(h * 0.5), Math.floor(w * 0.7), p * 2);
      ctx.fillRect(cx - Math.floor(w * 0.45), cy - Math.floor(h * 0.4), Math.floor(w * 0.9), p * 2);
      ctx.fillRect(cx - Math.floor(w * 0.5), cy - Math.floor(h * 0.3), w, Math.floor(h * 0.6));
      ctx.fillRect(cx - Math.floor(w * 0.45), cy + Math.floor(h * 0.3), Math.floor(w * 0.9), p * 2);
      ctx.fillRect(cx - Math.floor(w * 0.35), cy + Math.floor(h * 0.4), Math.floor(w * 0.7), p * 2);

      // 2. Midtone inner foliage
      ctx.fillStyle = midColor;
      ctx.fillRect(cx - Math.floor(w * 0.32), cy - Math.floor(h * 0.44), Math.floor(w * 0.64), p * 2);
      ctx.fillRect(cx - Math.floor(w * 0.42), cy - Math.floor(h * 0.34), Math.floor(w * 0.84), Math.floor(h * 0.64));
      ctx.fillRect(cx - Math.floor(w * 0.32), cy + Math.floor(h * 0.28), Math.floor(w * 0.64), p * 2);

      // 3. Highlight clusters on top and left (stepped pixel chunks)
      ctx.fillStyle = lightColor;
      ctx.fillRect(cx - Math.floor(w * 0.35), cy - Math.floor(h * 0.38), Math.floor(w * 0.45), p * 2);
      ctx.fillRect(cx - Math.floor(w * 0.4), cy - Math.floor(h * 0.3), Math.floor(w * 0.5), p * 3);
      ctx.fillRect(cx - Math.floor(w * 0.38), cy - Math.floor(h * 0.15), Math.floor(w * 0.4), p * 3);

      // 4. Bright specular highlight tip
      if (highlightColor) {
        ctx.fillStyle = highlightColor;
        ctx.fillRect(cx - Math.floor(w * 0.28), cy - Math.floor(h * 0.34), Math.floor(w * 0.25), p * 2);
        ctx.fillRect(cx - Math.floor(w * 0.32), cy - Math.floor(h * 0.26), Math.floor(w * 0.28), p * 2);
      }
    };

    // Stepped pixel 5-pixel flower (White or Pink with yellow center)
    const drawPixelFlower = (fx: number, fy: number, isPink: boolean) => {
      ctx.fillStyle = isPink ? '#f472b6' : '#ffffff';
      ctx.fillRect(fx - 2, fy - 1, 5, 3);
      ctx.fillRect(fx - 1, fy - 2, 3, 5);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(fx, fy, 1, 1);
    };

    const render = () => {
      tick++;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // =========================================================================
      // 1. SKY GRADIENT (Bright nostalgic pastel blue to soft cyan)
      // =========================================================================
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#78beff');
      skyGrad.addColorStop(0.35, '#99d2fe');
      skyGrad.addColorStop(0.65, '#c5e6fe');
      skyGrad.addColorStop(0.9, '#e4f4fe');
      skyGrad.addColorStop(1, '#f1f9fe');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // =========================================================================
      // 2. PIXEL CLOUDS (16-bit stepped shaded with white top, soft cyan underside)
      // =========================================================================
      clouds.forEach((cloud) => {
        cloud.x += cloud.speed;
        if (cloud.x > width + 100) cloud.x = -cloud.width - 50;

        const cx = Math.floor(cloud.x);
        const cy = Math.floor(cloud.y);
        const cw = cloud.width;
        const ch = cloud.height;

        // Cloud shadow / outline (soft lavender blue)
        ctx.fillStyle = '#b6dcf8';
        ctx.fillRect(cx + 4, cy + 6, cw - 8, ch - 2);
        ctx.fillRect(cx + 12, cy + 2, cw - 24, ch + 4);

        // Cloud body (white)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx + 6, cy + 4, cw - 12, ch - 6);
        ctx.fillRect(cx + 14, cy, cw - 28, ch);

        // Puffy cloud lobes
        ctx.fillRect(cx + 20, cy - 8, 36, 12);
        ctx.fillRect(cx + cw - 56, cy - 6, 32, 10);
      });

      // =========================================================================
      // =========================================================================
      // 3. 16-BIT PIXEL ART CITY SILHOUETTES (Pure Shadow Buildings - Zero Window Clutter)
      // =========================================================================
      const drawPixelBuilding = (
        bx: number,
        by: number,
        bw: number,
        bh: number,
        colors: {
          body: string;
          highlight: string;
          shadow: string;
        },
        extras?: {
          hasAntenna?: boolean;
          hasWaterTower?: boolean;
          hasPenthouse?: boolean;
        }
      ) => {
        // 1. Main Facade Body (Pure Shadow Silhouette - Clean & Uncluttered)
        ctx.fillStyle = colors.body;
        ctx.fillRect(bx, by, bw, bh);

        // 2. Subtle Sunlit Cornice Rim (Top 2px & Left 2px)
        ctx.fillStyle = colors.highlight;
        ctx.fillRect(bx, by, bw, 2);
        ctx.fillRect(bx, by, 2, bh);

        // 3. Subtle Under-Cornice & Right Edge Shadow (2px)
        ctx.fillStyle = colors.shadow;
        ctx.fillRect(bx, by + 2, bw, 2);
        ctx.fillRect(bx + bw - 3, by, 3, bh);

        // 4. Rooftop Silhouette Accessories
        if (extras?.hasPenthouse) {
          const pw = Math.floor(bw * 0.45);
          const ph = 14;
          const px = bx + Math.floor((bw - pw) / 2);
          const py = by - ph;

          ctx.fillStyle = colors.body;
          ctx.fillRect(px, py, pw, ph);
          ctx.fillStyle = colors.highlight;
          ctx.fillRect(px, py, pw, 2);
          ctx.fillRect(px, py, 2, ph);
          ctx.fillStyle = colors.shadow;
          ctx.fillRect(px + pw - 2, py, 2, ph);
        }

        if (extras?.hasWaterTower) {
          const tx = bx + bw - 20;
          const ty = by - 22;

          // Water tower stilts in silhouette shadow
          ctx.fillStyle = colors.shadow;
          ctx.fillRect(tx + 2, ty + 11, 2, 8);
          ctx.fillRect(tx + 11, ty + 11, 2, 8);
          ctx.fillRect(tx + 3, ty + 14, 9, 1);

          // Tank body in muted silhouette slate
          ctx.fillStyle = colors.body;
          ctx.fillRect(tx, ty + 2, 15, 10);
          ctx.fillStyle = colors.shadow;
          ctx.fillRect(tx, ty + 5, 15, 1);
          ctx.fillRect(tx, ty + 9, 15, 1);

          // Roof cone
          ctx.fillStyle = colors.highlight;
          ctx.fillRect(tx + 2, ty, 11, 2);
          ctx.fillRect(tx + 5, ty - 2, 5, 2);
        }

        if (extras?.hasAntenna) {
          const ax = bx + Math.floor(bw / 2);
          const ay = by - (extras.hasPenthouse ? 20 : 6);

          ctx.fillStyle = colors.shadow;
          ctx.fillRect(ax - 2, ay - 4, 4, 4);
          ctx.fillRect(ax - 1, ay - 18, 2, 14);
          ctx.fillRect(ax, ay - 24, 1, 6);

          // Soft dim red aviation beacon
          const isBlink = Math.floor(tick / 40) % 2 === 0;
          ctx.fillStyle = isBlink ? '#dc2626' : '#7f1d1d';
          ctx.fillRect(ax - 1, ay - 26, 2, 2);
        }
      };

      // Layer 1: Distant hazy atmospheric background silhouettes (Framed on flanks, low in center)
      const towersFar = [
        // Left flank
        { x: -10, w: 65, h: 160 },
        { x: 50, w: 75, h: 195 },
        { x: 120, w: 60, h: 145 },
        { x: 175, w: 85, h: 180 },
        // Center valley (LOW HORIZON - Keeps center sky completely open for AVERO title!)
        { x: 260, w: 90, h: 65 },
        { x: 350, w: 95, h: 55 },
        { x: 445, w: 90, h: 60 },
        { x: 535, w: 95, h: 55 },
        { x: 630, w: 85, h: 65 },
        // Right flank
        { x: 715, w: 80, h: 175 },
        { x: 790, w: 85, h: 195 },
        { x: 870, w: 75, h: 160 },
        { x: 940, w: 60, h: 145 },
      ];
      towersFar.forEach((t) => {
        const topY = 330 - t.h;
        ctx.fillStyle = '#a2c4e8';
        ctx.fillRect(t.x, topY, t.w, t.h + 80);
        ctx.fillStyle = '#b5d3f2';
        ctx.fillRect(t.x, topY, t.w, 2);
        if (t.h > 100) {
          ctx.fillStyle = '#91b3d8';
          ctx.fillRect(t.x + Math.floor(t.w / 2) - 1, topY - 12, 2, 12);
        }
      });

      // Layer 2: Main 16-Bit Pixel Art City Skyline (Soft Shadow Silhouettes)
      const shadowPalettes = [
        // Palette 0: Cool Slate Shadow
        {
          body: '#7599c2',
          highlight: '#88acd4',
          shadow: '#6184ac',
        },
        // Palette 1: Soft Lavender-Slate Shadow
        {
          body: '#7c8fa8',
          highlight: '#8fa2bb',
          shadow: '#687a93',
        },
        // Palette 2: Soft Dusty Warm-Shadow (Reference Art Tone)
        {
          body: '#988fa0',
          highlight: '#aba2b2',
          shadow: '#837b8b',
        },
      ];

      const midBuildings = [
        // Left Skyscraper Cluster (Flanking the left side)
        { x: -15, w: 70, h: 165, palIdx: 2, waterTower: true, antenna: false, penthouse: false },
        { x: 50, w: 80, h: 205, palIdx: 0, waterTower: false, antenna: true, penthouse: true },
        { x: 125, w: 65, h: 150, palIdx: 1, waterTower: false, antenna: false, penthouse: false },
        { x: 185, w: 85, h: 190, palIdx: 0, waterTower: true, antenna: true, penthouse: false },
        // Center Valley Skyline (Low horizon shadow blocks, leaving upper sky completely clear for Title & Team!)
        { x: 265, w: 85, h: 60, palIdx: 1, waterTower: false, antenna: false, penthouse: false },
        { x: 345, w: 90, h: 50, palIdx: 0, waterTower: false, antenna: false, penthouse: false },
        { x: 430, w: 95, h: 55, palIdx: 2, waterTower: false, antenna: false, penthouse: false },
        { x: 520, w: 90, h: 48, palIdx: 1, waterTower: false, antenna: false, penthouse: false },
        { x: 605, w: 85, h: 58, palIdx: 0, waterTower: false, antenna: false, penthouse: false },
        // Right Skyscraper Cluster (Flanking the right side)
        { x: 685, w: 80, h: 175, palIdx: 2, waterTower: false, antenna: true, penthouse: true },
        { x: 760, w: 90, h: 210, palIdx: 0, waterTower: true, antenna: true, penthouse: false },
        { x: 845, w: 80, h: 165, palIdx: 1, waterTower: false, antenna: false, penthouse: true },
        { x: 920, w: 70, h: 145, palIdx: 2, waterTower: true, antenna: false, penthouse: false },
      ];

      midBuildings.forEach((b) => {
        const topY = 340 - b.h;
        const pal = shadowPalettes[b.palIdx];
        drawPixelBuilding(
          b.x,
          topY,
          b.w,
          b.h + 80,
          pal,
          {
            hasWaterTower: b.waterTower,
            hasAntenna: b.antenna,
            hasPenthouse: b.penthouse,
          }
        );
      });

      // =========================================================================
      // 4. TELEPHONE & FIBER-OPTIC POWER POLES (Flanked on Sides - Center 100% Clear!)
      // =========================================================================
      // Left Utility Pole
      ctx.fillStyle = '#5a738c';
      ctx.fillRect(60, 130, 8, 230);
      ctx.fillRect(38, 150, 52, 6);
      ctx.fillRect(44, 175, 40, 5);
      // Transformers & insulators
      ctx.fillStyle = '#6f88a3';
      ctx.fillRect(40, 144, 6, 6);
      ctx.fillRect(80, 144, 6, 6);
      ctx.fillRect(46, 170, 5, 5);
      ctx.fillRect(75, 170, 5, 5);
      ctx.fillRect(68, 165, 12, 18);

      // Left Wires (Connecting from off-screen left to pole, and curving gently into left hedge)
      ctx.strokeStyle = '#5a738c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-10, 130);
      ctx.bezierCurveTo(20, 140, 40, 145, 64, 146);
      ctx.bezierCurveTo(110, 180, 160, 220, 210, 280);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-10, 155);
      ctx.bezierCurveTo(20, 165, 40, 170, 64, 172);
      ctx.bezierCurveTo(100, 200, 150, 240, 195, 290);
      ctx.stroke();

      // Right Utility Pole
      ctx.fillStyle = '#5a738c';
      ctx.fillRect(900, 135, 8, 225);
      ctx.fillRect(878, 155, 52, 6);
      ctx.fillRect(884, 180, 40, 5);
      ctx.fillStyle = '#6f88a3';
      ctx.fillRect(880, 149, 6, 6);
      ctx.fillRect(920, 149, 6, 6);
      ctx.fillRect(886, 175, 5, 5);
      ctx.fillRect(915, 175, 5, 5);

      // Right Wires (Connecting from right hedge to pole, and off-screen right)
      ctx.beginPath();
      ctx.moveTo(760, 280);
      ctx.bezierCurveTo(810, 220, 860, 180, 904, 151);
      ctx.bezierCurveTo(925, 145, 950, 140, 980, 130);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(775, 290);
      ctx.bezierCurveTo(820, 240, 870, 200, 904, 177);
      ctx.bezierCurveTo(925, 170, 950, 165, 980, 155);
      ctx.stroke();

      // =========================================================================
      // 5. MIDGROUND PIXEL TREES (100% Pixel Clumps - NO CIRCLES!)
      // =========================================================================
      // Background pixel hedge layer (Deep Emerald)
      for (let x = -20; x < width + 40; x += 44) {
        drawPixelFoliageClump(x, 340, 58, 48, '#14532d', '#15803d', '#22c55e', '#4ade80');
      }

      // Left Pixel Sakura Cherry Blossom Tree
      // Stepped pixel trunk
      ctx.fillStyle = '#78350f';
      ctx.fillRect(110, 280, 16, 95);
      ctx.fillRect(96, 310, 16, 10);
      ctx.fillRect(124, 298, 18, 10);
      ctx.fillRect(104, 345, 28, 8);
      // Sakura foliage pixel clumps (Pink stepped blocks)
      drawPixelFoliageClump(110, 240, 74, 58, '#e11d48', '#f43f5e', '#fb7185', '#fecdd3');
      drawPixelFoliageClump(70, 255, 56, 46, '#e11d48', '#f43f5e', '#fb7185', '#fecdd3');
      drawPixelFoliageClump(150, 250, 62, 50, '#e11d48', '#f43f5e', '#fb7185', '#fecdd3');
      drawPixelFoliageClump(115, 205, 54, 42, '#f43f5e', '#fb7185', '#fda4af', '#fff1f2');

      // Right Pixel Garden Tree
      ctx.fillStyle = '#78350f';
      ctx.fillRect(860, 280, 16, 95);
      ctx.fillRect(846, 310, 16, 10);
      ctx.fillRect(874, 300, 18, 10);
      // Green stepped pixel foliage
      drawPixelFoliageClump(860, 240, 72, 56, '#14532d', '#15803d', '#22c55e', '#86efac');
      drawPixelFoliageClump(820, 255, 56, 46, '#14532d', '#16a34a', '#4ade80', '#bbf7d0');
      drawPixelFoliageClump(900, 250, 58, 48, '#14532d', '#15803d', '#22c55e', '#86efac');

      // Drifting Sakura Petals in the breeze (square pixels)
      const petalCount = 16;
      ctx.fillStyle = '#fb7185';
      for (let p = 0; p < petalCount; p++) {
        const px = ((p * 75 + tick * 0.7) % (width + 60)) - 30;
        const py = 190 + ((p * 45 + tick * 0.4) % 270);
        const pSize = 3 + (p % 3);
        ctx.fillRect(px, py, pSize, pSize);
      }

      // =========================================================================
      // 6. FOREGROUND LUSH PIXEL BUSHES & BLOOMING FLOWERS (Matching Reference Screenshot)
      // =========================================================================
      const bushPalettes = [
        { dark: '#14532d', mid: '#16a34a', light: '#22c55e', highlight: '#86efac' },
        { dark: '#064e3b', mid: '#15803d', light: '#4ade80', highlight: '#bbf7d0' },
      ];

      // Layer 1: Mid-foreground pixel bushes
      for (let bx = -30; bx < width + 50; bx += 36) {
        const pal = bushPalettes[Math.abs(Math.floor(bx / 36)) % bushPalettes.length];
        const by = 380 + Math.floor(Math.sin(bx * 0.04) * 8);
        drawPixelFoliageClump(bx, by, 52, 44, pal.dark, pal.mid, pal.light, pal.highlight);
      }

      // Layer 2: Immediate foreground pixel bushes with blooming white & pink flowers
      for (let bx = -25; bx < width + 45; bx += 32) {
        const pal = bushPalettes[Math.abs(Math.floor(bx / 32) + 1) % bushPalettes.length];
        const by = 420 + Math.floor(Math.sin(bx * 0.05) * 6);
        drawPixelFoliageClump(bx, by, 48, 42, pal.dark, pal.mid, pal.light, pal.highlight);

        // Blooming 5-pixel flowers on foliage (White and Pink)
        if (Math.abs(bx * 7) % 3 === 0) {
          const fx = bx + 2;
          const fy = by - 14;
          const isPink = Math.abs(bx) % 2 === 0;
          drawPixelFlower(fx, fy, isPink);
        }
        if (Math.abs(bx * 5) % 4 === 0) {
          const fx = bx - 10;
          const fy = by - 6;
          drawPixelFlower(fx, fy, true);
        }
      }

      // =========================================================================
      // 7. BOTTOM SIDEWALK & SAFETY BALCONY RAILING (Identical to Reference Picture)
      // =========================================================================
      const terraceY = height - 52;
      // Sidewalk concrete pavement
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, terraceY, width, height - terraceY);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, terraceY + 4, width, 6);
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, terraceY + 10, width, height - terraceY - 10);

      // Pavement tile dividers
      ctx.fillStyle = '#334155';
      for (let px = 0; px < width; px += 48) {
        ctx.fillRect(px, terraceY + 4, 3, height - terraceY - 4);
      }

      // Bottom metallic safety railing (Matching reference image)
      const railTopY = height - 38;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, railTopY, width, 5);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, railTopY + 1, width, 3);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, railTopY + 4, width, 1);

      // Vertical railing posts
      for (let rx = 24; rx < width; rx += 64) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(rx - 1, railTopY + 4, 10, 34);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(rx, railTopY + 5, 8, 33);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(rx + 1, railTopY + 5, 2, 33);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(rx + 6, railTopY + 5, 2, 33);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        width={960}
        height={540}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          imageRendering: 'pixelated',
          display: 'block',
        }}
      />
    </div>
  );
}
