# Phase 32 — Release rings

`ProductionRelease` progresses `ring_0_internal → ring_1_canary → ring_2_pilot
→ ring_3_general_limited → ring_4_general`.

Required approvals per ring (from `lib/releases/approvals`):

| Ring | Required approvals |
|------|---------------------|
| ring_0_internal | engineering |
| ring_1_canary | engineering + safety |
| ring_2_pilot | engineering + safety + privacy |
| ring_3_general_limited | engineering + safety + privacy + security |
| ring_4_general | engineering + safety + privacy + security + executive |

Promoting to `ring_4_general` further requires `executiveApprovedById` to be
set on the release. Even so, this does not authorise any specific tenant —
tenant GA is a separate decision.
