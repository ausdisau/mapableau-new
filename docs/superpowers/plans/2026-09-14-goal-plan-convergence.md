# Goal Plan Convergence Implementation Plan

> **Execution:** Implement task-by-task with TDD. Do not merge or enable production flags from this plan. The approved design is the binding specification.

**Goal:** Converge Ask MapAble, Navigator, CareOS, and the Independence Expo app on one participant-controlled `Goal -> Goal Plan -> Mission -> Actions` semantic model, with C3 adaptive conversation and no duplicate consent, AI, mission, or domain execution stack.

**Architecture:** Put Goal Plan semantics in the existing platform-neutral `@mapable/contracts` package. Keep deterministic interpretation and C3 policy shared. Add pure adapters into Navigator and CareOS rather than new writers. Attach an optional Goal Plan draft to the existing `POST /api/mapable/ask` response path. Render that same draft in web Ask MapAble and the native Independence app. Because the Expo apps intentionally install outside the root pnpm workspace, Independence consumes `@mapable/contracts` through a local file dependency rather than being pulled into the workspace in this slice.

**Tech Stack:** TypeScript, Zod 4, Vitest 3, Next.js 15, React 18 web, Expo SDK 57, React Native 0.86, React 19 native, React Navigation 7, existing Prisma/CareOS services.

**Spec:** `docs/superpowers/specs/2026-09-14-goal-plan-convergence-design.md`

**Supersedes:** `docs/superpowers/plans/2026-09-14-goal-to-services-mobile-slice.md`

## Global Constraints

- Canonical terminology is **Goal -> Goal Plan -> Mission -> Actions**.
- Ask MapAble is the single participant-facing conversational manager. Navigator is a governed capability behind it; CareOS is coordination; existing domain services remain execution authorities.
- Candidate decisions are exactly `undecided | yes | no | not_sure`; all candidates begin `undecided`.
- C3 asks sensitive, high-impact, low-confidence, materially ambiguous, Care/personal-support, disclosure, hard-constraint, policy-gated, or explicitly step-by-step choices conversationally. Ordinary reversible candidates may sit in the Goal Plan as `undecided` without interrupting the person.
- Never infer Care, incapacity, reduced autonomy, lower capability, or treatment entitlement from diagnosis, disability identity, communication method, wheelchair use, dependency, or support needs alone.
- No disclosure permission is created by implication. `not_sure` is not consent.
- Hard accessibility and communication requirements are never silently relaxed. Generic non-negotiables that do not map to Navigator typed keys remain visible as unmapped constraints instead of being discarded.
- Goal Plan is not a consent ledger, booking object, funding approval, service agreement, or domain source of truth.
- No autonomous booking, payment, binding agreement, sensitive disclosure, capacity determination, safeguarding adjudication, complaint/incident reportability decision, or funding entitlement decision.
- Keep direct-browse, correction, refusal, stop, and human-help paths available.
- Web and native presentation may differ, but semantics must come from the same contract.
- Do not create a second chatbot API. Continue using `POST /api/mapable/ask` for web conversational intelligence.
- Do not create a second CareOS mission schema or direct mobile domain writer.
- Navigator pilot flags and all other fail-closed production flags remain unchanged.
- WCAG 2.2 AA-equivalent target: >=44x44 targets, keyboard/focus support on web, screen-reader labels, dynamic text on native, typed input always available, voice optional and never auto-sending, AAC-friendly no-time-pressure interaction, and no colour-only critical state.
- Evidence before claims: no production-ready, verified-live, NDIS-compliant, or accessibility-accepted claim without fresh evidence.

---

## Task 1: Replace the mobile prototype with the shared Goal Plan contract and C3 resolver

**Files**
- Create: `packages/contracts/src/goal-plan.ts`
- Create: `packages/contracts/src/goal-plan-resolver.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `tests/independence-goal-services.test.ts`
- Create: `tests/goal-plan-c3.test.ts`
- Delete after green: `apps/independence/src/goal-services/goalPlan.ts`

**Public interface**
- `buildGoalPlanDraft(goal, options?)`
- `setGoalPlanDecision(plan, module, decision)`
- `nextConversationalCandidate(plan)`
- `shouldAskConversationally(candidate)`
- `confirmGoalPlan(plan)`
- `STEP_BY_STEP_PREFERENCE`

### 1.1 Write failing shared-contract tests

Replace the prototype import in `tests/independence-goal-services.test.ts` with `@mapable/contracts` and preserve/expand the existing cases:

```ts
import { describe, expect, it } from "vitest";
import {
  buildGoalPlanDraft,
  setGoalPlanDecision,
} from "@mapable/contracts";

