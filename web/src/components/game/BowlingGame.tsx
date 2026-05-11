'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import {
  LEVELS,
  levelById,
  readMaxUnlockedLevel,
  subscribeMaxUnlocked,
  unlockNextLevel,
} from '@/lib/game/levels';
import {
  applySwipeToBall,
  createInitialSnapshot,
  finishRound,
  type SimSnapshot,
  stepSimulation,
} from '@/lib/game/sim';

type Hud = {
  standing: number;
  rollsLeft: number;
  message: string;
  won: boolean;
  lost: boolean;
};

function pullHud(snap: SimSnapshot): Hud {
  return {
    standing: snap.pins.filter((p) => !p.down).length,
    rollsLeft: snap.rollsLeft,
    message: snap.message,
    won: snap.won,
    lost: snap.lost,
  };
}

export function BowlingGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snapRef = useRef<SimSnapshot | null>(null);
  const dragRef = useRef<{ sx: number; sy: number; id: number } | null>(
    null,
  );
  const rafRef = useRef<number | undefined>(undefined);
  const rollFrame = useRef(0);
  const paintRef = useRef<() => void>(() => {});
  const dimensionsRef = useRef({ w: 360, h: 520 });
  const [levelId, setLevelId] = useState(1);
  const [dimensions, setDimensions] = useState({ w: 360, h: 520 });
  const [hud, setHud] = useState<Hud>({
    standing: 10,
    rollsLeft: 5,
    message: '',
    won: false,
    lost: false,
  });

  const maxUnlocked = useSyncExternalStore(
    subscribeMaxUnlocked,
    readMaxUnlockedLevel,
    () => 1,
  );

  const levelConfig = levelById(levelId) ?? LEVELS[0];

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const snap = snapRef.current;
    if (!canvas || !snap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = dimensions.w;
    const h = dimensions.h;
    const dpr =
      typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 3) : 1;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = '#070712';
    ctx.fillRect(0, 0, w, h);

    const gridOn =
      typeof window !== 'undefined' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (gridOn) {
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = '#00fff0';
      const t = Date.now() / 4000;
      for (let i = 0; i < 18; i += 1) {
        const shift = (((i / 18) * w + t * w) % (w + 40)) - 20;
        ctx.beginPath();
        ctx.moveTo(shift, 0);
        ctx.lineTo(shift + h * 0.3, h);
        ctx.stroke();
      }
      ctx.restore();
    }

    const cx = w / 2;
    const wash = ctx.createLinearGradient(0, 0, w, h);
    wash.addColorStop(0, 'rgba(255,0,240,0.08)');
    wash.addColorStop(0.5, 'rgba(0,255,255,0.05)');
    wash.addColorStop(1, 'rgba(120,255,0,0.06)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, h * 0.15);
    ctx.scale(1, 0.42);
    const laneGlow = ctx.createRadialGradient(0, 0, 20, 0, 0, w * 0.55);
    laneGlow.addColorStop(0, 'rgba(0,255,255,0.25)');
    laneGlow.addColorStop(1, 'rgba(3,5,20,0.4)');
    ctx.fillStyle = laneGlow;
    ctx.beginPath();
    ctx.ellipse(0, h * 0.9, w * 0.48, h * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const half = w * snap.level.playableHalfFrac;
    ctx.strokeStyle = 'rgba(0,255,255,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - half, h * 0.2);
    ctx.lineTo(cx - half * 0.88, h * 0.95);
    ctx.moveTo(cx + half, h * 0.2);
    ctx.lineTo(cx + half * 0.88, h * 0.95);
    ctx.stroke();

    for (const pin of snap.pins) {
      if (pin.down) continue;
      ctx.save();
      ctx.shadowColor = '#ff2eea';
      ctx.shadowBlur = 18;
      const pg = ctx.createRadialGradient(
        pin.x - 3,
        pin.y - 3,
        2,
        pin.x,
        pin.y,
        pin.r,
      );
      pg.addColorStop(0, '#fff5ff');
      pg.addColorStop(0.5, 'rgba(0,255,255,0.8)');
      pg.addColorStop(1, 'rgba(120,0,255,0.3)');
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(pin.x, pin.y, pin.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = 'rgba(255,0,220,0.45)';
      ctx.beginPath();
      ctx.arc(pin.x + 2, pin.y, pin.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const b = snap.ball;
    ctx.save();
    ctx.shadowColor = '#7cff00';
    ctx.shadowBlur = 22;
    const bg = ctx.createRadialGradient(
      b.x - 5,
      b.y - 5,
      3,
      b.x,
      b.y,
      b.r,
    );
    bg.addColorStop(0, '#f5fff0');
    bg.addColorStop(0.45, '#00ffbf');
    bg.addColorStop(1, '#00332a');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, [dimensions]);

  const resetSnapshotForSize = useCallback(
    (w: number, h: number) => {
      const snap = createInitialSnapshot(levelConfig, w, h);
      snapRef.current = snap;
      setHud(pullHud(snap));
      paintRef.current();
    },
    [levelConfig],
  );

  useEffect(() => {
    const el = canvasRef.current;
    if (!el?.parentElement) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      const ww = Math.max(280, Math.floor(cr.width));
      const hh = Math.max(400, Math.floor(cr.height));
      setDimensions({ w: ww, h: hh });
    });
    ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    dimensionsRef.current = dimensions;
    paintRef.current = paint;
    paint();
  }, [dimensions, paint, levelId]);

  /* eslint-disable react-hooks/set-state-in-effect --
     Lane sim resets when ResizeObserver publishes new viewport or chapter changes */
  useEffect(() => {
    resetSnapshotForSize(dimensions.w, dimensions.h);
  }, [levelConfig, dimensions, resetSnapshotForSize]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const kickLoop = () => {
    rollFrame.current = 0;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const step = () => {
      const snap = snapRef.current;
      if (!snap || snap.phase !== 'rolling') return;
      const { w, h } = dimensionsRef.current;
      for (let i = 0; i < 3; i += 1) stepSimulation(snap, w, h);
      paintRef.current();
      rollFrame.current += 1;
      if (rollFrame.current % 5 === 0) setHud(pullHud(snap));
      if (snap.phase !== 'rolling') {
        finishRound(snap, w, h);
        if (snap.won) {
          unlockNextLevel(snap.level.id);
        }
        setHud(pullHud(snap));
        paintRef.current();
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [levelId]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const snap = snapRef.current;
    if (!snap || snap.phase !== 'aim' || snap.won || snap.lost) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    if (y < dimensions.h * 0.52) return;
    dragRef.current = {
      sx: e.clientX - rect.left,
      sy: y,
      id: e.pointerId,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = dragRef.current;
    const snap = snapRef.current;
    dragRef.current = null;
    if (!d || !snap || d.id !== e.pointerId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - rect.left - d.sx;
    const dy = e.clientY - rect.top - d.sy;
    applySwipeToBall(snap, dx, dy);
    setHud(pullHud(snap));
    paintRef.current();
    if (snap.phase === 'rolling') kickLoop();
  };

  const selectLevel = (id: number) => {
    if (id > maxUnlocked) return;
    setLevelId(id);
  };

  const restartLevel = () => {
    resetSnapshotForSize(dimensions.w, dimensions.h);
  };

  const goNextLevel = () => {
    const next = levelId + 1;
    if (next <= LEVELS.length && next <= maxUnlocked) setLevelId(next);
  };

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {LEVELS.map((lv) => {
          const locked = lv.id > maxUnlocked;
          return (
            <button
              key={lv.id}
              type="button"
              disabled={locked}
              onClick={() => selectLevel(lv.id)}
              className={`rounded-md border px-3 py-1.5 font-mono text-xs uppercase tracking-wider ${
                lv.id === levelId
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100'
                  : locked
                    ? 'border-white/10 text-zinc-600'
                    : 'border-fuchsia-500/40 text-fuchsia-200 hover:bg-fuchsia-500/10'
              }`}
            >
              {locked ? `L${lv.id} ⊗` : `L${lv.id}`}
            </button>
          );
        })}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#05050c] shadow-[0_0_60px_rgba(0,255,255,0.12)]">
        <canvas
          ref={canvasRef}
          className="block h-[min(72dvh,560px)] w-full touch-none"
          style={{ width: '100%', height: 'min(72dvh, 560px)' }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            dragRef.current = null;
          }}
        />
        <div className="pointer-events-none absolute left-3 right-3 top-3 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-zinc-200 backdrop-blur-sm">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-300/90">
            {levelConfig.title}
          </p>
          <p className="mt-1 text-[13px] leading-snug text-zinc-400">
            {levelConfig.blurb}
          </p>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-fuchsia-500/25 bg-black/35 px-3 py-3 font-mono text-sm text-zinc-200">
        <p>
          Pins standing:{' '}
          <span className="tabular-nums text-fuchsia-300">{hud.standing}</span>
          {' '}
          · Rolls:{' '}
          <span className="tabular-nums text-cyan-300">{hud.rollsLeft}</span>
        </p>
        {hud.message && (
          <p className="text-xs text-lime-200/95">{hud.message}</p>
        )}
        {(hud.won || hud.lost) && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border border-white/15 px-3 py-2 text-xs uppercase text-zinc-200 hover:bg-white/10"
              onClick={restartLevel}
            >
              Replay lane
            </button>
            {hud.won && levelId < LEVELS.length && (
              <button
                type="button"
                className="rounded-md bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-3 py-2 text-xs font-bold uppercase text-black disabled:opacity-40"
                onClick={goNextLevel}
                disabled={levelId + 1 > maxUnlocked}
              >
                Next sector
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
