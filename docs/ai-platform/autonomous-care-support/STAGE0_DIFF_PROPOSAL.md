# Autonomous Care & Support — Stage 0 Reviewable Diff Proposal

**Status:** proposal only — **do not apply** in the Stage 0 PR  
**Decision:** ALLOW WITH SAFEGUARDS  
**Stage 0 PR contents:** docs under `docs/ai-platform/autonomous-care-support/**`, freeze cross-link, optional skipped test skeletons  
**Hard bans for Stage 0 PR:** no Prisma migrate deploy, no `MAPABLE_*` default true, no Vercel production promote, no merge-as-enablement

This file lists the **next** (Stage 1) PR’s intended touches after human go on Stage 0 and promotion of W-ACS-0 / W-ACS-1. Implementing these files is out of Stage 0 scope.

---

## Stage 1 trust fixes (proposed file list)

### 1. Exact-purpose consent at shared SoT (closes C1)

| Action | Path |
|--------|------|
| Extend or wrap | `lib/consent/consent-service.ts` — add purpose / dataScope / sourceAction to the shared check used by all AI gates |
| Reuse pattern from | `lib/ai/navigator/consent-gate.ts` (`verifyPurposeConsent`) — lift to shared helper; Navigator becomes a caller, not the only enforcer |
| Tests | `tests/autonomous-care-support/consent-purpose-enforcement.test.ts` |
| Non-goal | Second consent table or second SoT |

### 2. Durable cross-instance Stop AURA (closes C3)

| Action | Path |
|--------|------|
| Design + implement | Replace process-local `programmeAuraStopped` in `lib/programmes/aura/execution-gate.ts` with durable stop (participant/org scoped) readable by every instance |
| Invalidate | Cached protected reads on revoke/stop |
| Tests | `tests/autonomous-care-support/durable-stop-aura.test.ts`, `revocation-invalidation.test.ts` |
| Non-goal | Redis as consent/stop SoT; companion-only stop without server durability |

### 3. PEP wiring prerequisites (ACS-PEP)

| Action | Path |
|--------|------|
| Review / land under separate waiver | Open PR #660 PEP under `lib/aura-harness/pep/**` — evaluate before private retrieval |
| Gate every tool | Call PEP + shared consent helper before consequential tool invocation |
| Non-goal | Assume PEP merged; do not wire care RAG until C1–C5 green |

### 4. Authority writer reconciliation (closes C2)

| Action | Path |
|--------|------|
| Prefer single writer | `lib/authority/participant-authority-service.ts` |
| Retire or facade | Duplicate programme writer paths |
| Non-goal | Decision Passport as legal delegation wallet |

### 5. Participant tenancy clarity (closes C4)

| Action | Path |
|--------|------|
| Document + enforce | Canonical participant-owned tenant checks before private read |
| Tests | `tests/autonomous-care-support/cross-tenant-deny.test.ts` |

### 6. Standing-instruction envelope (ACS-SI — Stage 1 design / Stage 3 product)

| Action | Path |
|--------|------|
| Design note only in Stage 1 | Versioned SI fields: actor, participant, tool, purpose, fields, cost/contact limits, schedule, geo/device, grant revision, expiry, retries, reversibility, audit, fallback |
| Product store | Deferred to Stage 3 pre-authorised orchestration after Stage 1 trust evidence |
| Non-goal | Blanket future consent; L3+ without human ceilings |

---

## Explicitly deferred (not Stage 1)

| Item | Earliest stage |
|------|----------------|
| ParticipantRAG / ProviderRAG production path | After separate RAG waiver + Stage 1 trust |
| Temporal Cloud workers | Stage 3 after idempotency + durable stop |
| Live L2 standing-instruction workflow | Stage 3 |
| Support continuity with real provider schedules | Stage 4 |
| Home / device / physical assistive control | Stage 5 research + safety case |
| Scale / independent security-a11y-privacy go | Stage 6 |

---

## Stage 0 PR checklist (this change)

- [x] `STAGE0_EVIDENCE_MAP.md`
- [x] `STAGE0_TEST_PLAN.md`
- [x] `WAIVER_DRAFT_ACS_STAGE0.md`
- [x] `STAGE0_DIFF_PROPOSAL.md` (this file)
- [x] Freeze cross-link in `FEATURE_FREEZE.md`
- [x] Optional `tests/autonomous-care-support/*.test.ts` with `describe.skip` / `it.todo` only
- [ ] Human review of Stage 0 artefacts
- [ ] Promote waiver / open Stage 1 PR (future)

---

## Reviewer notes

Stage 0 is successful if reviewers can: (1) see where the paper maps onto `main`, (2) know which negative tests Stage 1 must pass, (3) know what is *not* waived, and (4) reject any attempt to merge runtime enablement under this PR’s cover.
