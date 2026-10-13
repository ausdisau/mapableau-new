# MapAble Employment Sentinel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add participant-controlled Employment Sentinel supervision for disclosure, interview adjustments and commute dependencies without introducing employability scoring or automated employer decisions.

**Architecture:** Employment Sentinel reuses existing Jobs participation services, disclosure preview, fairness boundaries and audit. It adds deterministic scoped-disclosure checks and shadow supervision around existing application flows; canonical Jobs services remain the system of record.

**Tech Stack:** TypeScript, Vitest, existing Prisma Jobs services, Sentinel Core contracts.

**Spec:** `docs/superpowers/specs/2026-09-14-mapable-sentinel-runtime-transport-employment-design.md`

## Global Constraints

- No employability score, productivity ranking, automatic rejection or disability inference.
- Employer-visible information is participant-controlled and scoped by employer/application/stage/fields/purpose.
- Sentinel never infers consent from preferences.
- Existing Jobs application and disclosure services remain canonical.
- `MAPABLE_SENTINEL_EMPLOYMENT_GATING_ENABLED=false` by default.

---

### Task 1: Scoped employment disclosure contract

**Files:**
- Create: `lib/ai/platform/sentinel/employment/disclosure-policy.ts`
- Test: `tests/ai-platform/sentinel/employment/disclosure-policy.test.ts`

**Interfaces:**

```ts
export type EmploymentDisclosureScope = {
  participantId: string;
  employerOrganisationId: string;
  applicationId: string;
  stage: "application" | "interview" | "offer" | "onboarding";
  fields: string[];
  purpose: string;
  expiresAt?: string;
};

export function evaluateEmploymentDisclosure(input: {
  requestedFields: string[];
  scope?: EmploymentDisclosureScope;
  now?: Date;
}): {
  outcome: "ALLOW" | "PARTICIPANT_CONFIRMATION" | "DENY";
  allowedFields: string[];
  blockedFields: string[];
  reasonCodes: string[];
};
```

- [ ] **Step 1: Write failing tests proving unscoped disability/adjustment fields are denied, expired scope is denied, and exact approved fields are allowed.**
- [ ] **Step 2: Run RED.**
- [ ] **Step 3: Implement exact-field scope matching; do not infer broader permission from one approved field.**
- [ ] **Step 4: Run GREEN.**
- [ ] **Step 5: Commit.**

### Task 2: Prohibited employment output detector

**Files:**
- Create: `lib/ai/platform/sentinel/employment/prohibited-output.ts`
- Test: `tests/ai-platform/sentinel/employment/prohibited-output.test.ts`

**Interfaces:**

```ts
export type EmploymentProhibitedOutput =
  | "employability_score"
  | "productivity_ranking"
  | "automatic_rejection"
  | "disability_inference"
  | "support_cost_desirability"
  | "predicted_complaint_risk";

export function classifyProhibitedEmploymentOutput(
  keys: string[],
): EmploymentProhibitedOutput[];
```

- [ ] **Step 1: Write failing tests showing prohibited machine-output keys are detected while neutral match-explanation fields are not.**
- [ ] **Step 2: Run RED.**
- [ ] **Step 3: Implement a deterministic allow/deny key classifier and map it to Sentinel `SECURITY_QUARANTINE`/`DENY` reason codes in a small helper.**
- [ ] **Step 4: Run GREEN.**
- [ ] **Step 5: Commit.**

### Task 3: Disclosure-preview shadow supervision

**Files:**
- Create: `lib/ai/platform/sentinel/employment/shadow.ts`
- Modify: `lib/jobs/disclosure/disclosure-preview-service.ts`
- Test: `tests/ai-platform/sentinel/employment/disclosure-shadow.test.ts`

**Behaviour:**

- Sentinel disabled: existing disclosure preview behaviour unchanged.
- Sentinel enabled, Employment gating false: evaluate employer-visible fields in shadow mode and audit would-block/would-confirm results without modifying preview data.
- Existing confirmed preview remains required by `submitParticipantApplication`.
- Sentinel does not insert employer-visible disability fields on its own.

- [ ] **Step 1: Write dependency-injected failing shadow tests.**
- [ ] **Step 2: Run RED.**
- [ ] **Step 3: Implement `observeEmploymentDisclosure()` and call it after employer-visible preview construction, before persistence.**
- [ ] **Step 4: Run focused Sentinel Employment and existing Jobs disclosure tests.**

```bash
pnpm vitest run tests/ai-platform/sentinel/employment
pnpm vitest run tests/jobs/disclosure.test.ts tests/jobs/applications.test.ts tests/jobs/fairness.test.ts
```

- [ ] **Step 5: Commit.**

### Task 4: Interview-adjustment stage contract

**Files:**
- Create: `lib/ai/platform/sentinel/employment/interview-adjustment.ts`
- Test: `tests/ai-platform/sentinel/employment/interview-adjustment.test.ts`

**Interfaces:**

```ts
export function buildInterviewAdjustmentDisclosure(input: {
  applicationId: string;
  participantId: string;
  employerOrganisationId: string;
  details: string;
  approvedForSharing: boolean;
}): {
  state: "PARTICIPANT_CONFIRMATION_REQUIRED" | "APPROVED_ACTION_PENDING";
  employerPayload?: { adjustmentRequest: string };
  reasonCodes: string[];
};
```

- [ ] **Step 1: Write tests proving details are absent before approval and present only after explicit sharing approval.**
- [ ] **Step 2: Run RED.**
- [ ] **Step 3: Implement pure builder; no employer API call is introduced.**
- [ ] **Step 4: Run GREEN.**
- [ ] **Step 5: Commit.**

## Plan Self-Review

The plan covers the approved Employment v1 vertical slice: disclosure, adjustment and forbidden scoring. Commute dependency propagation is implemented in the cross-domain plan so it does not leak Transport implementation concerns into Jobs services.
