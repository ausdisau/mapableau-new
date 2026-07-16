# AURA — Production Readiness

## Do not enable for general participants until

- [ ] Branch/schema reconciliation with CareOS tip complete (`CareOSMission` writers unified)
- [ ] One canonical Access Passport naming cutover (AiAccessPassport → AccessPassport) decided
- [ ] Consent + audit canonical paths verified in staging
- [ ] Every tool has authority classification
- [ ] No tool has direct Prisma access (Wave 1: enforced)
- [ ] Capability leasing tested (Wave 1: unit tests)
- [ ] Participant stop tested (Wave 1: unit tests)
- [ ] Unknown preservation + diagnosis non-inference tested
- [ ] Prompt injection + tenant isolation tested
- [ ] Standard non-AI routes present (Wave 1: yes)
- [ ] Keyboard / screen-reader workflows pass (manual pilot gate)
- [ ] Audit replay passes
- [ ] Physical actuation remains disabled
- [ ] Safeguarding remains human-only
- [ ] Operational owner assigned
- [ ] Rollback documented (see ROLLBACK.md)

## Current flags (defaults)

| Flag | Default |
|------|---------|
| `MAPABLE_AURA_ENABLED` | `false` |
| `MAPABLE_AURA_PROPOSALS_ENABLED` | `false` |
| `MAPABLE_AURA_WRITE_EXECUTION_ENABLED` | `false` |
| `MAPABLE_AURA_MEMORY_ENABLED` | `false` |
| `MAPABLE_AURA_PHYSICAL_ACTIONS_ENABLED` | `false` |

## Authority ceiling (Wave 1)

**L2_RECOMMEND** — no L3+ production authority.

## Claims we do not make

- AURA is not an ASI
- AURA is not autonomous case management
- AURA is not production-ready for general participants while gates above remain open
