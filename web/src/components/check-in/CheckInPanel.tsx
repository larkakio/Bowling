'use client';

import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWriteContract,
  useReadContract,
} from 'wagmi';
import { base } from 'wagmi/chains';

import { getBuilderDataSuffix } from '@/lib/chain/builderSuffix';
import { checkInAbi } from '@/lib/chain/checkInAbi';

const ADDRESS = process.env.NEXT_PUBLIC_CHECK_IN_CONTRACT_ADDRESS as
  | `0x${string}`
  | undefined;

export function CheckInPanel() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const {
    writeContractAsync,
    isPending: writing,
    error: writeErr,
    isSuccess,
    reset,
  } = useWriteContract();

  const configured = Boolean(ADDRESS && ADDRESS.length === 42);

  const { data: streak } = useReadContract({
    address: configured ? ADDRESS : undefined,
    abi: checkInAbi,
    functionName: 'currentStreak',
    chainId: base.id,
    args: address ? [address] : undefined,
    query: { enabled: Boolean(configured && address) },
  });

  async function handleCheckIn() {
    reset();
    if (!ADDRESS || !configured) return;
    const suffix = getBuilderDataSuffix();
    const baseId = base.id as typeof base.id;
    if (chainId !== baseId) {
      await switchChainAsync({ chainId: baseId });
    }
    await writeContractAsync({
      address: ADDRESS,
      abi: checkInAbi,
      functionName: 'checkIn',
      chainId: baseId,
      value: BigInt(0),
      ...(suffix ? { dataSuffix: suffix } : {}),
    });
  }

  const busy = switching || writing;

  return (
    <section className="mt-auto border-t border-cyan-500/20 bg-black/30 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-cyan-300/90">
        On-chain signal
      </h2>
      <p className="mb-3 text-[13px] leading-relaxed text-zinc-400">
        Daily check-in on Base — gas only, no ETH sent with the transaction.
      </p>
      {!configured && (
        <p className="text-sm text-amber-200/90">
          Set NEXT_PUBLIC_CHECK_IN_CONTRACT_ADDRESS after deployment.
        </p>
      )}
      {configured && !isConnected && (
        <p className="text-sm text-zinc-500">Connect a wallet on Base.</p>
      )}
      {configured &&
        isConnected &&
        streak !== undefined &&
        streak !== null && (
          <p className="mb-2 font-mono text-sm text-zinc-300">
            Current streak:&nbsp;<span className="text-fuchsia-300">{String(streak)}</span>
          </p>
        )}
      {configured && isConnected && (
        <button
          type="button"
          disabled={busy}
          className="w-full rounded-lg border border-cyan-400/50 bg-cyan-500/10 py-3 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20 disabled:opacity-40"
          onClick={() => void handleCheckIn()}
        >
          {busy ? 'Confirm in wallet…' : 'Check in on Base'}
        </button>
      )}
      {isSuccess && (
        <p className="mt-2 text-sm text-lime-300">Check-in submitted.</p>
      )}
      {writeErr && (
        <p className="mt-2 text-sm text-red-400">
          {writeErr.message.slice(0, 200)}
        </p>
      )}
    </section>
  );
}
