# ACS Stage 0 evidence map

**Mode:** inspection and inventory only  
**Authoring:** 8 November 2026 (Australia/Sydney)  
**This repo `main`:** `c4e5a777e1e279ea8e749bd5619e1cd50ca45f62`  
**Paper inspection repo:** `ausdisau/MapAble` @ `43ce85df6b5b09a8577b60bf29042fbc1dc96fb0`  
**Waiver:** [W-ACS-0](./W-ACS-0.md)  
**Stage 1:** not authorised

This map reuses Virtual Persona P00 conflicts **C1–C8** and Autonomy Assurance Prompt 0 source-of-truth ownership. It does not create a third consent ledger or a new operating system.

## 1. Inspection table

| Component                    | Path on this tree                                                                                                    | Reuse                             | Required work before independent private/unattended execution                     | Freeze                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------- |
| MapAble Core identity        | `lib/auth/current-user.ts`, org membership                                                                           | Keep as actor/session SoT         | Reject client-supplied role/tenant on every tool path                             | Permitted to deepen, not replace              |
| ConsentRecord                | `prisma/schema.prisma` `ConsentRecord`; [`lib/consent/consent-service.ts`](../../../lib/consent/consent-service.ts)  | Sole consent SoT                  | `checkConsent()` ignores purpose, dataScope, sourceAction, recipientType, tenant  | No second SoT                                 |
| Purpose-aware gate           | [`lib/ai/navigator/consent-gate.ts`](../../../lib/ai/navigator/consent-gate.ts) `verifyPurposeConsent`               | Closest exact-purpose pattern     | Navigator-only; empty `dataScope` = unrestricted; `tenantId` not bound on the row | Promote in Stage 1, do not fork               |
| Authority grants             | `lib/authority/participant-authority-service.ts` **and** `lib/programmes/authority/participant-authority-service.ts` | Dual writers (Prompt 0 collision) | Single evaluate path; programmes evaluator ignores org grantee                    | No third grant table                          |
| AURA harness PEP             | `lib/aura-harness/evaluate-action.ts`                                                                                | Risk γ / HITL matrix              | No live consent, Stop, or tenant join; memory can short-circuit                   | W-AA-1 deepen later; not this pack            |
| Programme Stop               | [`lib/programmes/aura/execution-gate.ts`](../../../lib/programmes/aura/execution-gate.ts)                            | Process-local flag                | Restart and multi-instance lose Stop; companion stop is device-local              | Durable Stop is Stage 1 (W-ACS-1, not issued) |
| Capability registry          | `lib/ai/platform/capabilities/**`                                                                                    | Design-time allowlists            | Metadata is not a live PEP proof                                                  | W-AA-1                                        |
| AgentRun                     | `lib/ai/agent-ops/agent-run-service.ts`                                                                              | Flag-gated evidence row           | Confirm hosting, regional data, crash recovery; not a consent DB                  | `AGENT_RUN_PERSISTENCE_ENABLED` default off   |
| Temporal                     | `lib/workflows/temporal/**`                                                                                          | Scaffold                          | `TEMPORAL_ENABLED` default false; no `@temporalio` production worker on this tree | Do not enable                                 |
| Redis                        | `lib/platform/cloud-providers.ts`                                                                                    | Optional short-lived cache        | Must not become consent/Stop SoT                                                  | Status/rate-limit only                        |
| MAIRA / BPS (perceptual)     | `docs/ai-platform/perceptual-frame/**`                                                                               | Synthetic contracts               | Proposal-only (`actionAuthority: "none"`)                                         | VP Phase 1 docs under W-AA-1                  |
| ParticipantRAG / ProviderRAG | **Absent** here; MapAble draft PR #22                                                                                | Do not merge                      | Isolation, pre-retrieval filtering, revocation invalidation                       | Outside W-AA-1 and W-ACS-0                    |
| Virtual Persona UI           | `lib/virtual-persona/**`                                                                                             | Text-first, flag off              | No live model/RAG/AgentRun                                                        | `MAPABLE_VIRTUAL_PERSONA_UI` default false    |
| Web / Expo / Electron        | `apps/web` layout via Next.js; `apps/companion`; `mobile/`                                                           | Accessible shells                 | Text/AAC complete without avatar or voice                                         | No new agent marketplace                      |
| Physical / clinical          | Research notes only                                                                                                  | Out of scope                      | Independent hardware interlocks; TGA case-by-case                                 | Permanent prohibition for LLM sole control    |

## 2. Confirmed blockers (C1–C8)

Same IDs as [`VIRTUAL_PERSONA_P00_RECONCILIATION.md`](../VIRTUAL_PERSONA_P00_RECONCILIATION.md). ACS Stage 0 does not close them.

