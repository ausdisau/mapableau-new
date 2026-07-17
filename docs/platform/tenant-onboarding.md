# Tenant onboarding

**Status:** Wave 8 Phase 32 — human-governed workflow. No auto-activation.

## Non-negotiable disclaimers

- **`Organisation.id` is the tenant security boundary.**
- **Platform admins do not automatically access participant data.**
- **Hub-and-spoke ≠ unrestricted sharing.**
- **Env ≠ entitlement ≠ assurance ≠ registration.**
- **Pilot ≠ GA.** Onboarding completion does not authorise GA.
- **Policies are versioned;** historical records retain historical policy.
- **Unknown health ≠ healthy.**
- **Critical integrations fail closed.**
- **No AI may** activate tenants, approve regulatory interpretations, expand rings, approve GA, or override cross-tenant controls.

## TenantOnboardingCase

Each new production-scale organisation progresses through a `TenantOnboardingCase`:

1. **Intake** — organisation record created in `draft` / `onboarding` status.
2. **Policy binding** — `TenantPolicyProfile` assigned (see [tenant-policy-profiles](./tenant-policy-profiles.md)).
3. **Entitlement draft** — proposed `TenantFeatureEntitlement` rows (inactive until approved).
4. **Assurance check** — continuous assurance snapshot reviewed (advisory).
5. **Human approval** — named operator transitions status; AI cannot approve or activate.

API: `GET/POST /api/platform/tenants`. UI: `/admin/platform/tenants/[tenantId]`.

## What onboarding does not do

- Does not set `tenantStatus` to `active` without human sign-off.
- Does not enable integrations or payment rails automatically.
- Does not substitute for NDIA registration or assurance certification.

## See also

- [General availability readiness](./general-availability-readiness.md)
- [Tenant suspension and offboarding](./tenant-suspension-and-offboarding.md)
- [Wave 8 migration runbook](./wave-8-migration-runbook.md)
