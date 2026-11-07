# Autonomous Care & Support — Stage 2 Digital Assistance Evidence

**Depends on:** Stage 1 trust evidence (`STAGE1_TRUST_EVIDENCE.md`)  
**Decision:** ALLOW WITH SAFEGUARDS — L0/L1 only  
**Flags:** `MAPABLE_VIRTUAL_PERSONA_UI` and `MAPABLE_VIRTUAL_PERSONA_PUBLIC_SEARCH` default **false**

## Delivered

| Capability | Implementation |
|------------|----------------|
| Text/AAC-first persona | Existing P02 workspace + Stage 2 fixtures |
| Deterministic public search | `lib/virtual-persona/public-search.ts` — private queries denied before candidates |
| L1 draft / edit | Draft fixtures remain `executable: false`, `actionAuthority: "none"` |
| Non-AI fallback | Fallback turn + `/ask` path unchanged |
| Breakfast continuity (§5) | `SYNTHETIC_BREAKFAST_CONTINUITY_TURN` — excludes family contact |

## Tests

```bash
pnpm exec vitest run tests/autonomous-care-support/stage2-digital-assist.test.ts tests/virtual-persona
```

## Hard bans still in force

No private RAG, no L2 standing-instruction auto-execute, no Temporal Cloud, no clinical/physical tools, no production claim language, no flag default true.

## Go/no-go for Stage 3

Stage 3 (pre-authorised L2) requires Stage 1 negatives green, this Stage 2 evidence, SI store design sign-off, and a separate narrow waiver.
