# AURA — ROLLBACK

## By capability

| Capability | Flag |
| --- | --- |
| Counterfactuals | `MAPABLE_AURA_COUNTERFACTUALS_ENABLED=false` |
| Resilience | `MAPABLE_AURA_RESILIENCE_ENABLED=false` |
| Plan challenge | `MAPABLE_AURA_PLAN_CHALLENGE_ENABLED=false` |
| Audit replay UI | `MAPABLE_AURA_AUDIT_REPLAY_ENABLED=false` |
| Offline packs | `MAPABLE_AURA_OFFLINE_PACKS_ENABLED=false` |
| Proposals | `MAPABLE_AURA_PROPOSALS_ENABLED=false` |
| Proposal review | `MAPABLE_AURA_PROPOSAL_REVIEW_ENABLED=false` |
| Shadow evaluation | `MAPABLE_AURA_SHADOW_EVALUATION_ENABLED=false` |

Keep write/delivery/physical **false**.

**Do not disable Stop AURA while AURA remains enabled.**

Disable AURA entirely: `MAPABLE_AURA_ENABLED=false`.

Additive proposal/shadow/audit tables may remain dormant. Do not delete historical proposal, review, receipt, or audit records.
