# MapAble Sentinel Cross-Domain Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect Sentinel Core, Transport and Employment through participant-authorised mission dependency events without copying sensitive domain data or disclosing disability information to employers.

**Architecture:** Cross-domain integration is status propagation, not shared ownership. CareOS mission/Continuity dependencies remain canonical; Sentinel consumes minimal dependency references and produces recovery/attention state. Domain writes still go through existing services and the Governed Action Kernel.

**Tech Stack:** TypeScript, Vitest, existing CareOS mission/continuity services, Sentinel Core contracts.

**Spec:** `docs/superpowers/specs/2026-09-14-mapable-sentinel-runtime-transport-employment-design.md`

## Global Constraints

- Cross-domain propagation requires an existing mission or participant-authorised dependency.
- Propagate status/reason references, not Care/Transport/Employment payload copies.
- Employer-visible messages never include disability/NDIS/Care/Transport details unless explicitly approved.
- Unknown dependency state remains unknown.
- No automatic recovery selection or domain write.

---

### Task 1: Cross-domain dependency contract

**Files:**
- Create: `lib/ai/platform/sentinel/dependencies/contracts.ts`
- Test: `tests/ai-platform/sentinel/cross-domain/dependencies.test.ts`

**Interfaces:**

```ts
export const sentinelDependencySchema = z.object({
  missionRef: z.string().min(1),
  from: z.object({ domain: z.enum(["care", "transport", "employment"]), subjectRef: z.string().min(1) }),
  to: z.object({ domain: z.enum(["care", "transport", "employment"]), subjectRef: z.string().min(1) }),
  status: z.enum(["confirmed", "threatened", "failed", "unknown", "restored"]),
  reasonCodes: z.array(z.string()),
  participantAuthorised: z.literal(true),
});
```

- [ ] **Step 1: Write failing tests proving participant authorisation is required and payload fields such as diagnosis/address are rejected by strict schema.**
- [ ] **Step 2: Run RED.**
- [ ] **Step 3: Implement strict Zod schema with `.strict()` on nested and root objects.**
- [ ] **Step 4: Run GREEN.**
- [ ] **Step 5: Commit.**

### Task 2: Interview mission dependency evaluator

**Files:**
- Create: `lib/ai/platform/sentinel/dependencies/interview-mission.ts`
- Test: `tests/ai-platform/sentinel/cross-domain/interview-mission.test.ts`

**Interfaces:**

```ts
export function evaluateInterviewMission(input: {
  employmentStatus: "confirmed" | "unknown";
  transportStatus: "confirmed" | "threatened" | "failed" | "unknown";
  careStatus?: "confirmed" | "threatened" | "failed" | "unknown";
}): {
  state: "OBSERVING" | "PAUSED" | "RECOVERY_PROPOSED" | "VERIFICATION_REQUIRED";
  reasonCodes: string[];
  suggestedOptions: Array<"transport_recovery" | "participant_arranged_transport" | "request_reschedule" | "request_remote_interview" | "request_human">;
};
```

- [ ] **Step 1: Write failing tests for transport failure, unknown transport and optional Care failure.**
- [ ] **Step 2: Run RED.**
- [ ] **Step 3: Implement deterministic evaluator. Transport failure proposes options but does not select one. Unknown produces verification-required rather than assumed failure/success.**
- [ ] **Step 4: Run GREEN.**
- [ ] **Step 5: Commit.**

### Task 3: Employer-safe reschedule message builder

**Files:**
- Create: `lib/ai/platform/sentinel/dependencies/employer-safe-message.ts`
- Test: `tests/ai-platform/sentinel/cross-domain/employer-safe-message.test.ts`

**Interfaces:**

```ts
export function buildEmployerSafeInterviewRequest(input: {
  kind: "reschedule" | "remote_interview";
  participantApprovedDisclosure?: string;
}): { subject: string; body: string };
```

- [ ] **Step 1: Write tests proving default copy says only “unexpected transport issue”/access need as appropriate and never inserts disability, NDIS, Care or worker details.**
- [ ] **Step 2: Write a separate test proving optional participant-approved disclosure is included verbatim only when supplied.**
- [ ] **Step 3: Run RED.**
- [ ] **Step 4: Implement deterministic message builder.**
- [ ] **Step 5: Run GREEN and commit.**

### Task 4: Sentinel integration exports and end-to-end contract test

**Files:**
- Modify: `lib/ai/platform/sentinel/index.ts`
- Test: `tests/ai-platform/sentinel/cross-domain/interview-flow.test.ts`

**Scenario:**

1. Participant-authorised interview mission exists.
2. Transport dependency moves to failed.
3. Mission evaluator produces `RECOVERY_PROPOSED` and multiple options.
4. No option is selected automatically.
5. Employer-safe reschedule payload contains no disability data.
6. Sentinel state machine requires participant/human confirmation before `APPROVED_ACTION_PENDING`.

- [ ] **Step 1: Write failing end-to-end pure contract test using Sentinel Core + dependency evaluators.**
- [ ] **Step 2: Run RED.**
- [ ] **Step 3: Add only necessary public exports/integration helpers.**
- [ ] **Step 4: Run focused and full Sentinel tests.**

```bash
pnpm test:sentinel
pnpm type-check
pnpm lint:lib
```

- [ ] **Step 5: Commit.**

## Plan Self-Review

This plan deliberately stops at participant-authorised proposals/messages. It does not send employer messages, book transport, alter Care, or start production Temporal workflows automatically. Those remain governed execution steps for later controlled-pilot work.
