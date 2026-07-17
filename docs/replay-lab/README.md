# MapAble Replay Lab

> A safe rehearsal environment for testing disability-support journeys before they affect real people.

Replay Lab (Mission Simulator) runs **synthetic**, **deterministic**, **inspectable** scenarios across communication, care, workforce, transport, access, continuity, billing, and authority boundaries.

## Quick start (developers)

```bash
pnpm test:replay-lab
```

Enable the accessible timeline UI at `/replay-lab`:

```bash
MAPABLE_REPLAY_LAB_ENABLED=true
MAPABLE_REPLAY_LAB_MODE=synthetic
MAPABLE_REPLAY_SCENARIO_DSL_ENABLED=true
MAPABLE_REPLAY_VIRTUAL_CLOCK_ENABLED=true
```

Optional domain adapters (still synthetic-only; no production writes):

```bash
MAPABLE_REPLAY_DOMAIN_ADAPTERS_ENABLED=true
```

## Foundations reused

- Taylor persona: `fixture:taylor` / `fixture:taylor-harbour-v1`
- Harbour precinct: `lib/access-intelligence-next/graph/harbour-fixture.ts`
- Flag / permanent-deny pattern: Access Intelligence Next
- See [WAVE0_RECONCILIATION.md](./WAVE0_RECONCILIATION.md)

## Docs

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [SAFETY_BOUNDARY.md](./SAFETY_BOUNDARY.md)
- [WAVE0_RECONCILIATION.md](./WAVE0_RECONCILIATION.md)

## Non-goals

- Not a production event store
- Not regulatory certification
- Not demographic prevalence data
- Not an AI release gate
