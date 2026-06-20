// Optional UI sound effects, synthesized with WebAudio (no audio files shipped).
// Off by default; users pick one of several sounds in Settings → Sound.
const ENABLED_KEY = 'forage.sound.v1';
const CHOICE_KEY = 'forage.sound.choice.v1';

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

// A distinct "into the trash" cue — a quick descending swoop with a soft
// crumple of noise, so deletes feel different from a save. Not in the picker.
const TRASH: Blip[] = [
  { type: 'triangle', from: 520, to: 130, dur: 0.22, gain: 0.11 },
  { type: 'square', from: 220, to: 90, dur: 0.12, gain: 0.05, at: 0.04 },
];

/** Play a specific sound by id (used for previews — always audible). */
export function playSound(id: string, mult = 1) {
  const ac = audio();
  if (!ac) return;
  const def = SOUNDS.find((s) => s.id === id) ?? SOUNDS[0];
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  for (const b of def.blips) blip(ac, ac.currentTime, b, mult);
}

/** Play the trash cue for delete actions (no-op when sounds are off). */
export function playTrash() {
  if (!getSoundEnabled()) return;
  const ac = audio();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const mult = 1 + (Math.random() * 2 - 1) * 0.04;
  for (const b of TRASH) blip(ac, ac.currentTime, b, mult);
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
