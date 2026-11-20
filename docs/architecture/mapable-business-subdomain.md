# MapAble Provider Center subdomain architecture

Status: in development

Target public host: `https://business.mapable.com.au`

## Purpose

Provider Center is the Meta Business Suite–style operations surface for provider organisations. It consolidates care, transport, workforce, bookings, claiming, billing, and insights under a dedicated origin with clean public URLs.

This is a **provider-authenticated** surface — not the public marketplace or participant app.

## Initial architecture

The first release stays in the existing `ausdisau/mapableau-new` Next.js codebase so it can reuse MapAble auth, security headers, billing, and CI without a second deployable.

Host routing is handled by middleware (`lib/provider/business-host-routing.ts`):

| Public URL (business host) | Internal App Router path |
| --- | --- |
| `business.mapable.com.au/` | `/provider` |
| `business.mapable.com.au/care` | `/provider/care` |
| `business.mapable.com.au/billing` | `/provider/billing` |
| `business.mapable.com.au/provider/care` | **301 →** `/care` (strip prefix) |

- Explicit `/provider/*` routes remain reachable on the apex host (`mapable.com.au`) during migration.
- API and static-asset requests are not rewritten.
- Override host with `MAPABLE_BUSINESS_HOST` for controlled environments.

Middleware sets `x-mapable-business-host: 1` on rewritten requests so layouts/nav can emit clean hrefs.

## Auth (cross-subdomain session)

Provider Center requires the same NextAuth session as apex MapAble.

- Production MapAble family deployments set session cookie `domain` to `.mapable.com.au` via `lib/auth/session-cookie-domain.ts` (when `NEXT_PUBLIC_APP_URL` / `NEXTAUTH_URL` is on `*.mapable.com.au`).
- Localhost and Vercel preview hosts stay **host-only** unless `MAPABLE_SESSION_COOKIE_DOMAIN` is set explicitly.
- Keep `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` on **apex** `https://mapable.com.au`. Do not point them at the business host.
- Unauthenticated business-host hits redirect to apex `/login` with an absolute `callbackUrl` back to `https://business.mapable.com.au/...`.
- For WebAuthn across hosts, set `PASSKEY_RP_ID=mapable.com.au` (parent scope).

## CORS

`vercel.json` allows `Access-Control-Allow-Origin: https://business.mapable.com.au` for `/api/*` when the request host is the business subdomain (same pattern as `peer.mapable.com.au`).

## Vercel deployment

Preferred deployment: attach `business.mapable.com.au` as a custom domain to the **same** Vercel web project that deploys `ausdisau/mapableau-new`.

Do not attach the domain until a preview deployment of this branch passes CI.

Expected sequence:

1. Identify the Vercel web project linked to `ausdisau/mapableau-new`.
2. Deploy the feature branch as Preview; verify `/provider` on Preview.
3. Merge after review.
4. Add `business.mapable.com.au` in Vercel Project Settings → Domains.
5. Configure the DNS record requested by Vercel at the authoritative DNS provider.
6. Verify TLS and domain ownership in Vercel.
7. Smoke-test `https://business.mapable.com.au/` (login → home → Care).
8. Confirm session cookie is shared with apex after login.

## Safety

- Provider Center is authenticated; do not expose marketplace or participant PII on unauthenticated business-host paths.
- Do not treat experimental Labs content as part of Provider Center.
- Apex `/provider` remains supported until a later cutover soft-redirects providers to the business host.

## Environment

| Variable | Purpose |
| --- | --- |
| `MAPABLE_BUSINESS_HOST` | Override business hostname (default `business.mapable.com.au`) |
| `MAPABLE_SESSION_COOKIE_DOMAIN` | Force cookie domain (e.g. `.mapable.com.au`); empty string disables |
| `PASSKEY_RP_ID` | Parent WebAuthn RP ID when using passkeys across hosts |
| `NEXT_PUBLIC_APP_URL` / `NEXTAUTH_URL` | Remain apex-only |
