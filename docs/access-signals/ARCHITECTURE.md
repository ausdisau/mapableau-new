# Access Signals architecture

## Reuse

- Provenance / freshness vocabulary from `lib/access/infrastructure/` (conceptual alignment; signals module stays pure).
- `AccessPlace` remains place SoT — signals never create a second place DB.
- RAG vocabulary is **distinct** from `AccessCompatibilityState`; optional display bridge only (`compatibility-bridge.ts`).

## Boundaries

| System | Relationship |
|---|---|
| Access Passport / Accreditation | Out of scope — no diagnosis inference |
| Compatibility engine | Display bridge only; no writes |
| Navigate (PR #13) | Untouched |
| ADL `accessScore` | Documented risk; production map pages unchanged |

## Module layout

`apps/web/lib/access/signals/` — flags, types, ruleset, evaluate, fixtures, GAIS helpers, remediation.
