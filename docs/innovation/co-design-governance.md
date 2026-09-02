# MapAble Co-Design & Research Governance

**Status:** Prompt 01 — technical governance foundation  
**Policy companion:** [co-design-protocol.md](../co-design-protocol.md)  
**Plan:** [01-co-design-governance.md](../superpowers/plans/01-co-design-governance.md)

> Research participation is **never** required for core MapAble navigation or services.

---

## Purpose

This document describes the technical governance domain for disability-led MapAble innovation: co-design programmes, granular research consent, contribution and payment records, and auditable governance decisions.

The [co-design protocol](../co-design-protocol.md) defines engagement policy. This document defines enforceable data structures and consent separation in code.

---

## Consent lanes (orthogonal)

| Lane | Storage | Examples |
|------|---------|----------|
| **Service** | `ConsentRecord` | Navigation, route history, profile sharing |
| **Research** | `ResearchConsentRecord` | Data collection, interviews, field validation |

Rules enforced in code (`@mapable/research`, `lib/research/consent-separation.ts`):

1. Research consent **does not** imply service consent
2. Service consent **does not** imply research consent
3. Withdrawn research consent stops future collection immediately
4. Historical governance records remain auditable without unnecessary personal data

---

## Domain entities

| Entity | Purpose |
|--------|---------|
| `CoDesignProgramme` | Bounded co-design engagement |
| `CoDesignParticipant` | Person with disability in a defined role |
| `ResearchProject` | Ethics-governed study (existing; optional link) |
| `ResearchConsentRecord` | Granular, withdrawable research consent by purpose |
| `ResearchContribution` | Structured contribution (not evidence authority) |
| `ContributionPayment` | Paid participation compensation |
| `ResearchDecision` | Governance decision with audit trail |
| `DecisionRationale` | Plain-language rationale |
| `CommunityReview` | Community review of features/findings |
| `AccessibilityFinding` | Documented finding from co-design |

Participation roles: `co_investigator`, `paid_researcher`, `field_validator`, `design_reviewer`, `governance_member`, `research_participant`.

Functional access requirements are stored in `functionalAccessNotes` — not medical diagnoses.

---

## Code locations

| Area | Path |
|------|------|
| Domain types & guards | `packages/research/` |
| Services | `lib/research/co-design-governance-service.ts` |
| Consent separation | `lib/research/consent-separation.ts` |
| API | `app/api/research/co-design/` |
| Participant UI | `app/research/participation/` |
| Admin UI | `app/admin/research/` |
| Audit tests | `tests/research/consent-separation-audit.test.ts` |

---

## Feature flag

Research governance requires:

```
MAPABLE_RESEARCH_GOVERNANCE_ENABLED=true
```

When disabled, co-design APIs return 503 and UI shows an honest disabled state.

---

## Rollback

Disable the feature flag. Schema tables remain empty or retained for audit. Co-design protocol policy is unaffected.

---

## Related documents

- [architecture-baseline.md](./architecture-baseline.md)
- [research-translation-model.md](./research-translation-model.md)
- [co-design-protocol.md](../co-design-protocol.md)
