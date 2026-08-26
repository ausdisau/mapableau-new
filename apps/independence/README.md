# MapAble Mobile (`apps/independence`)

Accessibility-first Expo + React Native client for the MapAble platform system of record (`ausdisau/mapableau-new`).

This app is a **native client, not a WebView wrapper**. It reuses MapAble's web/API architecture and does not fork participant identity, Care, Transport, Jobs, consent, audit or billing logic into a second backend.

## Current R1 scope

- **Today** — participant-controlled connected-journey overview.
- **Access** — live place search through `GET /api/access/search` when `EXPO_PUBLIC_MAPABLE_API_URL` is configured.
- **Care** — native information architecture over the existing Care domain; protected live data continues through secure web until native session exchange is implemented.
- **Travel** — native information architecture over the existing Transport domain; protected live data remains gated.
- **Jobs** — native information architecture over the existing Jobs domain; protected live data remains gated.
- **Mobile bootstrap** — capability discovery through `GET /api/mobile/bootstrap`.
- No compulsory smartphone pathway: protected journeys remain available through the responsive MapAble web application.

## Security boundary

The current MapAble protected APIs use the server-side NextAuth session authority. R1 does **not** invent a mobile bearer token or embed credentials in Expo environment variables.

Until a reviewed native session-exchange flow exists:

- public Access search can call the platform directly;
- Care, Transport and Jobs open the secure web flow for live protected data;
- no participant health, care, transport or employment records are cached by this app;
- live device location is not requested by the native Access search.

## Redis / realtime architecture

Redis remains server-side only. The Expo app never receives Redis credentials.

The initial keyspace is defined in `lib/platform/redis/mobile-keyspace.ts` and is limited to ephemeral coordination:

- Redis Stream — tenant-scoped mobile/realtime event fan-out;
- Hash — short-lived presence;
- String — idempotency markers;
- Set — realtime room membership;
- short-TTL public Access search cache keyed by SHA-256 digest, not raw query text.

PostgreSQL remains authoritative for participants, consent, bookings, shifts, trips, jobs, invoices and audit evidence. Redis events carry identifiers and minimal metadata only.

Production Redis is still feature-gated by `MAPABLE_MOBILE_REDIS_ENABLED`; setting a flag is configuration evidence, not proof that a production Redis adapter has passed recovery/security testing.

## Environment

```bash
cd apps/independence
cp .env.example .env
```

Set the MapAble API host explicitly for the environment:

```bash
EXPO_PUBLIC_MAPABLE_API_URL=http://localhost:3000
EXPO_PUBLIC_MAPABLE_WEB_URL=https://mapable.com.au
```

Do not put private API keys, Redis credentials or participant secrets in any `EXPO_PUBLIC_*` variable.

## Run

```bash
cd apps/independence
npm install
npm start
npm run typecheck
```

## Platform contracts already reused

The repository currently exposes server routes for:

- Access: `/api/access/search`
- Care: `/api/care/bookings`, `/api/care/requests`, `/api/care/schedules`, `/api/care/shifts` and related evidence/incident routes
- Transport: `/api/transport/quotes`, `/api/transport/bookings`, `/api/transport/trips`, `/api/transport/routing` and related accessibility/continuity routes
- Jobs: `/api/jobs` and job-detail routes

Protected routes remain authoritative on the server. The native app should add transport/care/jobs reads only after the mobile identity handoff is implemented and permission-tested.

## Accessibility release criteria

- minimum 48dp interactive targets (R1 buttons use 52dp minimum height);
- screen-reader labels on controls and search status;
- system font scaling remains enabled;
- no gesture-only critical action;
- no required camera, QR code or live location for essential R1 flows;
- clear status/error text in addition to visual styling;
- participant-facing core journeys remain available on responsive web.

## Next implementation slice

1. Native sign-in/session exchange using the existing MapAble identity authority.
2. Read-only Today timeline from participant-authorised Care + Transport data.
3. Redis-backed event adapter behind provider-neutral interfaces and feature flags.
4. Push notifications with redacted lock-screen content and per-channel consent.
5. Merge the useful Companion Visit Pack / communication-access functions into this Expo generation after encrypted-storage migration and tests.
