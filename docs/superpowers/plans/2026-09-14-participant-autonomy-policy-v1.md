# Participant Autonomy Policy v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one deterministic participant-governed AI autonomy policy that defaults to `PREPARE_THEN_CONFIRM`, supports guarded preparation and narrowly scoped standing authority, and fails closed on material change.

**Architecture:** Extend the existing `@mapable/contracts` vocabulary and `@mapable/intelligence-kernel` decision path. Participant preferences remain separate from consent and execution authority; Guardian / Full Life / AURA / legal constraints may only narrow authority; the Governed Action Kernel remains the execution boundary.

**Tech Stack:** TypeScript, Zod 4, Vitest 3, pnpm workspace, Next.js monorepo.

**Spec:** `docs/superpowers/specs/2026-09-14-participant-autonomy-policy-v1-design.md`

## Global Constraints

- Default posture is exactly `PREPARE_THEN_CONFIRM`.
- Guarded preparation requires participant confirmation before preparation proceeds.
- Selective standing authority is action-specific, participant-authored, time-limited, and re-checked at execution time.
- Material changes invalidate standing authority; bounded numeric changes remain valid only within participant-approved tolerances.
- Sensitive disclosure, crisis/emergency contact initiated solely by AI judgement, capacity, restrictive practice, clinical treatment, abuse substantiation/reportability, NDIS eligibility/funding, consequential employment selection/rejection, and participant override cannot receive standing AI authority.
- `PREFERENCE != CONSENT != AUTHORITY != APPROVAL != EXECUTION`.
- No database migration, UI, production flag activation, live external call, or production promotion in v1.

---

### Task 1: Lock the policy behavior with failing tests

**Files:**
- Create: `tests/intelligence/participant-autonomy-policy.test.ts`

**Interfaces:**
- Consumes: existing `decideProposedAction()` and `AuthorityGrant` / `ProposedAction` contracts.
- Produces: executable RED requirements for guarded preparation, selective standing authority, expiry, identity/purpose/data-scope changes, bounded amount/schedule tolerances, explicit stop, and monotonic narrowing.

- [ ] **Step 1: Write a failing test for guarded preparation**

Create an otherwise-authorised reversible action classified through `authority.constraints.autonomyPolicy` as `GUARDED`, with `confirmationRequired: false`, and assert the decision is `REQUIRE_PARTICIPANT_CONFIRMATION` rather than `ALLOW_DRAFT`.

- [ ] **Step 2: Write failing standing-authority tests**

Cover exact action/purpose binding, expiry, changed provider/worker/recipient, changed data scope, and prohibited standing-authority categories.

- [ ] **Step 3: Write failing bounded-tolerance tests**

Cover an amount within `maxAmountMinorUnits`, an amount above the cap, a schedule shift within `maxScheduleShiftMinutes`, and a shift above the cap.

- [ ] **Step 4: Write a monotonicity regression test**

Construct a permissive valid standing-authority state and progressively tighten one constraint at a time; assert no tightened state produces a more permissive policy decision than its predecessor.

- [ ] **Step 5: Run RED verification**

Run in GitHub CI because the execution sandbox cannot resolve `github.com` for a local clone:

```bash
pnpm exec vitest run tests/intelligence/participant-autonomy-policy.test.ts
```

Expected: at least the guarded-preparation assertion fails because current `decideProposedAction()` returns `ALLOW_DRAFT` when `confirmationRequired` is false and ignores structured autonomy constraints.

- [ ] **Step 6: Commit RED only**

```bash
git add tests/intelligence/participant-autonomy-policy.test.ts
git commit -m "test(ai): define participant autonomy policy behavior"
```

### Task 2: Add typed autonomy policy contracts

**Files:**
- Create: `packages/contracts/src/autonomy-policy.ts`
- Modify: `packages/contracts/src/public.ts`
- Test: `tests/intelligence/participant-autonomy-policy.test.ts`

**Interfaces:**
- Produces: `participantAutonomyPolicyConstraintV1Schema`, preparation classes, prohibited standing-authority classes, standing-authority envelope schema, and inferred TypeScript types.

- [ ] **Step 1: Add a failing contract-validation case**

Assert unknown policy versions, negative tolerances, invalid currencies, missing expiry, and blanket wildcard actions are rejected.

- [ ] **Step 2: Run targeted test and observe RED**

```bash
pnpm exec vitest run tests/intelligence/participant-autonomy-policy.test.ts
```

