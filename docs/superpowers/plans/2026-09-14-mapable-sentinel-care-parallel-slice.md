# MapAble Sentinel Care Parallel Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Care Sentinel supervisory profile that composes canonical Care eligibility, Guardian, Mission Runtime, Recovery and Action Kernel services without creating a second Care lifecycle or assigning workers autonomously.

**Architecture:** The Care slice is projection-only. It evaluates canonical Care facts at selected consequential transition points, maps them through existing Guardian policy, and returns a participant-safe supervisory disposition. Existing Care services remain systems of record and existing worker assignment remains the only write path.

**Tech Stack:** Next.js 15.5, TypeScript, Zod 4, Vitest, Prisma/Neon, existing `lib/care/**`, `lib/ai/platform/guardian/**`, `lib/ai/platform/missions/**`, `lib/ai/platform/recovery/**`, `lib/ai/platform/actions/**`.

**Spec:** `docs/ai-platform/SENTINEL_CONVERGENCE.md`

## Global Constraints

- Sentinel is a thin supervisory composition/profile layer, not a second CareOS or runtime.
- Unified Guardian remains deterministic policy authority.
- Existing Care services remain systems of record.
- Governed Action Kernel remains the execution boundary for any agent-prepared action.
- Sentinel must never assign or replace a worker automatically.
- Sentinel must never decide incident reportability, substantiate abuse, authorise restrictive practice, make clinical decisions, or weaken participant requirements because supply is scarce.
- Unknown worker/evidence/requirement state remains unknown.
- Participant stop and human-help paths remain available.
- All new flags default `false`.
- No Temporal-specific code in this slice.
- Do not modify shared Sentinel contracts/state-machine/policy-adapter in this branch after parallel kickoff unless coordinated through a separate convergence commit.

---

## Parallel Ownership Boundary

This Care branch may modify only:

- `lib/ai/platform/sentinel/care/**`
- `tests/ai-platform/sentinel/care/**`
- Care-specific documentation/tests required for integration

It may read but should not modify:

- `lib/ai/platform/sentinel/contracts.ts`
- `lib/ai/platform/sentinel/policy-adapter.ts`
- `lib/ai/platform/sentinel/state-machine.ts`
- Employment/Jobs Sentinel paths

Shared contract changes must be proposed separately and merged before both parallel branches rebase.

## File Structure

Create:

- `lib/ai/platform/sentinel/care/types.ts` — Care supervisory input/result contracts.
- `lib/ai/platform/sentinel/care/profile.ts` — pure deterministic Care supervisory projection.
- `lib/ai/platform/sentinel/care/explanation.ts` — participant-safe explanation formatter.
- `lib/ai/platform/sentinel/care/index.ts` — Care profile exports.
- `tests/ai-platform/sentinel/care/profile.test.ts`
- `tests/ai-platform/sentinel/care/explanation.test.ts`

Read/reuse without modifying where possible:

- `lib/care/worker-eligibility.ts`
- `lib/care/care-assignment-service.ts`
- `lib/care/backup-shift-recovery-service.ts`
- `lib/care/backup-recovery-pilot.ts`
- `lib/ai/platform/guardian/**`
- `lib/ai/platform/recovery/**`
- `lib/ai/platform/actions/**`

## First Care Vertical Slice

Scope only these three transitions:

1. **Worker assignment readiness** — worker is inactive, wrong organisation, unverified, screening not verified, or missing high-intensity competency.
2. **Credential/evidence freshness** — required worker credential evidence is expired/revoked/unverified/unknown.
3. **Shift disruption / replacement preparation** — existing worker becomes unavailable; Sentinel may mark recovery required and expose alternatives/human coordination, but may not assign the replacement.

### Expected supervisory outcomes

- `CONTINUE` — all required deterministic checks pass.
- `VERIFY` — required evidence is absent/stale/unknown but not proven incompatible.
- `PAUSE` — a hard deterministic eligibility condition fails.
- `PARTICIPANT_CONFIRMATION` — recovery has alternatives requiring participant choice.
- `HUMAN_REVIEW` — policy/authority requires a person.
- `DENY` / `SECURITY_QUARANTINE` — inherited from Guardian where applicable.

