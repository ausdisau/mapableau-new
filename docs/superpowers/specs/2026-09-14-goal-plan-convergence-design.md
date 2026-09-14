# Goal Plan Convergence Design

**Date:** 2026-09-14  
**Status:** Approved design direction; implementation follows after review  
**Scope:** Ask MapAble, Navigator, CareOS, and the MapAble Independence React Native app

## 1. Canonical terminology

MapAble uses the following terms consistently across participant-facing UX and internal orchestration:

1. **Goal** — the person’s own statement of what they want to do, change, achieve, or make possible.
2. **Goal Plan** — the editable participant-facing representation of that goal, including suggested modules, preferences, non-negotiables, uncertainties, and participant decisions.
3. **Mission** — the internal CareOS coordination object that represents a confirmed or reviewable cross-module outcome and its dependencies. Participants do not need to use the word “Mission” in normal UI.
4. **Actions** — bounded operations proposed or executed by existing domain services only after the required participant, authority, policy, and confirmation gates.

Canonical progression:

`Goal -> Goal Plan -> Mission -> Actions`

## 2. Architectural ownership

### Ask MapAble

Ask MapAble is the single conversational participant-facing manager across web and native surfaces.

Responsibilities:
- receive the participant’s goal in natural language;
- summarize the interpretation and invite correction;
- present C3 adaptive questions;
- explain why modules are suggested;
- preserve uncertainty and “Not sure” states;
- surface human help;
- hand structured, participant-reviewed context to deterministic planners and CareOS.

Ask MapAble must not become a second domain execution layer.

### Navigator

Navigator is a governed decision and navigation capability behind Ask MapAble, not a rival assistant.

Responsibilities:
- normalize structured filters;
- preserve hard accessibility and communication constraints;
- enforce exclusions and non-negotiables;
- rank or shortlist options through deterministic matching where available;
- return `NO_SAFE_MATCH` instead of silently relaxing hard constraints;
- produce draft transfer envelopes and Finder handoffs;
- preserve AI opt-out and human-help paths.

Navigator does not book, pay, approve, disclose sensitive information, or infer incapacity.

### CareOS

CareOS is the cross-module coordination layer and durable mission context where enabled and governed.

Responsibilities:
- coordinate confirmed Goal Plan context across MapAble modules;
- maintain mission state, dependencies, proposals, review state, and auditable events;
- read authorised operational information through governed tools;
- hand confirmed actions to existing domain writers rather than duplicating Care, Transport, Jobs, Access, billing, consent, messaging, complaints, or incident systems.

### Independence mobile app

The native app is a participant-facing client of shared contracts and platform APIs.

Responsibilities:
- accessible Goal input;
- C3 conversational decision UI;
- Goal Plan review/edit experience;
- direct-browse and human-help paths;
- local presentation state only.

The mobile app must not own a separate AI orchestration stack, consent ledger, mission source of truth, or duplicate domain services.

## 3. C3 adaptive conversation model

C3 is the canonical interaction pattern for service suggestions.

Each service candidate begins as `undecided` and has one of four participant decision states:

- `undecided`
- `yes`
- `no`
- `not_sure`

The system distinguishes ordinary, low-risk suggestions from sensitive or uncertain decisions.

### Ask conversationally now when

Any of the following applies:
- the suggestion is sensitive or high-impact;
- confidence is low or material ambiguity remains;
- the suggestion involves personal support or Care;
- the suggestion would affect disclosure of disability, health, access, employer, delegate, location, or support information;
- the suggestion changes a hard accessibility or communication constraint;
- the user has explicitly asked to decide step-by-step;
- policy requires an explicit confirmation gate.

### Place in the Goal Plan as “Not yet decided” when

All of the following are true:
- the candidate is ordinary and reversible;
- confidence is adequate;
- no sensitive disclosure is involved;
- no hard constraint is being relaxed;
- no irreversible or regulated action is being requested.

This reduces conversational burden without converting suggestion into consent.

## 4. Shared Goal Plan contract

