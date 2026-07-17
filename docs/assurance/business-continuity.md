# Business continuity

Business continuity checks and objectives for Wave 6 assurance.

## Checks

`evaluateContinuityChecks()` verifies:

- Backup configuration present
- Restore tested within `maxRestoreAgeDays`

## Recovery objectives

Default RPO: 24 hours. Default RTO: 72 hours (`lib/assurance/recovery/recovery-objectives.ts`).

## Admin

`/admin/assurance/continuity`

See [operations/business-continuity/README.md](../operations/business-continuity/README.md).

**Disclaimers**

- Internal readiness ≠ certification, registration, or NDIA approval.
- Feature flags ≠ readiness. No AI agent may sign or approve production go-live.
- Continuity checks passing does not certify business continuity compliance.
