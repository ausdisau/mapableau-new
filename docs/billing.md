# MapAble Core Billing

Stripe-powered billing for MapAble with NDIS-aware workflows, plan-managed exports, Connect payouts, and subscriptions.

## Architecture

- **Stripe** is the source of payment processing truth (cards, Checkout, Connect, subscriptions).
- **PostgreSQL (Prisma)** is the source of business workflow truth (invoices, funding sources, audit logs).
- **Webhooks** confirm payment success — never mark invoices paid from client redirects alone.
- **No card data** is stored locally; use Stripe Checkout and Customer Portal.

## Payment flows

### NDIS plan-managed

1. Participant adds a funding source with type `ndis_plan_managed`.
2. Invoice is created with status `issued` (not charged via Stripe).
3. Checkout API returns `plan_manager_export` instructions instead of a Stripe URL.
4. Export via `POST /api/billing/invoices/export` with `format: csv` or `plan_manager`.

### NDIS self-managed / private card

1. Participant selects `ndis_self_managed` or `private_card` funding.
2. `POST /api/billing/checkout` creates a Stripe Checkout Session (AUD).
3. Webhook `checkout.session.completed` or `payment_intent.succeeded` marks invoice `paid`.
4. Receipt is available in the billing dashboard after webhook processing.

### Stripe Connect (single provider)

When the invoice has one `providerId` and the provider has `stripeConnectedAccountId`:

- Destination charge with `application_fee_amount` = `platformFeeCents`
- `transfer_data.destination` = provider connected account

### Multiple providers

`PaymentSplit` records are created with status `pending`. Separate charges/transfers are stubbed for a future release.

## Environment variables

See `.env.example`:

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Server-only Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification |
| `NEXT_PUBLIC_APP_URL` | Checkout success/cancel URLs |
| `STRIPE_CONNECT_CLIENT_ID` | Connect OAuth (if used) |
| `STRIPE_PROVIDER_PRO_PRICE_ID` | Provider Pro subscription price |
| `STRIPE_EMPLOYER_PRO_PRICE_ID` | Employer Pro subscription price |

## API routes

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/billing/funding-sources` | List/create funding sources |
| POST | `/api/billing/invoices` | Create draft invoice |
| GET | `/api/billing/invoices/list` | List participant invoices |
| POST | `/api/billing/checkout` | Start Stripe Checkout or plan-manager path |
| POST | `/api/billing/connect/create-account` | Create Connect Express account |
| POST | `/api/billing/connect/onboarding-link` | Refresh onboarding link |
| POST | `/api/billing/subscriptions/checkout` | Subscription Checkout |
| POST | `/api/billing/customer-portal` | Stripe billing portal |
| POST | `/api/billing/invoices/export` | CSV / plan-manager export |
| POST | `/api/webhooks/stripe` | Stripe webhooks (raw body) |

## UI pages

- `/billing` — Participant dashboard (WCAG 2.2 AA: large targets, labels, keyboard nav)
- `/provider/billing` — Connect onboarding, payouts, subscriptions
- `/admin/billing` — Invoice search, failed payments, disputes

## Webhook setup

1. In Stripe Dashboard → Developers → Webhooks, add endpoint:
   `https://your-domain/api/webhooks/stripe`
2. Select events: `checkout.session.*`, `payment_intent.*`, `charge.refunded`, `charge.dispute.created`, `customer.subscription.*`, `account.updated`
3. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

### Local testing with Stripe CLI

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Use the CLI webhook secret in `.env.local`.

Trigger test events:

```bash
stripe trigger checkout.session.completed
```

## Production checklist

- [ ] Restricted API keys (RAK) where possible
- [ ] Webhook endpoint HTTPS only
- [ ] `STRIPE_WEBHOOK_SECRET` set per environment
- [ ] Connect platform settings and branding completed
- [ ] Price IDs for Provider Pro / Employer Pro in live mode
- [ ] Audit logs monitored for payment state changes
- [ ] Admin billing access restricted to `admin` role (enable when RBAC ready)

## Security notes

- Never expose `STRIPE_SECRET_KEY` to the browser.
- Webhook handler uses raw body + signature verification.
- Events stored by `stripeEventId` for idempotency.
- All money stored as integer cents (AUD).
- Immutable audit trail via `AuditLog` on create/export/payment changes.

## Accessibility requirements

Participant UI must meet **WCAG 2.2 AA**:

- Minimum 44×44px touch targets (`min-h-11` buttons)
- Visible focus rings on interactive elements
- `aria-label` / `sr-only` for amounts and status
- `role="status"` / `role="alert"` for dynamic messages
- Semantic headings and table headers in admin console

## Future: AbilityPay

This module is designed so plan-management and AbilityPay can extend:

- `FundingSource` metadata JSON
- Plan-managed export without Stripe
- `PaymentSplit` for multi-party settlements
- Xero export scaffold (`format: xero` returns 501)

## Running tests

```bash
pnpm test
```

Tests cover invoice totals, platform fees, funding decisions, checkout guards, and webhook idempotency.