The shared semantic contract must live outside a platform-specific UI tree so web and native experiences do not diverge.

```ts
export type GoalServiceModule = "access" | "care" | "transport" | "jobs";

export type ParticipantDecision =
  | "undecided"
  | "yes"
  | "no"
  | "not_sure";

export type CandidateSensitivity =
  | "ordinary"
  | "sensitive"
  | "high_impact";

export type CandidateConfidence = "high" | "medium" | "low";

export type GoalServiceCandidate = {
  module: GoalServiceModule;
  reasonSuggested: string;
  participantBenefit: string;
  question: string;
  decision: ParticipantDecision;
  confidence: CandidateConfidence;
  sensitivity: CandidateSensitivity;
  askConversationally: boolean;
  requiresExplicitChoice: boolean;
  requirements: string[];
  nonNegotiables: string[];
  uncertainties: string[];
  dataRequired: string[];
  proposedDisclosure: string[];
};

export type GoalPlanDraft = {
  goal: string;
  participantConfirmed: boolean;
  needsClarification: boolean;
  clarificationPrompt?: string;
  desiredOutcomes: string[];
  preferences: string[];
  nonNegotiables: string[];
  accessibilityRequirements: string[];
  communicationRequirements: string[];
  exclusions: string[];
  serviceCandidates: GoalServiceCandidate[];
  disclosurePermissions: string[];
  uncertainties: string[];
  humanHelpRequested: boolean;
  status: "draft" | "review" | "confirmed";
};
```

The contract may be extended, but consumers must not redefine these concepts independently.

## 5. Care and disability-rights boundary

Care is never inferred from diagnosis, impairment, communication method, wheelchair use, dependency, or disability identity alone.

Care may be suggested only when the participant explicitly describes a personal-support need, asks about support workers, or otherwise expresses support intent relevant to the goal.

Even then:
- Care starts `undecided`;
- `requiresExplicitChoice` is true;
- `askConversationally` is true;
- no disclosure permission is created by implication;
- choosing `not_sure` remains a stable state and is not treated as consent.

The same principle applies to employer disclosure, delegate involvement, sharing support information, and funding-related decisions.

## 6. Goal interpretation and constraint flow

Canonical participant journey:

1. Person states a Goal.
2. Ask MapAble produces a plain-language interpretation.
3. Person confirms, edits, rejects, or clarifies the interpretation.
4. The system extracts candidate modules and known constraints without relaxing or inventing requirements.
5. C3 asks sensitive/uncertain decisions one at a time.
6. Ordinary candidates may appear in the Goal Plan as `undecided`.
7. The person can answer any candidate with Yes, No, or Not sure.
8. Accessibility, communication requirements, exclusions, and other non-negotiables remain explicit.
9. Navigator/deterministic planners resolve compatible options and may return `NO_SAFE_MATCH`.
10. The person edits and confirms the Goal Plan.
11. Confirmed context may be adapted into a CareOS Mission where the relevant mission path is enabled and governed.
12. Existing domain systems perform bounded Actions only after their own deterministic and human/participant confirmation gates.

## 7. Web/native convergence

The web Ask MapAble widget and the Independence app should render different presentation components over the same semantic contract.

Shared:
- candidate states;
- C3 question policy;
- constraint vocabulary;
- participant decision semantics;
- disclosure defaults;
- reason/explanation fields;
- human-help state;
- adapter interfaces to Navigator and CareOS.

Platform-specific:
- layout;
- navigation;
- keyboard/input mechanics;
- native safe areas and touch behavior;
- web focus behavior and browser navigation.

## 8. Source-of-truth rules

1. Existing identity, consent, authority, audit, messaging, complaints, incidents, Care, Transport, Jobs, Access, billing, and domain writers remain authoritative for their domains.
2. Goal Plan is not a new consent ledger.
3. Goal Plan is not a booking or funding approval object.
4. CareOS Mission is the internal coordination representation, not a replacement for domain records.
5. Navigator constraints must be reused through adapters rather than reimplemented with mobile-only semantics.
6. Ask MapAble continues to use the existing `/api/mapable/ask` architecture for conversational intelligence; no second chatbot API or browser/mobile OpenAI client is introduced.
7. Feature flags and fail-closed behavior remain in force for unverified or pilot-only capabilities.

