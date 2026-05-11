import type { LevelConfig } from '@/lib/game/levels';

export type Phase = 'aim' | 'rolling' | 'round_settle';

export type SimPin = {
  id: number;
  x: number;
  y: number;
  r: number;
  down: boolean;
};

export type SimBall = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
};

export type SimSnapshot = {
  phase: Phase;
  level: LevelConfig;
  ball: SimBall;
  pins: SimPin[];
  rollsLeft: number;
  pinsDownRound: number;
  message: string;
  won: boolean;
  lost: boolean;
};

const PIN_R = 11;
const BALL_R = 14;

function headRowTriangle(cx: number, headY: number, rowGap: number, colGap: number): SimPin[] {
  const pins: SimPin[] = [];
  let id = 0;
  for (let row = 0; row < 4; row += 1) {
    const count = row + 1;
    const y = headY - row * rowGap;
    const width = (count - 1) * colGap;
    for (let i = 0; i < count; i += 1) {
      const x = cx - width / 2 + i * colGap;
      id += 1;
      pins.push({ id, x, y, r: PIN_R, down: false });
    }
  }
  return pins;
}

export function createInitialSnapshot(level: LevelConfig, width: number, height: number): SimSnapshot {
  const cx = width / 2;
  const ball: SimBall = {
    x: cx,
    y: height * 0.82,
    vx: 0,
    vy: 0,
    r: BALL_R,
  };
  const headY = height * 0.36;
  const pins = headRowTriangle(cx, headY, 26, 30);
  return {
    phase: 'aim',
    level,
    ball,
    pins,
    rollsLeft: level.rollsAllowed,
    pinsDownRound: 0,
    message: 'Swipe from the ball toward the pins',
    won: false,
    lost: false,
  };
}

/** Swipe length → ball speed (px-equivalent units per physics tick bucket). */
const SWIPE_POWER_SCALE = 0.34;
const SWIPE_SPEED_MIN = 26;
const SWIPE_SPEED_MAX = 88;

export function applySwipeToBall(snap: SimSnapshot, dx: number, dy: number): void {
  if (snap.phase !== 'aim' || snap.won || snap.lost) return;
  const mag = Math.hypot(dx, dy);
  if (mag < 20) {
    snap.message = 'Longer swipe for more power';
    return;
  }
  if (dy > -0.25 * mag) {
    swipeHint(snap);
    return;
  }
  const dirX = dx / mag;
  const dirY = dy / mag;
  const speed = Math.min(
    Math.max(mag * SWIPE_POWER_SCALE, SWIPE_SPEED_MIN),
    SWIPE_SPEED_MAX,
  );
  snap.ball.vx = dirX * speed;
  snap.ball.vy = dirY * speed;
  snap.phase = 'rolling';
  snap.pinsDownRound = 0;
  snap.message = '';
}

function swipeHint(snap: SimSnapshot) {
  snap.message = 'Swipe more toward the pins (up the lane)';
}

const DT = 1 / 68;

export function stepSimulation(snap: SimSnapshot, width: number, height: number): void {
  if (snap.phase !== 'rolling') return;
  const { ball, level } = snap;
  const half = width * level.playableHalfFrac;

  ball.x += ball.vx * DT;
  ball.y += ball.vy * DT;
  ball.vx *= level.friction;
  ball.vy *= level.friction;
  ball.vx += level.lateralDrift * DT;

  if (ball.x - ball.r < width / 2 - half) {
    ball.x = width / 2 - half + ball.r;
    ball.vx *= -0.35;
  }
  if (ball.x + ball.r > width / 2 + half) {
    ball.x = width / 2 + half - ball.r;
    ball.vx *= -0.35;
  }

  for (const pin of snap.pins) {
    if (pin.down) continue;
    const d = Math.hypot(ball.x - pin.x, ball.y - pin.y);
    if (d < ball.r + pin.r) {
      pin.down = true;
      snap.pinsDownRound += 1;
      const nx = (pin.x - ball.x) / (d || 1);
      const ny = (pin.y - ball.y) / (d || 1);
      ball.vx -= nx * 1.45;
      ball.vy -= ny * 1.45;
    }
  }

  const speed = Math.hypot(ball.vx, ball.vy);
  const pastPins = ball.y < height * 0.12;
  const stopped = speed < 0.16 && ball.y < height * 0.55;
  if (pastPins || stopped) {
    snap.phase = 'round_settle';
  }
}

export function finishRound(snap: SimSnapshot, width: number, height: number): void {
  if (snap.phase !== 'round_settle') return;
  const standing = snap.pins.filter((p) => !p.down).length;
  if (standing === 0) {
    snap.won = true;
    snap.phase = 'aim';
    snap.message = 'Sector clear — level complete';
    return;
  }
  snap.rollsLeft -= 1;
  if (snap.rollsLeft <= 0) {
    snap.lost = true;
    snap.phase = 'aim';
    snap.message = 'Out of rolls — retry from level select';
    return;
  }
  snap.ball.x = width / 2;
  snap.ball.y = height * 0.82;
  snap.ball.vx = 0;
  snap.ball.vy = 0;
  snap.phase = 'aim';
  snap.message = `Pick up the spare — ${snap.rollsLeft} roll(s) left`;
}