### Task 1: Care supervisory contracts

**Files:**
- Create: `lib/ai/platform/sentinel/care/types.ts`
- Test: `tests/ai-platform/sentinel/care/profile.test.ts`

**Interfaces:**
- Produces `CareSentinelCheck`, `CareSentinelInput`, `CareSentinelResult`.
- `CareSentinelResult` contains only references, reason codes, facts/unknowns and disposition; no duplicated participant narrative or worker record.

- [ ] **Step 1: Write the failing contract test**

```ts
import { describe, expect, it } from "vitest";
import type { CareSentinelInput } from "@/lib/ai/platform/sentinel/care/types";

describe("Care Sentinel contracts", () => {
  it("represents worker assignment supervision using references", () => {
    const input: CareSentinelInput = {
      transition: "worker_assignment_activation",
      tenantId: "org-1",
      participantRef: "Participant:p-1",
      careBookingRef: "CareBooking:b-1",
      workerRef: "WorkerProfile:w-1",
      tasks: [{ name: "support", intensity: "standard" }],
      requiredCredentialTypes: [],
    };
    expect(input.transition).toBe("worker_assignment_activation");
  });
});
```

- [ ] **Step 2: Run RED**

```bash
pnpm vitest run tests/ai-platform/sentinel/care/profile.test.ts
```

Expected: FAIL because Care Sentinel types do not exist.

- [ ] **Step 3: Implement minimal contracts**

```ts
export type CareSentinelTransition =
  | "worker_assignment_activation"
  | "worker_evidence_recheck"
  | "shift_disruption";

export type CareSentinelInput = {
  transition: CareSentinelTransition;
  tenantId: string;
  participantRef: string;
  careBookingRef: string;
  workerRef?: string;
  tasks?: unknown;
  requiredCredentialTypes?: string[];
};

export type CareSentinelDisposition =
  | "CONTINUE"
  | "VERIFY"
  | "PAUSE"
  | "PARTICIPANT_CONFIRMATION"
  | "HUMAN_REVIEW"
  | "DENY"
  | "SECURITY_QUARANTINE";

export type CareSentinelResult = {
  disposition: CareSentinelDisposition;
  reasonCodes: string[];
  factRefs: string[];
  unknownRefs: string[];
  recoveryRequired: boolean;
  participantDecisionRequired: boolean;
  humanReviewRequired: boolean;
};
```

- [ ] **Step 4: Run GREEN**

```bash
pnpm vitest run tests/ai-platform/sentinel/care/profile.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/ai/platform/sentinel/care/types.ts tests/ai-platform/sentinel/care/profile.test.ts
git commit -m "feat(sentinel-care): add supervisory contracts"
```

### Task 2: Worker assignment readiness projection

**Files:**
- Create: `lib/ai/platform/sentinel/care/profile.ts`
- Modify: `tests/ai-platform/sentinel/care/profile.test.ts`

**Interfaces:**
- Consumes canonical worker eligibility facts compatible with `assertWorkerEligibleForBooking`.
- Produces `evaluateCareAssignmentReadiness(input): CareSentinelResult`.
- Does not call `assignWorkerToCareBooking`.

- [ ] **Step 1: Add failing tests for hard failures and unknown evidence**

