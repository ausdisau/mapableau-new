# Go-live readiness

Production go-live gate — feature flags alone never pass.

## Assessment

`ProductionGoLiveAssessment` requires:

- `assuranceSatisfied`
- `registrationSatisfied`
- `ndiaPartnershipSatisfied`
- `workerTrustSatisfied`
- `rollbackPlanDocumented`

`featureFlagsSatisfied` is tracked but **never sufficient alone**.

## Audit

`pnpm assurance:audit-go-live` (wrapper: `scripts/audit-go-live-bypasses.ts`)

## Admin

`/admin/assurance/go-live` and `/admin/assurance/readiness`

See also [go-live.md](./go-live.md).

**Disclaimers**

- Internal readiness ≠ certification, registration, or NDIA approval.
- Feature flags ≠ readiness. **No AI agent may sign or approve production go-live.**
- Go-live assessment in MapAble is an internal gate — not executive or board approval.