describe("Goal Plan shared contract", () => {
  it("suggests Jobs and Transport for explicit work-and-travel intent", () => {
    const draft = buildGoalPlanDraft(
      "I want to work three days a week at a library and stop depending on my parents to get there",
    );
    expect(draft.serviceCandidates.map((c) => c.module)).toEqual(
      expect.arrayContaining(["jobs", "transport"]),
    );
    expect(draft.serviceCandidates.every((c) => c.decision === "undecided")).toBe(true);
  });

  it("suggests Access for explicit accessibility intent", () => {
    const draft = buildGoalPlanDraft(
      "I want a cafe with step-free entry and an accessible toilet near work",
    );
    expect(draft.serviceCandidates.some((c) => c.module === "access")).toBe(true);
  });

  it("does not infer Care from diagnosis or disability language alone", () => {
    const draft = buildGoalPlanDraft(
      "I have cerebral palsy and use a wheelchair. I want a job at a library.",
    );
    expect(draft.serviceCandidates.some((c) => c.module === "care")).toBe(false);
  });

  it("creates Care only from explicit support intent", () => {
    const draft = buildGoalPlanDraft(
      "I want a support worker to help with my morning routine before work",
    );
    const care = draft.serviceCandidates.find((c) => c.module === "care");
    expect(care?.requiresExplicitChoice).toBe(true);
    expect(care?.sensitivity).toBe("sensitive");
  });

  it("never creates default disclosure permissions", () => {
    expect(buildGoalPlanDraft("I want a job and accessible transport").disclosurePermissions).toEqual([]);
  });

  it.each(["yes", "no", "not_sure"] as const)("preserves participant decision %s", (decision) => {
    const draft = buildGoalPlanDraft("I want a job");
    const updated = setGoalPlanDecision(draft, "jobs", decision);
    expect(updated.serviceCandidates.find((c) => c.module === "jobs")?.decision).toBe(decision);
  });

  it("asks for clarification for empty or unbounded goals", () => {
    expect(buildGoalPlanDraft("   ").needsClarification).toBe(true);
    expect(buildGoalPlanDraft("I want my life to feel better").needsClarification).toBe(true);
  });
});
```

Create `tests/goal-plan-c3.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  STEP_BY_STEP_PREFERENCE,
  buildGoalPlanDraft,
  nextConversationalCandidate,
  shouldAskConversationally,
  type GoalServiceCandidate,
} from "@mapable/contracts";

describe("C3 adaptive conversation", () => {
  it("does not interrupt for ordinary high-confidence candidates", () => {
    const plan = buildGoalPlanDraft("I want a part-time job and transport to work");
    expect(plan.serviceCandidates.every((c) => c.askConversationally === false)).toBe(true);
    expect(nextConversationalCandidate(plan)).toBeNull();
  });

  it("asks Care conversationally", () => {
    const plan = buildGoalPlanDraft("I want a support worker to help me get ready before work");
    expect(nextConversationalCandidate(plan)?.module).toBe("care");
  });

  it("asks when sensitive disclosure is proposed", () => {
    const candidate: GoalServiceCandidate = {
      module: "jobs",
      reasonSuggested: "Workplace adjustments may be relevant.",
      participantBenefit: "Discuss adjustments on your terms.",
      question: "Would you like to decide what can be shared?",
      decision: "undecided",
      confidence: "high",
      sensitivity: "ordinary",
      askConversationally: false,
      requiresExplicitChoice: false,
      requirements: [],
      nonNegotiables: [],
      uncertainties: [],
      dataRequired: [],
      proposedDisclosure: ["employer:accessibilityRequirements"],
    };
    expect(shouldAskConversationally(candidate)).toBe(true);
  });

  it("honours an explicit step-by-step preference", () => {
    const plan = buildGoalPlanDraft("I want a job and transport to work", { stepByStep: true });
    expect(plan.preferences).toContain(STEP_BY_STEP_PREFERENCE);
    expect(nextConversationalCandidate(plan)?.module).toBe("jobs");
  });
});
```

### 1.2 Verify RED

```bash
pnpm exec vitest run tests/independence-goal-services.test.ts tests/goal-plan-c3.test.ts
```

Expected: failure because `@mapable/contracts` does not export the Goal Plan interface yet.

### 1.3 Implement schemas and helpers

Create `packages/contracts/src/goal-plan.ts`:

```ts
import { z } from "zod";

export const goalServiceModuleSchema = z.enum(["access", "care", "transport", "jobs"]);
export const participantDecisionSchema = z.enum(["undecided", "yes", "no", "not_sure"]);
export const candidateSensitivitySchema = z.enum(["ordinary", "sensitive", "high_impact"]);
export const candidateConfidenceSchema = z.enum(["high", "medium", "low"]);

export const goalServiceCandidateSchema = z.object({
  module: goalServiceModuleSchema,
  reasonSuggested: z.string().min(1),
  participantBenefit: z.string().min(1),
  question: z.string().min(1),
  decision: participantDecisionSchema,
  confidence: candidateConfidenceSchema,
  sensitivity: candidateSensitivitySchema,
  askConversationally: z.boolean(),
  requiresExplicitChoice: z.boolean(),
  requirements: z.array(z.string()),
  nonNegotiables: z.array(z.string()),
  uncertainties: z.array(z.string()),
  dataRequired: z.array(z.string()),
  proposedDisclosure: z.array(z.string()),
}).strict();

export const goalPlanDraftSchema = z.object({
  goal: z.string(),
  participantConfirmed: z.boolean(),
  needsClarification: z.boolean(),
  clarificationPrompt: z.string().optional(),
  desiredOutcomes: z.array(z.string()),
  preferences: z.array(z.string()),
  nonNegotiables: z.array(z.string()),
  accessibilityRequirements: z.array(z.string()),
  communicationRequirements: z.array(z.string()),
  exclusions: z.array(z.string()),
  serviceCandidates: z.array(goalServiceCandidateSchema),
  disclosurePermissions: z.array(z.string()),
  uncertainties: z.array(z.string()),
  humanHelpRequested: z.boolean(),
  status: z.enum(["draft", "review", "confirmed"]),
}).strict();

