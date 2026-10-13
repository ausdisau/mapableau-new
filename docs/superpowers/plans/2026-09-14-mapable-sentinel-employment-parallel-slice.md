# MapAble Sentinel Employment (Jobs) Parallel Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Employment/Jobs Sentinel supervisory profile that protects participant-controlled disclosure and access dependencies without scoring employability, rejecting candidates, or disclosing disability/support information autonomously.

**Architecture:** The Jobs slice is projection-only. It composes canonical Job Application, disclosure-preview, fairness, workplace-access and mission dependency facts with Guardian policy, then returns participant-safe supervisory dispositions. Existing Jobs services remain systems of record and employer-visible data continues to flow only through confirmed disclosure mechanisms.

**Tech Stack:** Next.js 15.5, TypeScript, Zod 4, Vitest, Prisma/Neon, existing `lib/jobs/**`, `lib/ai/platform/guardian/**`, `lib/ai/platform/missions/**`, `lib/ai/platform/recovery/**`, `lib/ai/platform/actions/**`.

**Spec:** `docs/ai-platform/SENTINEL_CONVERGENCE.md`

## Global Constraints

- Sentinel is a thin supervisory profile, not a second Jobs runtime.
- No employability score, candidate ranking by disability, predicted productivity, predicted support cost, predicted complaint risk, or automatic rejection.
- No disability, adjustment, Care or Transport information is disclosed to an employer without explicit participant-controlled scope.
- `preference != consent`; `previewed != confirmed`; `support dependency != employer disclosure`.
- Existing `ApplicationDisclosurePreview` remains the canonical disclosure preview/confirmation mechanism.
- Guardian may tighten but never weaken Jobs fairness/disclosure constraints.
- Unknown workplace accessibility evidence remains unknown.
- Transport/Care dependency status may cross into Jobs only as minimum-necessary fulfilment status; diagnoses/support details must not cross.
- All new flags default `false`.
- No Temporal-specific code in this slice.
- Do not modify shared Sentinel contracts/state-machine/policy-adapter in this branch after parallel kickoff unless coordinated through a separate convergence commit.

---

## Parallel Ownership Boundary

This Employment branch may modify only:

- `lib/ai/platform/sentinel/employment/**`
- `tests/ai-platform/sentinel/employment/**`
- Jobs-specific documentation/tests required for integration

It may read but should not modify:

- `lib/ai/platform/sentinel/contracts.ts`
- `lib/ai/platform/sentinel/policy-adapter.ts`
- `lib/ai/platform/sentinel/state-machine.ts`
- Care Sentinel paths

Shared contract changes must be proposed separately and merged before both parallel branches rebase.

## File Structure

Create:

- `lib/ai/platform/sentinel/employment/types.ts` — Employment supervisory contracts.
- `lib/ai/platform/sentinel/employment/profile.ts` — pure disclosure/access/dependency projection.
- `lib/ai/platform/sentinel/employment/explanation.ts` — participant-safe explanation formatter.
- `lib/ai/platform/sentinel/employment/index.ts` — exports.
- `tests/ai-platform/sentinel/employment/profile.test.ts`
- `tests/ai-platform/sentinel/employment/explanation.test.ts`

Read/reuse without modifying where possible:

- `lib/jobs/disclosure/disclosure-preview-service.ts`
- `lib/jobs/fairness-boundaries.ts`
- `lib/jobs/applications/**`
- `lib/jobs/evidence/**`
- `lib/jobs/matching/**`
- `lib/jobs/job-service.ts`
- `lib/ai/platform/guardian/**`
- `lib/ai/platform/missions/**`
- `lib/ai/platform/recovery/**`
- `lib/ai/platform/actions/**`

## First Employment Vertical Slice

Scope only these three journeys:

1. **Application disclosure confirmation** — employer-visible fields cannot progress from preview to disclosure without participant confirmation for the exact application/stage/scope.
2. **Interview adjustment request** — participant controls whether and what adjustment information is shared; the existence of Care/Transport support is not automatically employer-visible.
3. **Interview commute dependency** — Jobs may know `ready`, `at_risk`, `blocked`, or `unknown` transport fulfilment status without receiving diagnosis, worker, vehicle or support-detail payloads.