| ID  | Finding on `c4e5a777`                                                     | Evidence                                                                                                                                                                                                               |
| --- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | Canonical `checkConsent()` matches subject + scope + active + expiry only | [`lib/consent/consent-service.ts`](../../../lib/consent/consent-service.ts) lines 145–169. `purpose` and `dataScope` are stored on grant and ignored on check. Recipient filters apply only if the caller passes them. |
| C2  | Dual `ParticipantAuthorityGrant` writers                                  | Prompt 0 ownership table; programmes vs identity authority services                                                                                                                                                    |
| C3  | Stop AURA is process-local                                                | `let programmeAuraStopped = false` in execution-gate; companion `apps/companion/src/aura/stop-aura.ts` is device-local                                                                                                 |
| C4  | Org membership ≠ participant tenancy                                      | `ConsentRecord` has no `tenantId`; Navigator requires non-empty `tenantId` for audit only                                                                                                                              |
| C5  | AURA memory can short-circuit live checks                                 | `evaluateToolAction` returns `fromMemoryMatch` before consent/Stop/tenant; fingerprint is `toolName` + payload only ([`lib/aura-harness/fingerprint.ts`](../../../lib/aura-harness/fingerprint.ts))                    |
| C6  | No purpose-specific ACS consent UX                                        | Fail closed until approved UX; keep non-AI route                                                                                                                                                                       |
| C7  | Care-support retrieval outside W-AA-1                                     | MapAble PR #22 unmerged; no `lib/ai/platform/retrieval/care-support/**` on this tree                                                                                                                                   |
| C8  | Self-learning RBAC must not write grants                                  | Propose only; humans apply                                                                                                                                                                                             |

**Additional ACS-specific gaps**

- Action kernel `evaluateActionPolicy` trusts caller-supplied `consentScopes: string[]`, not a ConsentRecord join.
- Navigator empty `dataScope` allows any field within scope — too wide for ACS protected paths.
- No capability-manifest runtime for L2 standing instructions.
- No production worker-availability signal; unknown attendance must stay unknown.

## 3. Threat model (additive)

Extends [`THREAT_MODEL.md`](../THREAT_MODEL.md). Does not replace Navigator or Guardian stubs.

| Hazard (paper §6)                           | Current behaviour                                                 | Safe Stage 1 behaviour                                                                 | Stage 0 status                  |
| ------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------- |
| Consent revoked mid-workflow                | Next `checkConsent` sees `revoked`; AURA memory may still APPROVE | Pause next protected action; invalidate cached reads/memory; offer manual path         | **Open** (C1, C5)               |
| Worker fails to attend                      | No verified roster SoT on this tree                               | Classify unknown as unknown; never fabricate confirmation                              | **Open**                        |
| Wrong participant / tenant                  | Weak if recipient omitted                                         | Deny before retrieval; alert on repeated violations without profiling disability       | **Open** (C4)                   |
| Model hallucinates eligibility or care need | Policy docs only                                                  | Label unsupported claims; no funding/clinical decisions                                | Policy held; not runtime-proven |
| Network or Redis outage                     | Process Stop lost on restart; Redis not Stop SoT today            | Preserve safe local controls; never treat stale cache as approval                      | **Open** (C3)                   |
| Temporal replay / duplicate retries         | Temporal off                                                      | Idempotency keys + fresh auth/Stop/consent on every attempt                            | Docs only                       |
| Physical assistive device fault             | Not deployed                                                      | Hardware safety; never LLM stop                                                        | Research-only                   |
| Unreachable user / AAC failure              | Not modelled as access failure                                    | Communication-access failure; configured escalation; not presumed consent              | Fixture only                    |
| Family-exclusion standing instruction       | No ACS workflow                                                   | Preserve exclusion; never contact prohibited parties because a model predicts distress | Fixture only                    |

No composite “disabled person autonomy score”. Fewer human interactions is not a success metric.

## 4. Task inventory (AURA / MAIRA / AgentRun / Temporal / RAG)

| Task                                        | Owner path               | Implemented?   | Independent execution allowed?            |
| ------------------------------------------- | ------------------------ | -------------- | ----------------------------------------- |
| Authenticate actor                          | Core session             | Yes            | Yes (existing)                            |
| Store/revoke ConsentRecord                  | `lib/consent`            | Yes            | Grant/revoke human/API only               |
| Evaluate exact purpose + fields + recipient | Navigator gate only      | Partial        | **No** for ACS                            |
| Durable Stop                                | execution-gate flag      | No             | **No**                                    |
| AURA risk matrix                            | `lib/aura-harness`       | Yes, flag off  | Not a consent PEP                         |
| MAIRA competing hypotheses                  | perceptual-frame schemas | Docs/synthetic | Proposal only                             |
| BPS time-indexed picture                    | perceptual-frame         | Docs/synthetic | Proposal only                             |
| ParticipantRAG                              | MapAble #22              | Absent here    | **No**                                    |
| ProviderRAG                                 | MapAble #22              | Absent here    | **No**                                    |
| AgentRun persist                            | `lib/ai/agent-ops`       | Gated          | Evidence only                             |
| Temporal workflow                           | `lib/workflows/temporal` | Scaffold       | **No**                                    |
| Redis fan-out                               | cloud-providers          | Optional       | Not consent                               |
| L2 standing-instruction execute             | —                        | No             | **No** until Stage 3 under a later waiver |
| Physical device actuate                     | —                        | No             | Permanent research gate                   |