export type GoalServiceModule = z.infer<typeof goalServiceModuleSchema>;
export type ParticipantDecision = z.infer<typeof participantDecisionSchema>;
export type GoalServiceCandidate = z.infer<typeof goalServiceCandidateSchema>;
export type GoalPlanDraft = z.infer<typeof goalPlanDraftSchema>;
```

Create `packages/contracts/src/goal-plan-resolver.ts`:

```ts
import {
  goalPlanDraftSchema,
  type GoalPlanDraft,
  type GoalServiceCandidate,
  type GoalServiceModule,
  type ParticipantDecision,
} from "./goal-plan";

export const STEP_BY_STEP_PREFERENCE = "decision_mode:step_by_step" as const;

export function shouldAskConversationally(candidate: GoalServiceCandidate): boolean {
  return (
    candidate.askConversationally ||
    candidate.requiresExplicitChoice ||
    candidate.sensitivity !== "ordinary" ||
    candidate.confidence === "low" ||
    candidate.uncertainties.length > 0 ||
    candidate.proposedDisclosure.length > 0
  );
}

export function setGoalPlanDecision(
  plan: GoalPlanDraft,
  module: GoalServiceModule,
  decision: ParticipantDecision,
): GoalPlanDraft {
  return goalPlanDraftSchema.parse({
    ...plan,
    serviceCandidates: plan.serviceCandidates.map((candidate) =>
      candidate.module === module ? { ...candidate, decision } : candidate,
    ),
    status: "review",
  });
}

export function nextConversationalCandidate(plan: GoalPlanDraft): GoalServiceCandidate | null {
  const stepByStep = plan.preferences.includes(STEP_BY_STEP_PREFERENCE);
  return plan.serviceCandidates.find(
    (candidate) =>
      candidate.decision === "undecided" &&
      (stepByStep || shouldAskConversationally(candidate)),
  ) ?? null;
}

export function confirmGoalPlan(plan: GoalPlanDraft): GoalPlanDraft {
  if (plan.needsClarification) throw new Error("GOAL_PLAN_NEEDS_CLARIFICATION");
  if (nextConversationalCandidate(plan)) throw new Error("GOAL_PLAN_EXPLICIT_CHOICE_REQUIRED");
  return goalPlanDraftSchema.parse({ ...plan, participantConfirmed: true, status: "confirmed" });
}
```

Implement `buildGoalPlanDraft(goal, options?: { stepByStep?: boolean })` by migrating the current Jobs/Access/Transport/Care regex definitions into shared code, with these invariants:
- Jobs / Access / Transport: `confidence: "high"`, `sensitivity: "ordinary"`, `requiresExplicitChoice: false`, `askConversationally: false`, `proposedDisclosure: []`.
- Care matches only explicit support intent such as `support worker`, `personal care`, `personal support`, `help getting ready`, `morning routine`, `daily living support`; it must not match diagnosis/disability terms alone.
- Care: `confidence: "high"`, `sensitivity: "sensitive"`, `requiresExplicitChoice: true`, `askConversationally: true`, and question copy containing `Would you like me to include Care in this Goal Plan?`.
- If `options.stepByStep === true`, add `STEP_BY_STEP_PREFERENCE` to `preferences`.
- Empty/unbounded goals: `needsClarification: true`, no service candidates.
- Draft defaults: `participantConfirmed: false`, `status: "draft"`, `disclosurePermissions: []`, `humanHelpRequested: false`.

Export both files from `packages/contracts/src/index.ts`:

```ts
export * from "./goal-plan";
export * from "./goal-plan-resolver";
```

### 1.4 Verify GREEN and remove the duplicate prototype

```bash
pnpm exec vitest run tests/independence-goal-services.test.ts tests/goal-plan-c3.test.ts
pnpm check:package-boundaries
pnpm type-check
```

Delete `apps/independence/src/goal-services/goalPlan.ts` only after the shared tests pass, then re-run the focused tests.

### 1.5 Commit

```bash
git add packages/contracts/src/goal-plan.ts packages/contracts/src/goal-plan-resolver.ts packages/contracts/src/index.ts tests/independence-goal-services.test.ts tests/goal-plan-c3.test.ts apps/independence/src/goal-services/goalPlan.ts
git commit -m "feat(goal-plan): add shared participant contract and C3 policy"
```

---

## Task 2: Add pure Navigator and CareOS projections without new writers

**Files**
- Create: `lib/goal-plan/navigator-adapter.ts`
- Create: `lib/goal-plan/careos-adapter.ts`
- Create: `tests/goal-plan-navigator-adapter.test.ts`
- Create: `tests/goal-plan-careos-adapter.test.ts`

### 2.1 Write failing Navigator tests

```ts
import { describe, expect, it } from "vitest";
import { buildGoalPlanDraft, setGoalPlanDecision } from "@mapable/contracts";
import { projectGoalPlanToNavigator } from "@/lib/goal-plan/navigator-adapter";

