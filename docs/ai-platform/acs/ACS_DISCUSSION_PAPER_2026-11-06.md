# AUSTRALIAN DISABILITY LTD / MAPABLE

## Autonomous Care & Support

Architecture and delivery roadmap for maximum operational independence with participant authority

**6 November 2026** | Technical / rights-assurance discussion paper | **Version 1.0**

This file archives the source paper for Stage 0. It is not a statutory NDIS or TGA rating, not a production claim, and not an authorisation to merge runtime.

**Filed against:**

| Inspection target            | Value                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| Canonical paper repo (cited) | `ausdisau/MapAble` @ `43ce85df6b5b09a8577b60bf29042fbc1dc96fb0`                                  |
| This change-train repo       | `ausdisau/mapableau-new` @ `c4e5a777e1e279ea8e749bd5619e1cd50ca45f62` (`main` at pack authoring) |
| Related MapAble drafts       | PR #21 (Care & Support Perceptual Frame), PR #22 (synthetic RAG) — open, unmerged                |

---

## Executive decision

**Decision: ALLOW WITH SAFEGUARDS** — pursue high levels of independent digital coordination, but do not confer unrestricted authority over people, physical care, clinical decisions, finance or access rights on a self-evolving model.

The objective is to expand the participant’s independence, not to make the person dependent on an unaccountable AI. A system may become operationally autonomous within a participant-approved capability envelope, while remaining answerable to the participant, accountable care organisations, qualified professionals and an independently enforceable policy control plane.

**What “independent” means here.** The AI can notice an authorised need, plan a reversible response, verify permissions, execute a narrowly pre-approved digital action, monitor the outcome, and recover from routine failures without waiting for a staff member to direct every step.

**What it does not mean.** The AI cannot override the participant’s will, consent to its own activities, unilaterally expand its permissions, infer diminished decision-making capacity from disability, or provide autonomous clinical and personal-care interventions based on language-model outputs.

## A practical autonomy ladder

The ladder is a proposed product classification, not a statutory NDIS or TGA rating. The same feature can move between levels depending on context and consequences.

| Level                                | Permitted autonomy                                                                  | Boundary / example                                                  |
| ------------------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| L0 · Explain                         | Retrieve public information; explain options.                                       | No private access or action.                                        |
| L1 · Draft                           | Suggest plans, compare providers, prepare messages.                                 | Participant reviews; nothing is sent.                               |
| L2 · Pre-authorised                  | Execute low-risk, reversible, bounded tasks under standing instructions.            | Reminders or approved household routines; revocable.                |
| L3 · Supervised service coordination | Use approved workflows with confirmed providers and explicit cost/contact ceilings. | Participant-defined approvals, exceptions and monitored fulfilment. |
| L4 · High-impact care coordination   | Identify continuity risks and hand off to authorised humans.                        | Safety-critical and regulated decisions stay human-owned.           |
| L5 · Unrestricted self-direction     | Independent goals, rule changes or physical/clinical care.                          | **Not an acceptable deployment target.**                            |

## 1. System purpose and rights boundary

The user’s stated goal and lived experience are the starting point. The model may identify multiple plausible explanations, including an inaccessible environment, inconsistent assistance, communication mismatch, administrative delay or a changing preference. It must preserve uncertainty, ask only relevant optional questions, and allow correction or abstention. Its success is measured in genuine participation and reduced administrative burden—not measured “obedience” or inferred disability severity.

Australia’s NDIS Practice Standards emphasise informed choice, adequate communication, dignity of risk and independence. CRPD Articles 12 and 19 address equal legal capacity and independent community living, including the right to choose living arrangements and obtain personal assistance. A highly automated system must strengthen, not displace, these rights.

## 2. Proposed target architecture

- **Presentation:** accessible Next.js / Expo / optional Electron clients provide text, AAC, keyboard, switch, screen-reader and optional voice. The avatar is a presentation layer and never an authority source.
- **Control plane:** MapAble Core authenticates actors and stores authoritative consent, delegation, role permissions, participant boundaries and audit records. An independent PEP evaluates every proposed data access and tool invocation against verified, current policy. The model never supplies trusted role or tenant identity.
- **Perceptual intelligence:** the BPS builds a time-indexed picture of goals, reported bodily experiences, access barriers, supports, environmental affordances and relationships. MAIRA maintains competing hypotheses, source provenance and structured proposals; it does not infer consent or legal capacity.
- **Evidence plane:** ParticipantRAG searches only precisely authorised private data; ProviderRAG uses public or independently permissioned provider evidence. Sensitive filtering is enforced before vector or keyword candidate generation, not after model retrieval. Data becomes model context only through a minimum-necessary projection.
- **Execution plane:** AgentRun / Temporal coordinates durable tasks, retries and human review checkpoints. Redis is restricted to short-lived, non-sensitive status, rate limits and notification fan-out; neither Redis nor a Temporal history is a consent database. All consequential actions cross deterministic domain service gates and are audited.
- **Physical interface:** only explicitly approved device controllers can actuate equipment. Safety-critical control must be independent of the LLM.

