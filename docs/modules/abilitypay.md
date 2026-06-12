# AbilityPay module (MapAble Core payment gateway)

## Purpose

AbilityPay is MapAble's payment gateway for disability care and support. Participants and nominees manage plan budgets, review provider invoices, and approve payments in plain language. After human approval, AbilityPay routes invoices to the right execution adapter — plan-managed export, Stripe checkout (self-managed / private pay), or NDIA handoff (agency-managed).

## MVP scope

- Plan wallet with budget categories, funding model, and spending forecast
- Invoice inbox, validation rules, duplicate detection, and NDIS price-limit checks
- Human approval flow with consent gate (participant / family member / plan manager)
- Post-approval funding router (`plan_export`, `stripe_checkout`, `ndia_claim`)
- Stripe checkout bridge for self-managed and private-pay invoices (via `billing-core`)
- CSV claim pack and monthly statement export with consent enforcement
- Payment attempt ledger (`AbilityPayPaymentAttempt`) and webhook-driven status sync
- Draft-only AI review helper (suggestions, questions, category hints — no auto-approval)
- Audit trail for plan, invoice, approval, export, and payment actions

## Explicit non-goals

- No NDIA portal submission or autonomous claims (agency path is handoff only)
- No credential scraping or provider portal automation
- No AI-driven approval decisions
- No silent card charges without explicit checkout (approval authorises payment; participant completes Checkout)
- No replacement of `/plan-manager` or `/dashboard/billing` — AbilityPay orchestrates; billing-core executes card payments

## Funding models

| Model | Post-approval adapter | Card payment |
|-------|----------------------|--------------|
| `plan_managed` | CSV/HTML export | No |
| `self_managed` | Stripe Checkout | Yes |
| `private_pay` | Stripe Checkout | Yes |
| `agency_managed` | NDIA claim handoff | No |

Set on `AbilityPayParticipantPlan.fundingModel` (default `plan_managed`); may be overridden per invoice.

## Payment lifecycle

`pending_review` → `approved` → `ready_to_pay` / `processing` → `paid` | `failed` | `refunded`

Legacy `paid_mock` remains in the enum for backward compatibility but is not used on new flows.

## Routes

| Audience | Routes |
|----------|--------|
| Participant / nominee | `/abilitypay`, `/abilitypay/plan`, `/abilitypay/budgets`, `/abilitypay/invoices`, `/abilitypay/invoices/[id]`, `/abilitypay/approvals`, `/abilitypay/reports`, `/abilitypay/reconciliation`, `/abilitypay/payment-methods` |
| Plan manager | Above + workbench on dashboard; `/abilitypay/providers` |
| Provider admin | `/abilitypay/providers` (live payment status) |
| Admin | `/abilitypay/admin`, `/abilitypay/audit` |

All `/abilitypay` routes require authentication (see `lib/mapable-peers/peer-middleware.ts`).

## APIs

- `GET/POST /api/abilitypay/plans`, `GET/PATCH /api/abilitypay/plans/[id]`, `POST /api/abilitypay/plans/[id]/categories`
- `GET/POST /api/abilitypay/invoices`, `GET/PATCH /api/abilitypay/invoices/[id]`
- `POST /api/abilitypay/invoices/[id]/validate`, `/upload`, `/approve`, `/reject`, `/pay`, `/confirm-payment`, `/ai-assist`
- `POST /api/abilitypay/invoices/from-care` — manual care log → draft invoice intake
- `GET /api/abilitypay/reconciliation` — payment attempt ledger for plan managers / admins
- `GET /api/abilitypay/providers`, `GET /api/abilitypay/approvals`
- `POST /api/abilitypay/exports/claim-pack`, `/exports/statement`
- `POST /api/abilitypay/billing-portal` — Stripe Customer Billing Portal for self-managed / private-pay participants (manage saved cards)
- `GET /api/abilitypay/audit`

## Invoice status flow

`draft` → `submitted` → `in_review` → `awaiting_participant` → `approved` / `rejected` → `exported`

## Permission matrix

| Permission | participant | family_member | support_coordinator | plan_manager | provider_admin | mapable_admin |
|------------|-------------|---------------|---------------------|--------------|----------------|---------------|
| `abilitypay:read` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `abilitypay:plan:manage` | | | | ✓ | | ✓ |
| `abilitypay:invoice:upload` | ✓ | | | ✓ | ✓ | ✓ |
| `abilitypay:invoice:review` | | | ✓ | ✓ | | ✓ |
| `abilitypay:invoice:approve` | ✓ | ✓ | | ✓ | | ✓ |
| `abilitypay:export` | ✓ | ✓ | | ✓ | | ✓ |
| `abilitypay:audit:read` | | | | ✓ | | ✓ |
| `abilitypay:admin` | | | | | | ✓ |

Participants cannot access `/abilitypay/admin`. Provider admins cannot approve invoices.

## Audit action catalogue

Recorded via `AuditEvent` (`lib/abilitypay/audit.ts`):