describe("Goal Plan -> Navigator", () => {
  it("preserves hard constraints and unmapped non-negotiables", () => {
    const plan = {
      ...buildGoalPlanDraft("I want accessible transport to work"),
      accessibilityRequirements: ["step-free boarding"],
      communicationRequirements: ["extra processing time"],
      exclusions: ["provider-x"],
      nonNegotiables: ["Do not phone me without asking first"],
    };
    const projected = projectGoalPlanToNavigator(plan);
    expect(projected.hardConstraints.accessibilityRequirements).toEqual(["step-free boarding"]);
    expect(projected.hardConstraints.communicationRequirements).toEqual(["extra processing time"]);
    expect(projected.hardConstraints.exclusions).toEqual(["provider-x"]);
    expect(projected.unmappedNonNegotiables).toEqual(["Do not phone me without asking first"]);
  });

  it("only selects yes-decisions", () => {
    let plan = buildGoalPlanDraft("I want a job and transport to work");
    plan = setGoalPlanDecision(plan, "jobs", "yes");
    plan = setGoalPlanDecision(plan, "transport", "not_sure");
    expect(projectGoalPlanToNavigator(plan).selectedModules).toEqual(["jobs"]);
  });
});
```

### 2.2 Implement the Navigator projection

```ts
import type { GoalPlanDraft, GoalServiceModule } from "@mapable/contracts";
import type { HardConstraintKey, HardConstraintsInput } from "@/lib/ai/navigator/matching/types";

export type GoalPlanNavigatorProjection = {
  selectedModules: GoalServiceModule[];
  hardConstraints: HardConstraintsInput;
  unmappedNonNegotiables: string[];
};

export function projectGoalPlanToNavigator(plan: GoalPlanDraft): GoalPlanNavigatorProjection {
  const nonNegotiableKeys: HardConstraintKey[] = [];
  if (plan.exclusions.length) nonNegotiableKeys.push("exclusions");
  if (plan.accessibilityRequirements.length) nonNegotiableKeys.push("accessibilityRequirements");
  if (plan.communicationRequirements.length) nonNegotiableKeys.push("communicationRequirements");

  return {
    selectedModules: plan.serviceCandidates.filter((c) => c.decision === "yes").map((c) => c.module),
    hardConstraints: {
      requiredServices: [],
      exclusions: [...plan.exclusions],
      communicationRequirements: [...plan.communicationRequirements],
      accessibilityRequirements: [...plan.accessibilityRequirements],
      credentialRequirements: [],
      nonNegotiableKeys,
    },
    unmappedNonNegotiables: [...plan.nonNegotiables],
  };
}
```

Do not put module names into Navigator `requiredServices`; service taxonomy mapping is domain-specific and must not be guessed.

### 2.3 Write failing CareOS tests

```ts
import { describe, expect, it } from "vitest";
import { buildGoalPlanDraft, confirmGoalPlan, setGoalPlanDecision } from "@mapable/contracts";
import { toCareOSMissionCreate } from "@/lib/goal-plan/careos-adapter";

describe("Goal Plan -> CareOS Mission", () => {
  it("refuses an unconfirmed Goal Plan", () => {
    const plan = buildGoalPlanDraft("I want a job and transport to work");
    expect(() => toCareOSMissionCreate({ participantId: "p1", requestId: "r1", plan }))
      .toThrow("GOAL_PLAN_NOT_CONFIRMED");
  });

  it("projects only yes-decisions into mission modules", () => {
    let plan = buildGoalPlanDraft("I want a job and transport to work");
    plan = setGoalPlanDecision(plan, "jobs", "yes");
    plan = setGoalPlanDecision(plan, "transport", "no");
    plan = confirmGoalPlan(plan);
    const mission = toCareOSMissionCreate({ participantId: "p1", requestId: "r1", plan });
    expect(mission.desiredOutcome).toBe(plan.goal);
    expect(mission.modulesJson).toEqual(["jobs"]);
    expect(mission.status).toBe("proposed");
  });
});
```

### 2.4 Implement projection-only CareOS adapter

```ts
import type { Prisma } from "@prisma/client";
import type { GoalPlanDraft } from "@mapable/contracts";
import type { CanonicalMissionCreate } from "@/lib/careos/canonical-mission-service";

const json = (value: unknown) => value as Prisma.InputJsonValue;

export function toCareOSMissionCreate(input: {
  participantId: string;
  requestId: string;
  tenantId?: string;
  authorityDecisionId?: string;
  plan: GoalPlanDraft;
}): CanonicalMissionCreate {
  if (!input.plan.participantConfirmed || input.plan.status !== "confirmed") {
    throw new Error("GOAL_PLAN_NOT_CONFIRMED");
  }

  const selectedModules = input.plan.serviceCandidates
    .filter((candidate) => candidate.decision === "yes")
    .map((candidate) => candidate.module);

  return {
    participantId: input.participantId,
    requestId: input.requestId,
    missionType: "goal_plan",
    desiredOutcome: input.plan.goal,
    status: "proposed",
    tenantId: input.tenantId,
    authorityDecisionId: input.authorityDecisionId,
    modulesJson: json(selectedModules),
    inputSummary: json({
      source: "goal_plan",
      participantConfirmed: true,
      unresolvedCandidates: input.plan.serviceCandidates
        .filter((candidate) => candidate.decision === "undecided" || candidate.decision === "not_sure")
        .map((candidate) => ({ module: candidate.module, decision: candidate.decision })),
      nonNegotiables: input.plan.nonNegotiables,
      accessibilityRequirements: input.plan.accessibilityRequirements,
      communicationRequirements: input.plan.communicationRequirements,
    }),
    proposalsJson: json(input.plan.serviceCandidates),
  };
}
```

This file must not call `createCanonicalMission()`; it only prepares a typed proposal for a later authority/policy-gated caller.

### 2.5 Verify and commit

```bash
pnpm exec vitest run tests/goal-plan-navigator-adapter.test.ts tests/goal-plan-careos-adapter.test.ts
pnpm type-check

