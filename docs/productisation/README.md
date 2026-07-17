# MapAble Productisation and Connected Service Programme

**Positioning:** Care and support, connected.  
**Strategic lanes:** [docs/strategy/OPERATING_LANES.md](../strategy/OPERATING_LANES.md)

## Wave 0 deliverables (this folder + ConvergenceOS)

- [PR action ledger](../remediation/PR_ACTION_LEDGER.md)
- [Leadership train reconciliation](../remediation/LEADERSHIP_TRAIN_RECONCILIATION.md)
- [Productisation merge train](../convergence-os/PRODUCTISATION_MERGE_TRAIN.md)
- [Public claim registry](../convergence-os/PUBLIC_CLAIM_REGISTRY.md)
- [Capability registry (human mirror)](./CAPABILITY_REGISTRY.md)
- Capability honesty extensions in `lib/convergence-os/seed/capabilities.ts`
- Strategy docs under `docs/strategy/`

## Landed productisation train (on main)

1. #312 — registries, supersession, no product schema
2. #313 — encryption, Zod, tenant scope, IDOR
3. #314 — Communication Passport → readiness (no assign)
4. #327 — Care/Transport/Billing slices, Companion foundation, Provider Ops, Starting Work synthetic
5. #331 — strategy / operating lanes / capability honesty
6. #328 — Trust Fabric access receipts
7. #329 — Persistent Access Evidence Envelope

## Leadership train (cleared on main)

1. #330 — Database-backed Starting Work projection (`20260717140000`)
2. #341 — Persistent Transport quotes (`20260717150000`)
3. #346 — Recurring Care schedules (`20260717160000`)

See [LEADERSHIP_TRAIN_RECONCILIATION.md](../remediation/LEADERSHIP_TRAIN_RECONCILIATION.md) and
[MOAT_PR_RECONCILIATION.md](./MOAT_PR_RECONCILIATION.md).

## Mission Portfolio (next train)

Registry and shared boundaries: [docs/mission-portfolio/README.md](../mission-portfolio/README.md).

## Controlled pilot

Starting Work — Taylor at Harbour Civic Centre.
See [STARTING_WORK_PILOT.md](./STARTING_WORK_PILOT.md).  
**Honesty:** synthetic/fixtures by default (`MAPABLE_STARTING_WORK_SYNTHETIC_ONLY`);
DB projection is gated and not production_supported.

## Hard rules

- Feature flags and documentation are not production evidence.
- Managed Support ≠ Network facilitation.
- No fabricated NDIS registration claims for MapAble.
- Process-local transport quotes are not a durable quote store.