## 9. Accessibility and communication

Target WCAG 2.2 AA-equivalent behavior across supported surfaces.

Requirements:
- minimum 44x44 logical-pixel targets;
- screen-reader labels and meaningful grouping;
- visible focus on web and predictable focus order;
- dynamic text scaling on native;
- typed input always available;
- voice optional and never auto-sending;
- AAC-compatible interaction without timing pressure;
- plain-language questions;
- “Not sure”, correction, refusal, stop, and human-help paths always available;
- no critical state communicated by color alone;
- live-region/status announcements for asynchronous results where appropriate.

## 10. Safety, privacy, and authority

The model may propose and explain. Deterministic services and accountable humans enforce policy and execute actions.

The Goal Plan path must not autonomously:
- book services or transport;
- create or approve payments;
- create binding service agreements;
- disclose disability, health, employer, location, delegate, or support information;
- change participant authority;
- relax non-negotiable accessibility/communication requirements;
- make capacity determinations;
- adjudicate safeguarding, complaints, incident reportability, or funding entitlement.

Where a path is unavailable or unsafe, the system preserves unknowns, offers direct browse/human help, and uses explicit failure states rather than inventing success.

## 11. Data flow

```text
Goal
  -> shared Goal Plan interpreter/resolver
  -> participant review
  -> C3 questions where required
  -> confirmed Goal Plan
  -> Navigator adapter for constraints/matching as applicable
  -> CareOS Mission adapter for governed coordination as applicable
  -> existing domain writers for confirmed Actions
```

No direct mobile-to-domain execution bypass is introduced.

## 12. Testing and evidence

Implementation requires:
- unit tests for deterministic module suggestion rules;
- tests proving diagnosis/disability language alone never infers Care;
- tests for all four participant decision states;
- tests for C3 classification rules;
- tests proving disclosure permissions default to empty;
- tests proving hard constraints are not silently relaxed;
- web/native contract tests for shared semantics;
- Navigator adapter contract tests;
- CareOS adapter tests that keep Goal Plan and Mission responsibilities distinct;
- React Native type-checking and accessibility review;
- existing Ask MapAble, Navigator, CareOS, and production-claims suites where affected.

No production-readiness claim may be made without fresh verification evidence.

## 13. Migration from the current mobile slice

The initial `apps/independence/src/goal-services/goalPlan.ts` implementation is treated as a prototype implementation of the contract, not a new source of truth.

Implementation will:
1. move or replace shared types and deterministic rules into a reusable shared package/module;
2. leave React Native presentation components under `apps/independence`;
3. update tests to import the shared contract;
4. adapt existing web Ask MapAble and Navigator seams incrementally rather than rewrite them;
5. avoid database changes unless a later CareOS Mission adapter genuinely requires them;
6. correct stale architecture documentation where it conflicts with directly inspected current implementation.

## 14. Explicit non-goals for this slice

- no production flag enablement;
- no autonomous booking/payment;
- no new NDIS funding-decision engine;
- no new mission database schema;
- no replacement of Navigator;
- no replacement of CareOS;
- no duplicate consent, authority, audit, or messaging system;
- no claim that the mobile Goal Plan journey is production-ready before testing and accessibility acceptance.

## 15. Acceptance criteria

The design is correctly implemented when:
- web and native use the same Goal Plan semantics;
- C3 asks sensitive/uncertain questions conversationally while leaving ordinary suggestions `undecided` in the draft;
- every service decision remains Yes / No / Not sure / Undecided until the participant changes it;
- Care never appears from disability or diagnosis language alone;
- hard access and communication constraints are preserved;
- direct-browse and human-help paths remain available;
- confirmed Goal Plan context can be handed to existing Navigator/CareOS adapters without duplicating domain execution;
- the person experiences one coherent MapAble journey rather than separate competing assistants.
