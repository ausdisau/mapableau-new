# Prompt 15 — Research-to-Market Release Gate

## Objective

Act as final independent release reviewer. **Do not implement new features.** Review cumulative implementation against MapAble Innovation Plan, evidence graph architecture, disability-led governance, privacy, research protocol, commercial separation, accessibility, and security requirements.

## Non-goals

- Feature development
- Approving solely because CI is green
- Marking READY without evidence

## Prerequisites

- Prompts 01–14 merged or explicitly waived with documented risk
- All production gates from Prompt 14 executed with results recorded

## Output artifact

Create: [`docs/innovation/final-readiness-review.md`](../innovation/final-readiness-review.md)

Final status must be **exactly one of:**

- `READY`
- `READY WITH CONDITIONS`
- `NOT READY`

## Finding taxonomy

| Level | Definition |
|-------|------------|
| **BLOCKER** | Must fix before any release |
| **HIGH** | Must fix or have approved waiver with expiry |
| **MEDIUM** | Should fix; may release with conditions |
| **LOW** | Track; fix in next cycle |
| **OBSERVATION** | Informational |

## Verification questions (with evidence required)

| # | Question | Evidence sources |
|---|----------|------------------|
| 1 | Does routing distinguish unknown from inaccessible? | `tests/navigate/unknown-vs-inaccessible.test.ts`, manual review |
| 2 | Can commercial payment alter accessibility truth? | `tests/commercial/payment-cannot-alter-truth.test.ts` |
| 3 | Can AI-generated evidence become verified automatically? | `tests/accessibility-ai/low-confidence-cannot-verify.test.ts` |
| 4 | Can a participant use core functionality without entering research? | `tests/research/journey/consent-separation.test.ts` |
| 5 | Can research data leak into advertising/marketing? | `tests/impact/research-marketing-isolation.test.ts` |
| 6 | Can precise mobility history enter PostHog? | `tests/privacy/analytics/posthog-deny-list.test.ts` |
| 7 | Can partner data silently overwrite conflicting community evidence? | `tests/api/v1/webhooks/*`, graph dispute tests |
| 8 | Are accessibility claims provenance-backed? | `tests/access-graph/provenance-taxonomy.test.ts`, API responses |
| 9 | Does mobile clearly expose stale/offline data? | `tests/accesscast/offline.test.ts`, Playwright a11y |
| 10 | Do all core journeys meet WCAG 2.2 AA expectations? | axe results, manual AT testing evidence |
| 11 | Do tests include false-safe accessibility failures? | false-safe test suite inventory |
| 12 | Is rollback possible? | runbook review, flag inventory, migration reversibility |

## Review procedure

1. **Inventory** — list all Prompt 01–14 PRs with merge SHAs and claim states
2. **Verify** — run each verification question; record pass/fail with file:line or test name evidence
3. **Classify** — assign BLOCKER/HIGH/MEDIUM/LOW/OBSERVATION to each gap
4. **Conditions** — if READY WITH CONDITIONS, list mandatory fixes with owners and dates
5. **Sign-off** — reviewer name, date, status (single value)

## Review against programme documents

- [MAPABLE_INNOVATION_PORTFOLIO.md](../innovation/MAPABLE_INNOVATION_PORTFOLIO.md)
- [PORTFOLIO_STAGE_GATES.md](../innovation/PORTFOLIO_STAGE_GATES.md)
- [PORTFOLIO_RISK_REGISTER.md](../innovation/PORTFOLIO_RISK_REGISTER.md)
- [CONTROLLED_PILOT_CHARTER.md](../operations/CONTROLLED_PILOT_CHARTER.md)
- [co-design-protocol.md](../co-design-protocol.md)
- Privacy docs from Prompt 08
- Research protocol from Prompt 10

## Template for final-readiness-review.md

```markdown
# MapAble Innovation — Final Readiness Review

**Reviewer:** [name]
**Date:** [ISO date]
**Repository SHA:** [commit]
**Status:** READY | READY WITH CONDITIONS | NOT READY

## Executive summary
[2–3 sentences]

## Verification results
| # | Question | Result | Evidence |
|---|----------|--------|----------|

## Findings
### BLOCKER
### HIGH
### MEDIUM
### LOW
### OBSERVATION

## Conditions (if READY WITH CONDITIONS)
| Condition | Owner | Due |

## Prompt completion matrix
| Prompt | PR | Merged | Claim state updated |
|--------|-----|--------|---------------------|
```

## Commit message

**None** — review-only. If the review document itself is committed:

```
docs: add MapAble innovation final readiness review
```

## Verification checklist

- [ ] All 12 questions answered with evidence (not agent claims)
- [ ] Status is exactly one of three allowed values
- [ ] BLOCKER findings prevent READY status
- [ ] CI green is necessary but not sufficient
- [ ] Disability-led governance sign-off recorded (if required by charter)

## Rollback notes

N/A — documentation only.