```ts
import { evaluateCareAssignmentReadiness } from "@/lib/ai/platform/sentinel/care/profile";

it("pauses when worker screening is not verified", () => {
  const result = evaluateCareAssignmentReadiness({
    worker: {
      id: "w-1",
      organisationId: "org-1",
      active: true,
      verificationStatus: "verified",
      workerScreeningStatus: "pending",
      highIntensityCompetencyVerified: false,
    },
    booking: { organisationId: "org-1", tasks: [] },
    credentialEvidenceStatus: "verified",
  });
  expect(result.disposition).toBe("PAUSE");
  expect(result.reasonCodes).toContain("WORKER_SCREENING_REQUIRED");
});

it("requests verification when required credential evidence is unknown", () => {
  const result = evaluateCareAssignmentReadiness({
    worker: {
      id: "w-1",
      organisationId: "org-1",
      active: true,
      verificationStatus: "verified",
      workerScreeningStatus: "verified",
      highIntensityCompetencyVerified: true,
    },
    booking: { organisationId: "org-1", tasks: [] },
    credentialEvidenceStatus: "unknown",
  });
  expect(result.disposition).toBe("VERIFY");
  expect(result.unknownRefs).toContain("worker_credential_evidence");
});
```

- [ ] **Step 2: Run RED**

```bash
pnpm vitest run tests/ai-platform/sentinel/care/profile.test.ts
```

- [ ] **Step 3: Implement pure projection using canonical reason semantics**

Implementation must preserve the same hard checks as `lib/care/worker-eligibility.ts`:

```ts
if (!worker.active) return pause("WORKER_INACTIVE");
if (worker.organisationId !== booking.organisationId) return pause("WORKER_ORG_MISMATCH");
if (worker.verificationStatus !== "verified") return pause("WORKER_NOT_VERIFIED");
if (worker.workerScreeningStatus !== "verified") return pause("WORKER_SCREENING_REQUIRED");
if (bookingHasHighIntensityTasks(booking.tasks) && !worker.highIntensityCompetencyVerified) {
  return pause("HIGH_INTENSITY_COMPETENCY_REQUIRED");
}
if (credentialEvidenceStatus === "unknown") return verify("worker_credential_evidence");
if (credentialEvidenceStatus !== "verified") return pause("WORKER_CREDENTIAL_EVIDENCE_REQUIRED");
return continueResult();
```

Do not copy worker-loading/database logic into Sentinel.

- [ ] **Step 4: Run GREEN and canonical regression tests**

```bash
pnpm vitest run tests/ai-platform/sentinel/care/profile.test.ts
pnpm vitest run tests/care --passWithNoTests
```

- [ ] **Step 5: Commit**

```bash
git add lib/ai/platform/sentinel/care/profile.ts tests/ai-platform/sentinel/care/profile.test.ts
git commit -m "feat(sentinel-care): project worker assignment readiness"
```

### Task 3: Shift disruption and recovery handoff

**Files:**
- Modify: `lib/ai/platform/sentinel/care/profile.ts`
- Modify: `tests/ai-platform/sentinel/care/profile.test.ts`

**Interfaces:**
- Produces `evaluateCareShiftDisruption(input): CareSentinelResult`.
- Result may state `recoveryRequired=true` but must not select a replacement worker.

- [ ] **Step 1: Write failing no-auto-replacement test**

```ts
it("requires participant or human decision when a shift is disrupted", () => {
  const result = evaluateCareShiftDisruption({
    careBookingRef: "CareBooking:b-1",
    disruption: "worker_unavailable",
    compliantAlternativeRefs: ["WorkerProfile:w-2", "WorkerProfile:w-3"],
  });

  expect(result.recoveryRequired).toBe(true);
  expect(result.disposition).toBe("PARTICIPANT_CONFIRMATION");
  expect(result).not.toHaveProperty("selectedWorkerRef");
});
```

- [ ] **Step 2: Run RED**

```bash
pnpm vitest run tests/ai-platform/sentinel/care/profile.test.ts
```

- [ ] **Step 3: Implement recovery handoff projection**

Rules:

```text
0 compliant alternatives -> HUMAN_REVIEW
1+ compliant alternatives -> PARTICIPANT_CONFIRMATION
unknown eligibility among proposed alternatives -> VERIFY, not compatible
never return selectedWorkerRef
```

- [ ] **Step 4: Run GREEN**

