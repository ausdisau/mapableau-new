# Goal-to-Services Mobile Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a participant-controlled goal-to-services journey to the existing MapAble Independence app without creating a second AI, consent, or service-orchestration stack.

**Architecture:** Start with a pure deterministic Goal Plan contract and resolver that converts explicit goal language into transparent service candidates. Then add an accessible native Ask MapAble screen that renders the draft, lets the participant include or reject each suggestion, and later hands confirmed context to the existing MapAble Ask/API architecture rather than executing services itself.

**Tech Stack:** Expo SDK 57, React Native 0.86, React Navigation 7, TypeScript, Vitest at repository root.

**Spec:** `docs/architecture/ask-mapable-convergence.md`

## Global Constraints

- The participant remains the decision-maker; suggestions are proposals, never approvals or bookings.
- Never infer incapacity, lower autonomy, or a need for care from disability, diagnosis, communication method, dependency, or support needs alone.
- Care is suggested only from explicit support/care intent and is never pre-selected.
- No disability, health, location, employer, delegate, or support information is shared by default.
- Hard accessibility and communication requirements are never silently relaxed.
- Provide a non-AI/direct-browse path.
- Irreversible actions, sensitive disclosure, funding decisions, safety-critical matching, and credential exceptions require deterministic policy checks and human/participant confirmation outside the model.
- UI targets WCAG 2.2 AA principles, minimum 44x44 logical-pixel touch targets, screen-reader labels, clear focus/order, and plain-language status.
- Reuse the existing MapAble platform API and Ask MapAble architecture; do not create a second chatbot API or a second consent system.
- This slice is draft-only and must not claim production readiness.

---

### Task 1: Goal Plan contract and deterministic service resolver

**Files:**
- Create: `apps/independence/src/goal-services/goalPlan.ts`
- Create: `tests/independence-goal-services.test.ts`

**Interfaces:**
- Produces: `buildGoalPlanDraft(goal: string): GoalPlanDraft`
- Produces: `GoalPlanDraft`, `GoalServiceCandidate`, and `GoalServiceModule` types.
- Consumers: Task 2 native UI and later server/API handoff.

- [ ] **Step 1: Write failing tests** covering employment + transport inference, explicit access intent, diagnosis-only text not inferring Care, explicit care intent producing an ask-first Care candidate, zero default disclosure, and empty/ambiguous goals requesting clarification.
- [ ] **Step 2: Run the tests and verify they fail because the goal-plan module does not yet exist.**
- [ ] **Step 3: Implement the smallest deterministic resolver that makes those tests pass.**
- [ ] **Step 4: Re-run the focused tests and verify they pass.**
- [ ] **Step 5: Commit Task 1 and pause for Jonathan's wording/interaction preference before Task 2, because the user explicitly requested feedback checkpoints during implementation.**

### Task 2: Native Ask MapAble goal composer and editable Goal Plan

**Files:**
- Create: `apps/independence/src/goal-services/GoalPlannerScreen.tsx`
- Create: `apps/independence/src/goal-services/goalPlannerStyles.ts`
- Modify: `apps/independence/App.tsx`

**Interfaces:**
- Consumes: `buildGoalPlanDraft`, `GoalPlanDraft`.
- Produces: native goal entry, transparent candidate cards, participant include/not-needed decisions, direct-browse alternative, and a draft-only confirmation state.

- [ ] **Step 1: Add testable pure state transitions for include/reject/edit before wiring UI state.**
- [ ] **Step 2: Implement the Ask MapAble screen with a large goal input, example prompts, suggestion rationale, uncertainty copy, and candidate controls.**
- [ ] **Step 3: Ensure every candidate starts undecided and Care is visually marked as requiring explicit choice.**
- [ ] **Step 4: Add screen-reader labels/live status, large targets, keyboard-safe layout, and non-AI/direct-browse action.**
- [ ] **Step 5: Wire the screen into the existing Independence navigation without removing Today/Home/More functionality.**
- [ ] **Step 6: Type-check the Independence app and run focused tests.**
- [ ] **Step 7: Pause for Jonathan's visual-density, naming, and navigation feedback before API wiring.**

### Task 3: Existing Ask MapAble/API handoff, guarded and draft-only

**Files:**
- Create or modify only after inspecting the current Ask MapAble route/contracts at implementation time.
- Modify the Independence runtime adapter rather than adding a new mobile-only backend.

**Interfaces:**
- Consumes: participant-confirmed Goal Plan context only.
- Produces: bounded request to the existing MapAble Ask/API architecture and a visible, auditable response state.

- [ ] **Step 1: Re-inspect `/api/mapable/ask`, current identity/consent contracts, feature flags, and audit events before writing code.**
- [ ] **Step 2: Write failing contract tests for the handoff.**
- [ ] **Step 3: Add the minimum runtime adapter needed to send confirmed draft context.**
- [ ] **Step 4: Keep booking, payment, sensitive disclosure, and agreement execution outside the model path.**
- [ ] **Step 5: Add failure/timeout/non-AI fallback states and visible uncertainty.**
- [ ] **Step 6: Verify tests, type checks, accessibility checks available to the repository, and review the whole branch before any merge-readiness claim.**
