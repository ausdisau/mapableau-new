# AD.iD identity portal

A standalone Next.js application for Australian Disability Ltd account registration, sign-in and service selection.

## Central federation

The portal provides Clerk sign-in, registration, account recovery and service selection. The opt-in Auth0 broker lets each relying service establish its own session. The [federation deployment guide](docs/central-federation.md) covers MapAble, AccessiBooks, Wix and MediaWiki, including their separate credentials, callbacks and activation steps. The existing Wix link-only sandbox remains available. These integrations require a configured tenant and service-side rollout.

## Technology and boundaries
- Clerk Next.js: sign-in, session issuing, passkeys/MFA as configured in Clerk dashboard. Never trust an unverified JWT or self-declared role.
- Next.js 16 App Router: server-side `auth()`, protected `/dashboard` and `/api/identity/me`. No raw JWT parsing.
- Neon PostgreSQL: optional read-only `public.services` directory, enabled by `ADID_NEON_DIRECTORY_ENABLED=true`; no user reads or identity linking.
- Wix Editor/Velo: three gated stages in `packages/wix-integration` — (1) verified public AD.iD link, (2) dual-proof identity linking PoC, (3) disabled-by-default one-time session handoff. See `docs/wix-handoff.md` and `docs/wix/docs-index.md`. Clerk remains the sole AD.iD IdP; Wix keeps its own Members sessions.
- The public directory works from its bundled entries when Neon is unavailable. The account dashboard requires a configured Clerk tenant.
- The directory covers Australian Disability Ltd, MapAble, Disapedia and AccessiBooks. Service cards are **not** proof of entitlement, cross-app sign-in or availability.

## Local preparation
1. In `apps/adid`, install dependencies (`npm install`). Also `npm install` under `packages/wix-integration` if typechecking that package in isolation.
2. Copy `.env.example` to `.env.local`. For local development, replace `CLERK_FRONTEND_API_URL` with the development instance’s origin and use its matching publishable and secret keys. Run `npm run check:issuer` to check the public metadata.
3. Keep `ADID_DIRECTORY_ENABLED`, `ADID_NEON_DIRECTORY_ENABLED`, `ADID_WIX_PUBLIC_LINK_ENABLED`, `ADID_ACCOUNT_LINKING_ENABLED`, `ADID_WIX_SESSION_BRIDGE_ENABLED`, and `ADID_CROSS_APP_FEDERATION_ENABLED` as `false`.
4. Run `npm run typecheck`, `npm test` and `npm run build` and independently test WCAG 2.2 AA sign-in/recovery (see `docs/accessibility-mfa.md`).
5. For a protected Vercel preview use the `apps/adid` root directory. Set the two public variables for that preview before building. The Next.js secret belongs in the server-side environment.

## Protected routes
- `/sign-in`, `/sign-up` — Clerk hosted components
- `/dashboard` — service control centre (auth required)
- `/account` — Clerk `UserProfile` (MFA/passkeys/sign-out)
- `/api/identity/me` — authenticated subject metadata only (no grants)

Clerk Core 3 uses `<Show when="signed-in|signed-out">` (not `SignedIn`/`SignedOut`) and `ClerkProvider` inside `<body>`.

## Important: existing data
On 10 November 2026, the AD.iD Neon project was observed in AWS us-east-2 with `neon_auth` schema and `public.services`, `public.user_service_access`, `public.audit_events`. The uploaded `adid-neon-auth-db` Prisma migration creates overlapping `User`, `Session` and `Identity` tables and MUST NOT be deployed unreviewed. The AD.iD project is in US East; resolve Australian data residency before personal account linking.

## MapAble identity binding
The optional MapAble client uses the Auth0 issuer and subject to recognise returning people. A first sign-in with a new verified email can create a local participant account. If the email already belongs to a local account, MapAble directs the person to their established sign-in. Linking two existing accounts requires a separate proof-of-control flow. MapAble keeps permissions and its NextAuth session locally.

## Styling
The AD.iD Brand Identity reference gives deep Australian blue #1F5897, warm muted red #9D5D61, vivid orange #F0671D. The dashboard follows the screenshot's layout concept (sidebar, service cards, assistance); placeholder example emails/addresses in the brand source must never be published as real data.

> **Canonical repository:** `ausdisau/MapAble`. This mapableau-new mirror exists only because the cloud agent lacked push rights to MapAble; do not treat it as production identity source of truth.