```bash
pnpm vitest run tests/ai-platform/sentinel/care/profile.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/ai/platform/sentinel/care/profile.ts tests/ai-platform/sentinel/care/profile.test.ts
git commit -m "feat(sentinel-care): add disruption recovery handoff"
```

### Task 4: Guardian composition

**Files:**
- Modify: `lib/ai/platform/sentinel/care/profile.ts`
- Test: `tests/ai-platform/sentinel/care/profile.test.ts`

**Interfaces:**
- Consumes existing `GuardianDecision` and `mapGuardianDecisionToSentinel`.
- Produces effective Care disposition with Guardian able to tighten but never loosen deterministic Care constraints.

- [ ] **Step 1: Write failing precedence tests**

```ts
it("does not let Guardian ALLOW override a hard Care pause", () => {
  const result = combineCareAndGuardian(
    { disposition: "PAUSE", reasonCodes: ["WORKER_SCREENING_REQUIRED"] },
    { disposition: "ALLOW", reasonCodes: [], policyVersion: "v1", participantConfirmationRequired: false, humanReviewRequired: false },
  );
  expect(result.disposition).toBe("PAUSE");
});

it("lets Guardian require human review when Care checks pass", () => {
  const result = combineCareAndGuardian(
    { disposition: "CONTINUE", reasonCodes: [] },
    { disposition: "HUMAN_REVIEW", reasonCodes: ["GUARDIAN_REVIEW"], policyVersion: "v1", participantConfirmationRequired: false, humanReviewRequired: true },
  );
  expect(result.disposition).toBe("HUMAN_REVIEW");
});
```

- [ ] **Step 2: Run RED**
- [ ] **Step 3: Implement monotonic safety composition**

Precedence:

```text
SECURITY_QUARANTINE
DENY
HUMAN_REVIEW
PAUSE
VERIFY
PARTICIPANT_CONFIRMATION
CONTINUE
```

Do not let a lower-precedence result weaken a higher-precedence one.

- [ ] **Step 4: Run GREEN**
- [ ] **Step 5: Commit**

### Task 5: Participant-safe Care explanation

**Files:**
- Create: `lib/ai/platform/sentinel/care/explanation.ts`
- Test: `tests/ai-platform/sentinel/care/explanation.test.ts`

**Interfaces:**
- Produces `formatCareSentinelExplanation(result)` with `facts`, `unknowns`, `why`, `nextActions`.
- Does not expose internal safeguarding investigations, worker-sensitive notes, or raw credential data.

- [ ] **Step 1: Write failing explanation tests**

```ts
it("labels unknown evidence as unknown rather than failed", () => {
  const view = formatCareSentinelExplanation({
    disposition: "VERIFY",
    reasonCodes: [],
    factRefs: [],
    unknownRefs: ["worker_credential_evidence"],
    recoveryRequired: false,
    participantDecisionRequired: false,
    humanReviewRequired: false,
  });
  expect(view.unknowns).toContain("Worker credential evidence needs verification.");
});
```

- [ ] **Step 2: Run RED**
- [ ] **Step 3: Implement plain-language formatter**
- [ ] **Step 4: Run GREEN**
- [ ] **Step 5: Commit**

### Task 6: Care slice verification

- [ ] Run focused suite:

```bash
pnpm vitest run tests/ai-platform/sentinel/care
```

- [ ] Run existing Guardian regression suite:

```bash
pnpm vitest run tests/ai-platform/guardian
```

- [ ] Run existing AI platform tests relevant to missions/recovery/actions where practical:

```bash
pnpm test:ai-platform
```

- [ ] Run type-check:

```bash
pnpm type-check
```

- [ ] Confirm no Care assignment write path was added under `lib/ai/platform/sentinel/care/`.
- [ ] Confirm all Sentinel/Care flags remain disabled by default.
- [ ] Independent review before integration.

## Merge Contract

The Care branch is mergeable only if it exports a stable Care profile API and requires **no Employment branch code**. It may merge before or after Employment. Cross-domain integration happens in a third integration branch after both slices are individually green.
