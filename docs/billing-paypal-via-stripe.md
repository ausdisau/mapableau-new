# PayPal via Stripe Checkout (Option A)

MapAble accepts participant PayPal payments **through Stripe Checkout**, not a separate PayPal integration. No extra npm package or webhook endpoint is required.

## Code status

Already compatible:

- `lib/stripe/checkout.ts` creates Checkout Sessions **without** `payment_method_types`, so Stripe can show PayPal when enabled in the Dashboard.
- `lib/billing-core/checkout-service.ts` → `buildBillingPaymentCheckout` → same flow as card payments.
- Webhooks stay on `POST /api/webhooks/stripe` (`checkout.session.completed`, etc.).

## Prerequisites

1. **Stripe connected to the app** (`.env`):

```env
STRIPE_SECRET_KEY=sk_test_...   # or rk_test_... restricted key
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_ENABLED=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_DEFAULT_CURRENCY=AUD
```

2. **Stripe Dashboard — PayPal**

   - [Settings → Payment methods](https://dashboard.stripe.com/settings/payment_methods)
   - Enable **PayPal**
   - Complete [Activate PayPal payments](https://docs.stripe.com/payments/paypal/activate) (link Stripe ↔ PayPal business accounts)

3. **Connect (providers)** — unchanged

   Provider payouts still use **Stripe Connect Express** (`lib/stripe/connect.ts`). PayPal on Checkout does not replace Connect onboarding.

## Australia (MapAble)

Stripe documents PayPal for platforms whose **Stripe account** is registered in specific countries (mostly EEA). **AUD** is supported as a **presentment** currency for PayPal, but an **Australian** Stripe account may not see PayPal in Payment methods until Stripe offers it for your account region.

**Check:** Dashboard → Payment methods → is PayPal listed and activatable?

| Dashboard shows PayPal | Action |
|------------------------|--------|
| Yes | Enable, activate, test Checkout |
| No | Contact [Stripe Support](https://support.stripe.com/) or consider direct PayPal / custom payment method |

Reference: [PayPal payments](https://docs.stripe.com/payments/paypal).

## Test flow

1. `pnpm dev` with Stripe test keys in `.env`.
2. Create a billing invoice with funding source `private_card` or `ndis_self_managed`.
3. `POST /api/billing/checkout` or pay from `/dashboard/billing/invoices`.
4. On Stripe Checkout, select **PayPal** (or PayPal button if shown).
5. In test mode, use a [PayPal Sandbox personal account](https://developer.paypal.com/tools/sandbox/accounts/) when Checkout shows the PayPal button.
6. Confirm webhook marks invoice paid (`checkout.session.completed`).

Local webhooks:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Production checklist

- [ ] Live `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` on production URL
- [ ] PayPal enabled and activated in live Dashboard
- [ ] Test one AUD invoice end-to-end in live mode (small amount)
- [ ] Refunds/disputes handled per [Stripe PayPal docs](https://docs.stripe.com/payments/paypal#disputed-payments)

## What this does not cover

- Standalone PayPal marketplace / multiparty (separate PayPal Commerce Platform build)
- PayPal as provider payout rail (still Stripe Connect)
- Plan-managed NDIS invoices (no Checkout — export to plan manager only)