## 3. The autonomy envelope: a capability contract

Each independently executable digital action requires a participant-approved, versioned capability manifest. It is narrower than a general role and must include: actor identity; intended participant and tenant; allowed tool/action; purpose and data fields; cost and contact limits; schedule window; geographical/device boundaries; grant and consent revision; expiry; permitted retries; reversibility; audit correlation; and fallback/escalation instructions.

| Control       | Minimum enforceable rule                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| Identity      | Server-verified actor, participant and delegated authority; reject client-supplied role assertions.     |
| Consent       | Exact purpose, recipient, fields and active revision; recheck before every tool call and after retries. |
| Action        | Explicit allowlist, bounded parameters, limits and deterministic validation.                            |
| Safety        | Risk-tier gate, stop status, current environment and approved fallback.                                 |
| Traceability  | Immutable decision and operation IDs; privacy-minimised receipt without raw sensitive prompts.          |
| Reversibility | Cancellation, dispute and rollback or compensating action where technically feasible.                   |

A signed or server-held capability can authorise only a clearly bounded class of operations. It does not constitute blanket future consent.

## 4. Independent reasoning without independent rule-making

Closed loop: OBSERVE permitted evidence → REPRESENT alternative explanations → SELECT a low-risk authorised option → CHECK the PEP → EXECUTE through a deterministic tool → VERIFY actual outcomes → REQUEST correction → UPDATE only permitted memory.

Three learning loops remain separate: ephemeral session reasoning; persistent preferences under specific consent; offline role-mining / model improvements that produce proposals only.

**Curiosity rule.** Ask or verify when expected benefit exceeds privacy burden, communication effort and risk; “do not ask” must remain viable. Silence, dysarthric speech, AAC delay or an unavailable camera are not evidence of incapacity or consent.

**Governance rule.** AURA defines what may be attempted; MAIRA proposes what might help; AgentRun coordinates only what is authorised. A separate, accountable human-owned change process controls effective policies and model releases.

## 5. Example: a missed morning support

Synthetic scenario (see [fixtures/breakfast-scenario.json](./fixtures/breakfast-scenario.json)): a participant says they can eat breakfast themselves but need packaging opened; the scheduled worker has not arrived; do not contact family. This is not evidence of an inability to eat, permission to contact relatives, or an automatic medical emergency.

## 6–11. Safety, current integration, delivery sequence, assurance, decisions

See the filed paper body above and the Stage 0 operationalisation in:

- [STAGE_0_EVIDENCE_MAP.md](./STAGE_0_EVIDENCE_MAP.md)
- [STAGE_0_TEST_PLAN.md](./STAGE_0_TEST_PLAN.md)
- [STAGE_0_DIFF_PROPOSAL.md](./STAGE_0_DIFF_PROPOSAL.md)

**Decision 5 (this pack):** produce only the Stage 0 evidence map, exact test plan, narrow waiver and reviewable diff proposal. No merges of production behaviour, production migrations or live data.

### Decision ledger (as filed)

| Finding                    | Public reasoning / status                                                                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary decision           | ALLOW WITH SAFEGUARDS: bounded, auditable, participant-controlled autonomy.                                                                          |
| Critical tension           | Convenience and rapid service response vs autonomy, privacy, dignity of risk and safety.                                                             |
| Least-restrictive approach | Low-risk standing instructions with immediate revocation; high-impact pathways require accountable human review.                                     |
| Known gaps                 | No validated cross-instance Stop, production consent purpose enforcement, real worker availability or physical safety case.                          |
| Alternative perspective    | Automation could reduce coercive human dependence; excessive checkpoints could entrench barriers. Design proportionate, user-configurable oversight. |
| Confidence                 | High in rights/control architecture; moderate in feasibility of bounded digital automation; low in unsupervised physical care readiness.             |

### Sources (checked 6 November 2026)

Sources support legal and security principles; they do not certify the proposed MapAble architecture.

1. NDIS Commission — NDIS Code of Conduct
2. NDIS Commission — Core module: rights and responsibilities
3. United Nations — CRPD Article 12: Equal recognition
4. Australian Signals Directorate — Agentic AI harnesses (11 Sep 2026)
5. OAIC — Privacy and commercially available AI products
6. TGA — Understanding software-based medical devices (24 Feb 2026)
7. TGA — AI and medical device software regulation (5 Feb 2026)
8. Commonwealth — NDIS Act consolidated 1 Oct 2026
9. MapAble canonical repository and current main branch
10. MapAble draft PR #21 — Care & Support Perceptual Frame
11. MapAble draft PR #22 — synthetic RAG runtime
12. MapAble — Feature Freeze (canonical main)
13. United Nations — CRPD Article 19: Living independently

Implementation citations on the inspected MapAble SHA: `apps/web/lib/consent/consent-service.ts` and `apps/web/lib/programmes/aura/execution-gate.ts`. On this train those equivalents are [`lib/consent/consent-service.ts`](../../../lib/consent/consent-service.ts) and [`lib/programmes/aura/execution-gate.ts`](../../../lib/programmes/aura/execution-gate.ts).
