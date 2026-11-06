# MapAble Domain Services — self-serve provider hosting

Flag-gated wizard for provider organisations to register a **draft** white-label tenant preview. Inspired by TPP WhiteLabel setup UX, implemented as MapAble Domain Services (not a PHP/cPanel port).

## Flags (fail-closed)

| Variable | Default | Effect |
|---|---|---|
| `MAPABLE_DOMAIN_SERVICES_SELF_SERVE_ENABLED` | `false` | Master switch for wizard page + setup/slug APIs + for-providers primary CTA |
| `MAPABLE_DOMAIN_SERVICES_HOST_SUFFIX` | `mapable.com.au` | Branding-only proposed hostname suffix |

When the master flag is off:

- `GET/POST /api/domain-services/*` → `503 DOMAIN_SERVICES_SELF_SERVE_DISABLED`
- `/provider/domain-services/setup` → `404`
- `/for-providers` CTA stays on `/contact`

## Flow

1. Public entry: `/for-providers` → `/provider/domain-services/setup` (when flag on)
2. Sign in / register as MapAble user
3. Three-step wizard: account + slug → module toggles → brand tokens
4. Submit creates the caller’s own `care_provider` organisation + `provider_admin` membership (narrow self-serve; never creates orgs for others)
5. Draft tenant stored in the in-memory Domain Services registry (`status: preview`, `domainActivation: NOT_CONFIGURED`)
6. Preview at `/t/[slug]` with generic shell + Domain readiness **NOT CONFIGURED** card

## Authority model

- Session user is the only authority for setup APIs
- `Host`, `x-tenant-id`, and client-supplied organisation ids never authorise tenancy
- Reserved labels (`auth`, `admin`, `www`, …) and static tenants (`coveragecare`, `acme-care`) cannot be claimed
- Proposed hostname is **branding only**

## Persistence

Default: process memory (same pilot pattern as other synthetic tenancy demos). Drafts do not survive cold starts. Optional Prisma persistence is out of scope for v1 — do not apply production migrations for this feature.

## Explicit blockers (human ops later)

- Live DNS / TLS certificates
- Vercel domain attach
- Multi-host cookies
- TPP partnerconsole / cPanel / M365 / VPS SKUs
- Auto-activating Coverage Care product claims or NDIA

## Related code

- `lib/config/domain-services.ts`
- `lib/tenancy/domain-services-*.ts`
- `lib/tenancy/tenant-registry.ts` (`resolveTenantBySlug` consults drafts after static entries)
- `app/api/domain-services/`
- `app/provider/domain-services/setup/`
- `app/(tenant-preview)/t/[slug]/`
