# NDIS digital platform registration

Tracks the *Mandatory registration and transition pathways for NDIS digital platforms* and *Apply for registration* readiness — not submission or approval.

## Model

`NdisRegistrationApplication` records:

- `pathway` — e.g. `digital_platform`
- `registrationGroups` — includes `0137` when applicable
- `status` — internal workflow state
- `readinessDecision` — linked to assurance evaluation

## Pathway helper

`startDigitalPlatformRegistration()` in `lib/assurance/registration/digital-platform-registration.ts` always includes group 0137 unless explicitly excluded.

## Admin

- `/admin/assurance/registration`
- `/admin/assurance/registration/0137` — 0137-specific view

See also [registration.md](./registration.md) and [registration group 0137](./registration-group-0137.md).

**Disclaimers**

- Internal readiness ≠ certification, registration, or NDIA approval.
- Feature flags ≠ readiness. No AI agent may sign or approve production go-live.
- Registration status in MapAble is not platform approval and does not activate production NDIA submission.
