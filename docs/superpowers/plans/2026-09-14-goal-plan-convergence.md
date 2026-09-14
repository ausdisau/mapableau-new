# Goal Plan Convergence Implementation Plan

> **Execution:** Implement task-by-task with TDD. Do not merge or enable production flags from this plan. The approved design is the binding specification.

**Goal:** Converge Ask MapAble, Navigator, CareOS, and the Independence Expo app on one participant-controlled `Goal -> Goal Plan -> Mission -> Actions` semantic model, with C3 adaptive conversation and no duplicate consent, AI, mission, or domain execution stack.

**Architecture:** Move Goal Plan semantics into the existing platform-neutral `@mapable/contracts` package. Keep deterministic Goal Plan interpretation/C3 policy shared. Add pure adapters into Navigator and CareOS rather than new writers. Attach an optional Goal Plan draft to the existing `/api/mapable/ask` response path. Render that same draft in web Ask MapAble and native Independence surfaces. The Independence app installs independently, so consume `@mapable/contracts` through a local file dependency rather than adding the Expo app to the root pnpm workspace.

**Tech Stack:** TypeScript, Zod 4, Vitest 3, Next.js 15, React 18 web, Expo SDK 57, React Native 0.86, React 19 native, React Navigation 7, Prisma/CareOS existing services.

**Spec:** `docs/superpowers/specs/2026-09-14-goal-plan-convergence-design.md`

**Supersedes:** `docs/superpowers/plans/2026-09-14-goal-to-services-mobile-slice.md`

## Global Constraints

- Canonical terminology is **Goal -> Goal Plan -> Mission -> Actions**.
- Ask MapAble is the single participant-facing conversational manager. Navigator is a governed capability behind it; CareOS is coordination; domain services remain execution authorities.
- Every service candidate starts `undecided`; participant choices are exactly `yes | no | not_sure | undecided`.
- C3 asks sensitive, high-impact, low-confidence, materially ambiguous, Care/personal-support, disclosure, hard-constraint, or policy-gated choices conversationally. Ordinary reversible candidates may appear as `undecided` without interrupting the person.
- Never infer Care, incapacity, reduced autonomy, lower capability, or treatment entitlement from diagnosis, disability identity, communication method, wheelchair use, dependency, or support needs alone.
- No disclosure permission is created by implication. `not_sure` is not consent.
- Hard accessibility and communication requirements are never silently relaxed; generic unmapped non-negotiables must remain visible rather than being discarded.
- The Goal Plan is not a consent ledger, booking object, funding approval, service agreement, or domain source of truth.
- No autonomous booking, payment, binding agreement, sensitive disclosure, capacity determination, safeguarding adjudication, complaint/incident reportability decision, or funding entitlement decision.
- Keep direct-browse, correction, refusal, stop, and human-help paths available.
- Web and native presentation may differ, but semantics must come from the same contract.
- Do not create a second chatbot API. Continue using `POST /api/mapable/ask` for web conversational intelligence.
- Do not create a second CareOS mission schema or direct mobile domain writer.
- Navigator pilot flags and other fail-closed production flags remain unchanged.
- WCAG 2.2 AA-equivalent target: >=44x44 targets, keyboard/focus support on web, screen-reader labels, dynamic text on native, typed input always available, voice optional and never auto-sending, AAC-friendly no-time-pressure interaction, no colour-only critical state.
- Evidence before claims: no production-ready, verified-live, NDIS-compliant, or accessibility-accepted claim without fresh evidence.

---

## Task 1: Replace the mobile prototype with the shared Goal Plan contract and C3 resolver

**Files:**
- Create: `packages/contracts/src/goal-plan.ts`
- Create: `packages/contracts/src/goal-plan-resolver.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `tests/independence-goal-services.test.ts`
- Create: `tests/goal-plan-c3.test.ts`
- Delete after green: `apps/independence/src/goal-services/goalPlan.ts`

**Produces:**
- `GoalPlanDraft`
- `GoalServiceCandidate`
- `ParticipantDecision`
- `buildGoalPlanDraft(goal)`
- `setGoalPlanDecision(plan, module, decision)`
- `nextConversationalCandidate(plan)`
- `confirmGoalPlan(plan)`

### Step 1.1 — Write failing contract tests against `@mapable/contracts`

Update `tests/independence-goal-services.test.ts` to import from the shared package:

```ts
import { describe, expect, it } from "vitest";
import {
  buildGoalPlanDraft,
  setGoalPlanDecision,
} from "@mapable/contracts";

