# Stripe wallets on AdaptAble / MapAble mobile

Google Pay and Apple Pay are provided by **Stripe PaymentSheet**, not by embedding Google Play Services.

## Setup

1. Copy `.env.example` → `.env` and set:
   - `EXPO_PUBLIC_MAPABLE_API_URL`
   - `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` (publishable only)
   - `EXPO_PUBLIC_STRIPE_TEST_MODE=true` until production
2. Create an EAS or local native build (`npx expo run:android` / `run:ios`). **Expo Go does not support wallets.**
3. Apple Merchant ID: `merchant.com.ausdisau.mapable` (must match Stripe Dashboard + `app.json` plugin).
4. Pay tab → enter billing invoice ID + session access token → PaymentSheet.

## Backend

`POST {MAPABLE_API}/api/billing/payment-sheet` with `{ invoiceId }` and `Authorization: Bearer …`.
See mapableau-new `docs/billing-wallets.md`.
