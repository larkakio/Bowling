# CheckIn contract

Foundry project for `DailyCheckIn`-style staking-free check-in:

- `checkIn()` — payable but **rejects** non-zero ETH.
- Once per UNIX day bucket (`timestamp / 1 days`).
- Streak increments on consecutive UTC days.

```bash
forge test
forge build
```

## Deploy (Base mainnet reference)

Deployed `CheckIn` at **`0x804cf9A163d9C5988A4aF338dD630bC9317274c0`** ([tx](https://basescan.org/tx/0x01b513bf4f214eb82ea8b02fdd0d1f43b7e9fe0eb7f5f1d4d9d971a3e1a37700)).  
Set **`NEXT_PUBLIC_CHECK_IN_CONTRACT_ADDRESS`** in `web/.env.local` to this address (already done locally if you pulled latest env files).