describe("Goal Plan shared contract", () => {
  it("suggests Jobs and Transport for an explicit work-and-travel goal", () => {
    const draft = buildGoalPlanDraft(
      "I want to work three days a week at a library and stop depending on my parents to get there",
    );

    expect(draft.serviceCandidates.map((c) => c.module)).toEqual(
      expect.arrayContaining(["jobs", "transport"]),
    );
    expect(draft.serviceCandidates.every((c) => c.decision === "undecided")).toBe(true);
    expect(draft.disclosurePermissions).toEqual([]);
  });

  it("does not infer Care from diagnosis or disability language alone", () => {
    const draft = buildGoalPlanDraft(
      "I have cerebral palsy and use a wheelchair. I want to find a job at a library.",
    );
    expect(draft.serviceCandidates.some((c) => c.module === "care")).toBe(false);
  });

  it("keeps not-sure distinct from consent", () => {
    const draft = buildGoalPlanDraft(
      "I want help from a support worker before I travel to work",
    );
    const updated = setGoalPlanDecision(draft, "care", "not_sure");
    expect(updated.serviceCandidates.find((c) => c.module === "care")?.decision).toBe("not_sure");
    expect(updated.disclosurePermissions).toEqual([]);
  });
});
```

Create `tests/goal-plan-c3.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  buildGoalPlanDraft,
  nextConversationalCandidate,
  shouldAskConversationally,
  type GoalServiceCandidate,
} from "@mapable/contracts";