git add lib/goal-plan tests/goal-plan-navigator-adapter.test.ts tests/goal-plan-careos-adapter.test.ts
git commit -m "feat(goal-plan): add Navigator and CareOS projections"
```

---

## Task 3: Attach Goal Plan drafts to the existing Ask MapAble response path

**Files**
- Create: `lib/ask-mapable/goal-plan.ts`
- Modify: `lib/ask-mapable/index.ts`
- Modify: `lib/copilot/types.ts`
- Modify: `app/api/mapable/ask/route.ts`
- Create: `tests/ask-goal-plan.test.ts`

### 3.1 Write failing enrichment tests

```ts
import { describe, expect, it } from "vitest";
import { maybeBuildGoalPlanForAsk } from "@/lib/ask-mapable/goal-plan";

describe("Ask MapAble Goal Plan enrichment", () => {
  it("creates a bounded work-and-transport draft", () => {
    const plan = maybeBuildGoalPlanForAsk({
      query: "I want a part-time job at a library and to get there independently",
      intent: "combined",
    });
    expect(plan?.serviceCandidates.map((c) => c.module)).toEqual(
      expect.arrayContaining(["jobs", "transport"]),
    );
  });

  it("honours explicit one-at-a-time wording", () => {
    const plan = maybeBuildGoalPlanForAsk({
      query: "Help me plan work and transport, but ask me one at a time",
      intent: "combined",
    });
    expect(plan?.preferences).toContain("decision_mode:step_by_step");
  });

  it.each(["incident", "billing", "health", "provider_finder", "ndis"] as const)(
    "does not attach Goal Plan semantics to %s",
    (intent) => expect(maybeBuildGoalPlanForAsk({ query: "help me", intent })).toBeNull(),
  );
});
```

### 3.2 Implement bounded Ask enrichment

```ts
import { buildGoalPlanDraft, type GoalPlanDraft } from "@mapable/contracts";
import type { CopilotIntentType } from "@/lib/copilot/types";

const ELIGIBLE_INTENTS = new Set<CopilotIntentType>([
  "support", "transport", "combined", "jobs", "places", "unknown",
]);
const STEP_BY_STEP = /\b(one at a time|step[- ]?by[- ]?step|ask me each)\b/i;

export function maybeBuildGoalPlanForAsk(input: {
  query: string;
  intent: CopilotIntentType;
}): GoalPlanDraft | null {
  if (!ELIGIBLE_INTENTS.has(input.intent)) return null;
  const plan = buildGoalPlanDraft(input.query, { stepByStep: STEP_BY_STEP.test(input.query) });
  return plan.needsClarification && plan.serviceCandidates.length === 0 ? null : plan;
}
```

Export it from `lib/ask-mapable/index.ts`.

Extend `CopilotAskResponse` in `lib/copilot/types.ts`:

```ts
import type { GoalPlanDraft } from "@mapable/contracts";
// existing fields...
goalPlan?: GoalPlanDraft;
```

### 3.3 Integrate only on the normal guarded Ask path

In `app/api/mapable/ask/route.ts`, attach `goalPlan` after intent classification/planning/guardrails on the normal signed-in response. Do not change existing early returns for crisis/safety, explicit human help, booking-agent lookup, `care_transport_map`, or anonymous `provider_finder`.

```ts
const goalPlan = maybeBuildGoalPlanForAsk({ query, intent: intent.type });
const response: CopilotAskResponse = {
  // existing response fields
  ...(goalPlan ? { goalPlan } : {}),
};
```

Do not write Goal Plan state to Prisma.

### 3.4 Verify regressions and commit

```bash
pnpm exec vitest run tests/ask-goal-plan.test.ts tests/provider-finder-ask.test.ts tests/copilot-intent.test.ts
pnpm type-check

git add lib/ask-mapable lib/copilot/types.ts app/api/mapable/ask/route.ts tests/ask-goal-plan.test.ts
git commit -m "feat(ask-mapable): attach participant Goal Plan drafts"
```

---

## Task 4: Build one reusable web Goal Plan panel and C3 interaction

**Files**
- Create: `components/goal-plan/GoalPlanPanel.tsx`
- Modify: `components/copilot/CopilotPanel.tsx`
- Modify: `components/ask-mapable/types.ts`
- Modify: `components/ask-mapable/useAskLocalSessions.ts`
- Modify: `components/ask-mapable/AskMapAbleWidget.tsx`
- Modify: `components/ask-mapable/AskMapAbleChatTab.tsx`
- Create: `tests/goal-plan-panel.test.tsx`
- Extend: `tests/ask-mapable-widget.test.tsx`

### 4.1 Write failing panel tests

```tsx
/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { buildGoalPlanDraft, nextConversationalCandidate } from "@mapable/contracts";
import { GoalPlanPanel } from "@/components/goal-plan/GoalPlanPanel";

