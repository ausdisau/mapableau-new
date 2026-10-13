# Access Integration Gateway

## Purpose

Prevent external accessibility/geospatial systems from becoming MapAble's canonical domain model.

```text
EXTERNAL SYSTEM
      ↓
SOURCE ADAPTER
      ↓
SCHEMA VALIDATION (Zod)
      ↓
NORMALISATION
      ↓
PROVENANCE
      ↓
MAPABLE CONTRACT (NormalizedObservation)
      ↓
GAIS / Access Infrastructure (via existing observation services)
```

## Location

`lib/integrations/access/`

## NOW providers

| Provider ID | Role |
| ----------- | ---- |
| `panoramax` | Street-level imagery evidence references |
| `project_sidewalk` | Sidewalk labels → observations (unverified) |
| `overture` | Base geography boundary (fixtures; no planet import) |
| `mapable_quests` | Native community quest answers |

## NEXT provider IDs (registered/stubbed, flags OFF)

`open311`, `odk`, `sensorthings`, `opentripplanner`, `openrouteservice`, `valhalla`

## Rules

- Never write uncontrolled external payloads to Prisma from adapters.
- Observation ≠ verified capability.
- `UNKNOWN` is first-class.
- Publication to external imagery requires `EXTERNAL_PUBLICATION_APPROVED`.
- AI / robotic survey sources remain unverified by default.
