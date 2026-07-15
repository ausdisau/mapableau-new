# Access Intelligence — Architecture

## Layering

```
UI (Ask / Explore / Passport / Pulse / Venue Studio / Visit Plans)
  → API routes (auth + Zod validation)
    → Services (decision-engine, routing, repositories)
      → Demo adapter | Prisma ai_* tables (future)
    → Agent (ToolLoopAgent) orchestrates read tools; write tools needApproval
```

## Key boundaries

| Concern | Owner |
|---------|--------|
| Suitability status | `decision-engine` (deterministic) |
| Confidence | `confidence-engine` / decision-engine wrappers |
| Routing | `routing` / `route-engine` |
| Ontology labels | `ontology.ts` |
| LLM prose | Agent only — never invents suitability |
| Accreditation score | Display-only baseline; never auto-maps to personal fit |

## Cross-service reuse

Export from `lib/access-intelligence` for Transport, Care, Jobs, Kids adapters later:

- `evaluateAccessDecision`
- `buildAccessibleRoute`
- passport load/ownership
- live incident adapter interface (demo mock today)

## Geospatial

MVP indoor graphs are TypeScript Dijkstra over JSON coordinates. Prisma tables are ready; PostGIS columns are documented in DATA_MODEL.md for future outdoor segments.