### Expected supervisory outcomes

- `CONTINUE`
- `VERIFY`
- `PAUSE`
- `PARTICIPANT_CONFIRMATION`
- `HUMAN_REVIEW`
- `DENY`
- `SECURITY_QUARANTINE`

### Task 1: Employment supervisory contracts

**Files:**
- Create: `lib/ai/platform/sentinel/employment/types.ts`
- Test: `tests/ai-platform/sentinel/employment/profile.test.ts`

**Interfaces:**
- Produces `EmploymentSentinelInput`, `EmploymentSentinelResult`, `EmploymentDisclosureScope`, `EmploymentDependencyStatus`.

- [ ] **Step 1: Write failing contract test**

```ts
import { describe, expect, it } from "vitest";
import type { EmploymentDisclosureScope } from "@/lib/ai/platform/sentinel/employment/types";

describe("Employment Sentinel contracts", () => {
  it("binds disclosure to participant, employer, application, stage, fields and purpose", () => {
    const scope: EmploymentDisclosureScope = {
      participantRef: "Participant:p-1",
      employerRef: "Employer:e-1",
      applicationRef: "JobApplication:a-1",
      stage: "application",
      fields: ["applicantSummary"],
      purpose: "job_application",
      expiresAt: null,
    };
    expect(scope.fields).toEqual(["applicantSummary"]);
  });
});
```

- [ ] **Step 2: Run RED**

```bash
pnpm vitest run tests/ai-platform/sentinel/employment/profile.test.ts
```

- [ ] **Step 3: Implement minimal contracts**

```ts
export type EmploymentStage = "application" | "interview" | "offer" | "placement";

export type EmploymentDisclosureScope = {
  participantRef: string;
  employerRef: string;
  applicationRef: string;
  stage: EmploymentStage;
  fields: string[];
  purpose: string;
  expiresAt: string | null;
};

export type EmploymentDependencyStatus = "ready" | "at_risk" | "blocked" | "unknown";

export type EmploymentSentinelDisposition =
  | "CONTINUE"
  | "VERIFY"
  | "PAUSE"
  | "PARTICIPANT_CONFIRMATION"
  | "HUMAN_REVIEW"
  | "DENY"
  | "SECURITY_QUARANTINE";

export type EmploymentSentinelResult = {
  disposition: EmploymentSentinelDisposition;
  reasonCodes: string[];
  factRefs: string[];
  unknownRefs: string[];
  participantDecisionRequired: boolean;
  humanReviewRequired: boolean;
  employerVisibleFields: string[];
};
```

- [ ] **Step 4: Run GREEN**
- [ ] **Step 5: Commit**

```bash
git add lib/ai/platform/sentinel/employment/types.ts tests/ai-platform/sentinel/employment/profile.test.ts
git commit -m "feat(sentinel-jobs): add supervisory contracts"
```

### Task 2: Application disclosure supervision

**Files:**
- Create: `lib/ai/platform/sentinel/employment/profile.ts`
- Modify: `tests/ai-platform/sentinel/employment/profile.test.ts`

**Interfaces:**
- Produces `evaluateEmploymentDisclosure(input): EmploymentSentinelResult`.
- Consumes canonical disclosure-preview status and requested employer-visible fields.
- Does not update or confirm `ApplicationDisclosurePreview`.

- [ ] **Step 1: Add failing tests**

