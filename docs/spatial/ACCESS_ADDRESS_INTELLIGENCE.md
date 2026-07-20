# Access Address Intelligence

**Status:** controlled contracts — flags default **false**  
**Production claim:** none  
**Canonical Geoscape client:** `lib/geoscape-predictive/**` (PR #367) — do not fork

## Principle

Geoscape establishes where addresses and buildings are.  
MapAble records how disabled people can use those places.

A valid G-NAF address is **not** an accessible location.  
Inferred building or parcel candidates must never be labelled confirmed or accessible.

## Flags

| Variable                                        | Default | Role                                         |
| ----------------------------------------------- | ------- | -------------------------------------------- |
| `GEOSCAPE_PREDICTIVE_ENABLED`                   | `false` | Opt-in Predictive API                        |
| `GEOSCAPE_API_KEY`                              | empty   | Server-only key                              |
| `MAPABLE_ACCESS_ADDRESS_INTELLIGENCE_ENABLED`   | `false` | Context contracts + `/api/addresses/context` |
| `MAPABLE_ADDRESS_BUILDING_CONFIRMATION_ENABLED` | `false` | Building confirmation UX (later)             |

## Contracts

- `AddressResolutionResult` — formatted address, coords, candidates, provenance, ambiguity, `requiresConfirmation`
- `SpatialCandidate` — status vocabulary includes `inferred` … `confirmed` / `rejected` / `expired`
- `GeoscapeSourceReference` — product, endpoint, dataset, retrievedAt, attribution

## APIs

| Route                          | Role                                                 |
| ------------------------------ | ---------------------------------------------------- |
| `GET /api/search/autocomplete` | Street suggest (booking contexts) via Predictive     |
| `GET /api/addresses/resolve`   | Structured address from suggestion id                |
| `GET /api/addresses/context`   | AddressResolutionResult (intelligence flag required) |

## Non-goals (this wave)

- No AccessPlace auto-write
- No accessibility claims from Geoscape fields
- No Buildings/Parcels product calls until licensed adapters exist
- No map-only confirmation (manual text entry always available)

## Deferred competing PRs

Do not merge parallel geocoders into this train:

- #93 Google Places autocomplete — defer
- #67 Mapbox Geocoding — defer
- #222 / #309 Digital Twin — defer until spatial twin wave
- #284 / #282 Civic asset registries — defer to council waves
