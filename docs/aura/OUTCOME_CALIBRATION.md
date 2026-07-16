# AURA — OUTCOME CALIBRATION

See also: [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md), [BRANCH_AND_DOMAIN_RECONCILIATION.md](./BRANCH_AND_DOMAIN_RECONCILIATION.md).

## Summary

MapAble **AURA** (Accessibility · Understanding · Routing · Agency) is a participant-controlled accessibility assistant. It is **ASI-ready** in the safety sense: capability growth must not automatically expand authority, personal-data access, or write permission.

**Foundational rule:** Agents interpret, retrieve, compare, simulate, draft and recommend. Participants decide. Deterministic MapAble services execute.

## Wave 1 status

Wave 1 (read-only) ships on branch `cursor/mapable-aura-wave1-6ea8`:

- CareOSMission as canonical mission SoT (+ AuraMissionExtension)
- Capability leases; authority ceiling **L2_RECOMMEND**
- Proof-carrying plans + independent verifier
- Stop AURA protocol
- Accessibility Mission mode on `/ask`
- Taylor @ Harbour Civic synthetic flagship
- **No** application writes; **no** Prisma in agent tools; physical actuation **off**

## Topic focus: OUTCOME CALIBRATION

This document covers **OUTCOME CALIBRATION** for AURA operators and reviewers. Production enablement requires gates in PRODUCTION_READINESS.md. Do not claim AURA is an ASI, autonomous case management, or generally production-ready while release gates remain open.

## Related paths

- `lib/aura/`
- `app/api/intelligence/aura/`
- `components/aura/`
- `tests/aura/`