describe("C3 adaptive conversation", () => {
  it("places ordinary high-confidence candidates in the draft without interrupting", () => {
    const plan = buildGoalPlanDraft("I want a part-time job and transport to work");
    expect(plan.serviceCandidates.filter((c) => c.module !== "care").every((c) => c.askConversationally === false)).toBe(true);
  });

  it("asks Care conversationally", () => {
    const plan = buildGoalPlanDraft("I want a support worker to help me get ready before work");
    const care = plan.serviceCandidates.find((c) => c.module === "care");
    expect(care?.sensitivity).toBe("sensitive");
    expect(care?.requiresExplicitChoice).toBe(true);
    expect(care?.askConversationally).toBe(true);
    expect(nextConversationalCandidate(plan)?.module).toBe("care");
  });

  it("asks whenever a candidate proposes sensitive disclosure", () => {
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
});
```

### Step 1.2 — Verify RED

Run:

```bash
pnpm exec vitest run tests/independence-goal-services.test.ts tests/goal-plan-c3.test.ts
```

Expected: failure because `@mapable/contracts` does not yet export the Goal Plan contract/resolver.

### Step 1.3 — Implement the shared contract

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
export type CandidateSensitivity = z.infer<typeof candidateSensitivitySchema>;
export type CandidateConfidence = z.infer<typeof candidateConfidenceSchema>;
export type GoalServiceCandidate = z.infer<typeof goalServiceCandidateSchema>;
export type GoalPlanDraft = z.infer<typeof goalPlanDraftSchema>;
```

Create `packages/contracts/src/goal-plan-resolver.ts` with the current prototype regex rules migrated into shared code and these public helpers:

```ts
import {
  goalPlanDraftSchema,
  type GoalPlanDraft,
  type GoalServiceCandidate,
  type GoalServiceModule,
  type ParticipantDecision,
} from "./goal-plan";

export function shouldAskConversationally(candidate: GoalServiceCandidate): boolean {
  return (
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
  return plan.serviceCandidates.find(
    (candidate) => candidate.decision === "undecided" && shouldAskConversationally(candidate),
  ) ?? null;
}

export function confirmGoalPlan(plan: GoalPlanDraft): GoalPlanDraft {
  if (plan.needsClarification) throw new Error("GOAL_PLAN_NEEDS_CLARIFICATION");
  if (nextConversationalCandidate(plan)) throw new Error("GOAL_PLAN_EXPLICIT_CHOICE_REQUIRED");
  return goalPlanDraftSchema.parse({ ...plan, participantConfirmed: true, status: "confirmed" });
}
```

`buildGoalPlanDraft()` must migrate the existing Jobs/Access/Transport/Care matchers with these rules:
- Jobs / Access / Transport: `confidence: "high"`, `sensitivity: "ordinary"`, `requiresExplicitChoice: false`, no disclosure, and derived `askConversationally: false` unless future data changes the policy.
- Care: only explicit support-intent patterns, `confidence: "high"`, `sensitivity: "sensitive"`, `requiresExplicitChoice: true`, `askConversationally: true`.
- Empty/unsupported goal: `needsClarification: true`, no candidates.
- `disclosurePermissions: []` always at draft creation.
- `participantConfirmed: false`, `status: "draft"`, `humanHelpRequested: false`.

Append to `packages/contracts/src/index.ts`:

```ts
export * from "./goal-plan";
export * from "./goal-plan-resolver";
```

### Step 1.4 — Verify GREEN and package boundaries

```bash
pnpm exec vitest run tests/independence-goal-services.test.ts tests/goal-plan-c3.test.ts
pnpm check:package-boundaries
pnpm type-check
```

Then delete `apps/independence/src/goal-services/goalPlan.ts` and re-run the focused tests to prove no consumer depends on the prototype.

### Step 1.5 — Commit

```bash
git add packages/contracts/src/goal-plan.ts packages/contracts/src/goal-plan-resolver.ts packages/contracts/src/index.ts tests/independence-goal-services.test.ts tests/goal-plan-c3.test.ts apps/independence/src/goal-services/goalPlan.ts
git commit -m "feat(goal-plan): add shared participant contract and C3 policy"
```

---

## Task 2: Add pure adapters to Navigator and CareOS without creating new writers

**Files:**
- Create: `lib/goal-plan/navigator-adapter.ts`
- Create: `lib/goal-plan/careos-adapter.ts`
- Create: `tests/goal-plan-navigator-adapter.test.ts`
- Create: `tests/goal-plan-careos-adapter.test.ts`

### Step 2.1 — Write failing Navigator adapter tests

```ts
import { describe, expect, it } from "vitest";
import { buildGoalPlanDraft, setGoalPlanDecision } from "@mapable/contracts";
import { projectGoalPlanToNavigator } from "@/lib/goal-plan/navigator-adapter";

describe("Goal Plan -> Navigator adapter", () => {
  it("preserves access, communication and exclusion hard constraints exactly", () => {
    const base = buildGoalPlanDraft("I want accessible transport to work");
    const plan = {
      ...base,
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

  it("only treats yes-decisions as selected modules", () => {
    let plan = buildGoalPlanDraft("I want a job and transport to work");
    plan = setGoalPlanDecision(plan, "jobs", "yes");
    plan = setGoalPlanDecision(plan, "transport", "not_sure");
    expect(projectGoalPlanToNavigator(plan).selectedModules).toEqual(["jobs"]);
  });
});
```

### Step 2.2 — Implement the Navigator projection

```ts
import type { GoalPlanDraft, GoalServiceModule } from "@mapable/contracts";
import type { HardConstraintsInput, HardConstraintKey } from "@/lib/ai/navigator/matching/types";

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
      accessibilityRequirements: [...plan.accessibilityRequirements],
      communicationRequirements: [...plan.communicationRequirements],
      credentialRequirements: [],
      nonNegotiableKeys,
    },
    unmappedNonNegotiables: [...plan.nonNegotiables],
  };
}
```

Do **not** stuff module names into Navigator `requiredServices`; service taxonomy mapping is a later domain-specific concern.

### Step 2.3 — Write failing CareOS adapter tests

```ts
import { describe, expect, it } from "vitest";
import { buildGoalPlanDraft, confirmGoalPlan, setGoalPlanDecision } from "@mapable/contracts";
import { toCareOSMissionCreate } from "@/lib/goal-plan/careos-adapter";

describe("Goal Plan -> CareOS Mission adapter", () => {
  it("refuses an unconfirmed Goal Plan", () => {
    const plan = buildGoalPlanDraft("I want a job and transport to work");
    expect(() => toCareOSMissionCreate({ participantId: "p1", requestId: "r1", plan })).toThrow("GOAL_PLAN_NOT_CONFIRMED");
  });

  it("projects only participant-selected modules into the mission", () => {
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

### Step 2.4 — Implement the CareOS projection only

```ts
import type { GoalPlanDraft } from "@mapable/contracts";
import type { CanonicalMissionCreate } from "@/lib/careos/canonical-mission-service";

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
    modulesJson: selectedModules,
    inputSummary: {
      source: "goal_plan",
      participantConfirmed: true,
      unresolvedCandidates: input.plan.serviceCandidates
        .filter((candidate) => candidate.decision === "undecided" || candidate.decision === "not_sure")
        .map((candidate) => ({ module: candidate.module, decision: candidate.decision })),
      nonNegotiables: input.plan.nonNegotiables,
      accessibilityRequirements: input.plan.accessibilityRequirements,
      communicationRequirements: input.plan.communicationRequirements,
    },
    proposalsJson: input.plan.serviceCandidates,
  };
}
```

This adapter must not call `createCanonicalMission()`; persistence stays behind an explicit later authority/policy call site.

### Step 2.5 — Verify and commit

```bash
pnpm exec vitest run tests/goal-plan-navigator-adapter.test.ts tests/goal-plan-careos-adapter.test.ts
pnpm type-check

