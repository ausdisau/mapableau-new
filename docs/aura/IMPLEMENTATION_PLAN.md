# MapAble AURA — Implementation Plan

## Purpose

**AURA** (Accessibility · Understanding · Routing · Agency) is a participant-controlled accessibility assistant. It increases cognitive capability without automatically increasing authority, personal-data access, or permission to act.

**ASI-ready** means the architecture stays safe and governable if models become more capable at reasoning, planning, simulation, and tool selection. It does **not** mean this work creates artificial superintelligence.

**Rule:** Agents interpret, retrieve, compare, simulate, draft, and recommend. Participants decide. Deterministic MapAble services execute.

## What AURA is not

- Not a separate chatbot product
- Not a second Access Intelligence, CareOS, place, consent, audit, or agent registry
- Not an ASI, autonomous case manager, clinical decision-maker, or physical controller
- Not production-ready for general participants until §Production gates pass

## Wave 0 — Reconciliation (this PR docs)

Documented in `BRANCH_AND_DOMAIN_RECONCILIATION.md`.

## Wave 1 — Read-only vertical slice (this PR code)

**In scope:**

1. Accessibility Mission mode on `/ask`
2. Request-scoped module consent (Accessibility Profile **off** by default)
3. Mission-scoped capability leases
4. Mission graph + list alternative
5. Access + Whole-Journey specialists (deterministic tool bundles)
6. Proof-carrying plan + independent verifier
7. Stop AURA (revokes leases; preserves audit)
8. Authority ceiling **L2_RECOMMEND**
9. Harbour Civic / Taylor flagship demo (synthetic)
10. Zero external/application writes; no Prisma in agent tools
11. Feature flags default safe
12. Vitest suite for boundaries, authority, access decisions, proof plan, stop, flagship

**Out of scope (later waves):** executable proposals, memory cards persistence (flag off), outcome calibration writes, physical actions, L3+ production authority.

## Architecture planes (Wave 1)

| Plane | Implementation |
|-------|----------------|
| Experience | `/ask` Accessibility Mission + dashboard shells + AURA components |
| Cognition | Optional model reasoning behind flag; deterministic planner always available |
| Authority | Authority ladder, leases, module consent, invariants |
| Execution | Disabled (`MAPABLE_AURA_WRITE_EXECUTION_ENABLED=false`) |
| Witness | In-memory + AuditEvent correlation; audit replay API |

## Canonical decisions

1. User identity unchanged
2. `CareOSMission` = mission SoT (introduced on this branch; CareOS tips align later)
3. `AccessPlace` + Access Intelligence engines authoritative for fit/route/confidence
4. `AiAccessPassport` / AccessPassport for requirements
5. `ConsentRecord` + request-scoped modules
6. `AuditEvent` witness
7. No tool receives Prisma client

## Acceptance (Taylor)

See brief §30. Deterministic expected result: **suitable_with_conditions** — Entrance B + western lift; toilet ops & reception assistance remain **unknown**; no diagnosis share; non-AI routes visible; Stop revokes leases.

## Production gates

Do not set `MAPABLE_AURA_ENABLED=true` for general production until gates in `PRODUCTION_READINESS.md` are satisfied.
