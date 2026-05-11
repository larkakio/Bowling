## Neo-Bowling Arena — web

### Env

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SITE_URL` | deploy | Canonical site URL (WalletConnect metadata fallback) |
| `NEXT_PUBLIC_CHAIN_ID` | optional | `8453` for Base mainnet (informational) |
| `NEXT_PUBLIC_CHECK_IN_CONTRACT_ADDRESS` | after deploy | `0x…` Foundry `CheckIn` on Base |
| `NEXT_PUBLIC_BASE_APP_ID` | Base.dev | Shown in `<meta name="base:app_id" />` |
| `NEXT_PUBLIC_BUILDER_CODE` | Base.dev | `bc_…`; used with `ox` `Attribution.toDataSuffix` |
| `NEXT_PUBLIC_BUILDER_CODE_SUFFIX` | optional | Raw `0x…` hex override for suffix |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | optional | Enables WalletConnect connector |

### Commands

```bash
npm run dev
npm run build
npm run start
```

### Wallet sheet

Connectors render in a **`createPortal`** to `document.body` with body scroll lock (see PROMPT — avoids `overflow-hidden` clipping).
