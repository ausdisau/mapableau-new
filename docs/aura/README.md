# MapAble AURA

**AURA** = Accessibility · Understanding · Routing · Agency

Participant-controlled accessibility assistant for MapAble. AURA helps answer:

> Given my goal, functional access requirements, available supports, transport, destination evidence and current conditions, what options do I have, what is uncertain and what should happen next?

## ASI-ready (safety meaning)

Architecture remains governable if models become more capable at reasoning, planning, simulation and tool selection. Capability must not automatically increase authority, personal-data access, or write permission.

This does **not** create artificial superintelligence.

## Foundational rule

Agents interpret, retrieve, compare, simulate, draft and recommend.  
**Participants decide.**  
**Deterministic MapAble services execute.**

## Wave 1 (this release)

Read-only vertical slice:

| Capability | Status |
|------------|--------|
| `/ask` Accessibility Mission mode | Yes |
| CareOSMission + AuraMissionExtension | Yes |
| Capability leases | Yes |
| Authority ceiling L2_RECOMMEND | Yes |
| Proof-carrying plan + verifier | Yes |
| Stop AURA | Yes |
| Taylor @ Harbour Civic demo | Yes (synthetic) |
| Application writes / proposals | **Off** |
| Durable memory | **Off** |
| Physical actuation | **Off** |

Flags default `MAPABLE_AURA_ENABLED=false`.

## Docs

Start with [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) and [BRANCH_AND_DOMAIN_RECONCILIATION.md](./BRANCH_AND_DOMAIN_RECONCILIATION.md).

## Tests

```bash
pnpm test:aura
```