describe("GoalPlanPanel", () => {
  it("shows ordinary candidates as Not yet decided and one active C3 question", async () => {
    const user = userEvent.setup();
    const plan = buildGoalPlanDraft(
      "I want a support worker before work, a job at a library and transport there",
    );
    const onChange = vi.fn();
    render(<GoalPlanPanel plan={plan} onChange={onChange} />);

    expect(screen.getAllByText(/not yet decided/i).length).toBeGreaterThan(0);
    expect(screen.getByText(nextConversationalCandidate(plan)!.question)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /^not sure$/i }));
    expect(onChange).toHaveBeenCalled();
  });

  it("always exposes human help and non-AI browse", () => {
    render(<GoalPlanPanel plan={buildGoalPlanDraft("I want a job")} onChange={() => {}} />);
    expect(screen.getByRole("link", { name: /talk to a person/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /browse without ai/i })).toBeTruthy();
  });
});
```

### 4.2 Implement `GoalPlanPanel`

Requirements:
- heading `My Goal Plan`;
- show the goal verbatim;
- candidate status labels: `Not yet decided`, `Included`, `Not included`, `Not sure`;
- active question is exactly `nextConversationalCandidate(plan)`;
- Yes / No / Not sure buttons use >=44px height and update only local plan state with `setGoalPlanDecision()`;
- show `reasonSuggested` and `participantBenefit`;
- `Talk to a person` -> `/contact`;
- `Browse without AI` -> `/provider-finder` unless caller supplies a module-specific href;
- explicit note: `Nothing is booked or shared from this draft.`;
- no decision button triggers a network request.

Core C3 block:

```tsx
const active = nextConversationalCandidate(plan);
{active ? (
  <section aria-labelledby="goal-plan-question" className="space-y-3">
    <h3 id="goal-plan-question" className="font-semibold">Ask MapAble</h3>
    <p>{active.question}</p>
    <div role="group" aria-label={`Choices for ${active.module}`} className="flex flex-wrap gap-2">
      {(["yes", "no", "not_sure"] as const).map((decision) => (
        <button
          key={decision}
          type="button"
          className="min-h-11 rounded-lg border px-4 py-2 focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => onChange(setGoalPlanDecision(plan, active.module, decision))}
        >
          {decision === "not_sure" ? "Not sure" : decision === "yes" ? "Yes" : "No"}
        </button>
      ))}
    </div>
  </section>
) : null}
```

### 4.3 Persist embedded-widget drafts only for the browser session

Extend `AskLocalSession` in `components/ask-mapable/types.ts`:

```ts
import type { GoalPlanDraft } from "@mapable/contracts";

export type AskLocalSession = {
  id: string;
  title: string;
  updatedAt: string;
  messages: AskChatMessage[];
  goalPlan?: GoalPlanDraft;
};
```

Add `setGoalPlan(sessionId, goalPlan)` to `useAskLocalSessions` using the existing `sessionStorage` persistence. This is session-local draft persistence, not CareOS Mission persistence.

Pass `activeSession?.goalPlan` and `setGoalPlan` from `AskMapAbleWidget` to `AskMapAbleChatTab`. When `/api/mapable/ask` returns `data.goalPlan`, store it and render the shared panel under the conversation log.

### 4.4 Reuse the same panel on `/ask`

In `CopilotPanel.tsx`, add local `GoalPlanDraft | null` state; set it from `data.goalPlan` and render the same `GoalPlanPanel`. Do not create a second web Goal Plan component.

### 4.5 Verify

```bash
pnpm exec vitest run tests/goal-plan-panel.test.tsx tests/ask-mapable-widget.test.tsx tests/ask-page-client.test.tsx tests/ask-goal-plan.test.ts
pnpm lint:components
pnpm type-check
```

### Feedback checkpoint A

Show the web UI/screenshots and ask Jonathan only:
1. should `My Goal Plan` sit inside the conversation or directly below it;
2. are ordinary `Not yet decided` cards too visually busy;
3. is the active C3 question prominent enough without feeling coercive.

After the agreed visual adjustment:

```bash
git add components/goal-plan components/copilot components/ask-mapable tests/goal-plan-panel.test.tsx tests/ask-mapable-widget.test.tsx
git commit -m "feat(ask-mapable): render adaptive Goal Plan conversation"
```

---

## Task 5: Converge the Independence Expo app on Ask MapAble and shared semantics

**Files**
- Modify: `apps/independence/package.json`
- Modify: `apps/independence/package-lock.json` if changed by npm
- Create: `apps/independence/src/goal-services/GoalPlannerScreen.tsx`
- Create: `apps/independence/src/goal-services/goalPlannerStyles.ts`
- Modify: `apps/independence/src/runtime/mapableApi.ts`
- Modify: `apps/independence/App.tsx`
- Modify: `apps/independence/README.md`
- Add only from the user-approved source files when available in the execution runtime:
  - `apps/independence/assets/mapable-logo.png`
  - `apps/independence/assets/australian-disability-logo.png`

### 5.1 Add the shared contract as a local dependency

From `apps/independence`:

```bash
npm install ../../packages/contracts --save
npm run typecheck
```

Expected `package.json` dependency:

```json
"@mapable/contracts": "file:../../packages/contracts"
```

If Metro/TypeScript cannot resolve the local package, stop this task and fix package resolution. Never copy/fork the Goal Plan contract into the mobile app as a fallback.

### 5.2 Add an exact web-path helper for non-AI/human links

Extend `apps/independence/src/runtime/mapableApi.ts`:

```ts
export function mapAbleWebUrl(path: string): string | null {
  const baseUrl = getConfiguredBaseUrl();
  if (!baseUrl) return null;
  const normalisedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalisedPath}`;
}
```

