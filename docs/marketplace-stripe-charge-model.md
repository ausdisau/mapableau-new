# Marketplace Stripe charge model (proposed)

Status: **documentation before live money movement**. Sandbox/test only until product, legal and finance approve.

## Scope

Applies to MapAble Marketplace ordinary assistive-technology purchases (`serviceType: marketplace`) paid through the existing Billing Core + Stripe Checkout stack.

Does **not** enable:

- live `MAPABLE_PAYMENTS_MODE=live`
- `MAPABLE_PAYOUTS_ENABLED` unrestricted browser transfers
- AccessiMart review “fake checkout”
- NDIS plan-managed card capture
- Assessment / AbilityPay clinical pathways

## Buyer charge model

1. Cart sends **product IDs + quantities + pathway only** to `POST /api/marketplace/checkout`.
2. Server resolves unit prices from the trusted catalogue (`lib/marketplace/catalog.ts`).
3. Totals use `calculateInvoiceTotals`:
   - **Subtotal** = Σ quantity × unit cents
   - **GST** = GST-applicable lines × `BILLING_GST_BPS` (default 10%)
   - **Platform fee (commission)** = subtotal × `BILLING_PLATFORM_FEE_BPS` (default 10%)
   - **Total payable** = subtotal + GST + platform fee
4. A `BillingInvoice` is created as **draft**, then moved to **pending_payment** when a Checkout Session is created.
5. Stripe Checkout Session amount = invoice `totalCents` from the database — never browser-supplied amounts.
6. Order is marked **paid** only after a verified webhook (`checkout.session.completed` / payment_intent success). Visiting the success URL alone must never mark paid.

### Pathways (kept separate)

| Pathway | Funding type | Card Checkout? | Notes |
| --- | --- | --- | --- |
| `ordinary_purchase` | `private_card` | Yes | Default private buy |
| `ndis_self_managed` | `ndis_self_managed` | Yes | Does **not** claim NDIS eligibility |
| `ndis_plan_managed` | `ndis_plan_managed` | No | Invoice + plan-manager export only |

Assessment pathways remain outside this checkout.

## Commission calculation

Default platform fee: **`BILLING_PLATFORM_FEE_BPS`** (basis points on subtotal before GST).

Example (one GST-applicable item at $100.00, 1000 bps GST, 1000 bps fee):

- Subtotal $100.00
- Platform fee $10.00
- GST $10.00
- **Total $120.00**

Disclose the platform fee on the cart before payment (cart UI + quote API).

## Seller / Connect model

Preferred MVP: **separate charges and transfers** (platform charges the buyer, then transfers net to connected accounts after attestation / review window). Destination charges remain available when a single provider connected account is on the invoice and policy allows.

**Current catalogue limitation:** static catalogue sellers are display names only (`sellerName` in line metadata). Until each seller is bound to a `PayoutRecipient` / Connect account ID, marketplace invoices set `sellerSplitDeferred: true` and **do not** create `BillingPaymentSplit` rows. Funds remain on the platform balance; seller earnings UI will not show transfers for those purchases. This is intentional until a Connect-bound seller registry exists.

| Concept | Meaning |
| --- | --- |
| **Transfer** | Platform → connected Stripe account (`PayoutTransfer`) |
| **Bank payout** | Connected account → seller bank, scheduled by Stripe |

Seller onboarding: Express Connect via `/api/billing/connect/*` and status via `/api/billing/connect/status`. Connected account IDs bind server-side to the authenticated user’s `BillingAccount`.

Live transfers remain gated by `MAPABLE_PAYOUTS_ENABLED` (default off). No unrestricted browser-triggered withdrawals.

## Refund and dispute responsibilities (proposed)

| Event | Platform | Seller |
| --- | --- | --- |
| Full/partial refund before transfer | Platform refunds buyer; no seller transfer | N/A |
| Refund after transfer | Platform may reverse/claw back transfer where Stripe allows; seller notified | Seller remains responsible for product return / service remediation |
| Chargeback / dispute | Platform responds with evidence; payouts blocked while dispute open (`blockOnOpenDispute`) | Seller supplies fulfilment evidence promptly |
| Fraudulent listing | Platform may withhold / reverse | Seller liable under marketplace terms |

Automated transfer reversal on refund is an **known MVP gap** — do not enable live payouts until remediation is designed.

## Idempotency and safety

- Webhook signature verification on raw body (`/api/webhooks/stripe`)
- `BillingStripeWebhookEvent` deduplicates event IDs
- Checkout Session reuse when an open session already exists for the invoice
- Price tampering rejected (strict checkout schema; server catalogue prices)

## Remaining configuration (human)

See `docs/marketplace-stripe-vercel-remaining-steps.md`.
