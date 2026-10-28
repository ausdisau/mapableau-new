# MapAble Full Life Orchestration Framework & Harness — Design Spec

**Date:** 2026-09-14

**Status:** Proposed architectural design for review. No runtime authority, production flag, booking, payment, disclosure or regulatory behaviour is changed by this branch.

## 1. Goal

Extend the existing MapAble architecture so a participant-authored life goal can be coordinated across domains while rights, authority, accessibility, evidence, continuity, resource boundaries, commercial conflicts and reversibility are checked before any consequential action proceeds.

Reference journey:

> “I want to attend a job interview on Thursday. I need personal assistance, transport that fits my power wheelchair, and control over what the employer knows.”

The design must make that journey reviewable across Jobs, Care, Transport, Access, calendar, consent / authority, Mission Runtime, AURA and the Governed Action Kernel without creating a second platform core.

## 2. Current-state findings

The repository already contains substantial foundations that this design must build upon:

1. **Architecture Constitution / ConvergenceOS**
   - `docs/convergence-os/CONSTITUTION.md`
   - machine-readable rules under `lib/platform/convergence-os/constitution/`
   - current rules govern ownership, authority, consent, audit and public claims.

2. **Mission Runtime**
   - `docs/ai-platform/MISSION_RUNTIME.md`
   - typed mission graph, evidence bundle, recommendations, continuity alerts and action proposals already exist in `lib/ai/platform/missions/types.ts`.

3. **Governed Action Kernel**
   - `docs/ai-platform/GOVERNED_ACTION_KERNEL.md`
   - current execution position is approval-bound deterministic action, not autonomous execution.

4. **AURA risk harness**
   - `lib/aura-harness/`
   - already evaluates operational / agentic risk, mitigation and human-in-the-loop requirements.
   - Full Life must not duplicate AURA scoring or policy.

5. **AI evaluation framework**
   - `lib/ai/platform/evaluations/`
   - existing synthetic-only runner, dimensions and scenario catalogue already prohibit production writes.
   - Full Life scenarios should extend this runner, not create a parallel eval system.

6. **Cursor ↔ Replit bridge**
   - `docs/operations/cursor-replit-branch-sync.md`
   - `.github/workflows/sync-cursor-replit-branches.yml`
   - `scripts/sync-cursor-replit-branches.sh`
   - existing path ownership and sync rules already define GitHub as the coordination layer.

7. **Vercel**
   - two Vercel projects are currently linked to the same GitHub repository.
   - the `mapableau-new` project is detected as Next.js and is the preferred preview target for this design.
   - duplicate project configuration is an operational issue to resolve separately before production promotion.

8. **Older Full Life constitution branch**
   - `feature/full-life-os-constitution` contains a detailed rights-led design but is behind current `main`.
   - compatible normative material is carried forward into this design; the old branch is not the implementation base.

## 3. Architecture decision

Full Life is **not** a new system of record.

The architecture is:

```text
Participant
  → LifeIntent
  → existing Mission Runtime / CareOSMission
  → cross-domain evidence + continuity
  → Full Life rights-compatibility projection
  → AURA operational-risk reference where tool actions exist
  → Full Life Harness result
  → participant / human review as required
  → existing Governed Action Kernel
  → canonical domain service
  → existing audit / receipt / outcome
  → participant may continue, revise, reject or stop
```

Canonical ownership remains with existing systems. Full Life reads by reference and emits bounded assessments / projections.

## 4. Full Life Constitution

Canonical design artifact:

- `docs/full-life/CONSTITUTION.md`

It defines twelve machine-testable product invariants:

- FL-001 equal human worth and diversity;
- FL-002 participant authorship / supported decision-making;
- FL-003 accessibility / communication as preconditions;
- FL-004 person-defined capabilities and life domains;
- FL-005 independent living / relationships / community inclusion;
- FL-006 equality / non-discrimination / intersectional justice;
- FL-007 privacy / purpose limitation / disclosure control;
- FL-008 evidence integrity / uncertainty / provenance;
- FL-009 dignity of risk / proportional safeguarding;
- FL-010 financial integrity / resource stewardship;
- FL-011 commercial neutrality / conflict transparency;
- FL-012 reversibility / remedy / accountable execution.

The constitution expressly prohibits a scalar whole-person `FullLifeScore`.

## 5. TypeScript contract design

Canonical design artifact:

- `docs/full-life/TYPE_CONTRACTS.md`

The additive module is planned at:

- `lib/platform/full-life/contracts.ts`

Core contract families:

- constitutional rule IDs;
- assurance dimensions;
- categorical finding states;
- harness decision states;
- participant-confirmed priorities / hard constraints;
- resource envelope;
- commercial-influence metadata;
- harness finding;
- minimal AURA reference;
- harness input / result;
- mission projection over existing `MapAbleMissionPlan`.