| Action | When |
|--------|------|
| `abilitypay.plan.created` | New plan created |
| `abilitypay.plan.updated` | Plan or category updated |
| `abilitypay.invoice.created` | Invoice uploaded or drafted |
| `abilitypay.invoice.updated` | Invoice metadata or lines changed |
| `abilitypay.invoice.validated` | Validation rules run |
| `abilitypay.invoice.approved` | Human approval recorded |
| `abilitypay.invoice.rejected` | Human rejection recorded |
| `abilitypay.payment.initiated` | Post-approval routing or checkout started |
| `abilitypay.payment.paid` | Stripe webhook confirms payment |
| `abilitypay.payment.failed` | Payment failed |
| `abilitypay.payment.refunded` | Refund recorded |
| `abilitypay.payment.ndia_handoff` | Agency-managed NDIA claim draft or metadata handoff |
| `abilitypay.export.csv` | CSV claim pack downloaded |
| `abilitypay.export.statement` | Monthly statement generated |
| `abilitypay.billing_portal.opened` | Participant opened Stripe Billing Portal to manage saved cards |

## Database models

Prisma models prefixed `AbilityPay*` including `AbilityPayParticipantPlan` (with `fundingModel`), `AbilityPayInvoice` (with `billingInvoiceId`, `sourceType`, `sourceRefId`), `AbilityPayPaymentAttempt`, `AbilityPayClaimPack`, `AbilityPayConsentGrant`. Migrations: `20260611140000_abilitypay_mvp`, `20260611190000_abilitypay_gateway`, `20260611200000_abilitypay_phases_3_5`.

Reuses existing `AuditEvent`, `BillingInvoice` (Stripe execution), NDIS pricing catalogue, and consent patterns.

## Gateway services

| Service | Role |
|---------|------|
| `funding-router-service.ts` | Routes approved invoices by funding model |
| `stripe-adapter-service.ts` | Bridges to `billing-core` Checkout |
| `payment-sync-service.ts` | Syncs Stripe webhook outcomes to AbilityPay |
| `consent-service.ts` | Enforces `AbilityPayConsentGrant` before export/pay |
| `plan-manager-adapter-service.ts` | Plan manager confirms plan-managed payment (`manual` adapter) |
| `care-intake-service.ts` | Creates draft invoices from confirmed care service logs |
| `ndia-adapter-service.ts` | Builds NDIA claim payloads and initiates agency handoff |
| `reconciliation-service.ts` | Payment attempt listing and summary for reconciliation UI |
| `billing-portal-service.ts` | Stripe Customer Billing Portal for self-managed / private-pay saved cards |

## Invoice sources

`AbilityPayInvoice.sourceType` tracks provenance:

| Source | Trigger |
|--------|---------|
| `provider_upload` | Default provider invoice upload |
| `care_service_log` | Auto-draft on care log confirmation or `POST /invoices/from-care` |
| `delivery_event` | Reserved for delivery-event intake |
| `billing_invoice` | Reserved for billing-core linkage |

## Post-approval execution

```
approve → funding router → ready_to_pay / processing
  ├─ plan_managed  → export claim pack; plan manager POST confirm-payment → paid
  ├─ self_managed / private_pay → POST /pay → Stripe Checkout → webhook sync
  └─ agency_managed → NDIA claim draft or metadata handoff (no live submit)
```

Care intake: confirming a `CareServiceLog` best-effort creates a linked draft invoice when an active plan and provider exist.

## Billing Portal (saved cards)

Self-managed and private-pay participants can manage saved payment methods via Stripe's hosted Customer Billing Portal — no card data is stored in MapAble.

- **UI:** `/abilitypay/payment-methods` (AbilityPay nav) and **Manage payment methods** on invoice pay actions and `/dashboard/billing/invoices`
- **API:** `POST /api/abilitypay/billing-portal` with optional `returnPath`, `participantId` (plan managers)
- **Core:** `lib/billing-core/portal-service.ts` creates portal sessions; `ensureStripeCustomerForUser` lazily creates a Stripe Customer on first open
- **Not applicable:** plan-managed and agency-managed funding models (no card checkout)

Checkout sessions set `setup_future_usage: "off_session"` when a Stripe Customer exists so cards can be reused.

## Coexistence

- **`/plan-manager`** — legacy plan-manager portal; AbilityPay mirrors claim-pack columns but uses its own models and routes.
- **`/dashboard/billing`** — platform billing UI; AbilityPay creates linked `BillingInvoice` records for Stripe execution. Participant-facing hub will converge under AbilityPay over time.

## AI assistant boundaries

`lib/abilitypay/ai-invoice-assistant.ts` may suggest invoice type, missing fields, budget categories, and draft provider questions. It must not set approval status, create `ApprovalEvent`, or trigger export as submitted. UI shows: “AI helps you review. Only you or your nominee can approve payments.”

## Tests

`tests/abilitypay/` — validation checks, approval human-gate, funding router, consent, duplicate detection, AI suggestion side effects.

`tests/peer-middleware.test.ts` — `/abilitypay` auth prefix.

`tests/module-routes.test.ts` — module registry href `/abilitypay`.