GoalPlanner routes:

```ts
const MODULE_PATHS = {
  access: "/access",
  care: "/provider-finder",
  transport: "/transport",
  jobs: "/jobs",
} as const;
```

`Talk to a person` opens `mapAbleWebUrl("/contact")` with `Linking.openURL`. If the platform URL is not configured, show a plain-language unavailable message instead of inventing a destination.

### 5.3 Implement the native Goal Planner using only shared semantics

Imports:

```ts
import {
  buildGoalPlanDraft,
  nextConversationalCandidate,
  setGoalPlanDecision,
  type GoalPlanDraft,
} from "@mapable/contracts";
```

Requirements:
- multiline Goal input with large touch area;
- optional starter chips, never required;
- `Create my Goal Plan` performs the deterministic shared resolver locally;
- `My Goal Plan` candidate cards with `Not yet decided`/Included/Not included/Not sure;
- one active C3 question at a time;
- Care only appears from explicit support intent;
- `Nothing is booked or shared from this draft.`;
- non-AI module browse buttons use `mapAbleWebUrl(MODULE_PATHS[module])`;
- human-help button uses `/contact`;
- no live location request;
- no disclosure permission mutation;
- no `/api/mapable/ask` call yet because the app currently has no authenticated native session exchange;
- React Native font scaling remains enabled;
- primary controls `minHeight: 48`.

Core C3 native block:

```tsx
const activeQuestion = plan ? nextConversationalCandidate(plan) : null;
{activeQuestion ? (
  <View accessibilityLiveRegion="polite" style={styles.questionCard}>
    <Text accessibilityRole="header" style={styles.cardTitle}>Ask MapAble</Text>
    <Text style={styles.body}>{activeQuestion.question}</Text>
    <View style={styles.choiceRow}>
      {(["yes", "no", "not_sure"] as const).map((decision) => (
        <Pressable
          key={decision}
          accessibilityRole="button"
          accessibilityLabel={decision === "not_sure" ? "Not sure" : decision === "yes" ? "Yes" : "No"}
          onPress={() => setPlan((current) => current
            ? setGoalPlanDecision(current, activeQuestion.module, decision)
            : current)}
          style={styles.choiceButton}
        >
          <Text>{decision === "not_sure" ? "Not sure" : decision === "yes" ? "Yes" : "No"}</Text>
        </Pressable>
      ))}
    </View>
  </View>
) : null}
```

### 5.4 Remove the rival assistant identity from navigation

Replace the current `Indy` tab with `Ask`/`Ask MapAble` backed by `GoalPlannerScreen`:

```ts
const Tabs = createBottomTabNavigator({
  screenOptions: { /* retain existing accessible tab settings */ },
  screens: {
    Today: TodayScreen,
    Home: HomeScreen,
    Ask: GoalPlannerScreen,
    More: MoreScreen,
  },
});
```

Remove the old `IndyScreen` assistant proposal UI from participant navigation. Useful bounded Home suggestions may be moved to Today/More as ordinary suggestions, but do not retain a second assistant persona.

### 5.5 Apply only the approved brand assets

When the two approved logo files are available as actual runtime files, add them at the exact asset paths above. Do not redraw or substitute them. Render with `Image`, `resizeMode="contain"`, and accessibility labels `MapAble` and `Australian Disability Ltd`.

### 5.6 Update native boundary documentation

`apps/independence/README.md` must state:
- Goal Plan UI uses shared `@mapable/contracts` semantics;
- native AI conversation/API exchange is **in development** until secure authenticated native session exchange exists;
- current native Goal Plan creation is deterministic/local and does not book, pay, share data, or create a CareOS Mission.

### 5.7 Verify

```bash
cd apps/independence
npm run typecheck
npm run build:web
cd ../..
pnpm exec vitest run tests/independence-goal-services.test.ts tests/goal-plan-c3.test.ts
```

### Feedback checkpoint B

Show the native preview and ask Jonathan:
1. `Ask`, `Ask MapAble`, or compact logo + `Ask` for the tab label;
2. whether starter chips help or clutter;
3. whether `Why suggested` should be expanded or collapsed by default;
4. whether Not sure should remain visually equal to Yes/No or use a secondary visual treatment while retaining the same accessibility prominence.

After the agreed visual adjustment:

```bash
git add apps/independence
git commit -m "feat(independence): add Ask MapAble Goal Plan journey"
```

---

## Task 6: Reconcile architecture documentation and retire stale assumptions

**Files**
- Modify: `docs/architecture/ask-mapable-convergence.md`
- Modify: `docs/programmes/CANONICAL_DOMAIN_MAP.md`
- Modify: `docs/superpowers/plans/2026-09-14-goal-to-services-mobile-slice.md`

