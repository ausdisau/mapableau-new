# AbilityPay module (MapAble Core MVP)

## Purpose

AbilityPay helps NDIS participants and nominees manage plan budgets, review provider invoices, and approve payments in plain language. Plan managers can upload and prepare invoices; participants retain human-only approval before exports.

## MVP scope

- Plan wallet with budget categories and spending forecast
- Invoice inbox, validation rules, duplicate detection, and NDIS price-limit checks
- Human approval flow with consent gate (participant / family member / plan manager)
- Draft-only AI review helper (suggestions, questions, category hints — no auto-approval)
- CSV claim pack and monthly statement export
- Audit trail for plan, invoice, approval, and export actions

## Explicit non-goals

- No NDIA portal submission or autonomous claims
- No credential scraping or provider portal automation
- No auto-pay or AI-driven approval decisions
- No replacement of `/plan-manager` or `/dashboard/billing` — AbilityPay coexists alongside them

## Routes

| Audience | Routes |
|----------|--------|
| Participant / nominee | `/abilitypay`, `/abilitypay/plan`, `/abilitypay/budgets`, `/abilitypay/invoices`, `/abilitypay/invoices/[id]`, `/abilitypay/approvals`, `/abilitypay/reports` |
| Plan manager | Above + workbench on dashboard; `/abilitypay/providers` |
| Provider admin | `/abilitypay/providers` (payment status mock) |
| Admin | `/abilitypay/admin`, `/abilitypay/audit` |

All `/abilitypay` routes require authentication (see `lib/mapable-peers/peer-middleware.ts`).

## APIs

- `GET/POST /api/abilitypay/plans`, `GET/PATCH /api/abilitypay/plans/[id]`, `POST /api/abilitypay/plans/[id]/categories`
- `GET/POST /api/abilitypay/invoices`, `GET/PATCH /api/abilitypay/invoices/[id]`
- `POST /api/abilitypay/invoices/[id]/validate`, `/upload`, `/approve`, `/reject`, `/ai-assist`
- `GET /api/abilitypay/providers`, `GET /api/abilitypay/approvals`
- `GET /api/abilitypay/exports/claim-pack`, `/exports/statement`
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
| `abilitypay.export.csv` | CSV claim pack downloaded |
| `abilitypay.export.statement` | Monthly statement generated |

## Database models

Prisma models prefixed `AbilityPay*` (e.g. `AbilityPayPlan`, `AbilityPayBudgetCategory`, `AbilityPayInvoice`, `AbilityPayInvoiceLineItem`, `AbilityPayProvider`, `AbilityPayApprovalEvent`, `AbilityPayRiskFlag`, `AbilityPayClaimPack`, `AbilityPayConsentRecord`). Migration: `prisma/migrations/20260611140000_abilitypay_mvp/`.

Reuses existing `AuditEvent`, NDIS pricing catalogue (`NdisPricingCatalogueItem`, `NdisSupportItem`), and consent patterns.

## Coexistence

- **`/plan-manager`** — legacy plan-manager portal and export patterns; AbilityPay mirrors claim-pack columns but uses its own models and routes.
- **`/dashboard/billing`** — platform billing (Stripe, care/transport invoices); AbilityPay NDIS invoices are separate (`AbilityPayInvoice` vs legacy `Invoice`).

## AI assistant boundaries

`lib/abilitypay/ai-invoice-assistant.ts` may suggest invoice type, missing fields, budget categories, and draft provider questions. It must not set approval status, create `ApprovalEvent`, or trigger export as submitted. UI shows: “AI helps you review. Only you or your nominee can approve payments.”

## Tests

`tests/abilitypay/` — validation checks, approval human-gate, duplicate detection, AI suggestion side effects.

`tests/peer-middleware.test.ts` — `/abilitypay` auth prefix.

`tests/module-routes.test.ts` — module registry href `/abilitypay`.
