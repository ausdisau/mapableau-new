# Autonomous Care & Support — Stage 0 Evidence Map

**Programme:** Australian Disability Ltd / MapAble — Autonomous Care & Support  
**Paper:** Technical / rights-assurance discussion paper v1.0 (6 November 2026)  
**Executive decision:** **ALLOW WITH SAFEGUARDS**  
**Stage:** 0 · Governance / P00 (Decision 5 only)  
**Mode:** documentation and synthetic evidence only — no merges to production behaviour, no live private data, no flag enablement  
**Inspection repo:** `ausdisau/mapableau-new`  
**Inspection tip:** `origin/main` at Stage 0 branch creation (`f12981e6` — Virtual Persona P02)  
**Related prior artefacts:** [`VIRTUAL_PERSONA_P00_RECONCILIATION.md`](../VIRTUAL_PERSONA_P00_RECONCILIATION.md), [`AUTONOMY_ASSURANCE_PROMPT_0_RECONCILIATION.md`](../AUTONOMY_ASSURANCE_PROMPT_0_RECONCILIATION.md), [`FEATURE_FREEZE.md`](../../remediation/FEATURE_FREEZE.md)

Official NDIS / CRPD / TGA / OAIC / ASD sources in the discussion paper support legal and security *principles*. They do **not** certify this architecture, MapAble deployments, or any public production claim.

---

## 1. Binding decision and autonomy ladder

| Level | Permitted | Product posture for MapAble |
|-------|-----------|-----------------------------|
| L0 Explain | Public info; explain options | Allowed; no private access |
| L1 Draft | Suggest plans; prepare messages | Allowed under participant review |
| L2 Pre-authorised | Low-risk, reversible, bounded standing instructions | **First digital workflow ceiling** after Stage 1 trust evidence |
| L3 Supervised coordination | Approved workflows with cost/contact ceilings | Later stage; not Stage 0 |
| L4 High-impact handoff | Continuity risk → authorised humans | Human-owned; AI may only escalate |
| L5 Unrestricted self-direction | Independent goals / physical / clinical | **Forbidden** — never a deployment target |

**ALLOW WITH SAFEGUARDS** means: operational autonomy only inside a participant-approved capability envelope; the model never supplies trusted role, tenant, consent, or capacity judgments.

---

## 2. Paper § mapping → current codebase

Paper citations to `apps/web/lib/...` resolve to root `lib/...` in this monorepo.

