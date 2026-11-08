# ADR-001: Ads Manager boundaries (extend `lib/ads`)

**Status:** Accepted (2026-11-08, Australia/Sydney)  
**Context:** Blueprint v1.2 proposed greenfield `apps/ads-*` deployables. Repository inspection shows a flag-gated MapAble Ads foundation already lives in this Next.js + Prisma app.

## Decision

Implement Ads Manager P0/P1 and the §14.11 synthetic vertical slice as a **bounded module** inside the existing application:

- Domain: [`lib/ads/`](../../lib/ads/)
- HTTP: [`app/api/ads/`](../../app/api/ads/) including new `/api/ads/v1/*`
- Docs/contracts: [`docs/ads/`](./)
- Persistence: Prisma models colocated with existing `Ad*` tables

Do **not** create `apps/ads-web`, `apps/ads-api`, or `apps/ads-worker` in this phase.

## Consequences

- Reuse NextAuth, organisation membership, `createAuditEvent`, CloudEvent outbox, existing wallet/Stripe top-up patterns, and a11y CI.
- Keep auction/serve path unchanged; additive `lifecycleStatus` and placement-order tables avoid breaking Access/Provider Finder fill.
- Dual money domains: auction/wallet remains AUD **micros**; placement quotes/orders use OpenAPI **amountMinor** (integer cents).
- Tenant isolation remains **application-layer** (org/advertiser scoped). Postgres RLS on Ads tables is a residual risk noted below — mitigated by negative cross-tenant tests.
- External social/DOOH connectors stay synthetic/`demo` until commercial gates; catalogue discovery never grants buy rights.

## Alternatives considered

| Option | Why rejected for this phase |
|--------|-----------------------------|
| Greenfield `apps/ads-*` | Duplicates auth, billing, deploy, and CI without inventory evidence |
| Separate microservice | Premature; no live partner write traffic yet |
| Replace auction with buyer-only model | Existing sponsored inventory path is verified and must keep working |

## Residual risks

- No Prisma RLS on `ad_*` tables.
- Outbox relay is best-effort; Ads events must remain idempotent for consumers.
- APIs.io catalogue metadata may be stale or generated — never treat as entitlement.
