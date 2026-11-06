# Coverage Care × MapAble white-label pilot

Local / review-only prototype of Coverage Care as the first proposed MapAble Domain Services white-label tenant.

**Proposed host:** `coveragecare.mapable.com.au` (not live — do not change DNS or deploy).

**Preview base path:** `/t/coveragecare/*` (canonical). Legacy `/coverage-care/*` redirects here with path remaps for enquiries → portal.

## Flag matrix (all default OFF)

| Env | Purpose | Default |
|---|---|---|
| `MAPABLE_COVERAGE_CARE_ENABLED` | Master switch for pages + APIs + host rewrite | `false` |
| `MAPABLE_COVERAGE_CARE_HOST` | Proposed hostname | `coveragecare.mapable.com.au` |
| `MAPABLE_COVERAGE_CARE_BRANDOS_ENABLED` | BrandOS messaging/assets/approvals preview | `false` |
| `MAPABLE_COVERAGE_CARE_PROVISIONING_PREVIEW_ENABLED` | Domain-readiness preview (no DNS writes) | `false` |
| `MAPABLE_COVERAGE_CARE_PERSISTENCE` | `memory` (default) or `prisma` (local only) | `memory` |
| `MAPABLE_COVERAGE_CARE_DEMO_ACTOR` | Synthetic participant/provider identities | `false` |

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

- http://localhost:3000/t/coveragecare
- Host rewrite smoke (master flag on): `curl -I -H 'Host: coveragecare.mapable.com.au' http://localhost:3000/`

## Participant journey

1. Explore `/t/coveragecare/services` (10 proposed disciplines, all `proposed / awaiting verification`).
2. Enquire with preferred channel + optional access needs → share review → submit.
3. Portal: amend (while draft/sharing_review), withdraw, delete.
4. Provider inbox: `new | in_review | needs_information | closed`.

## Architecture map

| Concern | Path |
|---|---|
| Pure domain policies | `lib/tenancy/*` |
| Coverage Care services | `lib/coverage-care/*` |
| Preview UI | `app/(tenant-preview)/t/[slug]/*` |
| Tenant components | `components/tenants/*` |
| Tests | `tests/tenancy/*` (+ legacy `tests/coverage-care/*`) |

## Non-goals

- Live NDIA, payments, DNS, Vercel domain attach, production migrate
- Unverified NDIS/practitioner claims
- Platform admin auto-access to participant enquiries

See also: [DOMAIN_ACTIVATION_GATES.md](./DOMAIN_ACTIVATION_GATES.md), [SECURITY_ACCESSIBILITY_EVIDENCE.md](./SECURITY_ACCESSIBILITY_EVIDENCE.md).