## 5. Operating / legal model inventory (Decision 2)

This is **not** legal advice and does not sign Decision 2. It maps ACS stages onto [`OPERATING_LANES.md`](../../strategy/OPERATING_LANES.md).

| ACS stage                                                            | Lane                                                          | What MapAble would be operating                                             | Accountability implication                                                           |
| -------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 0 Governance (this pack)                                             | Connect documentation                                         | Coordination software design                                                | Product/docs liability only                                                          |
| 1 Deterministic trust                                                | Connect                                                       | Same; no live agent                                                         | Security/privacy owners                                                              |
| 2 Independent digital assistance (text/AAC, public search, drafts)   | **Connect**                                                   | Coordination software                                                       | Non-AI fallback required                                                             |
| 3 Pre-authorised orchestration (one reversible standing instruction) | Connect, approaching Network if a named provider is contacted | Still software if the action is participant-owned messaging under a ceiling | Provider contract not implied by a reminder                                          |
| 4 Support continuity (verified schedules, opt-in escalation)         | **Network** facilitation                                      | Marketplace/facilitation, not employment                                    | Named provider incident owner; platform facilitates reporting                        |
| 5 Home/device research                                               | Neither Connect nor Managed Support                           | Possible device developer                                                   | Separate TGA/engineering safety case                                                 |
| Managed Support                                                      | Lane 3                                                        | Direct personal support                                                     | **Blocked** until registration, workforce, insurance, complaints, safeguarding exist |
| Worker classification                                                | —                                                             | Fair Work / employment status                                               | **Unspecified** in current strategy docs; specialist advice required before Stage 4  |

Cursor cannot sign Decision 2. Accountable owner must record whether ACS is coordination software, service provider, marketplace, or device developer before Stage 3/4.

## 6. Autonomy envelope (Decision 1) — pending human signature

**Proposed, not signed:**

- First independently executable digital action: **one** reversible, opt-in, L2 standing instruction (low-risk, revocable).
- Exclude physical care, clinical care, finance, eligibility, worker assignment, restrictive practice, and L5.
- L3+ remains human-owned.
- Envelope is not in force until an accountable owner countersigns this section.

| Field               | Proposed value                                                                                          | Signature   |
| ------------------- | ------------------------------------------------------------------------------------------------------- | ----------- |
| Ceiling             | L2                                                                                                      | **Pending** |
| First workflow      | Single reversible digital standing instruction (not chosen in this pack beyond the breakfast _fixture_) | **Pending** |
| Physical / clinical | Excluded                                                                                                | **Pending** |
| L5                  | Permanent non-goal                                                                                      | **Pending** |

## 7. Decision ledger (Stage 0)

| Finding                | Status                                                 |
| ---------------------- | ------------------------------------------------------ |
| Primary paper decision | ALLOW WITH SAFEGUARDS (filed; not a production enable) |
| Envelope               | Proposed L2; **pending countersignature**              |
| Legal operating model  | Inventory only; specialist confirmation required       |
| C1–C8                  | Open                                                   |
| W-ACS-0                | This pack only                                         |
| W-ACS-1                | Previewed in the diff proposal; **not issued**         |
| Stage 1                | **Not authorised**                                     |
| MapAble #21 / #22      | Unmerged drafts; not evidence of production            |
| Public claim           | `internal_alpha` / not claimable                       |

## 8. Completion evidence for Stage 0

| Required (paper §8 Stage 0)         | This pack                                                                   |
| ----------------------------------- | --------------------------------------------------------------------------- |
| Inspect current code                | §1–2                                                                        |
| Threat model                        | §3                                                                          |
| Task inventory                      | §4                                                                          |
| Provider/worker legal model         | §5 inventory, unsigned                                                      |
| Feature-freeze waiver               | [W-ACS-0](./W-ACS-0.md)                                                     |
| Sign one autonomy-envelope decision | **Pending human signature** — agent must not sign                           |
| Exact test plan                     | [STAGE_0_TEST_PLAN.md](./STAGE_0_TEST_PLAN.md)                              |
| Reviewable diff proposal            | [STAGE_0_DIFF_PROPOSAL.md](./STAGE_0_DIFF_PROPOSAL.md)                      |
| No merges / migrations / live data  | This PR must remain unmerged for production behaviour; no Prisma migrations |
