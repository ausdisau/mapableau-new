# Donations

MapAble supports one-time guest donations via Stripe Checkout on the platform Stripe account.

## Flow

1. Donor visits `/donate` and chooses an amount (preset or custom).
2. The app creates a `Donation` row (`status: pending`) and a Stripe Checkout Session.
3. Donor completes payment on Stripe-hosted Checkout.
4. Stripe sends `checkout.session.*` webhooks; the donation handler updates `Donation.status`.

## Environment variables

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_DEFAULT_CURRENCY=AUD
DONATIONS_ENABLED=true
DONATIONS_MIN_CENTS=500
DONATIONS_MAX_CENTS=1000000
NEXT_PUBLIC_DONATION_URL=/donate
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Set `DONATIONS_ENABLED=false` to disable the checkout API without removing pages.

Set `NEXT_PUBLIC_DONATION_URL` to an external URL if the marketing header should link out instead of `/donate`.

## API

- `POST /api/donations/checkout` — public; body `{ amountCents, donorName?, donorEmail?, message? }`; returns `{ checkoutUrl, donationId, sessionId }`.
- `GET /api/donations/status?session_id=cs_...` — returns `{ status, amountCents, currency, paidAt }` (no PII).

## Stripe Dashboard checklist

1. Add webhook endpoint: `{APP_URL}/api/webhooks/stripe`
2. Subscribe to events:
   - `checkout.session.completed`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired` (optional; marks donation `cancelled`)
3. Enable customer email receipts (Settings → Emails) if you want Stripe to email receipts.
4. No pre-created Products/Prices are required — donations use dynamic `price_data`.

## Local webhook testing

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the signing secret into `STRIPE_WEBHOOK_SECRET`, then complete a test donation from `/donate`.

## Database

Prisma model: `Donation` with `DonationStatus` (`pending`, `paid`, `failed`, `cancelled`).

Apply migration:

```bash
npx prisma migrate deploy
```

## Out of scope (v1)

- Recurring donations
- Stripe Connect payouts to third-party charities
- Tax-deductible (DGR) receipts
- Admin donations dashboard
