# MapAble Ads Advertiser Wallet

## Purpose

Dedicated prepaid wallet for MapAble Ads. **Not** participant funding or NDIS balances.

## Model

`AdWallet` — one per `(advertiserId, currency)` (initial currency `AUD`).

Statuses: `ACTIVE` | `FROZEN` | `CLOSED`.

## Ledger

`AdWalletLedgerEntry` is append-only and the financial source of truth.

Types: `TOP_UP`, `IMPRESSION_CHARGE`, `CLICK_CHARGE`, `REFUND`, `DISPUTE`, `MANUAL_CREDIT`, `MANUAL_DEBIT`, `ADJUSTMENT_REVERSAL`.

Corrections = compensating entries only.

## Stripe top-up

Metadata (purpose-specific):

```text
mapablePurpose=ads_wallet_topup
advertiserId
walletId
topUpId
```

Credits occur **only** from verified Stripe webhooks via `handleAdsStripeEvent()`.

Browser `?checkout=success` must **never** credit the wallet.

Minimum development top-up: A$100. Presets: A$100 / A$250 / A$500 / A$1,000 / A$2,500.

Auto-recharge is **out of scope** for this slice (architecture leaves room for a future consent flow).

## Manual adjustments

Admin-only, require reason + audit event. Never silent balance changes.
