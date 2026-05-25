# Xero + Stripe billing

MapAble **Invoice** records are the source of truth. Stripe processes card payments. Xero receives accounting copies for reconciliation.

## Architecture

| Layer | Role |
|-------|------|
| `Invoice` + `InvoiceLine` | Source of truth, approvals, disputes |
| `StripePaymentRecord` | Checkout sessions and payment intents |
| `XeroConnection` | Encrypted OAuth per provider organisation |
| `XeroInvoiceSyncRecord` | Sync attempts with `payloadHash` idempotency |
| `BillingEvent` + audit events | Status history |

## Participant flow

1. Provider issues invoice from completed care shift / booking.
2. Participant approves at `/invoices/[id]` if required.
3. Participant pays private/gap via Stripe Checkout (`POST /api/stripe/checkout-session`).
4. Stripe webhook updates invoice to `paid` / `partially_paid`.

## Provider flow

1. Generate invoice: `POST /api/invoices/from-service-log/[careShiftId]`
2. Issue: `POST /api/invoices/[id]/issue`
3. Connect Xero: `/provider/settings/xero` → `GET /api/xero/connect`
4. Sync: `POST /api/xero/invoices/sync/[invoiceId]` (retry on failure)

## Environment

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_ENABLED=true` or `BILLING_ENABLE_STRIPE=true`
- `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `XERO_REDIRECT_URI`
- `XERO_ENABLED=true`
- `BILLING_ENCRYPTION_KEY` (recommended in production)

## Security

- Row-level access via `invoice-access-service` (participant, provider org, consent, plan manager).
- Xero tokens encrypted with AES-256-GCM.
- Webhook signature verification required.
- MFA placeholders on disconnect, manual payment, refunds.
