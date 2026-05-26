# Route consolidation (multi-module)

MapAble has several product modules that evolved in parallel. Many user-facing paths overlap; this document lists **canonical routes**, **legacy aliases**, and **API namespaces** that should not be merged blindly.

Canonical paths live in [`lib/routing/canonical-routes.ts`](../lib/routing/canonical-routes.ts).

## Canonical vs legacy (UI)

| Concern | Canonical | Legacy / parallel | Notes |
|---------|-----------|-------------------|--------|
| Participant care hub | `/care` | `/dashboard/care` | Legacy redirects to `/care` |
| New care request | `/care/request` | `/dashboard/care/new` | Redirect |
| Care booking detail | `/care/bookings/[id]` | `/dashboard/care/[careRequestId]` | Legacy resolves request → booking |
| Participant care shifts | `/care/shifts`, `/care/shifts/[id]` | `/dashboard/care/shifts/*` | Migrated under care layout |
| Care & support super-app | `/care/support/*` | — | Participant; coordinator uses `/support-coordinator/*` |
| Messages | `/messages`, `/messages/[id]` | `/dashboard/messages/*` | Communication Centre is canonical |
| Provider search (marketing) | `/provider-finder` | `/care/find` | `/care/find` links to finder |
| Provider search (dashboard API) | `/dashboard/find-support` | — | Inline search; not same as finder |
| Stripe participant billing | `/billing` | `/dashboard/invoices` | Different APIs (`billing-core` vs legacy `Invoice`) |
| Generic bookings | `/dashboard/bookings` | `/care/bookings` | Different models (`Booking` vs `CareBooking`) |

## Intentional dual-audience routes (do not merge)

| Participant | Coordinator | Shared APIs |
|-------------|-------------|-------------|
| `/care/support/coordination` | `/support-coordinator/participants/[id]` | `lib/care-support`, care bookings |
| `/support-coordinator/access` (approve) | `/support-coordinator/participants` | `CoordinatorAccessRequest` |

## API namespaces (parallel by domain — not duplicates)

| Namespace | Module | Do not merge with |
|-----------|--------|-------------------|
| `/api/care/*` | Care MVP | `/api/bookings` (generic) |
| `/api/care-support/*` | Assessments, referrals | `/api/support-coordinator/*` (coordinator ops) |
| `/api/support-coordinator/*` | Caseload, tasks, access | `/api/care-support/*` |
| `/api/billing/*` | Stripe billing-core | `/api/invoices`, `/api/funding-sources` (legacy) |
| `/api/incidents` | Generic incidents | `/api/care/incidents` (shift-scoped + QSC) |
| `/api/messages/conversations/*` | Messaging | Used by both `/messages` and legacy dashboard UI |

## Redirects configured

**`next.config.ts`** — permanent redirects for common legacy paths.

**Page-level** — remaining dynamic legacy pages (e.g. `/dashboard/care/[careRequestId]`) keep `redirect()` where params must be resolved in code.

## Module entry points (recommended links)

| Module | Link in nav |
|--------|-------------|
| Care MVP | `routes.care.hub` |
| Care & support | `routes.care.support.hub` |
| Coordinator | `routes.coordinator.hub` |
| Dashboard portal | `routes.dashboard.hub` |
| Billing (Stripe) | `routes.billing.hub` |
| Messages | `routes.messages.hub` |

## Future consolidation (not done yet)

- Unify incident reporting (`/dashboard/incidents` vs `/worker/report-issue` → one API surface).
- Deprecate `/dashboard/invoices` in favour of `/billing` and update Stripe checkout URLs.
- Align `/api/matching/*` and `/api/ai-matching/*`.
- Implement or remove stub routes (`/provider/messages`, `/admin/operations/bookings`).
- Add missing dashboard detail pages linked from lists (funding, invoices, incidents, support tickets).

## Verification

After changing redirects:

```bash
pnpm type-check
```

Manually verify: `/dashboard/care`, `/dashboard/messages`, `/dashboard/care/shifts` resolve to canonical paths.
