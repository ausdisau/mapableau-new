# Stage 0 — Autonomous Care & Support evidence map

**Status:** Stage 0 inspection only. Not a production architecture, NDIS rating, TGA classification or deployment authorisation.  
**Paper:** Australian Disability Ltd / MapAble — Autonomous Care & Support, 6 November 2026, v1.0  
**Executive decision recorded:** ALLOW WITH SAFEGUARDS — bounded, auditable, participant-controlled digital autonomy. L5 unrestricted self-direction is not a target.  
**Inspection:** `ausdisau/mapableau-new` `origin/main` @ `cbf8aeaa` (8 November 2026, Australia/Sydney).  
**Paper’s cited SHA** `43ce85df` / PRs #21–#22 refer to a prior `ausdisau/MapAble` layout (`apps/web/lib/...`). Canonical paths on this repository are listed below.

This artefact is the Stage 0 evidence map, test plan, freeze waiver record and reviewable diff proposal. It does **not** merge, migrate production databases, enable flags, or use live participant data.

## Autonomy envelope (signed product decision)

| Level | MapAble mapping on current main | First-release stance |
| --- | --- | --- |
| L0 Explain | `READ_ONLY_EXPLAIN` | Permitted |
| L1 Draft | `DRAFT_ONLY` / `SUGGEST_WITH_PARTICIPANT_APPROVAL` | Permitted |
| L2 Pre-authorised reversible digital tasks | Not implemented as a capability manifest | **Ceiling for the first workflow** (Decision 1) |
| L3 Supervised service coordination | Programme execution still suggestion-ceiling | Later stage; not authorised here |
| L4 High-impact continuity handoff | A2H / ActHandoff exist; human-owned | Later stage |
| L5 Unrestricted self-direction | Explicitly prohibited (`PROHIBITED_AUTONOMOUS_ACTIONS`, Trust Fabric permanent denials) | **Never a deployment target** |

Success metric: genuine participation and reduced administrative burden. Not inferred disability severity, “obedience”, or fewer human interactions as inherently better.

## Evidence map — current main

| Capability | Canonical path | Finding | Blocker for unattended private execution? |
| --- | --- | --- | --- |
| Consent SoT | `lib/consent/consent-service.ts` + Prisma `ConsentRecord` | `checkConsent()` matches subject, scope, optional recipient, `status=active`, unexpired. **Does not match `purpose` or `dataScope`.** Grant already stores both fields. | **Yes** — paper §7 |
| Consent require | `lib/consent/require-consent.ts` | Calls `checkConsent` only | Yes |
| Authority grants | `lib/programmes/authority/participant-authority-service.ts` | Purpose + allowed fields + allowed actions **are** matched for non-self actors. Self-actor is allowed without a grant. Dual writer also exists under `lib/authority/` (Prompt 0 collision). | Partial — not a substitute for consent purpose checks |
| Programme AURA stop | `lib/programmes/aura/execution-gate.ts` | `let programmeAuraStopped = false` — **process-local** | **Yes** — no cross-instance / durable Stop |
| Companion Stop | `apps/companion/src/aura/stop-aura.ts` | In-memory + encrypted local store on device | Device-local only |
| AURA harness | `lib/aura-harness/**` | In-process HITL interceptor; flag `MAPABLE_AURA_HARNESS_ENABLED` default false. Not `lib/aura/` Agent OS. | Do not treat as PEP |
| Programme ceiling | `PROGRAMME_AURA_CEILING = SUGGEST_WITH_PARTICIPANT_APPROVAL` | Direct writers (book/pay/consent/execute) refused | Aligns with L1, not L2 execute |
| Trust Fabric | `lib/config/trust-fabric.ts` | `aiDecisionAuthorityEnabled: false`, `automaticAuthorityEnabled: false` (permanent) | Keep |
| AgentRun | `lib/ai/agent-ops/agent-run-service.ts` | Persistence flag-gated; not a consent DB; create often records `status: completed` | Prototype only |
| Temporal / Redis | Integration registry stubs; Context Fabric docs | Not a consent or Stop plane | Must not become one |
| ParticipantRAG / ProviderRAG | Intelligence / research lanes | Research consent is a **separate** SoT (`isServiceLaneConsentScope`) | Do not mix lanes |
| Presentation | Next.js + Expo companion | Text/AAC/keyboard must remain complete without avatar/voice | Keep |
| Feature freeze | `docs/remediation/FEATURE_FREEZE.md` | Active; W-AA-1 covers Autonomy Assurance deepen, not this ACS Stage 0 doc set | Waiver **W-ACS-0** required |

### What current `checkConsent()` actually evaluates

Positive: active status, expiry, subject, scope, optional grantee user/org.

Not evaluated: exact purpose, data fields, consent revision, cost/contact ceilings, schedule window, geography/device, retry bound, reversibility, PEP stop, or current expressed refusal mid-workflow.

`purpose` and `dataScope` **are stored** on grant (`GrantConsentInput`) and therefore can be enforced without a new consent system.

### Physical / clinical red lines (out of Stage 0–2)

Do not propose LLM-only control of transfers/hoists, dysphagia feeding, ventilation, medication, restraint, restrictive practice, personal-care contact or emergency treatment. TGA intended-purpose review is application-specific; this paper does not classify MapAble software as a medical device.