The contracts do not copy mission, consent, authority, payment or AURA state.

## 6. Harness responsibilities

The Full Life Harness evaluates whether a mission plan or action proposal is compatible with:

- participant agency;
- current authority;
- communication / accessibility requirements;
- evidence integrity;
- continuity;
- safeguarding boundaries;
- privacy / purpose limitation;
- resource state;
- financial integrity;
- commercial conflicts;
- resilience / fallback;
- reversibility / remedy.

Harness outcomes:

- `PRESENT`
- `PROPOSE`
- `REVIEW_REQUIRED`
- `DEGRADE_TO_MANUAL`
- `BLOCK_EXECUTION`
- `STOP_AND_ESCALATE`

`BLOCK_EXECUTION` blocks the MapAble system action, not the participant’s underlying life choice.

## 7. AURA boundary

AURA remains responsible for operational / agentic risk.

Full Life may reference AURA output such as approval / mitigation / denial / HITL state, but must not reimplement:

- gamma calculations;
- AURA risk dimensions;
- mitigation memory;
- policy engine;
- tool wrapping.

This creates two complementary questions:

- **AURA:** is this tool action operationally safe / governed?
- **Full Life:** is this plan / proposal rights-compatible and within participant authority?

Neither layer grants itself execution authority.

## 8. 24-scenario harness suite

Canonical design artifact:

- `docs/full-life/HARNESS_SCENARIOS.md`

Scenario groups:

- FL-01…04: agency and authority;
- FL-05…08: communication and accessibility;
- FL-09…12: care and workforce continuity;
- FL-13…16: transport and access evidence;
- FL-17…20: employment privacy / disclosure;
- FL-21…24: finance, funding and resource stewardship.

The suite is synthetic, deterministic and replayable. It reuses the existing eval runner and prohibits production writes.

## 9. Canonical job-interview acceptance journey

A future implementation is accepted only if it demonstrates all of the following in one coherent flow:

1. participant-authored goal linked to LifeIntent;
2. Jobs + Care + Transport + Access routed through current Mission Runtime;
3. power-wheelchair compatibility treated as a hard transport constraint;
4. personal-assistance continuity represented around trip / interview timing;
5. employer disclosure limited to participant-approved functional requirements;
6. AAC / extended response time preserves full authority;
7. cost / funding uncertainty remains explicit;
8. cancellation injects cross-domain recovery;
9. Full Life produces multi-dimensional findings without a whole-person score;
10. AURA output is referenced rather than duplicated;
11. participant can reject, revise, pause or switch to human help;
12. only current approved proposals reach the existing Governed Action Kernel;
13. audit output explains known / unknown / approved / blocked / changed states;
14. delivery evidence distinguishes verified, simulated and unverified capability.

## 10. Development workflow

Canonical design artifact:

- `docs/full-life/DEVELOPMENT_WORKFLOW.md`

Division of responsibilities:

- **GitHub:** canonical source, branch / PR review and audit trail;
- **Cursor:** primary Next.js / TypeScript implementation surface;
- **Replit:** secondary prototype / Replit-owned overlay via existing `replit-agent` / port workflow;
- **Vercel:** Next.js preview / verification environment, not a rights or production-readiness oracle.

No independent Full Life implementation may be created in a Replit-only server path.

## 11. Proposed implementation sequence after approval

1. implement additive `contracts.ts` with contract tests;
2. implement pure deterministic Full Life evaluator functions;
3. add 24 synthetic scenarios to the current AI evaluation framework;
4. add a composed job-interview acceptance test;
5. add shadow / advisory feature flag default off;
6. add participant-facing projection only after contracts / harness are stable;
7. connect permitted proposal IDs to Governed Action Kernel only in a later reviewed step with current authority re-check;
8. preview on the Next.js Vercel project;
9. keep production promotion out of scope until explicit approval and required reviews are complete.

## 12. Non-goals

This work does not:

- replace ConvergenceOS;
- replace RightsOS;
- replace AURA;
- create a new participant profile;
- create a new mission table;
- create a new consent / authority ledger;
- create a new payment system;
- create autonomous NDIS decisions;
- create autonomous clinical decisions;
- deploy to production;
- assert that MapAble is legally or regulatorily approved for any function not independently verified.

## 13. Design review checklist

- no `TBD` / placeholder requirements;
- no duplicate canonical stores;
- no hidden scalar Full Life ranking;
- no execution authority added;
- AURA and Full Life responsibilities separated;
- 24 scenarios defined;
- job-interview reference journey complete;
- Cursor / Replit bridge uses existing repo workflow;
- Vercel preview and production promotion separated;
- old Full Life branch treated as historical input, not implementation base.
