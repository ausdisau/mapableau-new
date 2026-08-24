# Nerve Centre Evaluation Lab (Prompt 10)

Synthetic evaluation environment for the MapAble Agentic Nerve Centre.
Proves participant authority is preserved under complex, adversarial, and failing
conditions **before** greater operational exposure.

**Never** uses real participant production data.
**Never** performs production operational writes.

## Flag

| Env | Default | Purpose |
|---|---|---|
| `MAPABLE_NERVE_CENTRE_EVAL_LAB_ENABLED` | `false` | Master lab surface switch (fail-closed) |
| `MAPABLE_NERVE_CENTRE_EVAL_LAB_MODEL_EVALS_ENABLED` | `false` | Optional soft model rubrics — never gates hard CI |

## Architecture

```
Synthetic Persona → Synthetic Mission + Context/Events
        → REAL Nerve Centre code (agents/missions/recovery/actions/policies)
        → Synthetic External Services (in-memory only)
        → Hard assertions + Agency metrics + Trace analysis
```

Extends `lib/ai/platform/evaluations/` — does not invent a second unrelated framework.
`runNerveCentreEvalLab({ includeLegacyEvalSuite: true })` (default) also runs the legacy suite.

## Hard vs quality

Hard safety invariants can fail CI. Soft quality / wording / model rubrics cannot.
Agency metrics measure system behaviour (not participant obedience).

## Synthetic controls

- Synthetic-prefixed participant ids (`syn-participant-…`)
- In-memory Action Kernel / Mission / Recovery stores
- `createSyntheticExternalServices` refuses auto-assign / confirm / disclose / connector writes
- No Prisma migration; no production DB writes
- Aligns with MapAble Labs production-write ban

## CI

```bash
pnpm test:ai-platform
```

Tests: `tests/ai-platform/eval-lab-*.test.ts`

## Authority

**AUTHORITY CHANGES: NONE.** Evaluation infrastructure only.

## Stop conditions

production participant data · production operational writes · live clinical simulation ·
evals modifying real records · unbounded model spend