## Threat / failure inventory (Stage 0)

| Hazard | Current behaviour | Required before L2 |
| --- | --- | --- |
| Consent revoked mid-workflow | Revoke updates `ConsentRecord`; cached reads / in-flight AgentRun not universally invalidated | Recheck exact consent before every tool call; pause on revoke |
| Purpose mismatch | `checkConsent` can return true for a different purpose on the same scope | `checkExactPurposeConsent` (proposed, unwired) |
| Cross-tenant retrieval | Programme helpers deny mismatched org IDs when callers use them | Mandatory PEP before RAG/tool |
| Process crash / second instance | Programme stop does not survive process restart or other workers | Durable Stop (Stage 1) |
| Hallucinated eligibility | Prohibited action list exists; not all model paths go through it | Grounding + no funding/clinical writes |
| Duplicate Temporal retry | AgentRun not an idempotent consent gate | Idempotency + fresh auth (Stage 3) |
| Silence / AAC delay treated as consent | Not encoded as a hard invariant in `checkConsent` | Curiosity rule: “do not ask” remains valid; silence ≠ consent |
| Family contact against instruction | No standing-instruction manifest | Capability manifest + contact exclusions |

## Task inventory (no Stage 1 implementation in this PR)

1. Governance: this document + W-ACS-0 + synthetic tests.  
2. Stage 1 (later): wire exact-purpose/field/recipient recheck; durable Stop; tenant isolation negatives; no live agents.  
3. Stage 2: text/AAC-first L0–L1 persona; public search; non-AI fallback.  
4. Stage 3: **one** reversible L2 standing-instruction workflow (synthetic).  
5. Stages 4–6: continuity, devices, scale — not authorised.

## Provider / worker legal model (unresolved — Decision 2)

MapAble on this repository is coordination software with gated marketplace, care and transport domains. Stage 0 does **not** decide whether a future L3 workflow makes MapAble a registered NDIS provider, marketplace operator or device developer. Contracts, insurance and NDIS/TGA obligations stay human-owned. No provider API is called here.

## Exact test plan

Synthetic only. No live participant, worker or provider data.

| ID | Case | Expected |
| --- | --- | --- |
| S0-01 | L5 is not deployable | `isDeployableAutonomyLevel("L5_unrestricted") === false` |
| S0-02 | Trust Fabric AI authority | permanently false |
| S0-03 | `checkConsent` where-clause | no `purpose` / `dataScope` (documents the gap) |
| S0-04 | Proposed exact-purpose helper | denies missing purpose match |
| S0-05 | Proposed helper | denies field not in `dataScope` |
| S0-06 | `requireConsent` | still calls `checkConsent` only (proves unwired) |
| S0-07 | Programme Stop | in-process boolean; source has no Redis/Temporal Stop |
| S0-08 (Stage 1 later) | Cross-tenant RAG | deny before retrieval |
| S0-09 (Stage 1 later) | Revoke then retry tool | next protected action denied |
| S0-10 (Stage 2 later) | Breakfast scenario | never contact family; unknown attendance stays unknown |
| S0-11 (Stage 3 later) | Standing instruction | identity, consent revision, cost/contact, exclusions rechecked immediately before send |

Run now: `pnpm exec vitest run tests/autonomy/stage0-evidence.test.ts`

## Reviewable diff proposal (this PR)

In scope:

- `docs/ai-platform/AUTONOMY_ENVELOPE_STAGE_0.md` (this file)
- Freeze waiver **W-ACS-0**
- Types: `lib/autonomy/envelope.ts`
- Unwired helper: `lib/consent/exact-purpose-check.ts`
- Synthetic tests: `tests/autonomy/stage0-evidence.test.ts`

Explicitly **out** of this PR:

- Changing production `checkConsent()` behaviour
- Prisma migrations
- Wiring exact-purpose checks into `requireConsent` or agents
- Temporal/Redis Stop
- Live AgentRun, RAG, device control
- New consent SoT
- Merging AURA Agent OS (`lib/aura/`)

### Proposed Stage 1 patch (not applied)

1. Keep `ConsentRecord` as sole service-lane SoT.  
2. Switch consequential gates from `checkConsent` to `checkExactPurposeConsent` (purpose + recipient + fields + active + expiry), rechecked after retries.  
3. Replace process-local `programmeAuraStopped` with a durable, tenant-scoped Stop that invalidates in-flight protected actions.  
4. Require PEP evaluation before ParticipantRAG candidate generation.  
5. Capability manifests for any L2 action; flags default false.  
6. Still no model-written grants, capacity inference, payments, clinical or physical care.

## Remaining risks

- Dual authority writers (`lib/authority` vs `lib/programmes/authority`).  
- AgentRun can persist `completed` without a human checkpoint.  
- Feature freeze remains active; W-AA-1 does not cover ACS product execution.  
- Paper’s GitHub inspection (`MapAble` #21/#22, SHA `43ce85df`) is a different tree; do not treat those PRs as merged here.

## Next human go/no-go

Stage 0 complete when reviewers accept: envelope (L2 ceiling, L5 banned), W-ACS-0, evidence of consent/Stop gaps, and the Stage 1 patch sketch. No stage automatically authorises the next.
