# Virtual Persona — Delivery State Ledger

Standing development ledger for MapAble Next-Generation Virtual Persona (P00–P08).
Update after every authorised work unit. Do not treat this file as release approval.

## Repository tips

| Tip | SHA / ref | Notes |
|-----|-----------|-------|
| mapableau-new `main` (delivery) | `f12981e6` at P01 branch cut | P00 #658 + P02 #659 merged |
| ausdisau/MapAble `main` (canonical monorepo) | `43ce85df` | No VP P00/P02 code yet; PR #21/#22 open drafts |
| This work branch | `cursor/vp-p01-pep-enforcement-ac5c` @ `a6afefee` (PR #660) | P01 PEP |

## Phase status

| Phase | Status | Evidence | Gate |
|-------|--------|----------|------|
| P00 Reconciliation | **Done** | `VIRTUAL_PERSONA_P00_RECONCILIATION.md`, `perceptual-frame/**`, PR #658 | Freeze docs under W-AA-1 |
| P01 PEP | **Implemented (flag off)** | `lib/aura-harness/pep/**`, `ADR_P01_PEP.md`, tests under `tests/aura-harness/pep/` | Synthetic deny suite green; not wired to live routes; flag off |
| P02 Text-first UI | **Done** | `lib/virtual-persona/**`, PR #659 | Flag `MAPABLE_VIRTUAL_PERSONA_UI` off |
| P03 Permission-scoped RAG | **Blocked** | Needs P01 + retrieval-path waiver | No private embeddings/RAG without waiver |
| P04 AgentRun Temporal/Redis | Blocked | Depends on P01 + P03 | — |
| P05 Memory / personalisation | Blocked | Depends on P01–P04 | — |
| P06 Policy recommendations | Blocked | Shadow only; never auto-apply | — |
| P07 RN / Electron / multimodal | Blocked | Text/AAC foundation first | — |
| P08 Assurance / pilot go-no-go | Blocked | Human-owned | — |

## Active flags (all default OFF)

| Flag | Purpose |
|------|---------|
| `MAPABLE_VIRTUAL_PERSONA_UI` | P02 synthetic UI |
| `MAPABLE_PEP_ENABLED` | P01 Policy Enforcement Point |

## Outstanding conflicts (not resolved in P01)

- **C1** — bare `checkConsent` ignores purpose (PEP uses purpose-aware path instead)
- **C2** — dual `ParticipantAuthorityGrant` writers (identity vs programmes); PEP uses identity SoT only
- **C3** — Stop AURA is process-local
- **C4** — org membership ≠ participant tenancy (PEP requires non-empty tenant + membership for delegates)

## Next safe task after this unit

P03 design + narrow freeze waiver for `lib/ai/platform/retrieval/**` only after P01 tests green and human waiver. Do not wire live RAG or enable production flags without separate approval.

## Rollback (P01)

1. Leave `MAPABLE_PEP_ENABLED` unset / `false` (default).
2. Revert the P01 PR / commits if needed.
3. No Prisma migrations in this unit — no schema rollback required.
