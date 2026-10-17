'use client';

/**
 * Authentic 8-bit Retro Arcade Web Audio Chiptune Synthesizer & BGM Engine
 * Generates genuine NES / Game Boy style polyphonic music and sound effects
 * entirely client-side without external audio files.
 */

// Note frequency map (in Hz)
const NOTE: Record<string, number> = {
  REST: 0,
  C2: 65.41,
  D2: 73.42,
  E2: 82.41,
  F2: 87.31,
  G2: 98.0,
  A2: 110.0,
  B2: 123.47,
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
  B5: 987.77,
  C6: 1046.5,
  D6: 1174.66,
  E6: 1318.51,
};

// Singleton AudioContext
let audioCtx: AudioContext | null = null;
let bgmMasterGain: GainNode | null = null;
let bgmIntervalId: ReturnType<typeof setInterval> | null = null;
let isBgmActive = false;
let currentBgmStep = 0;
let nextNoteTime = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// 8-Bit Drum noise buffer generator
let noiseBuffer: AudioBuffer | null = null;
function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    const bufferSize = ctx.sampleRate * 0.15; // 150ms noise burst
    noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }
  return noiseBuffer;
}

/* =========================================================================
   1. RETRO SOUND EFFECTS (SFX)
   ========================================================================= */

export type ArcadeSfxType =
  | 'click'
  | 'hover'
  | 'success'
  | 'error'
  | 'open'
  | 'chime'
  | 'coin'
  | 'key'
  | 'bark'
  | 'meow';

export function playArcadeSfx(type: ArcadeSfxType, volume = 0.1) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'hover') {
      // Subtle 8-bit blip
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(820, now + 0.03);
      gain.gain.setValueAtTime(volume * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.035);
    } else if (type === 'key') {
      // Mechanical 8-bit typing tick
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(420 + Math.random() * 80, now);
      gain.gain.setValueAtTime(volume * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.025);
    } else if (type === 'click') {
      // Retro Select Button
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
      gain.gain.setValueAtTime(volume * 0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'coin') {
      // Super Mario style high coin sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.07); // E6
      gain.gain.setValueAtTime(volume * 0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    } else if (type === 'open') {
      // Upward warp / modal open
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.14);
      gain.gain.setValueAtTime(volume * 0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } else if (type === 'success') {
      // Ascending triumphant victory fanfare
      const melody = [523.25, 659.25, 783.99, 1046.5];
      melody.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        const start = now + i * 0.09;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(volume * 0.8, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.18);
      });
    } else if (type === 'error') {
      // Low retro failure buzzer
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(120, now + 0.12);
      gain.gain.setValueAtTime(volume * 0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === 'chime') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.14);
      gain.gain.setValueAtTime(volume * 0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'bark') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(210, now + 0.12);
      gain.gain.setValueAtTime(volume * 0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } else if (type === 'meow') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(640, now);
      osc.frequency.exponentialRampToValueAtTime(920, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.2);
      gain.gain.setValueAtTime(volume * 0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch {}
}

/* =========================================================================
   2. AUTHENTIC 8-BIT ARCADE BGM COMPOSITION (Upbeat Chiptune Title Theme)
   ========================================================================= */

// 16-step patterns looped across 4 measures (64 total 16th-note steps)
// Track 1: Square Lead Melody
const LEAD_TRACK: string[] = [
  // Measure 1: C major punchy start
  'C5', 'REST', 'E5', 'REST', 'G5', 'REST', 'C6', 'REST',
  'G5', 'E5', 'REST', 'C5', 'D5', 'REST', 'E5', 'REST',
  // Measure 2: G/B joyful bounce
  'D5', 'REST', 'G5', 'REST', 'B5', 'REST', 'D6', 'REST',
  'B5', 'G5', 'REST', 'D5', 'C5', 'REST', 'D5', 'REST',
  // Measure 3: A minor heroic groove
  'E5', 'REST', 'A5', 'REST', 'C6', 'REST', 'E6', 'REST',
  'C6', 'A5', 'REST', 'E5', 'D5', 'REST', 'E5', 'REST',
  // Measure 4: F major to G turnaround
  'F5', 'REST', 'A5', 'REST', 'C6', 'REST', 'A5', 'REST',
  'G5', 'REST', 'B5', 'REST', 'D6', 'REST', 'G5', 'REST',
];

// Track 2: Triangle Bouncing Bassline
const BASS_TRACK: string[] = [
  // Measure 1: C chord
  'C3', 'REST', 'C4', 'REST', 'G3', 'REST', 'C4', 'REST',
  'C3', 'REST', 'C4', 'REST', 'G3', 'REST', 'C4', 'REST',
  // Measure 2: G chord
  'G2', 'REST', 'G3', 'REST', 'D3', 'REST', 'G3', 'REST',
  'G2', 'REST', 'G3', 'REST', 'D3', 'REST', 'G3', 'REST',
  // Measure 3: Am chord
  'A2', 'REST', 'A3', 'REST', 'E3', 'REST', 'A3', 'REST',
  'A2', 'REST', 'A3', 'REST', 'E3', 'REST', 'A3', 'REST',
  // Measure 4: F to G turnaround
  'F2', 'REST', 'F3', 'REST', 'C3', 'REST', 'F3', 'REST',
  'G2', 'REST', 'G3', 'REST', 'D3', 'REST', 'G3', 'REST',
];

