# Native Deputy / Xero / Stripe integration runbook

**Status:** Feature-flagged. Production switches remain OFF unless an authorised owner enables them after sandbox evidence.

## Base SHA

Implemented against `main` at `041941ec12538da238d2293349898b58af3b9891` (November 2026).

## Feature flags (defaults)

| Variable | Default | Purpose |
| --- | --- | --- |
| `MAPABLE_INTEGRATIONS_OUTBOX_ENABLED` | `false` | Process `IntegrationDelivery` outbox |
| `MAPABLE_INTEGRATIONS_DRY_RUN` | `true` (unless explicitly `false`) | Record deliveries without remote calls |
| `DEPUTY_ENABLED` | `false` | Deputy OAuth + draft roster adapter |
| `XERO_DIRECT_ENABLED` | `false` | Direct Xero OAuth + draft ACCREC |
| `STRIPE_DIRECT_BOOKING_ENABLED` | `false` | Care vertical slice → Checkout wiring |
| `DEPUTY_WEBHOOK_VERIFICATION_MODE` | `disabled` | `enterprise_hmac` only when Enterprise secret configured |
| `MAPABLE_PAYMENTS_MODE` | `test` | Must match Stripe event `livemode` |

Reuse existing `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `XERO_ENABLED` / `XERO_CLIENT_*`. Do not put secrets in `NEXT_PUBLIC_*`.

## Stripe webhook safety

- Handler failures leave `BillingStripeWebhookEvent.processingStatus=failed` (or legacy equivalent) and return HTTP 500 so Stripe retries.
- Livemode mismatches set `quarantined` and return HTTP 409; financial state is not advanced.
- States: `pending` → `processing` (lease) → `processed` | `failed` | `quarantined`.
- Never treat a browser return URL as payment proof.

## Outbox / DLQ

1. Domain events enqueue `IntegrationDelivery` with a stable `dedupeKey`.
2. Worker (`processPendingDeliveries`) claims `pending`/`retryable` rows.
3. Failures back off exponentially; after max attempts → `dead_letter`.
4. Human-reviewed MapAble bookings/invoices are never silently overwritten by reconciliation rows (`IntegrationReconciliation`).

## Token storage

OAuth tokens are stored only in `BillingIntegrationConnection.tokenCiphertext` (AES-GCM via `NDIS_ENCRYPTION_KEY` / `MAPABLE_DATA_ENCRYPTION_KEY`). Disconnect clears local ciphertext; providers may retain historical data under their own terms.

## Operator views

- Platform registry health: `/admin/integrations`
- Org billing connections: `/billing/integrations`
- Outbox summary helper: `getOutboxStatusSummary`

## Stop conditions

Do not enable live flags without: sandbox OAuth success, persisted external mapping, recovery test evidence, privacy/security/accessibility review, and financial-owner signoff.