| Paper section | Expectation | Current path / artefact | Verdict |
|---------------|-------------|-------------------------|---------|
| §1 Rights boundary | Strengthen CRPD 12/19, NDIS choice & dignity of risk | Docs + Trust Fabric permanent denials (`lib/config/trust-fabric.ts`) | Present as policy; not a completed rights evaluation |
| §2 Presentation | Text/AAC-first; avatar never authority | P02 synthetic UI: `lib/virtual-persona/**`, `components/virtual-persona/**`, `app/(marketing)/virtual-persona/**` (`MAPABLE_VIRTUAL_PERSONA_UI` default false) | Synthetic only |
| §2 Control plane | Core identity, ConsentRecord, PEP | `lib/auth/current-user.ts`, `lib/consent/consent-service.ts`, `ConsentRecord`; PEP proposed in open PR #660 (`lib/aura-harness/pep/**`) | SoT present; PEP not assumed on `main` |
| §2 Perceptual intelligence | BPS picture; MAIRA competing hypotheses | Contracts: `docs/ai-platform/perceptual-frame/**`; MAIRA schema proposal-only (`actionAuthority: "none"`) | Contracts only |
| §2 Evidence plane | ParticipantRAG / ProviderRAG with pre-filter | Named future; booking/mission RAG must not generalise; shadow care RAG (MapAble PR #22) blocked | Missing for care-support |
| §2 Execution plane | AgentRun / Temporal; Redis non-consent | `lib/ai/agent-ops/agent-run-service.ts`; Temporal-named local MVP under `lib/workflows/temporal/**` (Postgres mirror); no Temporal SDK; Redis not consent DB | Partial |
| §3 Capability envelope | Versioned capability manifest | Capability registry + ARC sidecar: `lib/ai/platform/capabilities/**`; standing-instruction store **missing** | Registry present; SI store absent |
| §4 Closed loop | AURA defines / MAIRA proposes / AgentRun coordinates | AURA harness `lib/aura-harness/**`; programme gate `lib/programmes/aura/execution-gate.ts`; AgentRun evidence ledger | Gated / proposal-only |
| §5 Missed morning support | Synthetic continuity scenario | No production workflow; scenario reserved for Stage 2–4 tests | Not implemented |
| §6 Safety / red lines | No LLM sole control of clinical/physical care | Freeze + W-AA-1 permanent prohibitions; TGA purpose-specific review required later | Documented red lines |
| §7 Integration assessment | Gaps before private / distributed execution | This evidence map + P00 C1–C8 | Confirmed material blockers |

---

## 3. Reuse inventory (do not fork)

| Domain | Canonical owner |
|--------|-----------------|
| Identity / session | `lib/auth/current-user.ts` |
| Organisation membership | `lib/api/organisation-scope.ts` |
| Consent SoT | `lib/consent/consent-service.ts` + Prisma `ConsentRecord` |
| Purpose-aware Navigator pattern | `lib/ai/navigator/consent-gate.ts` (`verifyPurposeConsent`) |
| Authority (prefer single writer) | `lib/authority/participant-authority-service.ts` |
| AURA risk / HITL | `lib/aura-harness/**` |
| Programme execution ceiling | `lib/programmes/aura/execution-gate.ts` (`PROGRAMME_AURA_CEILING = SUGGEST_WITH_PARTICIPANT_APPROVAL`) |
| Agent evidence | `lib/ai/agent-ops/agent-run-service.ts` |
| Trust Fabric | `lib/config/trust-fabric.ts`, `lib/trust/fabric/**` |
| Authority ceilings | `lib/ai/platform/types/authority.ts` |
| CareOS autonomy model | `lib/intelligence/careos/policy/autonomy.ts`, `docs/careos/AUTONOMY_MODEL.md` |
| Perceptual-frame contracts | `docs/ai-platform/perceptual-frame/**` |

**Do not resurrect:** `lib/aura/` Agent OS; second consent/authority SoT; wholesale merge of Agent OS mega-branches; Redis or Temporal history as consent database; model-written grants/revocations.

---

## 4. Material gaps (blockers before Stage 1+ runtime)

Inherited from Virtual Persona P00, plus Autonomous Care Stage 0 additions:

| ID | Gap | Why it blocks independent private / distributed execution |
|----|-----|-------------------------------------------------------------|
| C1 | `checkConsent()` matches scope/subject/expiry only — ignores `purpose` / `dataScope` / `sourceAction` | Exact-purpose envelope cannot be enforced at shared SoT; Navigator helper is not universal |
| C2 | Dual `ParticipantAuthorityGrant` writers | Ambiguous delegated authority evaluation |
| C3 | Stop AURA is process-local (`programmeAuraStopped`) | No durable cross-instance stop; unsafe under multi-instance / Temporal-style replay |
| C4 | Org membership ≠ participant tenancy | Cross-tenant deny must be participant-canonical |
| C5 | AURA memory must never short-circuit live checks | Memory replacing consent/stop/tenancy is a rights failure |
| C6 | No purpose-specific AI consent UX | Fail closed until approved UX; keep non-AI alternative |
| C7 | Care-support RAG outside W-AA-1 path list | Shadow RAG needs separate narrow waiver before merge |
| C8 | Self-learning RBAC auto grant/revoke | Forbidden — humans apply grants |
| ACS-SI | No standing-instruction store / engine | L2 pre-authorised workflow cannot be participant-versioned yet |
| ACS-PEP | PEP not on `main` (open PR #660 only) | Every tool/data access needs independent policy evaluation |
| ACS-PHYS | No physical / clinical safety case | L5 and device sole-control remain research-only |

---

## 5. Threat / failure map (Stage 0 summary)

| Hazard | Required safe behaviour | Current evidence |
|--------|-------------------------|------------------|
| Consent revoked mid-workflow | Pause next protected action; invalidate cached reads | Needs Stage 1 tests; no durable invalidation yet |
| Wrong participant / tenant | Deny before retrieval | Partial org scoping; C4 open |
| Model hallucinates eligibility / care need | Label unsupported; `actionAuthority: none` | Perceptual-frame contracts enforce proposal-only |
| Network / Redis outage | Never treat stale cache as approval | Redis not consent SoT (good); must stay that way |
| Temporal replay / duplicate retries | Idempotency + fresh auth | No production Temporal agent fabric |
| Unreachable user / AAC delay | Communication failure ≠ consent or incapacity | Documented in paper + P02 honesty labels |
| Physical device fault | Hardware interlocks; trained human backup | Out of Stage 0–4 product scope |

---

## 6. Open human decisions (not coded in Stage 0)

| Decision | Status |
|----------|--------|
| D1 Autonomy envelope — one reversible digital workflow first | **Agreed in principle** by paper; product pick deferred to post–Stage 1 |
| D2 Legal operating model (coordination software / provider / marketplace / device) | **Open** — changes NDIS/TGA/contracts |
| D3 Fix consent, delegation, durable Stop, tenancy before private retrieval | **Required** — Stage 1 |
| D4 Disability-led review panel + independent privacy/a11y/security owners | **Open** organisational |
| D5 Stage 0 evidence map / test plan / waiver / diff proposal | **This artefact set** |

---

## 7. Confidence ledger

| Dimension | Confidence | Note |
|-----------|------------|------|
| Rights / control architecture | High | SoT separation and freeze align with paper |
| Bounded digital automation (≤ L2) | Moderate | Feasible after C1–C5 and SI/PEP |
| Unsupervised physical / clinical care | Low | Explicitly not a near-term target |

---

## 8. Stage 0 completion evidence

| Artefact | Path |
|----------|------|
| Evidence map | this file |
| Exact test plan | [`STAGE0_TEST_PLAN.md`](./STAGE0_TEST_PLAN.md) |
| Narrow freeze waiver draft | [`WAIVER_DRAFT_ACS_STAGE0.md`](./WAIVER_DRAFT_ACS_STAGE0.md) + freeze cross-link |
| Reviewable diff proposal | [`STAGE0_DIFF_PROPOSAL.md`](./STAGE0_DIFF_PROPOSAL.md) |

**Stage 0 does not authorise Stage 1.** No automatic progression. No production migrations, live data, or flag flips from this PR.
