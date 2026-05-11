import { BowlingGame } from '@/components/game/BowlingGame';
import { CheckInPanel } from '@/components/check-in/CheckInPanel';
import { WalletBar } from '@/components/wallet/WalletBar';

export default function Home() {
  return (
    <div className="cyber-grid cyber-grid-anim flex min-h-dvh flex-col overflow-x-hidden">
      <header className="flex flex-col gap-3 border-b border-cyan-500/20 bg-black/40 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="neon-text-pulse font-[family-name:var(--font-orbitron)] text-xl font-bold uppercase tracking-[0.18em] text-transparent sm:text-2xl"
            style={{
              background:
                'linear-gradient(90deg,#00fff0,#ff2eea,#7cff00)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
            }}
          >
            Neo-Bowling Arena
          </h1>
          <p className="mt-1 max-w-md text-xs text-zinc-400 sm:text-sm">
            Swipe from the ball zone toward the pins. English UI · Base ready ·
            Builder code on check-in.
          </p>
        </div>
        <WalletBar />
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-6">
        <BowlingGame />
      </main>

      <CheckInPanel />
    </div>
  );
}
