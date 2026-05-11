# Neo-Bowling Arena (Base)

Cyber arcade bowling — swipe lanes plus wagmi/viem daily **`checkIn`** on Base with ERC‑801 attribution (**builder code** suffix). Notifications are not implemented.

## Structure

- [`web/`](web/) — Next.js App Router (**Vercel root** = `web`)
- [`contracts/`](contracts/) — Foundry `CheckIn` (no ETH with `checkIn`, one check per UTC day, streak)

## Environment

Copy [`web/.env.example`](web/.env.example) to `web/.env.local` and fill values. See [`web/README.md`](web/README.md) for details.

## Scripts

```bash
cd contracts && forge test
cd web && npm install && npm run build
```

## Assets

Regenerate store images (max 1 MB, icon 1024², thumb 1.91:1):

```bash
cd web && node scripts/generate-assets.mjs
```

## Links

- [Migrate to a standard web app (Base)](https://docs.base.org/apps/guides/migrate-to-standard-web-app)
- [Base Builder Codes](https://docs.base.org/apps/builder-codes/builder-codes)
