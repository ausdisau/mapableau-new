# Continuous assurance

**Status:** Wave 8 Phase 32 — lightweight tenant assurance snapshots. **Not certification.**

## Non-negotiable disclaimers

- **`Organisation.id` is the tenant security boundary.**
- **Platform admins do not automatically access participant data.**
- **Hub-and-spoke ≠ unrestricted sharing.**
- **Env ≠ entitlement ≠ assurance ≠ registration.** Snapshots are advisory.
- **Pilot ≠ GA.**
- **Policies are versioned;** historical records retain historical policy.
- **Unknown health ≠ healthy.** Missing controls in snapshot ≠ pass.
- **Critical integrations fail closed.**
- **No AI may** activate tenants, approve regulatory interpretations, expand rings, approve GA, or override cross-tenant controls.

## evaluateContinuousAssurance

`evaluateContinuousAssurance(organisationId)` returns a snapshot from Wave 6 assurance tables:

- Control test freshness
- Open exceptions
- Evidence staleness
- Integration health linkage

The snapshot is **not** a certification report, SOC 2 opinion, or NDIA approval.

## Usage

- Runtime gate may **block** production features when assurance regresses (configurable).
- UI: `/admin/platform/continuous-assurance`, `/provider/admin/assurance`
- API: `GET /api/platform/continuous-assurance`
- Script: `pnpm platform:evaluate-assurance`

## See also

- [Assurance (Wave 6)](../assurance/README.md)
- [General availability readiness](./general-availability-readiness.md)
- [Tenant policy profiles](./tenant-policy-profiles.md)