### 6.1 Correct stale CareOS Mission status

Replace the stale mission section in `CANONICAL_DOMAIN_MAP.md` with current repository evidence:

```md
## Mission and coordination

| Concept | Canonical | Current | Status |
| --- | --- | --- | --- |
| Goal Plan | `@mapable/contracts` Goal Plan contract | shared semantic draft/review contract | in development |
| Mission | `CareOSMission` / `careos_missions` | `lib/careos/canonical-mission-service.ts` | implemented, not independently production verified |
| Starting Work projection | — | `StartingWorkJourneyProjection` | available on main; temporary; not the CareOS Mission SoR |

**Rule:** Goal Plans are participant-facing drafts. Confirmed Goal Plans may be projected into the canonical CareOS Mission through an adapter; programme code must not create a second mission table or bypass canonical mission persistence.
```

Remove the stale row describing CareOSMission as absent/speculative while retaining historical notes where useful.

### 6.2 Update Ask convergence

Add the canonical flow:

```text
Ask MapAble
  -> Goal interpretation
  -> shared Goal Plan + C3 decisions
  -> Navigator/deterministic planners
  -> participant confirmation
  -> CareOS Mission adapter when governed/enabled
  -> existing domain Actions
```

State that Navigator is a capability behind Ask MapAble, not a competing assistant.

### 6.3 Mark the original mobile plan superseded

Add at the top of `2026-09-14-goal-to-services-mobile-slice.md`:

```md
> **SUPERSEDED:** Use `2026-09-14-goal-plan-convergence.md`. The original plan placed Goal Plan semantics inside the mobile app; the approved convergence design moved them into the shared platform contract.
```

### 6.4 Verify claims and commit

```bash
pnpm ci:production-claims

git add docs/architecture/ask-mapable-convergence.md docs/programmes/CANONICAL_DOMAIN_MAP.md docs/superpowers/plans/2026-09-14-goal-to-services-mobile-slice.md
git commit -m "docs: reconcile Goal Plan Ask Navigator and CareOS ownership"
```

---

## Task 7: Whole-slice verification and review

Any defect found here must start with a failing regression test before production code changes.

### 7.1 Focused suite

```bash
pnpm exec vitest run \
  tests/independence-goal-services.test.ts \
  tests/goal-plan-c3.test.ts \
  tests/goal-plan-navigator-adapter.test.ts \
  tests/goal-plan-careos-adapter.test.ts \
  tests/ask-goal-plan.test.ts \
  tests/goal-plan-panel.test.tsx \
  tests/ask-mapable-widget.test.tsx \
  tests/ask-page-client.test.tsx \
  tests/provider-finder-ask.test.ts \
  tests/copilot-intent.test.ts \
  tests/careos-coordinate-confirm.test.ts
```

### 7.2 Static/platform gates

```bash
pnpm check:package-boundaries
pnpm type-check
pnpm lint:components
pnpm lint:lib
pnpm ci:production-claims
```

### 7.3 Native gates

```bash
cd apps/independence
npm run typecheck
npm run build:web
```

### 7.4 Full repository gate before any merge-readiness claim

Only if environment dependencies/database are available:

```bash
pnpm test
pnpm build
```

If a command cannot run, record it as **NOT VERIFIED**; do not extrapolate.

### 7.5 Manual accessibility acceptance

Verify at minimum:
- keyboard reaches all web Yes/No/Not sure and human/direct-browse paths;
- focus remains visible when the active C3 question changes;
- screen reader announces active C3 question/status changes;
- 200% web zoom retains core choices without loss;
- native large-text scaling does not clip goal input or decision controls;
- Talk to a person and Browse without AI remain available when AI/model services fail;
- no diagnosis is requested to justify Care;
- `not_sure` survives rerender/session persistence unchanged;
- unknown/unmapped non-negotiables remain visible;
- no decision button books, pays, discloses, or persists a Mission.

Lived-experience, switch-control, and AAC acceptance remain human gates and cannot be marked complete from automated tests.

### 7.6 Final branch review

Check the full diff against the approved spec:
- no second Goal Plan contract remains in `apps/independence`;
- no new chatbot route or browser/mobile OpenAI client;
- no duplicate consent/audit store;
- no Prisma migration;
- no production flag enabled;
- Navigator hard constraints remain unrelaxed;
- CareOS adapter is projection-only;
- web/native use shared semantics;
- docs no longer contradict current CareOS Mission implementation.

Do not merge. Present Jonathan with fresh verification evidence, unresolved tests, accessibility findings, and the next decision.

---

## Execution checkpoints

Jonathan explicitly asked for preference feedback during development. Pause after **Task 4** (web C3 UI) and **Task 5** (native UI). These are visual/interaction feedback checkpoints, not opportunities to silently weaken the approved rights/safety contract.

## Rollback

- Revert feature-branch commits; this plan introduces no schema migration.
- If Ask response enrichment regresses existing flows, remove the optional `goalPlan` response field while retaining the shared contract/tests.
- If Expo cannot consume the local contract package cleanly, keep native work unmerged and fix package distribution; never fork the contract into the app.
- Production flags remain unchanged, so rollback requires no production flag change.
