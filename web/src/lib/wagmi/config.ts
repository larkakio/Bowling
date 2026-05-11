import { http, createConfig, createStorage, cookieStorage } from 'wagmi';
import { base, mainnet } from 'wagmi/chains';
import { baseAccount, injected, walletConnect } from 'wagmi/connectors';

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
                : (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com'),
            icons: [],
          },
          showQrModal: true,
        }),
      ]
    : []),
];

export const config = createConfig({
  chains: [base, mainnet],
  connectors,
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