- [ ] **Step 3: Implement the minimum Zod schemas**

Use strict objects, finite enums, non-negative integer limits, finite expiry timestamps, and exact action / purpose strings. Do not add persistence.

- [ ] **Step 4: Export the contract through `packages/contracts/src/public.ts`**

- [ ] **Step 5: Run targeted test and type-check**

```bash
pnpm exec vitest run tests/intelligence/participant-autonomy-policy.test.ts
pnpm type-check
```

- [ ] **Step 6: Commit**

```bash
git add packages/contracts/src/autonomy-policy.ts packages/contracts/src/public.ts tests/intelligence/participant-autonomy-policy.test.ts
git commit -m "feat(ai): add typed participant autonomy policy contracts"
```

### Task 3: Implement deterministic effective-autonomy resolution

**Files:**
- Create: `packages/intelligence-kernel/src/autonomy-policy.ts`
- Modify: `packages/intelligence-kernel/src/index.ts`
- Test: `tests/intelligence/participant-autonomy-policy.test.ts`

**Interfaces:**
- Produces: `evaluateAutonomyPolicyConstraint()` and a normalized outcome consumed by `decideProposedAction()`.

- [ ] **Step 1: Add a failing test for material-change invalidation reason codes**

Require distinct reason codes for expiry, identity change, purpose change, data-scope change, amount tolerance breach, schedule tolerance breach, prohibited standing authority, participant stop/refusal, and guarded preparation.

- [ ] **Step 2: Run RED**

```bash
pnpm exec vitest run tests/intelligence/participant-autonomy-policy.test.ts
```

- [ ] **Step 3: Implement pure deterministic evaluator**

Return only a bounded disposition such as `ALLOW_DRAFT`, `REQUIRE_PARTICIPANT_CONFIRMATION`, `REQUIRE_HUMAN_REVIEW`, or `DENY_PROHIBITED`; never execute a side effect.

- [ ] **Step 4: Integrate into `decideProposedAction()` before the existing final allow/draft branch**

The autonomy evaluator may only keep or reduce the permissiveness of the existing decision path. It must never turn an existing denial/review state into an allow state.

- [ ] **Step 5: Run targeted regression set**

```bash
pnpm exec vitest run \
  tests/intelligence/participant-autonomy-policy.test.ts \
  tests/intelligence/evaluation-harness.test.ts
pnpm type-check
```

- [ ] **Step 6: Commit**

```bash
git add packages/intelligence-kernel/src/autonomy-policy.ts packages/intelligence-kernel/src/index.ts tests/intelligence/participant-autonomy-policy.test.ts
git commit -m "feat(ai): enforce participant autonomy policy in intelligence kernel"
```

### Task 4: Convergence and assurance adapters

**Files:**
- Modify only if needed after sibling-branch review: `docs/superpowers/specs/2026-09-14-participant-autonomy-policy-v1-design.md`
- Test: `tests/intelligence/participant-autonomy-policy.test.ts`

**Interfaces:**
- Consumes: PR #593 Sentinel, PR #596 Full Life, PR #528 Agency Memory, Companion consent/share stack.
- Produces: documented adapter rules; no hidden runtime dependency on unmerged sibling PRs.

- [ ] **Step 1: Verify no duplicated authority store or consent store is introduced**
- [ ] **Step 2: Verify Full Life / AURA / Guardian outputs can only narrow the action set**
- [ ] **Step 3: Verify Sentinel remains a consumer of the resolved decision rather than a grant issuer**
- [ ] **Step 4: Verify disclosure still requires canonical purpose-bound consent independent of autonomy posture**
- [ ] **Step 5: Commit documentation-only clarifications if required**

### Task 5: Final verification and draft PR evidence

**Files:**
- No required production files.

- [ ] **Step 1: Run targeted tests**

```bash
pnpm exec vitest run \
  tests/intelligence/participant-autonomy-policy.test.ts \
  tests/intelligence/evaluation-harness.test.ts
```

- [ ] **Step 2: Run platform regressions**

```bash
pnpm test:ai-platform
pnpm type-check
pnpm check:package-boundaries
```

- [ ] **Step 3: Inspect GitHub Actions and Vercel preview evidence**

Separate branch-specific failures from inherited failures on the stacked base.

- [ ] **Step 4: Keep PR draft**

Do not mark ready, merge, enable production flags, or promote a deployment. Record the dependency on PR #597 and any sibling convergence notes.
