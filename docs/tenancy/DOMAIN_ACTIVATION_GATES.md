# Domain activation gates

Coverage Care’s proposed hostname is **branding context only**. Activation is fail-closed.

## Status: NOT CONFIGURED

| Gate | Status | Notes |
|---|---|---|
| Proposed host `coveragecare.mapable.com.au` | NOT CONFIGURED | No DNS / CNAME / Vercel domain attach |
| Host rewrite | Gated | Only when `MAPABLE_COVERAGE_CARE_ENABLED=true` |
| Reserved labels (`auth`, `admin`, `api`, `www`, `peer`, …) | Protected | Never resolve as tenants |
| TLS certificate | Blocked | Requires human platform credentials |
| Auth cookie / passkey RP ID | Blocked | Remains apex-scoped until security approval |
| Tenant registry | Server slug only | Host / `x-tenant-id` / `organisationId` alone never authorize |
| Live publish (BrandOS) | Blocked | Draft → approval preview only |
| NDIA capabilities | Denied | All return `NOT_AUTHORISED_OR_NOT_CONFIGURED` |

## Policy modules

- `lib/tenancy/tenant-host-policy.ts` — allow-list proposed host; reserved labels; forged/unknown hosts never activate
- `lib/tenancy/tenant-preview-policy.ts` — feature gates; synthetic banner
- `lib/tenancy/tenant-registry.ts` — approved slug resolve only
- Admin UI card at `/t/coveragecare/admin` and provisioning panel echo **NOT CONFIGURED**

## Human review required before any live step

1. DNS ownership proof and CNAME plan
2. TLS + cookie domain / RP ID multi-host design
3. Security review of host rewrite + CSP
4. Explicit product + compliance go-live for Coverage Care flags
