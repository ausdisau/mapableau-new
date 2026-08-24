# Release Governance (Prompt 12)

**Status:** gates implemented — pilot **not** enabled — production **not** live

Technical release-governance framework for moving selected Agentic Nerve Centre
capabilities from development into a tightly controlled human-supported pilot
**without enabling the pilot**.

## Authority boundaries

- This prompt does **not** authorise production deployment.
- Do **not** merge/deploy/enable pilot flags as part of this work.
- Do **not** invent approvals or declare compliance without evidence.
- Do **not** enable regulated workflows without named operating capacity.
- LLMs must **never** approve releases.

## Release states (canonical)

`experimental` → `internal_test` → `controlled_pilot_candidate` →
`controlled_pilot` → `production_supported` → (`suspended` | `retired`)

Code merge does **not** automatically advance maturity or release state.

`ReleaseState` is distinct from `CapabilityMaturity` in
`lib/ai/platform/types/maturity.ts`. Align/extend; do not invent a conflicting
second maturity taxonomy.

## Capability release gate — required evidence

For `controlled_pilot_candidate` and above, deterministic readiness requires
evidence for:

| Gate | Evidence |
|------|----------|
| Identity | named owner, purpose, authority ceiling |
| Privacy | privacy classification, consent scopes |
| Human review | human review path |
| Flags | feature flag, kill switch |
| Evaluation | evaluation suite |
| Accessibility | keyboard, screen reader, zoom, focus order, error messaging, plain language, AAC where applicable |
| Security | authn, RBAC, tenant isolation, secrets handling, dependency scan, action replay tests, prompt-injection eval, rollback verification |
| Rollback | rollback plan |
| Operations | operational owner, support process, incident process, known limitations, named capacity for participant support / human review / incident response / safeguarding escalation / outage handling |

## GO / NO-GO verdicts

Deterministic output only:

- `READY_FOR_REVIEW`
- `NOT_READY`
- `BLOCKED`

Never: `AUTO_APPROVED`.

## MapAbleReleaseManifest

Code-defined in `lib/ai/platform/release-governance/manifests.ts`.

Fields: `capabilityKey`, `releaseState`, `version`, `allowedCohorts`, `domains`,
`requiredFlags`, `requiredEvals`, `requiredHumanOperations`, `knownLimitations`,
`privacyReviewRef`, `accessibilityReviewRef`, `securityReviewRef`,
`rollbackPlanRef`, `owner`, `approvedBy`, `approvedAt`, `expiresAt?`,
`evidence`, `relatedCapabilityMaturity`.

Approval refs stay `null` until real human approval occurs.

## Pilot cohort infrastructure

Server-side, auditable, revocable, tenant-aware, capability-specific
(`lib/ai/platform/release-governance/cohort.ts`).

- In-memory store for now (no migration / no fake approvals in DB).
- Client-only feature gates are insufficient and rejected.
- `controlled_pilot_candidate` does not admit participants.

## Public claim control

Public claims derive from approved release state
(`lib/ai/platform/release-governance/claims.ts`).

Experimental must **not** be described as: production proven, NDIA approved,
NDIS registered, clinically validated, certified, fully autonomous — unless
independently verified. Claim mismatches are rejected.

## Feature flags

| Flag | Default | Meaning |
|------|---------|---------|
| `MAPABLE_RELEASE_GOVERNANCE_ENABLED` | `false` | Fail-closed for enforcement UI / cohort grants |

Do **not** enable `MAPABLE_*_PILOT` or production flags in this prompt.

## Admin

Read-only view: `/admin/ai/release-readiness`.

No one-click “ship AI to everyone”.

## Module layout

```
lib/ai/platform/release-governance/
  types.ts
  schemas.ts
  states.ts
  evidence.ts
  readiness.ts
  cohort.ts
  claims.ts
  manifests.ts
  index.ts
lib/config/release-governance.ts
```

## Persistence

In-memory / code-defined manifests only. If durable DB persistence becomes
required, stop and open Prompt 12A.

## Recommended Prompt 13

Human-operated pilot rehearsal runbook + evidence pack collection against these
gates — still without enabling production or inventing approvals.
