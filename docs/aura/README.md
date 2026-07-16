# MapAble AURA

**AURA** = Accessibility · Understanding · Routing · Agency

Participant-controlled accessibility assistant for MapAble.

## Foundational rule

Agents interpret, retrieve, compare, simulate, draft and recommend.  
**Participants decide.**  
**Deterministic MapAble services execute.**

## Wave 3 (this release)

| Capability | Status |
| --- | --- |
| Immutable action proposals (5 types) | Yes — draft only |
| Disclosure previews + purpose binding | Yes |
| Proposal verifier | Yes (`futureExecutionEligible: false`) |
| Participant shadow review | Yes — not execution approval |
| Shadow evaluation + receipts | Yes — zero side effects |
| Execution guard | Yes |
| Application writes / delivery | **Off** |
| Authority ceiling | **L3_PROPOSE** |

## Prior waves

- Wave 1: CareOSMission, leases, proof plans, Stop, Taylor@Harbour
- Wave 2: Counterfactuals, resilience, challenge, audit replay, offline packs

Flags default `MAPABLE_AURA_ENABLED=false`. Stop has no optional disable flag.

## Docs

- [WAVE_3_IMPLEMENTATION_PLAN.md](./WAVE_3_IMPLEMENTATION_PLAN.md)
- [ACTION_PROPOSALS.md](./ACTION_PROPOSALS.md)
- [SHADOW_MODE.md](./SHADOW_MODE.md)
- [EXECUTION_GUARD.md](./EXECUTION_GUARD.md)

## Tests

```bash
pnpm test:aura
```
