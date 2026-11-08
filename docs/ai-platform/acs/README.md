# Autonomous Care & Support — Stage 0 pack

**Programme:** Australian Disability Ltd / MapAble ACS  
**Paper:** 6 November 2026, technical / rights-assurance discussion paper v1.0  
**Mode:** documentation, synthetic fixtures, and freeze-compliant tests only  
**Waiver:** [W-ACS-0](./W-ACS-0.md)  
**Verdict:** Stage 0 evidence only. Stage 1 is **not** authorised.

## Contents

| Artefact                                                                   | Purpose                                                               |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [ACS_DISCUSSION_PAPER_2026-11-06.md](./ACS_DISCUSSION_PAPER_2026-11-06.md) | Filed source paper                                                    |
| [STAGE_0_EVIDENCE_MAP.md](./STAGE_0_EVIDENCE_MAP.md)                       | Inspection, threats, task inventory, operating lanes, decision ledger |
| [STAGE_0_TEST_PLAN.md](./STAGE_0_TEST_PLAN.md)                             | Exact negative cases for Stage 1 go/no-go                             |
| [STAGE_0_DIFF_PROPOSAL.md](./STAGE_0_DIFF_PROPOSAL.md)                     | Reviewable, unmerged Stage 1 design                                   |
| [W-ACS-0.md](./W-ACS-0.md)                                                 | Narrow freeze waiver for this pack                                    |
| [fixtures/breakfast-scenario.json](./fixtures/breakfast-scenario.json)     | Synthetic missed-morning-support scenario                             |

## Related (do not fork)

- [`AUTONOMY_ENVELOPE_STAGE_0.md`](../AUTONOMY_ENVELOPE_STAGE_0.md) — sibling Stage 0 map from #670; same W-ACS-0
- [`VIRTUAL_PERSONA_P00_RECONCILIATION.md`](../VIRTUAL_PERSONA_P00_RECONCILIATION.md) — C1–C8
- [`AUTONOMY_ASSURANCE_PROMPT_0_RECONCILIATION.md`](../AUTONOMY_ASSURANCE_PROMPT_0_RECONCILIATION.md)
- [`FEATURE_FREEZE.md`](../../remediation/FEATURE_FREEZE.md) — W-AA-1 remains the Autonomy Assurance product waiver
- [`OPERATING_LANES.md`](../../strategy/OPERATING_LANES.md)

## Permanent non-goals of this pack

No production migrations, live data, RAG runtime, Temporal enablement, second consent source of truth, physical or clinical control, or Stage 1 PEP implementation.