```ts
it("requires participant confirmation for a previewed disclosure", () => {
  const result = evaluateEmploymentDisclosure({
    previewStatus: "previewed",
    requestedFields: ["applicantSummary"],
    confirmedFields: [],
    adjustmentSharingEnabled: false,
  });
  expect(result.disposition).toBe("PARTICIPANT_CONFIRMATION");
  expect(result.employerVisibleFields).toEqual([]);
});

it("blocks adjustment disclosure when sharing is not enabled", () => {
  const result = evaluateEmploymentDisclosure({
    previewStatus: "previewed",
    requestedFields: ["reasonableAdjustmentRequest"],
    confirmedFields: [],
    adjustmentSharingEnabled: false,
  });
  expect(result.disposition).toBe("PAUSE");
  expect(result.reasonCodes).toContain("ADJUSTMENT_SHARING_NOT_ENABLED");
});
```

- [ ] **Step 2: Run RED**
- [ ] **Step 3: Implement pure disclosure projection**

Rules:

```text
preview absent -> VERIFY
previewed + disclosure requested -> PARTICIPANT_CONFIRMATION
adjustment requested while shareAdjustments=false -> PAUSE
confirmed -> employerVisibleFields = intersection(requestedFields, confirmedFields)
never make transportSupportNeeded/careSupportNeeded employer-visible merely because dependency exists
```

Use the existing canonical semantics in `lib/jobs/disclosure/disclosure-preview-service.ts`; do not duplicate its Prisma writes.

- [ ] **Step 4: Run GREEN**

```bash
pnpm vitest run tests/ai-platform/sentinel/employment/profile.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/ai/platform/sentinel/employment/profile.ts tests/ai-platform/sentinel/employment/profile.test.ts
git commit -m "feat(sentinel-jobs): supervise participant disclosure"
```

### Task 3: Interview adjustment scope

**Files:**
- Modify: `lib/ai/platform/sentinel/employment/profile.ts`
- Modify: `tests/ai-platform/sentinel/employment/profile.test.ts`

**Interfaces:**
- Produces `evaluateInterviewAdjustmentDisclosure(input)`.
- Scope is application + employer + interview stage + fields + purpose.

- [ ] **Step 1: Write failing stage-isolation test**

```ts
it("does not reuse application-stage confirmation for interview adjustment disclosure", () => {
  const result = evaluateInterviewAdjustmentDisclosure({
    requestedScope: {
      participantRef: "Participant:p-1",
      employerRef: "Employer:e-1",
      applicationRef: "JobApplication:a-1",
      stage: "interview",
      fields: ["reasonableAdjustmentRequest"],
      purpose: "interview_adjustment",
      expiresAt: null,
    },
    confirmedScopes: [{
      participantRef: "Participant:p-1",
      employerRef: "Employer:e-1",
      applicationRef: "JobApplication:a-1",
      stage: "application",
      fields: ["applicantSummary"],
      purpose: "job_application",
      expiresAt: null,
    }],
  });
  expect(result.disposition).toBe("PARTICIPANT_CONFIRMATION");
});
```

- [ ] **Step 2: Run RED**
- [ ] **Step 3: Implement exact-scope matching**

Confirmation is valid only when participant, employer, application, stage, purpose and requested field subset match an unexpired confirmed scope.

- [ ] **Step 4: Run GREEN**
- [ ] **Step 5: Commit**

### Task 4: Commute dependency privacy projection

**Files:**
- Modify: `lib/ai/platform/sentinel/employment/profile.ts`
- Modify: `tests/ai-platform/sentinel/employment/profile.test.ts`

**Interfaces:**
- Produces `evaluateInterviewDependency(input)`.
- Accepts only minimal dependency status and reference, not diagnosis/Care/Transport payloads.

- [ ] **Step 1: Write failing privacy tests**

```ts
it("reports a blocked commute without employer disclosure", () => {
  const result = evaluateInterviewDependency({
    dependencyRef: "TransportTrip:t-1",
    dependencyType: "transport",
    status: "blocked",
  });
  expect(result.disposition).toBe("PARTICIPANT_CONFIRMATION");
  expect(result.employerVisibleFields).toEqual([]);
});

it("keeps unknown dependency status unknown", () => {
  const result = evaluateInterviewDependency({
    dependencyRef: "TransportTrip:t-1",
    dependencyType: "transport",
    status: "unknown",
  });
  expect(result.disposition).toBe("VERIFY");
  expect(result.unknownRefs).toContain("TransportTrip:t-1");
});
```

