# Coverage Care × MapAble white-label pilot

Local / review-only prototype of Coverage Care as the first proposed MapAble Domain Services white-label tenant.

**Proposed host:** `coveragecare.mapable.com.au` (not live — do not change DNS or deploy).

**Base path:** `/coverage-care/*` on the MapAble apex (works without host rewrite).

## Flag matrix (all default OFF)

| Env | Purpose | Default |
|---|---|---|
| `MAPABLE_COVERAGE_CARE_ENABLED` | Master switch for pages + APIs + host rewrite surface | `false` |
| `MAPABLE_COVERAGE_CARE_HOST` | Proposed hostname | `coveragecare.mapable.com.au` |
| `MAPABLE_COVERAGE_CARE_BRANDOS_ENABLED` | BrandOS messaging/assets/approvals preview | `false` |
| `MAPABLE_COVERAGE_CARE_PROVISIONING_PREVIEW_ENABLED` | Domain-readiness preview (no DNS writes) | `false` |
| `MAPABLE_COVERAGE_CARE_PERSISTENCE` | `memory` (default synthetic) or `prisma` (local migration only) | `memory` |
| `MAPABLE_COVERAGE_CARE_DEMO_ACTOR` | Synthetic participant/provider identities for UI without IdP | `false` |

## Local enablement

```bash
export MAPABLE_COVERAGE_CARE_ENABLED=true
export MAPABLE_COVERAGE_CARE_BRANDOS_ENABLED=true
export MAPABLE_COVERAGE_CARE_PROVISIONING_PREVIEW_ENABLED=true
export MAPABLE_COVERAGE_CARE_DEMO_ACTOR=true
export MAPABLE_COVERAGE_CARE_PERSISTENCE=memory
pnpm dev
```

Open:

- http://localhost:3000/coverage-care
- Host rewrite smoke: `curl -I -H 'Host: coveragecare.mapable.com.au' http://localhost:3000/`

## Participant journey

1. Explore `/coverage-care/services` (synthetic allied-health directory).
2. Create enquiry → review sharing → submit.
3. Provider reviews at `/coverage-care/provider/inbox`.
4. Participant withdraws / deletes at `/coverage-care/enquiries/[id]`.

## Exact module tree

```
app/coverage-care/
  layout.tsx
  page.tsx
  services/page.tsx
  enquiries/page.tsx
  enquiries/new/page.tsx
  enquiries/[id]/page.tsx
  provider/inbox/page.tsx
  provider/admin/page.tsx
  admin/brandos/page.tsx
  admin/provisioning/page.tsx
  admin/ndia/page.tsx
app/api/coverage-care/
  services/route.ts
  enquiries/route.ts
  enquiries/[id]/route.ts
  enquiries/[id]/share|submit|withdraw/route.ts
  provider/inbox/route.ts
  provider/inbox/[id]/review/route.ts
  brandos/route.ts
  brandos/[id]/review/route.ts
  provisioning/run/route.ts
  ndia/readiness/route.ts
components/coverage-care/*
lib/coverage-care/*
lib/config/coverage-care.ts
prisma/migrations/20261105040000_coverage_care_pilot/
prisma/seed-coverage-care.ts
tests/coverage-care/*
docs/coverage-care/*
```

## Security / tenancy

- Every write API resolves actor + tenant and enforces ownership / provider_admin.
- Cross-tenant reads of Coverage Care enquiries throw and record an access denial.
- Listings always carry `provenance: synthetic_demo` — never `ndis_verified`.
- NDIA panel wraps `OfficialDisabledClaimsGateway` only.

## Rollback

1. Leave all `MAPABLE_COVERAGE_CARE_*` flags unset/`false` (default).
2. Revert or close the feature PR / delete branch `cursor/coverage-care-white-label-af0e`.
3. If the local Prisma migration was applied, drop `coverage_care_*` tables.
4. No production DNS, deploy, or migration to undo when never promoted.

## Honesty

- No real bookings, payments, or NDIA submissions.
- No verified NDIS registration / practitioner / availability claims.
- Prisma migration is for local/pilot review only — not a production rollout.
