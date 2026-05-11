import { Attribution } from 'ox/erc8021';
import type { Hex } from 'viem';

export function getBuilderDataSuffix(): Hex | undefined {
  const overrideRaw = process.env.NEXT_PUBLIC_BUILDER_CODE_SUFFIX;
  if (
    overrideRaw &&
    overrideRaw.startsWith('0x') &&
    overrideRaw.length >= 34
  ) {
    return overrideRaw as Hex;
  }
  const code = process.env.NEXT_PUBLIC_BUILDER_CODE;
  if (!code?.length) return undefined;
  return Attribution.toDataSuffix({ codes: [code] }) as Hex;
}