git add lib/goal-plan tests/goal-plan-navigator-adapter.test.ts tests/goal-plan-careos-adapter.test.ts
git commit -m "feat(goal-plan): add Navigator and CareOS projections"
```

---

## Task 3: Attach Goal Plans to the existing Ask MapAble response path

**Files:**
- Create: `lib/ask-mapable/goal-plan.ts`
- Modify: `lib/ask-mapable/index.ts`
- Modify: `lib/copilot/types.ts`
- Modify: `app/api/mapable/ask/route.ts`
- Create: `tests/ask-goal-plan.test.ts`

### Step 3.1 — Write failing response-enrichment tests

```ts
import { describe, expect, it } from "vitest";
import { maybeBuildGoalPlanForAsk } from "@/lib/ask-mapable/goal-plan";

describe("Ask MapAble Goal Plan enrichment", () => {
  it("creates a bounded draft for a work-and-transport goal", () => {
    const plan = maybeBuildGoalPlanForAsk({
      query: "I want a part-time job at a library and to get there independently",
      intent: "combined",
    });
    expect(plan?.serviceCandidates.map((c) => c.module)).toEqual(expect.arrayContaining(["jobs", "transport"]));
  });

  it.each(["incident", "billing", "health", "provider_finder"] as const)(
    "does not attach Goal Plan semantics to %s responses",
    (intent) => {
      expect(maybeBuildGoalPlanForAsk({ query: "help me", intent })).toBeNull();
    },
  );
});
```

### Step 3.2 — Implement the bounded helper

```ts
import { buildGoalPlanDraft, type GoalPlanDraft } from "@mapable/contracts";
import type { CopilotIntentType } from "@/lib/copilot/types";

const ELIGIBLE_INTENTS = new Set<CopilotIntentType>([
  "support", "transport", "combined", "jobs", "places", "unknown",
]);

export function maybeBuildGoalPlanForAsk(input: {
  query: string;
  intent: CopilotIntentType;
}): GoalPlanDraft | null {
  if (!ELIGIBLE_INTENTS.has(input.intent)) return null;
  const plan = buildGoalPlanDraft(input.query);
  return plan.needsClarification && plan.serviceCandidates.length === 0 ? null : plan;
}
```

Export it from `lib/ask-mapable/index.ts`.

Extend `CopilotAskResponse`:

```ts
import type { GoalPlanDraft } from "@mapable/contracts";
// ...
export type CopilotAskResponse = {
  // existing fields
  goalPlan?: GoalPlanDraft;
};
```

### Step 3.3 — Integrate only in the normal guarded Ask flow

In `app/api/mapable/ask/route.ts`, import `maybeBuildGoalPlanForAsk`. Attach `goalPlan` only after intent classification/planning/guardrails on the normal signed-in path. Do not modify the existing early-return paths for:
- crisis/safety interception;
- human-help request;
- booking-agent lookup;
- `care_transport_map`;
- anonymous `provider_finder`.

Use the shape:

```ts
const goalPlan = maybeBuildGoalPlanForAsk({ query, intent: intent.type });

