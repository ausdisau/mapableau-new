# Connect Stripe to MapAble

MapAble already includes Stripe in `lib/stripe/` and `lib/billing-core/`. Connecting Stripe means adding **API keys**, **enabling env flags**, and (for local dev) **forwarding webhooks**.

For hosted **Checkout** (invoice pay, Pro subscriptions), see [stripe-checkout.md](./stripe-checkout.md).

## Stripe Connect Express (provider payouts)

Providers onboard via **Connect Express** accounts created in `lib/stripe/connect.ts` (`type: "express"`, country `AU`). MapAble uses **destination charges**: participant Checkout sessions include `payment_intent_data.transfer_data.destination` and an optional platform fee when the provider has completed Connect onboarding.

| Step | API / UI |
| ---- | -------- |
| Create Express account | `POST /api/billing/connect/create-account` or first `POST /api/billing/connect/onboarding-link` |
| Finish onboarding | Stripe-hosted Account Link → `/provider/billing` |
| Receive payouts | After `account.updated` (charges enabled), invoice Checkout routes funds to `stripeConnectedAccountId` |

Set `STRIPE_CONNECT_CLIENT_ID` if you use OAuth-based Connect settings in the Dashboard; account creation works with the secret key alone for standard Express onboarding.

Enable Connect webhooks: include `account.updated` on `/api/webhooks/stripe` so `connectOnboardingComplete` updates in `BillingAccount`.

## 1. Get API keys

1. Open [Stripe Dashboard](https://dashboard.stripe.com) (use **Test mode** for development).
2. **Developers → API keys**
3. Copy a **server** key — **Secret** (`sk_test_...`) or **restricted** (`rk_test_...`).  
   Do **not** put **Publishable** keys (`pk_...`) in `STRIPE_SECRET_KEY`.

Optional but recommended:

| Key | Where | Env var |
|-----|--------|---------|
| Secret key | API keys | `STRIPE_SECRET_KEY` |
| Webhook signing secret | Webhooks endpoint or CLI | `STRIPE_WEBHOOK_SECRET` |
| Connect client ID | Connect settings | `STRIPE_CONNECT_CLIENT_ID` |
| Provider Pro price | Products → Price ID | `STRIPE_PROVIDER_PRO_PRICE_ID` |
| Employer Pro price | Products → Price ID | `STRIPE_EMPLOYER_PRO_PRICE_ID` |

Use [restricted API keys](https://docs.stripe.com/keys/restricted-api-keys) in production when possible.

## 2. Configure `.env`

```bash
cp .env.example .env
```

Set at minimum:

```env
STRIPE_SECRET_KEY=sk_test_...   # or rk_test_... restricted key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...   # optional, client-only
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_DEFAULT_CURRENCY=AUD
BILLING_ENABLE_STRIPE=true
STRIPE_ENABLED=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Billing-core** routes (`/api/billing/*`) only need `STRIPE_SECRET_KEY`.  
**Legacy** phase-2 guards also require `BILLING_ENABLE_STRIPE=true` or `STRIPE_ENABLED=true`.

Restart the dev server after changing `.env`.

## 3. Verify connection

```bash
pnpm stripe:verify
```

Or while signed in as an admin, open:

```http
GET /api/billing/stripe-status?ping=1
```

A successful ping returns Stripe account id and test-mode flag.

## 4. Webhooks (local)

Install [Stripe CLI](https://docs.stripe.com/stripe-cli):

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`, restart `pnpm dev`, then:

```bash
stripe trigger checkout.session.completed
```

Production endpoint: `https://<your-host>/api/webhooks/stripe`  
Events: `checkout.session.*`, `payment_intent.*`, `charge.refunded`, `charge.dispute.created`, `invoice.*`, `customer.subscription.*`, `account.updated`

## 5. App surfaces

| Page | Purpose |
|------|---------|
| `/billing` | Participant billing dashboard |
| `/provider/billing` | Provider Connect + payouts |
| `/admin/billing` | Admin invoice oversight |

API overview: [docs/billing.md](./billing.md)

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `STRIPE_NOT_CONFIGURED` | Set non-empty `STRIPE_SECRET_KEY` |
| Legacy routes return “not configured” | Set `BILLING_ENABLE_STRIPE=true` or `STRIPE_ENABLED=true` |
| Webhook 400 / signature error | Match `STRIPE_WEBHOOK_SECRET` to CLI or Dashboard endpoint |
| Checkout works but invoice stays unpaid | Webhook not reaching `/api/webhooks/stripe` |
| `pnpm stripe:verify` fails | Test key typo, wrong mode (live vs test), or network |

Never commit `.env` or paste live keys into git or chat.

If live keys were exposed, **roll them immediately** in Stripe Dashboard → Developers → API keys (create new restricted key, revoke old).
