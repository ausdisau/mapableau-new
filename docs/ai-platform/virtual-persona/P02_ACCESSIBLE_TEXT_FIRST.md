# P02 — Accessible text-first Virtual Persona (synthetic)

**Status:** synthetic UI pilot, default-off, not claimable as production AI.  
**Depends on:** P00 reconciliation (docs). **P01 PEP:** not implemented — this phase deliberately avoids protected retrieval and live adapters.

## Scope

- Text-first conversation workspace at `/virtual-persona`
- Deterministic synthetic adapter (no model credentials)
- State machine, turn validation (`actionAuthority: "none"`)
- Participant controls: edit/reject draft, opt out of AI, stop, non-AI fallback, human-support info
- Feature flag `MAPABLE_VIRTUAL_PERSONA_UI` (`=== "true"`, default off)

## Non-goals

- Live ParticipantRAG / ProviderRAG / AgentRun
- P01 server PEP enforcement for private data (blocked until P01 lands)
- Voice, video avatar, biometrics
- Booking, payment, consent writes, permission grants
- Production deployment

## Architecture

| Layer | Path | Responsibility |
|-------|------|----------------|
| Flag | `lib/config/virtual-persona.ts` | Fail-closed enablement |
| Contracts | `lib/virtual-persona/types.ts`, `validate-turn.ts` | Versioned turn schema |
| State | `lib/virtual-persona/state-machine.ts`, `controller.ts` | Deterministic transitions |
| Adapter | `lib/virtual-persona/synthetic-adapter.ts`, `fixtures.ts` | Fixture replies |
| UI | `components/virtual-persona/**` | Accessible workspace |
| Route | `app/(marketing)/virtual-persona/page.tsx` | Gated mount |

UI never decides permissions. Client does not trust role/tenant headers for access control (no protected API in P02).

## Accessibility

- Keyboard-operable Send / Stop / Clear / Retry / controls
- AAC-friendly composer (no timeout)
- `aria-live` status region (polite; not character streaming)
- Visible focus rings; min 44px touch targets
- Non-AI link to `/ask`
- Meaning not dependent on avatar animation (static mark only)

## Rollback

1. Unset `MAPABLE_VIRTUAL_PERSONA_UI` (or leave false).
2. Revert this PR. No migrations.

## Tests

```bash
pnpm exec vitest run tests/virtual-persona
```
