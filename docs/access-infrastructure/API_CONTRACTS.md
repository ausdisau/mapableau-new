# Access Infrastructure API contracts

**Status:** contract specification (shadow / flag-gated)  
**Public claim:** none — partner production APIs require Lane 4 Developer Platform promotion  
**Code:** `packages/contracts` · `lib/access/infrastructure/` · planned routes under `/api/access-infrastructure/*`

## Design principles

- Zod at every boundary.
- Thin `app/api/**/route.ts` handlers.
- Attribute-level consent before returning passport attributes.
- Never return diagnosis as a matching input.
- Never return a universal accessibility score as a consequential decision.
- Unknown / stale evidence must surface as `uncertain`, not false certainty.

## Experience API mapping

`mapable.com.au` uses these BFF routes as the Access Experience surface (not a parallel stack):

```text
My Access      → GET/PATCH /api/access-infrastructure/passport
Places         → /api/access/places + GET .../places/{id}/capabilities
Compatibility  → POST /api/access-infrastructure/compatibility
Ontology       → GET /api/access-infrastructure/ontology
```

## Resource surface

```http
GET  /api/access-infrastructure/ontology          # live (flag-gated)
GET  /api/access-infrastructure/domains           # live (flag-gated)
GET  /api/access-infrastructure/passport          # live (flag-gated, owner-only)
PATCH /api/access-infrastructure/passport         # live (flag-gated, owner-only)
GET  /api/access-infrastructure/places/{placeId}/capabilities  # live (flag-gated; no passport data)
POST /api/access-infrastructure/compatibility     # live (flag-gated, session)
GET  /api/access-infrastructure/entities/{entityType}/{entityId}/capabilities  # planned
POST /api/access-infrastructure/journeys/evaluate # planned
GET  /api/access-infrastructure/evidence/{observationId}  # planned
GET  /api/access-infrastructure/adjustments       # planned
```

Partner-oriented Lane 4 aliases (future promotion):

```http
GET /access/places/{placeId}
GET /access/routes
GET /access/compatibility
GET /access/features
GET /access/evidence
GET /access/disruptions
```

These partner paths must not go live without Developer Platform auth, claim discipline, and Access Infrastructure Council sign-off.

## Compatibility request / response

### Request

```json
{
  "schemaVersion": "1.0",
  "passportId": "…",
  "entityType": "place",
  "entityId": "…",
  "context": {
    "activity": "job_interview",
    "journeyId": null
  }
}
```

### Response

```json
{
  "schemaVersion": "1.0",
  "state": "compatible_with_adjustment",
  "required": { "met": [], "unmet": [], "uncertain": [] },
  "preferences": { "met": [], "unmet": [], "uncertain": [] },
  "adjustments": [{ "id": "…", "summary": "Table service available" }],
  "evidenceRefs": ["…"],
  "limitations": ["Synthetic / shadow evaluation"],
  "participantDecisionRequired": true,
  "decisionOwner": "PARTICIPANT"
}
```

## Ontology response

Extends existing `/api/access-intelligence-next/ontology` with:

- `framework: "access_as_infrastructure"`
- `domains`: twenty canonical domains
- `ontology`: `ACCESS_ONTOLOGY_CURRENT` (v2)
- `legacyOntology`: v1 retained for alias resolution
- `productionClaim: "none"`

## Flag gates

| Flag | Purpose | Default |
| --- | --- | --- |
| `MAPABLE_ACCESS_INFRASTRUCTURE_ENABLED` | Master switch | OFF |
| `MAPABLE_ACCESS_PASSPORT_ENABLED` | Passport read/write + `/my-access` | OFF |
| `MAPABLE_ACCESS_CAPABILITIES_ENABLED` | Capability/observation reads | OFF |
| `MAPABLE_ACCESS_COMPATIBILITY_ENGINE_ENABLED` | Compatibility evaluation + place panel | OFF |
| `MAPABLE_ACCESS_JOURNEY_ENGINE_ENABLED` | Whole-journey evaluation (unused) | OFF |
| Deferred Omni/Care/Transport/Jobs/Ask flags | Stubs only | OFF |
| Existing Access Intelligence Next flags | Compilers / AQL / graph / preflight | OFF |

Permanent deny flags remain: AI execution authority, universal score, diagnosis inference.