let response: CopilotAskResponse = {
  // existing response fields
  ...(goalPlan ? { goalPlan } : {}),
};
```

Do not write Goal Plan state to Prisma in this task.

### Step 3.4 — Verify regression paths

```bash
pnpm exec vitest run tests/ask-goal-plan.test.ts tests/provider-finder-ask.test.ts tests/copilot-intent.test.ts
pnpm type-check
```

Commit:

```bash
git add lib/ask-mapable lib/copilot/types.ts app/api/mapable/ask/route.ts tests/ask-goal-plan.test.ts
git commit -m "feat(ask-mapable): attach participant Goal Plan drafts"
```

---

## Task 4: Build one reusable web Goal Plan UI and C3 interaction

**Files:**
- Create: `components/goal-plan/GoalPlanPanel.tsx`
- Modify: `components/copilot/CopilotPanel.tsx`
- Modify: `components/ask-mapable/types.ts`
- Modify: `components/ask-mapable/useAskLocalSessions.ts`
- Modify: `components/ask-mapable/AskMapAbleWidget.tsx`
- Modify: `components/ask-mapable/AskMapAbleChatTab.tsx`
- Create: `tests/goal-plan-panel.test.tsx`
- Extend: `tests/ask-mapable-widget.test.tsx`

### Step 4.1 — Write failing component tests

Create `tests/goal-plan-panel.test.tsx`:

```tsx
/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { buildGoalPlanDraft } from "@mapable/contracts";
import { GoalPlanPanel } from "@/components/goal-plan/GoalPlanPanel";

describe("GoalPlanPanel", () => {
  it("shows ordinary candidates as Not yet decided and asks one C3 question at a time", async () => {
    const user = userEvent.setup();
    const plan = buildGoalPlanDraft(
      "I want a support worker before work, a job at a library and transport there",
    );
    const onChange = vi.fn();
    render(<GoalPlanPanel plan={plan} onChange={onChange} />);

    expect(screen.getByText(/not yet decided/i)).toBeTruthy();
    expect(screen.getByText(/would you like me to include care/i)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /^not sure$/i }));
    expect(onChange).toHaveBeenCalled();
  });

  it("always exposes human help and a non-AI browse path", () => {
    render(<GoalPlanPanel plan={buildGoalPlanDraft("I want a job")} onChange={() => {}} />);
    expect(screen.getByRole("link", { name: /talk to a person/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /browse without ai/i })).toBeTruthy();
  });
});
```

### Step 4.2 — Implement the panel

`GoalPlanPanel` must:
- render `My Goal Plan` as the participant-facing heading;
- render the goal verbatim;
- show all ordinary candidates as cards with status `Not yet decided`, `Included`, `Not included`, or `Not sure`;
- show only `nextConversationalCandidate(plan)` as the active C3 question;
- buttons: `Yes`, `No`, `Not sure`, all `min-h-11`;
- update only local Goal Plan state through `setGoalPlanDecision()`;
- never call an API when a decision button is pressed;
- show why each candidate was suggested;
- show `Talk to a person` -> `/contact`;
- show `Browse without AI` -> `/provider-finder` (or module-specific href when supplied);
- include plain language: `Nothing is booked or shared from this draft.`

Core interaction:

```tsx
const active = nextConversationalCandidate(plan);

