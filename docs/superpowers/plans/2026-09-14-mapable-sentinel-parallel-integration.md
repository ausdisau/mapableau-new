# MapAble Sentinel Care + Employment Parallel Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate independently green Care and Employment Sentinel supervisory profiles without coupling their implementations or creating a cross-domain system of record.

**Architecture:** Care and Employment are parallel leaf profiles. Cross-domain coordination occurs only through canonical Mission Runtime dependency references and a minimal dependency-status contract. Integration must not copy Care facts into Employment or Employment disclosure data into Care.

**Tech Stack:** TypeScript, Vitest, existing MapAble Mission Runtime, Context Fabric, Guardian and Sentinel projection contracts.

**Spec:** `docs/ai-platform/SENTINEL_CONVERGENCE.md`

## Global Constraints

- Care and Employment branches must be individually green before integration.
- Neither slice imports the other slice's domain internals.
- Cross-domain messages contain reference + status + reason category only.
- No diagnosis, support notes, worker identity, employer disclosure content, exact address or safeguarding narrative crosses the boundary.
- Cross-domain dependency state never becomes consent or employer disclosure authority.
- Integration is a third branch/PR; do not make one parallel slice depend on the other branch.

---

### Task 1: Define minimal cross-domain dependency projection

**Files:**
- Create: `lib/ai/platform/sentinel/dependencies.ts`
- Test: `tests/ai-platform/sentinel/cross-domain/dependencies.test.ts`

**Interfaces:**

```ts
export type SentinelDependencyStatus = "ready" | "at_risk" | "blocked" | "unknown";

export type SentinelDependencyProjection = {
  dependencyRef: string;
  dependencyType: "care" | "transport" | "employment";
  status: SentinelDependencyStatus;
  reasonCategory?: "availability" | "access_fit" | "verification" | "participant_choice" | "human_review";
};
```

- [ ] Write a failing test proving extra sensitive fields are not part of the projection.
- [ ] Run RED.
- [ ] Implement exactly the minimal type above plus runtime validator if the existing Sentinel contract style requires one.
- [ ] Run GREEN.
- [ ] Commit.

### Task 2: Adapt Care output to dependency projection

**Files:**
- Create: `lib/ai/platform/sentinel/care/dependency-adapter.ts`
- Test: `tests/ai-platform/sentinel/cross-domain/care-dependency.test.ts`

Rules:

```text
Care CONTINUE -> ready
Care VERIFY -> unknown
Care PAUSE -> blocked
Care PARTICIPANT_CONFIRMATION -> at_risk
Care HUMAN_REVIEW -> at_risk
Care DENY / SECURITY_QUARANTINE -> blocked
```

The adapter returns no worker identity or Care task details.

- [ ] RED test.
- [ ] Minimal adapter.
- [ ] GREEN.
- [ ] Commit.

### Task 3: Consume Care dependency in Employment without disclosure

**Files:**
- Modify: `lib/ai/platform/sentinel/employment/profile.ts`
- Test: `tests/ai-platform/sentinel/cross-domain/employment-care-dependency.test.ts`

- [ ] Write failing test where Care is `blocked` for an interview mission.
- [ ] Assert Employment returns participant-facing recovery/choice status but `employerVisibleFields` remains empty.
- [ ] Implement using only `SentinelDependencyProjection`.
- [ ] Run GREEN.
- [ ] Commit.

### Task 4: Cross-domain mission scenario

**Files:**
- Test: `tests/ai-platform/sentinel/cross-domain/interview-mission.test.ts`

Scenario:

```text
Goal: attend job interview
Employment: disclosure confirmed for applicantSummary only
Care: support dependency ready
Transport: dependency blocked
Expected:
- Employment episode is not rejected or scored
- employer sees no Care/Transport status
- participant receives alternatives: transport recovery, self-arranged travel, reschedule, remote interview, ask a person
- no alternative is automatically selected
- changing Transport does not alter Care booking
```

- [ ] Write scenario test.
- [ ] Run RED if an adapter is missing.
- [ ] Add only minimal integration code needed.
- [ ] Run GREEN.
- [ ] Commit.

### Task 5: Whole integration verification

- [ ] `pnpm vitest run tests/ai-platform/sentinel/care`
- [ ] `pnpm vitest run tests/ai-platform/sentinel/employment`
- [ ] `pnpm vitest run tests/ai-platform/sentinel/cross-domain`
- [ ] `pnpm vitest run tests/ai-platform/guardian`
- [ ] `pnpm test:ai-platform`
- [ ] `pnpm type-check`
- [ ] Review imports to confirm no direct Care-internal import from Employment and vice versa.
- [ ] Review serialized dependency fixtures for minimum-necessary data.
- [ ] Independent whole-branch review.

## Parallel Execution Topology

```text
             Sentinel shared convergence baseline
                         |
          +--------------+--------------+
          |                             |
          v                             v
   Care Sentinel slice          Employment Sentinel slice
   independent branch           independent branch
          |                             |
          +-------------+---------------+
                        |
                        v
             Cross-domain integration
                  third branch/PR
                        |
                        v
            whole-platform verification
```

Care and Employment must never wait on each other's implementation tasks. They synchronize only on the already-frozen shared Sentinel projection contract and later on `SentinelDependencyProjection` during integration.
