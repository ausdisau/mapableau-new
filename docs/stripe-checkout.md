# Stripe Checkout setup (MapAble billing)

MapAble uses **Stripe Checkout Sessions** for invoice payments and Pro subscriptions. Checkout code lives under `lib/stripe/` and `lib/billing-core/`; UI entry points include **Pay now** on billing invoices and provider subscription checkout.

## Stripe Projects (projects.dev)

Stripe API keys are **not** provisioned through [Stripe Projects](https://projects.dev/providers). Preflight in this repo (Stripe CLI ≥ 1.40, `stripe plugin install projects`):

| Command | Result |
| ------- | ------ |
| `stripe projects search stripe --json` | `result_count: 0` — no Stripe service in catalog |
| `stripe projects search payments --json` | Privy (`payments` category), not Stripe |
| `stripe projects init` | Requires browser auth; does not supply `STRIPE_SECRET_KEY` |

Configure keys manually in the [Stripe Dashboard](https://dashboard.stripe.com) (use **Test mode** first).

Optional: Stripe Projects can still provision **other** catalog services (e.g. Vercel, Neon) — unrelated to payment keys.

## Environment variables

Set these in `.env.local` (local) and your host (e.g. Vercel project settings). **Never commit secret values.**

| Variable | Required | Purpose |
| -------- | -------- | ------- |
| `STRIPE_SECRET_KEY` | Yes (checkout) | Server SDK (`lib/stripe/client.ts`) — prefer restricted key `rk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Yes (status updates) | Verify `POST /api/webhooks/stripe` |
| `NEXT_PUBLIC_APP_URL` | Yes | Success/cancel URLs (`lib/stripe/checkout.ts`) |
| `STRIPE_DEFAULT_CURRENCY` | No | Default `AUD` |
| `STRIPE_ENABLED` | Recommended | Integration health (`lib/env.ts`) |
| `BILLING_ENABLE_STRIPE` | Recommended | Legacy integration gate (`lib/stripe/config.ts`) |
| `STRIPE_PROVIDER_PRO_PRICE_ID` | Subscriptions | Provider Pro Checkout price ID |
| `STRIPE_EMPLOYER_PRO_PRICE_ID` | Subscriptions | Employer Pro price ID |
| `STRIPE_CONNECT_CLIENT_ID` | Connect payouts | Provider Connect onboarding |

`isBillingStripeConfigured()` is true when `STRIPE_SECRET_KEY` is set (core checkout path). Integration adapters may also require `STRIPE_ENABLED=true` or `BILLING_ENABLE_STRIPE=true`.

See `.env.example` for a full template.

## Stripe Dashboard (test mode)

1. **API key:** Developers → API keys → Create **restricted key** with Checkout, Customers, Webhooks, and Connect (if using marketplace payouts). Paste into `STRIPE_SECRET_KEY`.
2. **Products/prices (optional):** Create Pro products → copy Price IDs into `STRIPE_PROVIDER_PRO_PRICE_ID` / `STRIPE_EMPLOYER_PRO_PRICE_ID`.
3. **Webhook endpoint:**
   - **Production/preview:** URL `{NEXT_PUBLIC_APP_URL}/api/webhooks/stripe`
   - **Events (minimum):** `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `account.updated` (if using Connect)
   - Copy signing secret → `STRIPE_WEBHOOK_SECRET`

### Vercel preview deployments

Use the preview URL as `NEXT_PUBLIC_APP_URL` for that environment, and add a **separate** webhook endpoint in Stripe pointing at `https://<preview-host>/api/webhooks/stripe` with the matching signing secret in Vercel env vars.

## Local development webhooks

Forward events to your app:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Use the **webhook signing secret** printed by the CLI as `STRIPE_WEBHOOK_SECRET` in `.env.local` (distinct from the Dashboard endpoint secret).

Run the app with `NEXT_PUBLIC_APP_URL=http://localhost:3000` and `STRIPE_SECRET_KEY` set.

## Verify invoice checkout (E2E)

1. Apply DB migrations; ensure a participant user with funding **self-managed** or **private_card** (plan-managed NDIS blocks card checkout).
2. Create or issue a `BillingInvoice` in `issued` or `pending_payment`.
3. Open `/dashboard/billing/invoices/[id]` → **Pay now**.
4. Complete payment with test card `4242424242424242`.
5. Confirm webhook delivery and invoice/payment status updates (`BillingPayment`, invoice `paid`).

`GET /api/billing/status` reports whether Stripe and webhooks are configured (no secrets returned).

## Verify subscription checkout (optional)

1. Set `STRIPE_PROVIDER_PRO_PRICE_ID`.
2. Provider console → **Billing & payouts** → start Pro subscription.
3. After `checkout.session.completed`, confirm `BillingSubscription` is no longer incomplete.

## Stripe Connect (provider payouts)

For destination charges on invoices with a `providerId`, the provider must complete Connect onboarding (`/api/billing/connect/*`) before checkout applies `transfer_data`. Set `STRIPE_CONNECT_CLIENT_ID` from Connect settings.

## Automated tests

```bash
npm test -- tests/billing-core.test.ts tests/stripe-sdk.test.ts
npm run build
```
