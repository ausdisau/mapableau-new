# Narrow freeze waiver draft — ACS Stage 0 (W-ACS-0)

**Status:** DRAFT — requires human signature before any Stage 1 product code lands  
**Waiver ID:** W-ACS-0  
**Programme:** Autonomous Care & Support (ALLOW WITH SAFEGUARDS)  
**Parent freeze:** [`FEATURE_FREEZE.md`](../../remediation/FEATURE_FREEZE.md)  
**Related active waiver:** W-AA-1 (AI Autonomy Assurance — docs/harness deepen; flags default false)

This draft does **not** lift the global feature freeze. It only records the intended narrow scope for Stage 0 artefacts already aligned with W-AA-1 documentation/testing under `docs/ai-platform/**`.

---

## Authorised (Stage 0)

| Field | Value |
|-------|-------|
| Domain | Autonomous Care & Support — Stage 0 governance artefacts |
| Paths | `docs/ai-platform/autonomous-care-support/**`; optional `tests/autonomous-care-support/**` skeletons marked `describe.skip` / `it.todo` only |
| Schema | None |
| Flags | No new flags; existing `MAPABLE_*` remain default **false** |
| Public claim | `not_claimable` — principles docs only; no certification or production autonomy claim |
| Stack | Single docs PR; do not deepen other product stacks |
| Rollback | Revert docs/test-skeleton commit; no runtime behaviour change |

Stage 0 may document the evidence map, exact test plan, this waiver draft, and a reviewable Stage 1 diff *proposal*. Optional todo/skip tests document expected Stage 1 behaviour without asserting a green SoT.

---

## Explicitly not waived

| Item | Reason |
|------|--------|
| MapAble / care-support shadow RAG (PR #22) merge | Needs separate retrieval waiver (C7) |
| Production consent schema migrations / migrate deploy | Stage 1+ after human go |
| Durable Stop AURA implementation merge | Stage 1 product PR after signature |
| Temporal Cloud / `@temporalio` production workers | Out of Stage 0–1 unless separately waived |
| Redis as consent, authority, or stop database | Permanent prohibition |
| Physical / clinical / device sole-control | Research-only; TGA/safety case required |
| Flag enablement (`MAPABLE_AURA_HARNESS`, Virtual Persona, care RAG, etc.) | Fail closed |
| Marketing site / DNS / Vercel production promote | Unrelated programme |
| Second consent or authority SoT | Freeze permanent |
| Model-written grants, capacity inference, autonomous payments/safeguarding/assignment | W-AA-1 permanent prohibitions |
| Merge of this PR to `main` without review | Reviewable only until humans approve |

---

## Human signature gate (Stage 1)

Before any Stage 1 trust-fix code (shared purpose consent helper, durable stop, PEP wiring, SI store) may land:

1. Disability-led / accountable owner reviews Stage 0 artefacts.
2. Security and privacy owners acknowledge C1–C5 blockers.
3. This waiver is promoted from DRAFT to Active in `FEATURE_FREEZE.md` with named approver and date — **or** Stage 1 proceeds under an explicit new waiver ID (W-ACS-1) with path enumeration.
4. Legal Decision 2 (operating model) is recorded even if “deferred”; silence is not approval.

Until then, Stage 1 file touches listed in [`STAGE0_DIFF_PROPOSAL.md`](./STAGE0_DIFF_PROPOSAL.md) remain **proposal only**.

---

## Relationship to W-AA-1

W-AA-1 already covers related `docs/ai-platform/**` documentation/testing for Autonomy Assurance and Virtual Persona Phase 1 contracts. W-ACS-0 clarifies that Autonomous Care & Support Stage 0 artefacts under `docs/ai-platform/autonomous-care-support/**` sit in that documentation scope and do **not** expand runtime paths, retrieval, or production enablement.
