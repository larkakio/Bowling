import { http, createConfig, createStorage, cookieStorage } from 'wagmi';
import { base, mainnet } from 'wagmi/chains';
import { baseAccount, injected, walletConnect } from 'wagmi/connectors';

import { getBuilderDataSuffix } from '@/lib/chain/builderSuffix';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

const connectors = [
  injected(),
  baseAccount({ appName: 'Neo-Bowling Arena' }),
  ...(projectId
    ? [
        walletConnect({
          projectId,
          metadata: {
            name: 'Neo-Bowling Arena',
            description: 'Cyber lane bowling on Base.',
            url:
              typeof window !== 'undefined'
                ? window.location.origin
                : (process.env.NEXT_PUBLIC_SITE_URL ??
                    'https://bowling-gamma.vercel.app'),
            icons: [],
          },
          showQrModal: true,
        }),
      ]
    : []),
];

const builderDataSuffix = getBuilderDataSuffix();

export const config = createConfig({
  chains: [base, mainnet],
  connectors,
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
  },
  ...(builderDataSuffix ? { dataSuffix: builderDataSuffix } : {}),
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
