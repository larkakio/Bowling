import type { Metadata } from 'next';
import { Orbitron, DM_Sans } from 'next/font/google';

import './globals.css';

import { Web3Providers } from '@/components/Web3Providers';

const orbitron = Orbitron({
  variable: '--font-orbitron',
  subsets: ['latin'],
});

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bowling-gamma.vercel.app';

const baseAppId =
  process.env.NEXT_PUBLIC_BASE_APP_ID ?? '6a01801aef4989446dc30d18';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Neo-Bowling Arena',
  description:
    'Swipe-to-bowl cyber arcade on Base. Connect your wallet & check in on-chain.',
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${dmSans.variable} h-full antialiased`}
    >
      <head>
        <meta name="base:app_id" content={baseAppId} />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body
        className="min-h-dvh font-sans text-zinc-100"
        style={{ fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}
      >
        <Web3Providers>{children}</Web3Providers>
      </body>
    </html>
  );
}