{active ? (
  <section aria-labelledby="goal-plan-question">
    <h3 id="goal-plan-question">Ask MapAble</h3>
    <p>{active.question}</p>
    {(["yes", "no", "not_sure"] as const).map((decision) => (
      <button
        key={decision}
        type="button"
        className="min-h-11 min-w-11 rounded-lg border px-4 py-2"
        onClick={() => onChange(setGoalPlanDecision(plan, active.module, decision))}
      >
        {decision === "not_sure" ? "Not sure" : decision === "yes" ? "Yes" : "No"}
      </button>
    ))}
  </section>
) : null}
```

### Step 4.3 — Persist only the embedded-widget draft for the browser session

Extend `AskLocalSession`:

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

Add `setGoalPlan(sessionId, goalPlan)` to `useAskLocalSessions`; store through the existing `sessionStorage` mechanism. This is **session-local draft persistence only**, not a cross-device CareOS Mission.

Pass `activeSession?.goalPlan` and `setGoalPlan` through `AskMapAbleWidget` to `AskMapAbleChatTab`.

When `/api/mapable/ask` returns `data.goalPlan`, call `onGoalPlanChange(sid, data.goalPlan)` and render `GoalPlanPanel` beneath the conversation log.

### Step 4.4 — Reuse the same panel on `/ask`

In `CopilotPanel.tsx`, add local `goalPlan` state. On Ask response:

```ts
setResponse(data as CopilotAskResponse);
setGoalPlan((data as CopilotAskResponse).goalPlan ?? null);
```

Render:

```tsx
{goalPlan ? <GoalPlanPanel plan={goalPlan} onChange={setGoalPlan} /> : null}
```

Do not create separate Goal Plan components for widget vs `/ask`.

### Step 4.5 — Verify web accessibility and regressions

```bash
pnpm exec vitest run tests/goal-plan-panel.test.tsx tests/ask-mapable-widget.test.tsx tests/ask-page-client.test.tsx tests/ask-goal-plan.test.ts
pnpm lint:components
pnpm type-check
```

### Feedback checkpoint A

Show the rendered web UI or screenshots to Jonathan and ask only about:
1. whether `My Goal Plan` should sit inside the conversation or directly below it;
2. whether ordinary `Not yet decided` cards feel too visually busy;
3. whether the active C3 question is prominent enough without feeling coercive.

Do not change the semantic contract in response to cosmetic feedback unless explicitly requested.

Commit after the agreed UI adjustment:

```bash
git add components/goal-plan components/copilot components/ask-mapable tests/goal-plan-panel.test.tsx tests/ask-mapable-widget.test.tsx
git commit -m "feat(ask-mapable): render adaptive Goal Plan conversation"
```

---

## Task 5: Converge the Independence Expo app on Ask MapAble + shared Goal Plan semantics

**Files:**
- Modify: `apps/independence/package.json`
- Modify: `apps/independence/package-lock.json` if npm updates it
- Create: `apps/independence/src/goal-services/GoalPlannerScreen.tsx`
- Create: `apps/independence/src/goal-services/goalPlannerStyles.ts`
- Modify: `apps/independence/App.tsx`
- Modify: `apps/independence/README.md`
- Optional binary assets after the approved logo files are available in the execution runtime:
  - `apps/independence/assets/mapable-logo.png`
  - `apps/independence/assets/australian-disability-logo.png`

### Step 5.1 — Add the shared contract as a local file dependency

From `apps/independence`:

```bash
npm install ../../packages/contracts --save
```

Expected `package.json` entry:

```json
"@mapable/contracts": "file:../../packages/contracts"
```

Immediately verify module resolution before any UI work:

```bash
npm run typecheck
```

If Metro/TypeScript cannot resolve the symlinked file package, stop this task and fix package resolution only; do **not** copy the Goal Plan types into the app as a fallback.

### Step 5.2 — Implement native local state transitions using the shared resolver

`GoalPlannerScreen.tsx` must import only shared semantics:

```ts
import {
  buildGoalPlanDraft,
  nextConversationalCandidate,
  setGoalPlanDecision,
  type GoalPlanDraft,
  type ParticipantDecision,
} from "@mapable/contracts";
```

The screen state starts with the goal text and no draft. `Create my Goal Plan` calls `buildGoalPlanDraft(goalText)` locally. No model/API call is added in this task because the Independence README confirms authenticated native session exchange is not implemented yet.

Required native C3 flow:

```tsx
const activeQuestion = plan ? nextConversationalCandidate(plan) : null;

