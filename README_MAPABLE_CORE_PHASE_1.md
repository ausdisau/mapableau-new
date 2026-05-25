# MapAble Core — Phase 1

Phase 1 delivers the platform spine: identity, roles, participant profiles, accessibility preferences, organisations, consent, notifications, audit events, and care/transport booking primitives.

## Run locally

```bash
pnpm install
cp .env.example .env   # set DATABASE_URL, AUTH0_* (see docs/auth0-mapable-setup.md)
npx prisma migrate deploy
npx prisma db seed
pnpm dev
```

**Auth0 + Google (default):** Set `AUTH_PROVIDER=auth0`, `AUTH0_SECRET` (32+ chars), `AUTH0_DOMAIN=login.ad.org.au`, client credentials, and `APP_BASE_URL`. Sign in at `/login` → Continue with Google. See [docs/auth0-mapable-setup.md](docs/auth0-mapable-setup.md).

**Legacy credentials** (`AUTH_PROVIDER=nextauth`): seed users with password hash:

- `participant@mapable.test` — participant dashboard
- `admin@mapable.test` — admin console

## Key routes

| Area | Routes |
|------|--------|
| Dashboard | `/dashboard`, `/dashboard/profile`, `/dashboard/accessibility`, `/dashboard/consent`, `/dashboard/bookings` |
| Admin | `/admin`, `/admin/participants`, `/admin/organisations`, `/admin/bookings`, `/admin/audit-events` |
| Provider | `/provider/onboarding` |

## Key models

`User`, `UserRoleAssignment`, `ParticipantProfile`, `AccessibilityProfile`, `Organisation`, `ConsentRecord`, `Notification`, `AuditEvent`, `Booking`, `BookingSegment`

## Environment variables

- `DATABASE_URL` — PostgreSQL
- `AUTH0_SECRET`, `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `APP_BASE_URL` — Auth0 session (HttpOnly cookies)
- `AUTH_PROVIDER` — `auth0` (default) or `nextauth`
- `NEXTAUTH_SECRET` / `NEXTAUTH_URL` — legacy credentials only
- `NDIS_ENCRYPTION_KEY` — optional; falls back to `NEXTAUTH_SECRET` for NDIS number encryption

## Limitations (Phase 1)

- No live transport tracking, payments, or NDIS API
- Email/SMS/push delivery stubbed (in-app notifications only)
- Manual provider verification
- Single primary role per user (multi-role table ready)

## Phase 2

Incident management, automated provider checks, Stripe/Xero, dispatch, marketplace, and mobile apps.
