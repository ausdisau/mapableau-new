# MapAble programme subdomain DNS mapping

Status: **runbook only** — do **not** attach production DNS or Vercel domains until human review.

This document maps programme subdomains to Next.js path rewrites, Cloudflare DNS, Vercel custom domains, and Neon Postgres. Application rewrites ship in middleware; DNS attach remains deferred.

## Host → path matrix

| Public host | Env override | Internal path | Notes |
| --- | --- | --- | --- |
| `labs.mapable.com.au` | `MAPABLE_LABS_HOST` | `/labs` | Existing Labs adapter |
| `peer.mapable.com.au` | peers host helpers | `/peers` | Existing Peers adapter (dedicated) |
| `signal.mapable.com.au` | `MAPABLE_SIGNAL_HOST` | `/signal` | Community Mapping Challenges |
| `accessimart.mapable.com.au` | `MAPABLE_ACCESSIMART_HOST` | `/marketplace` | Option 1 programme root |
| `accessimart.mapable.com.au/review` | same | `/marketplace/accessimart-review` | Option 2 path; still flag + allowlist gated |
| `marketplace.mapable.com.au` | `MAPABLE_MARKETPLACE_HOST` | `/marketplace` | Option 3; `/browse` when shop flag on |
| `ecosystem.mapable.com.au` | `MAPABLE_ECOSYSTEM_HOST` | `/ecosystem` | Option 4 hub |
| `care.mapable.com.au` | `MAPABLE_CARE_HOST` | `/care` | Care programme |
| `transport.mapable.com.au` | `MAPABLE_TRANSPORT_HOST` | `/transport` | Transport programme |
| `employment.mapable.com.au` | `MAPABLE_EMPLOYMENT_HOST` | `/employment` | Employment programme |

Code: `lib/platform/subdomain-route-adapter.ts`, `lib/platform/mapable-subdomain-registry.ts`, `middleware.ts`.

## Shared rewrite rules

For each programme adapter (except Peers):

- `/` → `{pathPrefix}`
- `/foo` → `{pathPrefix}/foo`
- paths already under `{pathPrefix}`, `/api/*`, `/_next/*`, and static files are not rewritten
- AccessiMart special paths: `/review` and `/accessimart-review` → `/marketplace/accessimart-review`

Subdomain rewrite does **not** flip feature flags, auth, or Neon credentials.

## Cloudflare DNS (authoritative zone `mapable.com.au`)

Prefer **primary (full) setup** with Cloudflare as the authoritative DNS provider for `mapable.com.au`.

For each programme subdomain, create a **CNAME** in **DNS → Records**:

| Type | Name | Target | Proxy status | TTL |
| --- | --- | --- | --- | --- |
| CNAME | `accessimart` | `cname.vercel-dns.com` | **DNS only** (grey cloud) initially | Auto |
| CNAME | `marketplace` | `cname.vercel-dns.com` | DNS only initially | Auto |
| CNAME | `ecosystem` | `cname.vercel-dns.com` | DNS only initially | Auto |
| CNAME | `care` | `cname.vercel-dns.com` | DNS only initially | Auto |
| CNAME | `transport` | `cname.vercel-dns.com` | DNS only initially | Auto |
| CNAME | `employment` | `cname.vercel-dns.com` | DNS only initially | Auto |
| CNAME | `signal` | `cname.vercel-dns.com` | DNS only initially | Auto |

Notes:

1. Confirm the exact CNAME target in Vercel **Project Settings → Domains** after adding the hostname (Vercel may show `cname.vercel-dns.com` or a project-specific target). Use the value Vercel displays.
2. Start with **DNS only** so Vercel can complete domain verification and issue TLS without orange-cloud interference. After SSL is Active, optionally enable **Proxied** with Cloudflare SSL mode **Full (strict)**.
3. Do not create conflicting A/AAAA records for the same name.
4. If a delegated subdomain zone already has NS records for that name, remove or roll back the delegation before adding a CNAME (Cloudflare will refuse overlapping NS + CNAME).
5. This runbook does **not** use Cloudflare Tunnel (`*.cfargotunnel.com`) for these public programme hosts — traffic terminates on Vercel.

