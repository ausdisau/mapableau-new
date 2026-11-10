# MapAble Signal subdomain architecture

Status: development / draft PR — do not attach production DNS until review.

Target public host: `https://signal.mapable.com.au`

## Purpose

MapAble Signal is the Community Mapping Challenges surface. The subdomain gives a distinct public origin while staying in the same Next.js codebase as `mapable.com.au`.

## Routing

Handled via the shared programme registry and thin wrapper `lib/signal/host-routing.ts`:

- `signal.mapable.com.au/` rewrites to `/signal`
- `signal.mapable.com.au/<path>` rewrites to `/signal/<path>`
- explicit `/signal/*` remains reachable on the main host
- `/community` remains an alias for the same workspace split (live flag vs Signal Sites prototype)
- API and static-asset requests are not rewritten

Override host with `MAPABLE_SIGNAL_HOST` for controlled environments.

DNS / Vercel / Neon attach runbook: `docs/architecture/mapable-subdomain-dns-cloudflare-vercel-neon.md`.

## Safety

- Browser-local fictional Signal Sites remain the default when Community live is off.
- Live Community mode stays separately gated; subdomain rewrite does not enable live publication.
- Observations are scoped reports, not independent accessibility verification.

## Vercel

Attach `signal.mapable.com.au` only after preview CI and accessibility review. Prefer the same Vercel web project as `mapable.com.au`.
