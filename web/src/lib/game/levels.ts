/** Level definitions + persistent unlock storage (1-based ids). */

export const STORAGE_MAX_LEVEL_KEY = 'neo-bowling-max-unlocked-level';

export type LevelConfig = {
  id: number;
  title: string;
  blurb: string;
  rollsAllowed: number;
  /** Aim dead-zone as fraction — higher = narrower gutter / harder */
  playableHalfFrac: number;
  /** Multiply velocity each physics step (~1/60 s) */
  friction: number;
  /** Lateral push per second toward positive X (neon “oil” hook) */
  lateralDrift: number;
};

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    title: 'Photon Lane',
    blurb: 'Knock down all pins before you run out of rolls.',
    rollsAllowed: 5,
    playableHalfFrac: 0.44,
    friction: 0.997,
    lateralDrift: 0,
  },
  {
    id: 2,
    title: 'Magnetic Divide',
    blurb: 'Ion hook pulls sideways — compensate with your swipe angle.',
    rollsAllowed: 4,
    playableHalfFrac: 0.4,
    friction: 0.9978,
    lateralDrift: 38,
  },
  {
    id: 3,
    title: 'Grid Collapse',
    blurb: 'Tighter channel. Speed bleeds slower — finesse beats force.',
    rollsAllowed: 4,
    playableHalfFrac: 0.35,
    friction: 0.9985,
    lateralDrift: -28,
  },
  {
    id: 4,
    title: 'Singularity Core',
    blurb: 'Low roll budget. Aim for splits like a demolition artist.',
    rollsAllowed: 3,
    playableHalfFrac: 0.32,
    friction: 0.9988,
    lateralDrift: 55,
  },
  {
    id: 5,
    title: 'Omega Alley',
    blurb: 'Final audition: survive the glare and bury the pyramid.',
    rollsAllowed: 3,
    playableHalfFrac: 0.3,
    friction: 0.9988,
    lateralDrift: -48,
  },
];

export function readMaxUnlockedLevel(): number {
  if (typeof window === 'undefined') return 1;
  const raw = window.localStorage.getItem(STORAGE_MAX_LEVEL_KEY);
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(Math.floor(parsed), LEVELS.length);
}

export function unlockNextLevel(completedLevelId: number): void {
  if (typeof window === 'undefined') return;
  const next = completedLevelId + 1;
  if (next > LEVELS.length) return;
  const prev = readMaxUnlockedLevel();
  if (next > prev) {
    window.localStorage.setItem(STORAGE_MAX_LEVEL_KEY, String(next));
  }
  window.dispatchEvent(new CustomEvent('neo-bowling-unlock'));
}

export function subscribeMaxUnlocked(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const run = () => callback();
  window.addEventListener('neo-bowling-unlock', run);
  window.addEventListener('storage', run);
  return () => {
    window.removeEventListener('neo-bowling-unlock', run);
    window.removeEventListener('storage', run);
  };
}
export function levelById(id: number) {
  return LEVELS.find((l) => l.id === id);
}