{activeQuestion ? (
  <View accessibilityLiveRegion="polite" style={styles.questionCard}>
    <Text accessibilityRole="header" style={styles.cardTitle}>Ask MapAble</Text>
    <Text style={styles.body}>{activeQuestion.question}</Text>
    <View style={styles.choiceRow}>
      {(["yes", "no", "not_sure"] as ParticipantDecision[]).map((decision) => (
        <Pressable
          key={decision}
          accessibilityRole="button"
          accessibilityLabel={decision === "not_sure" ? "Not sure" : decision}
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

Requirements:
- free-text Goal input, multiline, large touch area;
- example goals as optional starter chips, never required;
- `My Goal Plan` summary cards;
- `Not yet decided` for undecided ordinary candidates;
- Care question only when explicit support intent was stated;
- `Nothing is booked or shared from this draft.`;
- direct-browse section with non-AI shortcuts to Access / Jobs / Transport / Care discovery surfaces or existing app search;
- human-help button that opens the configured MapAble support/contact path if available;
- no live location request;
- no disclosure permission mutation;
- font scaling enabled (default React Native Text behavior; do not set `allowFontScaling={false}`);
- minimum `minHeight: 48` for primary interactive controls.

### Step 5.3 — Remove the rival-assistant navigation concept

In `App.tsx`, replace the `Indy` tab entry with the shared participant manager:

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

Remove the old `IndyScreen` proposal UI from participant navigation. If any bounded Home proposal content remains useful, move it to a clearly labelled non-agentic suggestion card under Today/More rather than keeping a second assistant identity.

### Step 5.4 — Apply the approved brand assets without inventing substitutes

Only when the two user-approved logos are available as actual files in the execution runtime, add them to the exact asset paths above and render them with accessible labels. Do not redraw or substitute a logo in code.

Example:

```tsx
<Image
  source={require("../../assets/mapable-logo.png")}
  accessibilityLabel="MapAble"
  resizeMode="contain"
  style={styles.brandLogo}
/>
```

If the Australian Disability logo is included next to MapAble, use `accessibilityLabel="Australian Disability Ltd"`.

### Step 5.5 — Document current boundary

Update `apps/independence/README.md` to state:
- Goal Plan UI uses the shared `@mapable/contracts` semantics;
- native Ask MapAble conversational API exchange is still **in development** until secure authenticated session exchange exists;
- current native Goal Plan generation is deterministic/local and does not book, pay, share data, or create a CareOS Mission.

### Step 5.6 — Verify native build surface

```bash
cd apps/independence
npm run typecheck
npm run build:web
```

Also from repository root:

```bash
pnpm exec vitest run tests/independence-goal-services.test.ts tests/goal-plan-c3.test.ts
```

### Feedback checkpoint B

Show the native preview and ask Jonathan about:
1. whether the Ask tab should read `Ask`, `Ask MapAble`, or use a compact logo + `Ask` label;
2. whether goal starter chips help or clutter;
3. whether service summary cards should show `Why suggested` expanded or collapsed by default;
4. whether `Not sure` should remain visually equal to Yes/No or be shown as a secondary choice.

Do not default `Not sure` to a weaker or less prominent accessible control without Jonathan explicitly choosing that design.

Commit after the agreed adjustment:

```bash
git add apps/independence
git commit -m "feat(independence): add Ask MapAble Goal Plan journey"
```

---

## Task 6: Reconcile architecture documentation and retire stale assumptions

**Files:**
- Modify: `docs/architecture/ask-mapable-convergence.md`
- Modify: `docs/programmes/CANONICAL_DOMAIN_MAP.md`
- Modify: `docs/superpowers/plans/2026-09-14-goal-to-services-mobile-slice.md`

### Step 6.1 — Correct the stale CareOS Mission statement

`docs/programmes/CANONICAL_DOMAIN_MAP.md` currently says CareOSMission is absent. Replace that mission section with current repository evidence:

```md
## Mission and coordination

| Concept | Canonical | Current | Status |
| --- | --- | --- | --- |
| Goal Plan | `@mapable/contracts` Goal Plan contract | shared semantic draft/review contract | in development |
| Mission | `CareOSMission` / `careos_missions` | `lib/careos/canonical-mission-service.ts` | implemented, not independently production verified |
| Starting Work projection | `StartingWorkJourneyProjection` | temporary pilot projection | available on main; not a replacement mission SoR |

**Rule:** Goal Plans are participant-facing drafts. Confirmed Goal Plans may be projected into the canonical CareOS Mission through an adapter; programme code must not create a second mission table or bypass canonical mission persistence.
```

Remove the stale row that labels CareOSMission speculative/absent, while preserving historical context where useful.

### Step 6.2 — Update Ask convergence doc

Add Goal Plan to the convergence target:

```text
Ask MapAble
  -> Goal interpretation
  -> shared Goal Plan draft + C3 participant decisions
  -> Navigator/deterministic planners
  -> participant confirmation
  -> CareOS Mission adapter (when governed/enabled)
  -> existing domain Actions
```

State explicitly that Navigator is a capability behind Ask MapAble, not a competing conversational identity.

### Step 6.3 — Mark the first mobile plan superseded

At the top of `docs/superpowers/plans/2026-09-14-goal-to-services-mobile-slice.md` add:

```md
> **SUPERSEDED:** Use `2026-09-14-goal-plan-convergence.md`. The original plan placed Goal Plan semantics inside the mobile app; the approved convergence design moved them into the shared platform contract.
```

### Step 6.4 — Run production-claim consistency check

```bash
pnpm ci:production-claims
```

Commit:

```bash
git add docs/architecture/ask-mapable-convergence.md docs/programmes/CANONICAL_DOMAIN_MAP.md docs/superpowers/plans/2026-09-14-goal-to-services-mobile-slice.md
git commit -m "docs: reconcile Goal Plan Ask Navigator and CareOS ownership"
```

---

## Task 7: Whole-slice verification and review

**Files:** no new production files unless verification exposes a defect; any defect fix starts with a failing regression test.

### Step 7.1 — Focused test suite

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

### Step 7.2 — Static/platform gates

```bash
pnpm check:package-boundaries
pnpm type-check
pnpm lint:components
pnpm lint:lib
pnpm ci:production-claims
```

### Step 7.3 — Native gates

```bash
cd apps/independence
npm run typecheck
npm run build:web
```

### Step 7.4 — Full repository gate before any merge-readiness claim

Only if the environment has the dependencies/database needed:

```bash
pnpm test
pnpm build
```

If a full command cannot run, record it as **NOT VERIFIED** rather than extrapolating from focused tests.

### Step 7.5 — Manual accessibility acceptance checklist

Manually verify at minimum:
- keyboard can reach all web Yes/No/Not sure choices and human/direct-browse paths;
- visible focus is never lost when a C3 question changes;
- screen reader announces the new active C3 question and changed status;
- 200% browser zoom remains usable without horizontal loss of core choices;
- native large-text scaling does not clip Yes/No/Not sure or the Goal input;
- Talk to a person and Browse without AI remain available when AI/model services fail;
- no diagnosis is requested to justify Care;
- `not_sure` remains stable after rerender/session persistence;
- unknown or unmapped non-negotiables remain visible;
- no decision button triggers booking, payment, disclosure, or mission persistence.

Lived-experience / switch / AAC acceptance remains a human gate; do not mark it complete from automated tests.

### Step 7.6 — Final branch review

Review the whole branch against the approved spec and explicitly check:
- no second Goal Plan contract remains under `apps/independence`;
- no new `/api/public-agent` or chatbot route exists;
- no duplicate consent/audit store exists;
- no new Prisma migration exists;
- no production feature flag was enabled;
- Navigator hard constraints remain unchanged/unrelaxed;
- CareOS adapter is projection-only;
- web and native import shared semantics;
- docs no longer contradict the current CareOS Mission implementation.

Do not merge. Present Jonathan with verified evidence, unresolved tests, accessibility findings, and the next decision.

---

## Execution checkpoints

Because Jonathan explicitly requested preference feedback during development, pause after **Task 4** (web C3 UI) and **Task 5** (native UI). These are design-feedback checkpoints, not permission to weaken the approved rights/safety contract. Continue TDD and verification within each task before presenting the checkpoint.

## Rollback

- Revert the feature branch commits; no schema migration is introduced.
- If web Goal Plan enrichment causes regressions, remove the optional `goalPlan` response field while retaining the shared package and tests.
- If the Expo file dependency cannot be supported cleanly, keep the native UI work unmerged and resolve package distribution; never copy/fork the contract into the mobile app.
- Production flags remain unchanged, so rollback requires no production flag flip.
