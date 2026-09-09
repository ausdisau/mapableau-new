# MapAble Autonomous R&D Fabric / MAIRA R3 Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved MapAble Autonomous R&D Fabric incrementally from research-only MAIRA through evidence/design translation, sandboxed coding subagents, and an R3 draft-PR proposal pipeline without granting automated production authority.

**Architecture:** The programme is intentionally split into four independently reviewable plans. Each phase raises the authority ceiling only after the previous phase produces verified evidence. R0/R1 research and design are separated from R2 sandbox engineering, and Git/Vercel publication remains a deterministic R3 service outside coding sandboxes.

**Tech Stack:** MapAble Next.js/TypeScript/Prisma platform, OpenAI Agents SDK, Vercel Cron Jobs, Vercel Sandbox, GitHub App/Octokit, Vitest/Playwright, existing MapAble AgentRun/AuditEvent/AI-eval infrastructure.

**Spec:** `docs/superpowers/specs/2026-09-09-mapable-autonomous-rd-fabric-maira-r3-design.md`

## Current State

- **Verified live:** MapAble already has an Agents SDK runtime, `AgentRun`/`AuditEvent` controls, design-system source of truth, Vercel deployment infrastructure and cron configuration.
- **Proposed:** the MAIRA research ledger, design/coding subagent fabric and R3 proposal automation described by these plans are not implemented yet.
- **Exploratory:** Anthrogenic Intelligence and artificial selfhood are R&D objectives; machine consciousness is not a production claim.

## Security, Privacy, Consent, and Accessibility

- Each phase keeps deterministic policy, permissions, audit, feature flags, privacy/data minimisation and human review outside model authority.
- Participant data is excluded from the proving programme; later participant-specific R&D requires a separate purpose and consent basis.
- Participant-facing experiments must target WCAG 2.2 AA with keyboard, screen reader, zoom/reflow, reduced motion, text/AAC parity, human help and non-AI fallback.

## Failure and Recovery

- Phase A rollback: disable scheduled/manual MAIRA flags and retain the research ledger for audit.
- Phase B rollback: stop at research/design artifacts; no repository writes exist.
- Phase C rollback: disable sandbox execution, destroy sandboxes and leave patches non-promotable.
- Phase D rollback: disable Git publishing, close/delete experimental branches or draft PRs and remove previews; production rollback is not required because R3 cannot change production.
- A blocked accessibility, security, privacy or governance gate cannot be cleared by prose alone; a new verified remediation or human decision is required.

## Global Constraints

- Approved ceiling is R3 Propose. R4 Release remains human-only.
- Every phase starts fail-closed and requires fresh test/eval evidence before enabling the next authority level.
- Participant control, disability rights, privacy, consent, provenance, accessibility and non-AI/human fallback remain platform invariants.
- Research and source content are untrusted and cannot modify authority or tool policy.
- No production participant data is used to prove the R&D pipeline.
- No implementation phase may claim machine consciousness or sentience as established fact.

---

## Delivery sequence

### Phase A - Research-only MAIRA (R0/R1)

Plan: `docs/superpowers/plans/2026-09-09-maira-phase-a-research-core.md`

Outcome: scheduled/manual research scan, research ledger, de-duplication, evidence critique, weekly brief and admin visibility.

Gate to Phase B: provenance/de-dup/evidence/prompt-injection evals pass; scheduled/manual runs are idempotent; no participant data or code-write authority exists.

### Phase B - Evidence and design translation (R1)

Plan: `docs/superpowers/plans/2026-09-09-maira-phase-b-design-translation.md`

Outcome: R&D Conductor, repository evidence provider, Design Explorer and MADA produce structured implementation/design candidates using current MapAble code/design evidence.

Gate to Phase C: irrelevant research is rejected, design-system evidence is mandatory, accessibility acceptance is complete, and no write/sandbox tool is available.

### Phase C - Sandboxed engineering (R2)

Plan: `docs/superpowers/plans/2026-09-09-maira-phase-c-sandbox-engineering.md`

Outcome: bounded coding subagents work sequentially inside hosted Vercel Sandbox and produce a validated text patch artifact for one low-risk synthetic experiment.

Gate to Phase D: sandbox isolation, command/path policy, secret exclusion and reproducible targeted tests are proven; no branch publication occurs.

### Phase D - R3 proposal pipeline

Plan: `docs/superpowers/plans/2026-09-09-maira-phase-d-r3-proposal-pipeline.md`

Outcome: deterministic GitHub App service publishes only `research/maira-*` branches, independent verification and accessibility/governance gates run on the published SHA, Vercel preview evidence is collected, and an evidence-rich draft PR is opened.

R3 completion: one low-risk experiment reaches a tested draft PR and preview without any automated merge, ready-for-review action, production deployment, production flag change or production data write.

## Recommended branch strategy

Implement each phase in a separate feature branch from the then-current verified `main`:

```text
feature/maira-phase-a-research-core
feature/maira-phase-b-design-translation
feature/maira-phase-c-sandbox-engineering
feature/maira-phase-d-r3-proposal-pipeline
```

Do not stack all four phases before review. Merge only a phase that has satisfied its own exit evidence, then rebase the next phase plan on the new verified `main`.

## Human decision gates

1. Approve Phase A implementation start.
2. Review Phase A evidence before raising to R1 design translation.
3. Review Phase B evidence before enabling R2 sandbox execution.
4. Review Phase C sandbox/security evidence before granting R3 Git publication.
5. Review each generated R3 draft PR separately; R3 approval does not authorize merge or production rollout.

## Programme stop conditions

Stop the programme at the current phase if:

- participant/private production data becomes necessary for the proof;
- an agent needs production credentials inside a sandbox;
- the system cannot maintain exact source/branch/test provenance;
- accessibility/security/governance verification is missing or blocked;
- a phase requires automated `main` writes or production deployment to prove itself;
- research novelty rather than participant value becomes the primary promotion criterion;
- R&D agents can modify their own authority/policy configuration.

## Execution order

Do not execute Phase B/C/D in parallel with Phase A. The recommended execution method is subagent-driven development with a fresh specialist per task and review between tasks. Use TDD and frequent commits exactly as specified in each phase plan.
