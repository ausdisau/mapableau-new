# Remaining Stripe / Vercel configuration steps

Do **not** enable live payments, initiate real payouts, or deploy production from this PR alone.

## Identified projects

| System | ID / name | Notes |
| --- | --- | --- |
| Vercel (this app) | `mapableau-new` (`prj_EL1M4DxsXdPDUJpLeJ90zivUb3mf`) | Team `mapableau` |
| Vercel (legacy) | `mapableau` | Currently holds Stripe integration secrets (production) |
| Neon | Shared via `DATABASE_URL` / `DIRECT_URL` on Vercel | See `docs/operations/neon.md` |

## Gap: Stripe keys on wrong Vercel project

As of inspection (values not printed):

- **`mapableau` (legacy)** has Stripe integration-store secrets: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (production).
- **`mapableau-new`** did not list those Stripe keys in env filter results.

### Required on `mapableau-new` (test/sandbox first)

Add for **Preview + Development** (and Production only after review):

| Name | Purpose |
| --- | --- |
| `STRIPE_SECRET_KEY` | `sk_test_…` for sandbox |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` for `/api/webhooks/stripe` |
| `STRIPE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | test publishable key if Elements/client needs it |
| `STRIPE_CONNECT_CLIENT_ID` | Connect platform client (test) |
| `STRIPE_CONNECT_RETURN_URL` | e.g. `https://<host>/payouts/onboarding/return` |
| `STRIPE_CONNECT_REFRESH_URL` | e.g. `https://<host>/payouts/onboarding/refresh` |
| `MAPABLE_PAYMENTS_MODE` | `test` (never `live` until approved) |
| `MAPABLE_PAYOUTS_ENABLED` | keep `false` until go-live checklist |
| `MAPABLE_PAYOUTS_AUTO_PROCESS` | keep `false` |
| `BILLING_ENABLE_STRIPE` / `STRIPE_ENABLED` | `true` in sandbox preview if legacy gates needed |
| `BILLING_PLATFORM_FEE_BPS` | commission bps (default 1000) |
| `BILLING_GST_BPS` | GST bps (default 1000) |
| `MAPABLE_MARKETPLACE_ENABLED` | `true` only when shop routes should open |
| `DATABASE_URL` / `DIRECT_URL` | Neon pooled + direct |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` | auth + return URLs |

## Stripe Dashboard (test mode)

1. Confirm platform is in **Test mode**.
2. Enable Connect (Express).
3. Add webhook endpoint → `https://<preview-or-staging-host>/api/webhooks/stripe`.
4. Subscribe at least: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`, `account.updated`, `transfer.created`, `transfer.reversed`, `payout.paid`, `payout.failed`.
5. Copy webhook signing secret into `STRIPE_WEBHOOK_SECRET` on `mapableau-new`.

## Verification before any live switch

1. Successful / declined / cancelled / pending Checkout in test mode.
2. Webhook replay (same `event.id`) does not double-pay invoices.
3. Duplicate checkout reuses open session.
4. Price-tampered cart body rejected.
5. Seller cannot read another seller’s Connect status (session-bound).
6. Incomplete onboarding surfaces requirements; payouts stay gated off.
7. Read `docs/marketplace-stripe-charge-model.md` and `docs/payout-go-live-checklist.md`.

## Explicitly deferred

- Setting `MAPABLE_PAYMENTS_MODE=live`
- Setting `MAPABLE_PAYOUTS_ENABLED=true`
- Production DNS / domain attach for marketplace subdomains
- Automated transfer reversal on refund
