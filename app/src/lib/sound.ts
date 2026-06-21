// Optional UI sound effects, synthesized with WebAudio (no audio files shipped).
// Off by default; users pick one of several sounds in Settings → Sound.
const ENABLED_KEY = 'forage.sound.v1';
const CHOICE_KEY = 'forage.sound.choice.v1';
const TRASH_KEY = 'forage.sound.trash.v1';

export function getSoundEnabled(): boolean {
  try {
    return localStorage.getItem(ENABLED_KEY) === '1';
  } catch {
    return false;
  }
}
export function setSoundEnabled(on: boolean) {
  try {
    if (on) localStorage.setItem(ENABLED_KEY, '1');
    else localStorage.removeItem(ENABLED_KEY);
  } catch {
    /* non-fatal */
  }
}
export function getSoundId(): string {
  try {
    return localStorage.getItem(CHOICE_KEY) || 'pop';
  } catch {
    return 'pop';
  }
}
export function setSoundId(id: string) {
  try {
    localStorage.setItem(CHOICE_KEY, id);
  } catch {
    /* non-fatal */
  }
}
export function getTrashId(): string {
  try {
    return localStorage.getItem(TRASH_KEY) || 'thud';
  } catch {
    return 'thud';
  }
}
export function setTrashId(id: string) {
  try {
    localStorage.setItem(TRASH_KEY, id);
  } catch {
    /* non-fatal */
  }
}

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  try {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = ctx ?? new AC();
    return ctx;
  } catch {
    return null;
  }
}

interface Blip {
  type?: OscillatorType;
  from: number;
  to?: number;
  dur: number;
  gain?: number;
  at?: number; // delay from start, seconds
}
function blip(ac: AudioContext, t0: number, b: Blip, mult = 1) {
  const t = t0 + (b.at ?? 0);
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = b.type ?? 'sine';
  osc.frequency.setValueAtTime(b.from * mult, t);
  if (b.to) osc.frequency.exponentialRampToValueAtTime(b.to * mult, t + b.dur);
  const peak = b.gain ?? 0.12;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + b.dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + b.dur + 0.03);
}

// A single white-noise buffer, reused — the raw material for crumple/whoosh
// textures that make the delete cues feel physical rather than chiptune.
let noiseBuf: AudioBuffer | null = null;
function noise(ac: AudioContext): AudioBuffer {
  if (noiseBuf && noiseBuf.sampleRate === ac.sampleRate) return noiseBuf;
  const len = Math.floor(ac.sampleRate * 0.8);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  noiseBuf = buf;
  return buf;
}

interface NoiseHit {
  dur: number;
  filter?: BiquadFilterType;
  from: number; // filter cutoff start
  to?: number; // filter cutoff end (sweep)
  q?: number;
  gain?: number;
  at?: number;
}
/** A burst of filtered noise — the building block for crumple/whoosh sounds. */
function hit(ac: AudioContext, t0: number, n: NoiseHit) {
  const t = t0 + (n.at ?? 0);
  const src = ac.createBufferSource();
  src.buffer = noise(ac);
  const f = ac.createBiquadFilter();
  f.type = n.filter ?? 'lowpass';
  f.frequency.setValueAtTime(Math.max(40, n.from), t);
  if (n.to) f.frequency.exponentialRampToValueAtTime(Math.max(40, n.to), t + n.dur);
  f.Q.value = n.q ?? 0.7;
  const g = ac.createGain();
  const peak = n.gain ?? 0.16;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);
  src.connect(f).connect(g).connect(ac.destination);
  src.start(t);
  src.stop(t + n.dur + 0.02);
}

export interface TrashDef {
  id: string;
  name: string;
  render: (ac: AudioContext, t0: number) => void;
}

