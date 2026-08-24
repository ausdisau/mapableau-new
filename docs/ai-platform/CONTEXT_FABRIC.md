# Context Fabric

Provenance-aware operational context (perception layer) and Temporal Event Bus.

Prompt 04 implements the fabric core under `lib/ai/platform/context-fabric/`.
Prompt 05 wires **Agency Memory** as a governed personalisation source via
`agency-memory.ts` — scoped retrieval only, never full-graph injection.

## Architecture

```
Domain events / Agency Memory (confirmed)
        │
        ▼
Context Fabric (normalise, provenance, freshness, scope)
        │
        ▼
Mission Runtime / model context (minimum relevant)
```

## Agency Memory bridge

```ts
import { buildAgencyMemoryContextSlice } from "@/lib/ai/platform/context-fabric";

const slice = buildAgencyMemoryContextSlice({
  participantId,
  tenantId,
  missionId,
  purposes: ["job_application_acme"],
  maxItems: 8,
});
```

Requires:

- `MAPABLE_CONTEXT_FABRIC_ENABLED=true`
- `MAPABLE_AGENCY_MEMORY_ENABLED=true`
- `MAPABLE_AGENCY_MEMORY_MODEL_CONTEXT_ENABLED=true`

Fail-closed otherwise.

See [AGENCY_MEMORY.md](./AGENCY_MEMORY.md).