References:

- [Manage DNS records](https://developers.cloudflare.com/dns/manage-dns-records/)
- [CNAME record type](https://developers.cloudflare.com/dns/manage-dns-records/reference/dns-record-types/#cname)
- [Primary (full) setup](https://developers.cloudflare.com/dns/zone-setups/full-setup/)

## Vercel custom domains

Attach every programme hostname to the **same** Vercel web project that deploys `ausdisau/mapableau-new` (same pattern as Labs).

Expected sequence (per host, after merge + preview CI):

1. Identify the Vercel project for `ausdisau/mapableau-new`.
2. Deploy Preview; verify path routes on the preview URL (`/marketplace`, `/ecosystem`, `/care`, …).
3. **Project Settings → Domains → Add** e.g. `care.mapable.com.au`.
4. Apply the DNS record Vercel requests in Cloudflare (see above).
5. Run `vercel domains verify <hostname> --project <project>` (or use the dashboard) until Valid.
6. Confirm TLS certificate provisioned (`vercel certs ls` / Domains UI).
7. Smoke-test host rewrite: `https://care.mapable.com.au/` → Care landing.

CLI sketch (does not run automatically from this PR):

```bash
vercel domains add accessimart.mapable.com.au <project>
vercel domains verify accessimart.mapable.com.au --project <project>
# DNS at Cloudflare (not vercel dns) when Cloudflare is authoritative:
# CNAME accessimart → cname.vercel-dns.com (DNS only)
```

References:

- [Set up a custom domain](https://vercel.com/docs/domains/set-up-custom-domain)
- [Managing DNS records](https://vercel.com/docs/domains/managing-dns-records)

## Neon Postgres

Programme subdomains share the **same** Next.js deployment and therefore the **same** Neon database. No per-subdomain Neon project is required.

| Variable | Neon connection | Role |
| --- | --- | --- |
| `DATABASE_URL` | Pooled (`-pooler` hostname) | Runtime Prisma client |
| `DIRECT_URL` | Direct (no `-pooler`) | Migrations / seed |

Configure once on the Vercel project for Production / Preview / Development. Subdomain attach does not change Neon URLs.

See `docs/operations/neon.md` for project IDs, `sslmode=require`, and migrate/seed commands.

Optional preview isolation: use a Neon **branch** for Preview deployments; still one `DATABASE_URL` / `DIRECT_URL` pair per environment — not per subdomain.

## Environment variables (hosts)

Optional overrides (defaults match production hostnames):

```env
MAPABLE_SIGNAL_HOST=signal.mapable.com.au
MAPABLE_ACCESSIMART_HOST=accessimart.mapable.com.au
MAPABLE_MARKETPLACE_HOST=marketplace.mapable.com.au
MAPABLE_ECOSYSTEM_HOST=ecosystem.mapable.com.au
MAPABLE_CARE_HOST=care.mapable.com.au
MAPABLE_TRANSPORT_HOST=transport.mapable.com.au
MAPABLE_EMPLOYMENT_HOST=employment.mapable.com.au
```

## Safety

- No production DNS or Vercel domain changes in this PR.
- AccessiMart review (`/review` on the AccessiMart host) remains fail-closed behind `MAPABLE_ACCESSIMART_REVIEW_ENABLED` + tester allowlist.
- Marketplace shop routes stay behind existing marketplace flags.
- Care / Transport / Employment auth gates are unchanged by host rewrite.
- Neon credentials stay project-scoped; never embed in DNS or client bundles.

## Deferred human checklist

- [ ] Preview CI green for this branch
- [ ] Accessibility review of programme landings
- [ ] Add hosts in Vercel Domains
- [ ] Create Cloudflare CNAMEs (DNS only → verify → optional Proxied Full strict)
- [ ] Confirm Neon env vars already present on the Vercel project
- [ ] Smoke-test each attached host