- [ ] **Step 2: Run RED**
- [ ] **Step 3: Implement minimal dependency projection**

Rules:

```text
ready -> CONTINUE
at_risk -> PARTICIPANT_CONFIRMATION (review alternatives / reschedule / remote / human help)
blocked -> PARTICIPANT_CONFIRMATION
unknown -> VERIFY
```

No employer-facing field is populated by dependency status.

- [ ] **Step 4: Run GREEN**
- [ ] **Step 5: Commit**

### Task 5: Guardian and fairness composition

**Files:**
- Modify: `lib/ai/platform/sentinel/employment/profile.ts`
- Modify: `tests/ai-platform/sentinel/employment/profile.test.ts`

**Interfaces:**
- Consumes existing Guardian projection and Jobs fairness boundary outcomes.
- Produces effective Employment disposition.

- [ ] **Step 1: Write failing non-weakening tests**

```ts
it("cannot turn a prohibited disclosure into CONTINUE", () => {
  const result = combineEmploymentAndGuardian(
    { disposition: "PAUSE", reasonCodes: ["DISCLOSURE_SCOPE_NOT_CONFIRMED"] },
    { disposition: "ALLOW", reasonCodes: [], policyVersion: "v1", participantConfirmationRequired: false, humanReviewRequired: false },
  );
  expect(result.disposition).toBe("PAUSE");
});
```

Add explicit tests proving no result type contains `employabilityScore`, `predictedProductivity`, `supportCostScore`, `complaintRiskScore`, or `autoReject`.

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

- [ ] **Step 4: Run GREEN**
- [ ] **Step 5: Commit**

### Task 6: Participant-safe Employment explanation

**Files:**
- Create: `lib/ai/platform/sentinel/employment/explanation.ts`
- Test: `tests/ai-platform/sentinel/employment/explanation.test.ts`

**Interfaces:**
- Produces `formatEmploymentSentinelExplanation(result)` with `facts`, `unknowns`, `why`, `nextActions`, `employerWillSee`.

- [ ] **Step 1: Write failing explanation test**

```ts
it("makes non-disclosure explicit", () => {
  const view = formatEmploymentSentinelExplanation({
    disposition: "PARTICIPANT_CONFIRMATION",
    reasonCodes: ["DISCLOSURE_CONFIRMATION_REQUIRED"],
    factRefs: [],
    unknownRefs: [],
    participantDecisionRequired: true,
    humanReviewRequired: false,
    employerVisibleFields: [],
  });
  expect(view.employerWillSee).toEqual([]);
  expect(view.why).toContain("Nothing is shared with the employer until you confirm it.");
});
```

- [ ] **Step 2: Run RED**
- [ ] **Step 3: Implement plain-language formatter**
- [ ] **Step 4: Run GREEN**
- [ ] **Step 5: Commit**

### Task 7: Employment slice verification

- [ ] Run focused suite:

```bash
pnpm vitest run tests/ai-platform/sentinel/employment
```

- [ ] Run existing Jobs tests:

```bash
pnpm vitest run tests/jobs --passWithNoTests
```

- [ ] Run Guardian/AI platform regressions:

```bash
pnpm vitest run tests/ai-platform/guardian
pnpm test:ai-platform
```

- [ ] Run type-check:

```bash
pnpm type-check
```

- [ ] Search the Employment Sentinel output types/source and confirm prohibited scoring/rejection fields do not exist.
- [ ] Confirm no employer-visible field is derived from Care/Transport dependency status.
- [ ] Confirm no direct Prisma writes exist under `lib/ai/platform/sentinel/employment/`.
- [ ] Confirm all Jobs/Sentinel flags remain disabled by default.
- [ ] Independent review before integration.

## Merge Contract

The Employment branch is mergeable only if it exports a stable Employment profile API and requires **no Care branch code**. It may merge before or after Care. Cross-domain integration happens in a third integration branch after both slices are individually green.
