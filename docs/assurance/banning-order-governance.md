# Banning order governance

Banning-order checks gate worker platform eligibility. Fail-closed when sources are unavailable.

## Policy

1. **Source unavailable** → status `source_unavailable` — not treated as clear.
2. **Pending clearance** → not eligible for platform work.
3. **Blocked** → `blocksPlatformWork` prevents assignment and go-live satisfaction.

## Implementation

- `WorkerPlatformEligibilityAssessment` model
- Audit: `scripts/assurance/audit-worker-trust.ts`

See [worker screening and platform eligibility](./worker-screening-and-platform-eligibility.md).

**Disclaimers**

- Internal readiness ≠ certification, registration, or NDIA approval.
- Feature flags ≠ readiness. No AI agent may sign or approve production go-live.
- MapAble does not perform NDIA banning-order lookups in Wave 6 without configured external sources.
