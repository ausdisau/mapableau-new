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

## Wave 1 (complete)

Read-only vertical slice: CareOSMission, leases, proof plans, verifier, Stop, Taylor@Harbour demo. Writes/proposals/memory/physical **off**.

## Wave 2 (this release)

| Capability                     | Status                                           |
| ------------------------------ | ------------------------------------------------ |
| Deterministic counterfactuals  | Yes (simulated; no real-state mutation)          |
| Route / journey resilience     | Yes (plan/environment — not participant scoring) |
| Bounded plan challenge         | Yes (one cycle / plan version; no CoT)           |
| Stop AURA + receipt + abort    | Yes (mandatory when AURA enabled)                |
| Hash-chained audit replay      | Yes (structured; no hidden reasoning)            |
| Offline Visit Packs            | Yes (HTML/print; stale warnings)                 |
| Application writes / proposals | **Off**                                          |
| Authority ceiling              | **L2_RECOMMEND**                                 |

Flags default `MAPABLE_AURA_ENABLED=false`. Stop has no optional disable flag.

## Docs

- [WAVE_2_IMPLEMENTATION_PLAN.md](./WAVE_2_IMPLEMENTATION_PLAN.md)
- [COUNTERFACTUAL_ENGINE.md](./COUNTERFACTUAL_ENGINE.md)
- [RESILIENCE_ASSESSMENT.md](./RESILIENCE_ASSESSMENT.md)
- [BOUNDED_PLAN_CHALLENGE.md](./BOUNDED_PLAN_CHALLENGE.md)
- [STOP_PROTOCOL.md](./STOP_PROTOCOL.md)
- [AUDIT_REPLAY.md](./AUDIT_REPLAY.md)
- [OFFLINE_VISIT_PACKS.md](./OFFLINE_VISIT_PACKS.md)
- [ROLLBACK.md](./ROLLBACK.md)

## Tests

```bash
pnpm test:aura
```
