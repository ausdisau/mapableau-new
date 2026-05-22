# MapAble Core — Phase 1

Phase 1 delivers the platform spine: identity, roles, participant profiles, accessibility preferences, organisations, consent, notifications, audit events, and care/transport booking primitives.

## Run locally

```bash
pnpm install
cp .env.example .env   # set DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
npx prisma migrate deploy
npx prisma db seed
pnpm dev
```

Sign in with seed users (password matches existing seed hash — same as `alice@example.com` in legacy seed):

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
- `NEXTAUTH_SECRET` — session signing
- `NEXTAUTH_URL` — app URL (e.g. `http://localhost:3000`)
- `NDIS_ENCRYPTION_KEY` — optional; falls back to `NEXTAUTH_SECRET` for NDIS number encryption

## Limitations (Phase 1)

- No live transport tracking, payments, or NDIS API
- Email/SMS/push delivery stubbed (in-app notifications only)
- Manual provider verification
- Single primary role per user (multi-role table ready)

## Phase 2

Incident management, automated provider checks, Stripe/Xero, dispatch, marketplace, and mobile apps.
