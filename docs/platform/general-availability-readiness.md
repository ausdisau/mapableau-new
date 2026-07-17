# General availability readiness

**Status:** Wave 8 Phase 32 — advisory GA assessment. **Not GA activation.**

## Non-negotiable disclaimers

- **`Organisation.id` is the tenant security boundary.**
- **Platform admins do not automatically access participant data.**
- **Hub-and-spoke ≠ unrestricted sharing.**
- **Env ≠ entitlement ≠ assurance ≠ registration.** GA assessment ≠ registration.
- **Pilot ≠ GA.** Controlled pilot approval does not satisfy GA requirements.
- **Policies are versioned;** historical records retain historical policy.
- **Unknown health ≠ healthy.** Incomplete assessment ≠ approved.
- **Critical integrations fail closed.**
- **No AI may** activate tenants, approve regulatory interpretations, expand rings, **approve GA**, or override cross-tenant controls.

## GeneralAvailabilityAssessment

Per-tenant advisory record capturing:

- Assurance snapshot review
- Entitlement and quota readiness
- Policy profile binding confirmation
- Executive sign-off (`executiveApprovedById`, `decision`)

`decision: approved` is required for production runtime gate (layer 4). **Executive signature is mandatory. AI cannot approve.**

## What GA approval does not mean

- Not NDIA digital platform registration.
- Not SOC 2, ISO 27001, or any certification.
- Not automatic activation — status transition is separate human action.
- Not fleet-wide — each organisation has its own assessment.

API: `GET/POST /api/platform/ga-readiness`. UI: `/admin/platform/ga-readiness`. Script: `pnpm platform:assess-ga`.

## See also

- [Phase 32 GA decision](./phase-32-ga-decision.md)
- [Continuous assurance](./continuous-assurance.md)
- [Tenant onboarding](./tenant-onboarding.md)