// Ten "send it to the trash" cues — softer and more physical than the old
// chiptune swoop. Most lean on filtered noise (crumples, whooshes) with the
// odd low tone for body.
export const TRASH_SOUNDS: TrashDef[] = [
  {
    id: 'thud',
    name: 'Soft thud',
    render: (ac, t) => {
      blip(ac, t, { type: 'sine', from: 180, to: 70, dur: 0.18, gain: 0.16 });
      hit(ac, t, { from: 500, to: 160, dur: 0.12, gain: 0.05 });
    },
  },
  {
    id: 'crumple',
    name: 'Paper crumple',
    render: (ac, t) => {
      hit(ac, t, { filter: 'highpass', from: 1400, dur: 0.05, q: 0.6, gain: 0.1 });
      hit(ac, t, { filter: 'highpass', from: 1800, dur: 0.04, q: 0.6, gain: 0.09, at: 0.05 });
      hit(ac, t, { filter: 'bandpass', from: 2200, dur: 0.06, q: 0.8, gain: 0.11, at: 0.1 });
      hit(ac, t, { filter: 'highpass', from: 1600, dur: 0.05, q: 0.6, gain: 0.08, at: 0.17 });
    },
  },
  {
    id: 'whoosh',
    name: 'Whoosh',
    render: (ac, t) => {
      hit(ac, t, { filter: 'lowpass', from: 1800, to: 300, dur: 0.32, q: 1.2, gain: 0.16 });
    },
  },
  {
    id: 'swipe',
    name: 'Swipe',
    render: (ac, t) => {
      hit(ac, t, { filter: 'bandpass', from: 700, to: 2600, dur: 0.16, q: 1.4, gain: 0.16 });
    },
  },
  {
    id: 'drop',
    name: 'Drop',
    render: (ac, t) => {
      blip(ac, t, { type: 'sine', from: 420, to: 110, dur: 0.24, gain: 0.15 });
      hit(ac, t, { from: 900, to: 200, dur: 0.18, gain: 0.04 });
    },
  },
  {
    id: 'poof',
    name: 'Poof',
    render: (ac, t) => {
      hit(ac, t, { filter: 'lowpass', from: 1200, to: 500, dur: 0.14, q: 0.5, gain: 0.18 });
    },
  },
  {
    id: 'vacuum',
    name: 'Suck in',
    render: (ac, t) => {
      hit(ac, t, { filter: 'lowpass', from: 300, to: 1700, dur: 0.22, q: 1, gain: 0.12 });
      blip(ac, t, { type: 'sine', from: 160, to: 360, dur: 0.22, gain: 0.06 });
    },
  },
  {
    id: 'tap',
    name: 'Muffled tap',
    render: (ac, t) => {
      blip(ac, t, { type: 'triangle', from: 240, to: 150, dur: 0.1, gain: 0.14 });
      hit(ac, t, { filter: 'lowpass', from: 800, dur: 0.04, gain: 0.06 });
    },
  },
  {
    id: 'sweep',
    name: 'Sweep out',
    render: (ac, t) => {
      hit(ac, t, { filter: 'bandpass', from: 2400, to: 500, dur: 0.26, q: 2, gain: 0.16 });
    },
  },
  {
    id: 'whoomp',
    name: 'Low whoomp',
    render: (ac, t) => {
      blip(ac, t, { type: 'sine', from: 150, to: 95, dur: 0.28, gain: 0.18 });
      blip(ac, t, { type: 'sine', from: 300, to: 190, dur: 0.18, gain: 0.05, at: 0.01 });
    },
  },
];

export interface SoundDef {
  id: string;
  name: string;
  blips: Blip[];
}

export const SOUNDS: SoundDef[] = [
  { id: 'pop', name: 'Pop', blips: [{ from: 620, to: 880, dur: 0.16 }] },
  { id: 'click', name: 'Click', blips: [{ type: 'square', from: 420, dur: 0.05, gain: 0.07 }] },
  { id: 'bubble', name: 'Bubble', blips: [{ from: 900, to: 480, dur: 0.18 }] },
  {
    id: 'chime',
    name: 'Chime',
    blips: [
      { from: 880, dur: 0.18, gain: 0.1 },
      { from: 1320, dur: 0.24, gain: 0.08, at: 0.09 },
    ],
  },
  { id: 'ding', name: 'Ding', blips: [{ type: 'triangle', from: 1500, dur: 0.3, gain: 0.09 }] },
  { id: 'tick', name: 'Tick', blips: [{ type: 'square', from: 1200, dur: 0.03, gain: 0.05 }] },
  { id: 'marimba', name: 'Marimba', blips: [{ from: 523, dur: 0.26, gain: 0.13 }] },
  { id: 'drop', name: 'Drop', blips: [{ from: 700, to: 170, dur: 0.22 }] },
  {
    id: 'coin',
    name: 'Coin',
    blips: [
      { type: 'square', from: 988, dur: 0.06, gain: 0.07 },
      { type: 'square', from: 1319, dur: 0.14, gain: 0.07, at: 0.06 },
    ],
  },
  { id: 'soft', name: 'Soft', blips: [{ from: 330, to: 392, dur: 0.2, gain: 0.1 }] },
];

/** Play a specific sound by id (used for previews — always audible). */
export function playSound(id: string, mult = 1) {
  const ac = audio();
  if (!ac) return;
  const def = SOUNDS.find((s) => s.id === id) ?? SOUNDS[0];
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  for (const b of def.blips) blip(ac, ac.currentTime, b, mult);
}

/** Play a specific delete cue by id (used for previews — always audible). */
export function playTrashSound(id: string) {
  const ac = audio();
  if (!ac) return;
  const def = TRASH_SOUNDS.find((s) => s.id === id) ?? TRASH_SOUNDS[0];
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  def.render(ac, ac.currentTime);
}

/** Play the user's chosen delete cue for an action (no-op when sounds are off). */
export function playTrash() {
  if (!getSoundEnabled()) return;
  playTrashSound(getTrashId());
}

// "Variety" mode cycles through the sounds so back-to-back actions don't repeat.
let cycle = Math.floor(Math.random() * SOUNDS.length);

/** Play the user's selected sound for an action (no-op when sounds are off).
 *  Adds a touch of random pitch so repeats feel alive; in Variety mode, advances
 *  through the set on every action. */
export function playAction() {
  if (!getSoundEnabled()) return;
  const mult = 1 + (Math.random() * 2 - 1) * 0.05; // ±5% pitch
  if (getSoundId() === 'variety') {
    const def = SOUNDS[cycle % SOUNDS.length];
    cycle++;
    playSound(def.id, mult);
  } else {
    playSound(getSoundId(), mult);
  }
}

/** Preview the Variety mode — plays the next sound in the rotation. */
export function playVarietyPreview() {
  const def = SOUNDS[cycle % SOUNDS.length];
  cycle++;
  playSound(def.id);
}
