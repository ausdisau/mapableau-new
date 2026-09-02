# Prompt 01 — Disability-Led Co-Design & Governance

## Objective

Implement the governance foundation for disability-led MapAble innovation: a first-class co-design and research participation domain with enforceable consent separation, payment records, and decision audit trails.

**Principle:** Design WITH people, not merely FOR people. Do not create participant surveillance or tokenistic feedback features.

## Non-goals

- Requiring research participation for core navigation
- Storing unnecessary disability diagnoses
- Public scoring of disabled contributors
- Replacing [`docs/co-design-protocol.md`](../../co-design-protocol.md) policy — extend it technically

## Prerequisites

- Prompt 00 merged ([architecture baseline](../../innovation/architecture-baseline.md))
- Existing: `ResearchProject` in `prisma/schema.prisma`, `lib/research/research-project-service.ts`, `lib/consent/consent-service.ts`

## Current claim state

**Proposed** — policy in `docs/co-design-protocol.md` is implemented; technical domain is scaffold-only (`lib/research/`, synthetic-only default)

## Required domain concepts

| Concept | Purpose |
|---------|---------|
| `CoDesignProgramme` | Bounded co-design engagement (workshops, reviews, governance) |
| `CoDesignParticipant` | Person with disability in a defined role |
| `ResearchProject` | Ethics-governed research study (extend existing model) |
| `ResearchRole` | co-investigator, paid researcher, field validator, design reviewer, governance member, research participant |
| `ResearchConsent` | Granular, withdrawable research consent |
| `ResearchContribution` | Structured contribution record |
| `ContributionPayment` | Paid participation / compensation |
| `ResearchDecision` | Governance decision with audit trail |
| `DecisionRationale` | Plain-language rationale for decisions |
| `CommunityReview` | Community review of features/findings |
| `AccessibilityFinding` | Documented accessibility finding from co-design |

Participation roles: co-investigators, paid accessibility researchers, field validators, design reviewers, governance members, research participants.

## Files to create / modify

| Action | Path |
|--------|------|
| Create | `packages/research/` — domain types, services, consent guards |
| Create | `app/research/` — accessible participation interfaces |
| Create | `app/admin/research/` — programme administration |
| Extend | `prisma/schema.prisma` — co-design entities above |
| Extend | `lib/research/research-project-service.ts` — integrate co-design programmes |
| Extend | `lib/consent/consent-service.ts` — research vs service purpose scopes |
| Create | `tests/research/consent-separation-audit.test.ts` |
| Create | `tests/research/withdrawal-stops-collection.test.ts` |
| Create | `tests/research/governance-audit-retention.test.ts` |
| Create | `docs/innovation/co-design-governance.md` |

## Data model / API changes

- Granular consent with independent withdrawal per purpose
- Role separation enforced at API and service layers
- Payment/compensation records linked to contributions (not to evidence authority)
- Decision logs with plain-language summaries for participants
- Functional access requirements preferred over diagnosis fields
- Historical governance records auditable without retaining unnecessary personal data

## Tests required (audit tests)

- Research consent does **not** imply service consent
- Service consent does **not** imply research consent
- Withdrawn research consent stops future collection immediately
- Historical governance records remain auditable without unnecessary PII retention
- Core navigation works without any research enrolment

## Docs to write

- `docs/innovation/co-design-governance.md` — technical governance model
- Cross-link `docs/co-design-protocol.md`

## Commit message (exact)

```
feat: establish disability-led research governance
```

## Verification checklist

- [ ] `pnpm type-check`
- [ ] `pnpm test tests/research`
- [ ] Consent separation audit tests pass
- [ ] Accessible participation UI reviewed (keyboard, screen reader)
- [ ] No diagnosis fields required for participation

## Rollback notes

Disable research UI routes via feature flag; schema tables remain empty. Co-design protocol policy unaffected.
