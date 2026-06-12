# MapAble Core Billing Service

Stripe-powered billing for private pay, self-managed NDIS, co-pays, provider subscriptions, and marketplace transactions. NDIS **plan-managed** funding never uses Stripe Checkout — invoices are exported to plan managers (CSV / email-ready JSON; Xero scaffold).

## Stripe SDK (`lib/stripe/`)

Server-only Stripe Node SDK (pinned API version in `lib/stripe/client.ts`):

| Module | Purpose |
|--------|---------|
| `config.ts` | `STRIPE_SECRET_KEY`, webhook secret, price IDs |
| `checkout.ts` | Payment & subscription Checkout sessions |
| `payment-intents.ts` | Legacy `Invoice` payment intents |
| `connect.ts` | Express Connect accounts & onboarding links |
| `portal.ts` | Customer Billing Portal |
| `webhooks.ts` | Signature verification + billing-core & legacy dispatch |
| `index.ts` | Public exports |

**Enable legacy routes:** `STRIPE_SECRET_KEY` + `BILLING_ENABLE_STRIPE=true` or `STRIPE_ENABLED=true`.  
**Billing-core routes:** only require `STRIPE_SECRET_KEY`.

## Architecture

- **Stripe** — payment processing truth (Checkout, Connect, Customer Portal, webhooks).
- **PostgreSQL (Prisma)** — business workflow truth (`BillingInvoice`, `BillingPayment`, `BillingFundingSource`, etc.).
- **Amounts** — integer cents only.
- **Audit** — every material change writes `BillingAuditLog`.
- **PCI** — no card data stored locally; use Stripe-hosted Checkout and Billing Portal.

## Payment flows

### Plan-managed NDIS

1. Participant adds funding source `ndis_plan_managed`.
2. Invoice created in `draft` / `issued`.
3. `POST /api/billing/checkout` returns instructions (no Checkout URL).
4. `POST /api/billing/invoices/export` with `format: csv` or `plan_manager`.

### Self-managed / private card

1. Funding source `ndis_self_managed` or `private_card`.
2. `POST /api/billing/checkout` creates Stripe Checkout (AUD).
3. Webhook `checkout.session.completed` marks invoice `paid` — **never** trust redirect alone.

### Single provider + Connect

When the provider has `stripeConnectedAccountId`, Checkout uses a destination charge:

- `application_fee_amount` = `platformFeeCents`
- `transfer_data.destination` = connected account

### Multiple providers

`providerSplits` on invoice create records `BillingPaymentSplit` rows; separate charges/transfers are stubbed for a later release.

## API routes

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/billing/funding-sources` | List / create funding sources |
| GET/POST | `/api/billing/invoices` | List / create draft invoices |
| POST | `/api/billing/checkout` | Stripe Checkout or plan-managed instruction |
| POST | `/api/billing/connect/create-account` | Express Connect account + onboarding link |
| POST | `/api/billing/connect/onboarding-link` | Refresh onboarding |
| POST | `/api/billing/subscriptions/checkout` | Provider Pro / Employer Pro subscription Checkout |
| POST | `/api/billing/customer-portal` | Stripe Billing Portal URL (`returnUrl` optional; creates Stripe Customer if missing) |
| POST | `/api/billing/invoices/export` | CSV / plan-manager JSON / Xero scaffold |
| POST | `/api/webhooks/stripe` | Signed webhook (raw body) |
| GET | `/api/admin/billing/invoices` | Admin search + flagged list |

## Environment variables

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_CONNECT_CLIENT_ID=
STRIPE_PROVIDER_PRO_PRICE_ID=
STRIPE_EMPLOYER_PRO_PRICE_ID=
BILLING_PLATFORM_FEE_BPS=1000
BILLING_GST_BPS=1000
```

Enable Stripe in development by setting `STRIPE_SECRET_KEY` (and optionally `BILLING_ENABLE_STRIPE=true` for legacy phase-2 guards).

## Webhook setup

1. Stripe Dashboard → Developers → Webhooks → Add endpoint: `https://<host>/api/webhooks/stripe`
2. Events: `checkout.session.*`, `payment_intent.*`, `charge.refunded`, `charge.dispute.created`, `invoice.*`, `customer.subscription.*`, `account.updated`
3. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

### Local testing (Stripe CLI)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
export STRIPE_WEBHOOK_SECRET=whsec_...
stripe trigger checkout.session.completed
```

## UI

- `/dashboard/billing` — **Invoice & billing centre** (participant control panel): overview, invoices & payments, funding sources, legacy invoice drafts
- `/dashboard/billing/invoices` — list, pay, export (Stripe Checkout / plan manager); **Manage payment methods** opens Stripe Billing Portal
- `/dashboard/billing/invoices/[invoiceId]` — invoice detail
- `/dashboard/billing/funding` — billing-core funding sources
- `/dashboard/billing/legacy` — Phase 2 `Invoice` drafts
- `/billing` — redirects to `/dashboard/billing`
- `/provider/billing` — Connect onboarding + subscription
- `/admin/billing` — search and flagged payments

## Production checklist

- [ ] Live Stripe keys in secrets manager
- [ ] Webhook endpoint on production URL with signature verification
- [ ] Connect platform settings and OAuth client ID
- [ ] Price IDs for Provider Pro / Employer Pro
- [ ] Database migration applied (`prisma db push` or migrate)
- [ ] Monitor `BillingStripeWebhookEvent` for unprocessed rows
- [ ] Reconciliation job for `BillingPaymentSplit` transfers (future)

## Security

- Secret keys only in server env / `lib/stripe/client.ts`
- Webhook raw body + `constructEvent`
- Idempotent `stripeEventId` storage
- No client-side payment confirmation

## Accessibility

Participant billing UI targets WCAG 2.2 AA: semantic headings, `aria-live` status, visible focus rings, minimum 44px tap targets, screen reader labels on totals and status.

## AbilityPay gateway integration

AbilityPay (`lib/abilitypay/`) is MapAble's NDIS payment gateway. Approved self-managed and private-pay invoices create a linked `BillingInvoice` and use this module's Stripe Checkout flow. Webhooks in `lib/billing-core/webhook-handler.ts` sync payment outcomes back to `AbilityPayInvoice.paymentStatus` via `payment-sync-service.ts`.

Plan-managed invoices use export adapters (CSV claim pack) instead of card checkout. `billing-core` remains the execution plane; AbilityPay is the orchestration and trust layer.

### Saved payment methods

`lib/billing-core/portal-service.ts` exposes `createCustomerPortalSession` for any billing account role. Participants use `POST /api/billing/customer-portal` from the dashboard; AbilityPay participants use `POST /api/abilitypay/billing-portal` with funding-model gating. Cards are stored only in Stripe.