// Track 3: Fast 16th-note Arpeggio Sparkle (Authentic Chiptune effect)
const ARP_CHORDS = [
  ['C4', 'E4', 'G4', 'C5'], // Bar 1: C
  ['G3', 'B3', 'D4', 'G4'], // Bar 2: G
  ['A3', 'C4', 'E4', 'A4'], // Bar 3: Am
  ['F3', 'A3', 'C4', 'F4'], // Bar 4: F
];

// 132 BPM => 16th note = (60 / 132) / 4 ≈ 0.1136s
const STEP_TIME = 0.1136;

function scheduleStep(ctx: AudioContext, masterGain: GainNode, step: number, time: number) {
  const stepInBar = step % 64;
  const barIndex = Math.floor(stepInBar / 16);
  const chord = ARP_CHORDS[barIndex];

  // 1. Lead Melody Note (Square Wave)
  const leadNote = LEAD_TRACK[stepInBar];
  if (leadNote && leadNote !== 'REST' && NOTE[leadNote]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(NOTE[leadNote], time);

    // Punchy 8-bit envelope
    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + STEP_TIME * 1.6);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(time);
    osc.stop(time + STEP_TIME * 1.6);
  }

  // 2. Bassline Note (Triangle Wave)
  const bassNote = BASS_TRACK[stepInBar];
  if (bassNote && bassNote !== 'REST' && NOTE[bassNote]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(NOTE[bassNote], time);

    gain.gain.setValueAtTime(0.16, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + STEP_TIME * 1.8);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(time);
    osc.stop(time + STEP_TIME * 1.8);
  }

  // 3. Arpeggio Chiptune Shimmer (Light 25% duty pulse / square)
  const arpNote = chord[step % 4];
  if (arpNote && NOTE[arpNote]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(NOTE[arpNote], time);

    gain.gain.setValueAtTime(0.035, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + STEP_TIME * 0.9);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(time);
    osc.stop(time + STEP_TIME * 0.9);
  }

  // 4. 8-Bit Retro Drum (Hi-hat every 2 steps, Snare on beats 4 & 12 in each 16-step bar)
  const isSnare = stepInBar % 8 === 4;
  const isHiHat = stepInBar % 2 === 0 && !isSnare;

  if (isSnare || isHiHat) {
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    if (isSnare) {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, time);
      gain.gain.setValueAtTime(0.1, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      noise.start(time);
      noise.stop(time + 0.12);
    } else if (isHiHat) {
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7000, time);
      gain.gain.setValueAtTime(0.035, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      noise.start(time);
      noise.stop(time + 0.04);
    }
  }
}

/**
 * Starts or resumes the authentic 8-bit game background music loop.
 */
export function startArcadeBgm(volume = 0.15) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return false;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (isBgmActive) return true;

    // Create or reuse master BGM gain node
    if (!bgmMasterGain) {
      bgmMasterGain = ctx.createGain();
      bgmMasterGain.connect(ctx.destination);
    }

    // Smoothly fade in volume
    bgmMasterGain.gain.cancelScheduledValues(ctx.currentTime);
    bgmMasterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    bgmMasterGain.gain.exponentialRampToValueAtTime(Math.max(0.01, volume), ctx.currentTime + 0.1);

    isBgmActive = true;
    nextNoteTime = ctx.currentTime + 0.05;
    currentBgmStep = 0;

    // Schedule ahead loop (Web Audio clock scheduling pattern)
    bgmIntervalId = setInterval(() => {
      if (!isBgmActive || !ctx || !bgmMasterGain) return;
      // Schedule notes up to 250ms ahead
      while (nextNoteTime < ctx.currentTime + 0.25) {
        scheduleStep(ctx, bgmMasterGain, currentBgmStep, nextNoteTime);
        nextNoteTime += STEP_TIME;
        currentBgmStep++;
      }
    }, 60);

    return true;
  } catch {
    return false;
  }
}

/**
 * Stops the 8-bit game background music loop smoothly.
 */
export function stopArcadeBgm() {
  try {
    if (bgmIntervalId) {
      clearInterval(bgmIntervalId);
      bgmIntervalId = null;
    }
    if (audioCtx && bgmMasterGain) {
      bgmMasterGain.gain.cancelScheduledValues(audioCtx.currentTime);
      bgmMasterGain.gain.setValueAtTime(bgmMasterGain.gain.value, audioCtx.currentTime);
      bgmMasterGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);
    }
    isBgmActive = false;
  } catch {}
}

/**
 * Toggles BGM on or off.
 */
export function toggleArcadeBgm(volume = 0.15): boolean {
  if (isBgmActive) {
    stopArcadeBgm();
    return false;
  } else {
    startArcadeBgm(volume);
    return true;
  }
}

/**
 * Returns whether BGM is actively playing.
 */
export function isArcadeBgmPlaying(): boolean {
  return isBgmActive;
}

/**
 * Adjusts master BGM volume.
 */
export function setArcadeBgmVolume(volume: number) {
  if (audioCtx && bgmMasterGain) {
    bgmMasterGain.gain.cancelScheduledValues(audioCtx.currentTime);
    bgmMasterGain.gain.setValueAtTime(Math.max(0.0001, volume), audioCtx.currentTime);
  }
}
