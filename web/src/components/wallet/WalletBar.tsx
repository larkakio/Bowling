'use client';

import { createPortal } from 'react-dom';
import { useConnect, useAccount, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';
import { useEffect, useState, type ReactNode } from 'react';

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletBar(): ReactNode {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { connectAsync, connectors, isPending } = useConnect();

  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  const wrongNetwork = isConnected && chainId !== base.id;

  const openSheet = () => setSheetOpen(true);
  const closeSheet = () => setSheetOpen(false);

  const panel =
    sheetOpen ? (
      <div
        className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 p-3 sm:items-center"
        role="presentation"
        onClick={closeSheet}
        onKeyDown={(e) => e.key === 'Escape' && closeSheet()}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Choose wallet"
          className="mb-[env(safe-area-inset-bottom)] w-full max-w-md overflow-hidden rounded-xl border border-cyan-500/40 bg-[#0a0f18] text-zinc-100 shadow-[0_0_40px_rgba(0,255,255,0.15)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-cyan-500/20 px-4 py-3">
            <span className="font-mono text-sm tracking-wide text-cyan-300">
              CONNECT_WALLET
            </span>
            <button
              type="button"
              aria-label="Close wallet list"
              className="rounded-lg px-2 py-1 text-fuchsia-300 hover:bg-white/10"
              onClick={closeSheet}
            >
              ✕
            </button>
          </div>
          <div className="max-h-[50dvh] space-y-1 overflow-y-auto p-2">
            {connectors.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-zinc-400">
                No wallet connectors available in this environment. Open in Base App
                / a wallet in-app browser, or install a wallet extension on desktop.
              </p>
            ) : (
              connectors.map((c) => (
                <button
                  key={c.uid}
                  type="button"
                  disabled={isPending}
                  className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-left text-sm hover:border-cyan-400/60 hover:bg-cyan-500/10 disabled:opacity-40"
                  onClick={() => {
                    void (async () => {
                      try {
                        await connectAsync({
                          connector: c,
                          chainId: base.id,
                        });
                        closeSheet();
                      } catch {
                        /* user rejected or unavailable */
                      }
                    })();
                  }}
                >
                  <span>{c.name}</span>
                  <span className="text-xs text-zinc-500">Base</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    ) : null;

  return (
    <div className="flex min-w-0 flex-1 flex-col items-end gap-2 sm:flex-row sm:items-center sm:justify-end">
      {wrongNetwork && (
        <div className="flex w-full items-center justify-between gap-2 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-xs text-amber-100 sm:w-auto">
          <span>Wrong network</span>
          <button
            type="button"
            className="shrink-0 rounded-md bg-cyan-500 px-3 py-1 font-semibold text-black hover:bg-cyan-400"
            onClick={() =>
              switchChain({ chainId: base.id })
            }
          >
            Switch to Base
          </button>
        </div>
      )}
      {!isConnected && (
        <button
          type="button"
          className="shrink-0 rounded-lg bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-black shadow-[0_0_20px_rgba(255,0,255,0.35)] hover:brightness-110"
          onClick={openSheet}
        >
          Connect wallet
        </button>
      )}
      {isConnected && address && (
        <div className="flex items-center gap-2">
          <span className="hidden max-w-[8rem] truncate font-mono text-xs text-zinc-300 sm:inline md:max-w-xs">
            {formatAddress(address)}
          </span>
          <button
            type="button"
            className="rounded-lg border border-fuchsia-500/50 px-3 py-2 text-xs text-fuchsia-200 hover:bg-fuchsia-500/20"
            onClick={() => disconnect()}
          >
            Disconnect
          </button>
        </div>
      )}
      {typeof document !== 'undefined'
        ? createPortal(panel, document.body)
        : null}
    </div>
  );
}
