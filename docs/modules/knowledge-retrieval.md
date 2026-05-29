# Interdependent module RAG

MapAble uses **module-scoped retrieval packs** that pull context from related product modules—not isolated silos. Each pack is a small RAG (retrieval-augmented generation) surface: structured text chunks ranked by the user’s query, filtered by **consent**, and wired through a **dependency graph**.

## Code

| Piece | Path |
|-------|------|
| Types & graph | `apps/web/lib/rag/types.ts`, `module-graph.ts` |
| Consent gates | `apps/web/lib/rag/consent-for-module.ts` |
| Mock providers (demo participant) | `apps/web/lib/rag/providers/mock-providers.ts` |
| Orchestrator | `apps/web/lib/rag/interdependent-rag-service.ts` |
| Co-Pilot wiring | `apps/web/app/api/mapable/ask/route.ts`, `lib/copilot/actionPlanner.ts` |

## Dependency graph

When retrieval runs for an **origin module**, the service also queries **dependent modules** (up to a configurable limit), for example:

- **care** → prms, consent, transport, cases, orchestration  
- **transport** → prms, consent, care, cases, access  
- **cases** → prms, consent, care, transport, incidents, billing  
- **orchestration** → care, transport, jobs, billing, calendar, prms, consent  

See `MODULE_DEPENDENCIES` in `module-graph.ts` for the full mesh.

## Consent

Each module declares required PRMS consent scopes. Dependent modules are skipped when the participant has not granted the needed scopes (billing requires `billing_plan_manager`, transport requires `transport_sharing`, etc.).

## Co-Pilot flow

1. `POST /api/mapable/ask` classifies intent → origin module (`copilotIntentToModule`).  
2. `retrieveInterdependentModuleRag` loads ranked chunks into `context.moduleRetrieval`.  
3. `planCopilotActions` appends a short cross-module context block to the plain-language answer.

Demo participant: `participant-demo-001` (mock PRMS packs only).

## Production path

Replace or extend `providers/mock-providers.ts` with:

- Vector search over case notes, service events, and documents  
- Prisma-backed loaders per module  
- Audit logging via `lib/ai-governance` and `lib/audit`

The `CaseAIEngine.search` hook in `lib/cases/ai/engine.ts` can call the same orchestrator with `originModule: "cases"` without changing API routes.

## Tests

```bash
pnpm test tests/module-interdependent-rag.test.ts
```

## Related

- [Cross-module orchestration](cross-module-orchestration.md) — transactional links between modules  
- [Case management](case-management.md) — pluggable case AI engine  
- [PRMS + Co-Pilot](../prms-copilot-integration.md) — participant context and guardrails  
