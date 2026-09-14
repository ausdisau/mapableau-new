# MapAble Participant Autonomy Policy v1 — Design Specification

**Date:** 2026-09-14  
**Repository:** `ausdisau/mapableau-new`  
**Status:** approved design, implementation starting under TDD  
**Branch:** `chatgpt/participant-autonomy-policy-v1`  
**Base dependency:** `fix/goal-plan-contract-green` / PR #597  
**Production status:** not production ready

## 1. Decision

MapAble will use one participant-governed autonomy policy shared by Companion, CareOS, Navigator, AURA, Sentinel, Full Life, and domain modules. The default posture is `PREPARE_THEN_CONFIRM`: AI may read, explain, recommend, and prepare ordinary reversible actions, but consequential execution requires participant confirmation unless a narrow standing authority exists.

The policy is not a second consent system, authority store, mission runtime, or execution engine.

## 2. Canonical ownership

- Participant-confirmed autonomy preferences may be stored through Agency Memory / participant-control surfaces.
- Typed policy vocabulary belongs in `@mapable/contracts`.
- Effective authority resolution belongs in `@mapable/intelligence-kernel` as deterministic code.
- Guardian, Full Life, AURA, legal/consent checks, and capability ceilings may only narrow the effective action set.
- Sentinel consumes the decision and projects supervision / confirmation / review state; it does not create authority.
- The Governed Action Kernel remains the execution boundary.
- Canonical consent / disclosure systems remain authoritative for disclosure permission.

The invariant is:

`PREFERENCE != CONSENT != AUTHORITY != APPROVAL != EXECUTION`

## 3. Approved participant-control choices

### 3.1 Default posture

`PREPARE_THEN_CONFIRM`

- read: allowed within purpose / privacy scope;
- explain: allowed within purpose / privacy scope;
- recommend: allowed;
- prepare ordinary reversible action: allowed;
- prepare guarded action: participant confirmation required before guarded preparation;
- execute consequential action: participant confirmation required unless valid standing authority applies.

### 3.2 Guarded preparation

Preparation classes:

- `ORDINARY`
- `GUARDED`
- `PROHIBITED_AI_AUTHORITY`

Guarded examples include money movement, worker/provider replacement, sensitive external disclosure preparation, crisis-contact preparation, and consequential employment actions. The initial implementation must be conservative and may classify a capability as guarded even if the domain later introduces a narrower subtype.

Prohibited-AI-authority examples include capacity determinations, restrictive-practice authorisation, abuse substantiation, autonomous clinical treatment decisions, autonomous funding/eligibility determinations, or participant override.

### 3.3 Selective standing authority

Standing authority may exist only for explicitly participant-approved, tightly bounded actions whose conditions are machine-checkable. It must not be a blanket domain permission.

Standing authority is prohibited for:

- sensitive disclosure to employers or other external recipients;
- crisis/emergency contact initiated solely by AI judgement;
- capacity determinations;
- restrictive-practice decisions;
- clinical treatment decisions;
- abuse substantiation / reportability findings;
- NDIS eligibility / funding decisions;
- consequential employment selection or rejection;
- overriding an expressed participant refusal.

### 3.4 Expiry and material-change invalidation

Standing authority is time-limited and must be re-checked at execution time.

Material changes invalidate standing authority and fall back to participant confirmation. Material-change dimensions include:

- provider / worker / recipient identity;
- action or capability;
- purpose;
- data scope;
- risk / reversibility class;
- participant preference;
- legal / consent state;
- price or schedule outside participant-approved tolerance;
- evidence becoming stale, disputed, missing, or materially different.

Numeric changes may remain within authority only when a participant-approved bounded tolerance explicitly covers them, such as a fare ceiling or maximum schedule shift.

## 4. Resolution rule

Effective autonomy is deterministic and least-permissive.

Resolution order:

1. hard rights / safety prohibitions;
2. legal, consent, privacy, disclosure, and domain requirements;
3. explicit participant stop / refusal;
4. capability and system autonomy ceiling;
5. action-specific standing authority;
6. participant domain preference;
7. global participant default (`PREPARE_THEN_CONFIRM`);
8. fail-safe fallback (`RECOMMEND_ONLY`).

No AI model, worker, provider, supporter, delegate, or sibling module may automatically widen effective authority.

## 5. Monotonicity invariant

Let `Allowed(x)` be the set of actions permitted by the effective policy state `x`. If policy constraints tighten or evidence quality decreases from `x` to `y`, then:

`Allowed(y) subseteq Allowed(x)`

New uncertainty, revocation, expiry, stricter risk classification, changed recipient, changed purpose, changed data scope, or tolerance breach may reduce authority but must never silently increase it.

## 6. First vertical slice

The first implementation is deliberately narrow:

1. typed preparation / autonomy / material-change contract values;
2. deterministic policy parsing from `AuthorityGrant.constraints` without creating another authority record type;
3. `decideProposedAction()` integration for guarded preparation and standing-authority invalidation;
4. tests proving fail-closed behavior, bounded tolerance handling, and monotonic narrowing;
5. no database migration;
6. no UI;
7. no live external action;
8. no feature flag enablement.

## 7. Initial contract shape

`AuthorityGrant.constraints` remains the canonical extension point for v1 to avoid a second authority store. The structured value is versioned and validated before use.

```ts
interface ParticipantAutonomyPolicyConstraintV1 {
  version: "1";
  defaultPosture: "PREPARE_THEN_CONFIRM";
  preparationClass: "ORDINARY" | "GUARDED" | "PROHIBITED_AI_AUTHORITY";
  standingAuthority?: {
    enabled: boolean;
    action: string;
    purpose: string;
    providerRef?: string;
    workerRef?: string;
    recipientRef?: string;
    dataScopes?: string[];
    maxAmountMinorUnits?: number;
    currency?: string;
    maxScheduleShiftMinutes?: number;
    expiresAt: string;
  };
}
```

The exact production schema may be factored into focused types, but the semantics above are binding for v1.

## 8. Safety and rights invariants

- silence, delay, distress, AAC use, dysarthria, or communication difficulty never become consent;
- a delegate cannot exceed established authority;
- participant refusal or stop overrides automation for future optional processing;
- a prior Full Life / AURA / Guardian pass is not a perpetual execution token;
- sensitive disclosure remains separately purpose-bound and consent-bound;
- unknown remains unknown;
- participant-approved hard constraints cannot be traded away for price or convenience;
- failures degrade to confirmation or human/manual path, never to broader automation.

## 9. Convergence targets

This v1 is intentionally compatible with active work in:

- PR #528 Agency Memory / Preference Graph;
- PR #534 Explainable Matching / Options Engine;
- PR #562+ Companion / Ask MapAble convergence;
- PR #582/#591 purpose-bound sharing and one-time authorisation;
- PR #593 Sentinel supervisory convergence;
- PR #594/#596 Full Life constitutional harness;
- PR #597 Goal Plan shared contract repair;
- existing AURA and Governed Action Kernel paths;
- existing Care allocation conditional-autonomy work.

None of those modules should implement an independent autonomy constitution after this shared policy exists.

## 10. Release gates

Before any participant-facing enablement:

- TDD RED/GREEN evidence for the policy slice;
- targeted regression tests for existing intelligence-kernel callers;
- repository type-check and relevant AI-platform suites;
- CodeRabbit / Cursor BugBot review evidence when available;
- privacy, accessibility, disability-lived-experience, and security review;
- Vercel preview build evidence;
- no production promotion from this branch.
