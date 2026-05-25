# MapAble registration and onboarding

Two-layer flow: **register lightly**, **onboard carefully**, **verify before service delivery**.

## User flow

1. Create account at `/register` (name, email, password only).
2. Sign in → `/onboarding/role` to choose a role.
3. Complete base registration at `/onboarding` (contact, postcode, consents).
4. Complete role-specific onboarding (e.g. `/onboarding/participant`).
5. Land on `/onboarding/complete` with eligibility status, then dashboard.

## API routes

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/registration/base` | Base profile + consents |
| POST | `/api/onboarding/role` | Role selection |
| GET | `/api/onboarding/status` | Current onboarding state |
| POST | `/api/onboarding/{role}` | Role-specific submit |

## Data model

Uses existing `User` and domain profiles (`ParticipantProfile`, `Organisation`, `WorkerProfile`, etc.) plus:

- `ProfileOnboardingStatus`
- `RegistrationConsent`
- `OnboardingEvent`
- `NomineeOnboardingProfile`, `AlliedHealthOnboardingProfile`, `PlanManagerOnboardingProfile`, `EmployerOnboardingProfile`

Apply migration: `pnpm prisma migrate deploy`

## Eligibility

See `lib/onboarding/eligibility-gates.ts`. Providers, workers, and drivers are not booking/matching/dispatch eligible until verification.

## Not collected at signup

NDIS number, full home address, plan upload, diagnosis, medical history, or bank details.
