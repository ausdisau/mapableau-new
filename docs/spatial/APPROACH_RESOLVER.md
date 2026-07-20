# Accessible Entrance and Drop-off Resolver

**Status:** synthetic civic pilot — flags default **false**  
**Production claim:** none

## Flags

- `MAPABLE_ENTRANCE_RESOLVER_ENABLED=false`
- `MAPABLE_DROP_OFF_RESOLVER_ENABLED=false`

## Pilot

Place id `harbour_civic` returns synthetic approach candidates (west entrance, forecourt drop-off, kerb pickup). All start as `inferred`.

## API

`POST /api/places/[placeId]/approach-candidates`

- `action: "list"` — list candidates (optionally inferred)
- `action: "review"` — ephemeral confirm/reject (persistence deferred)

## Rules

- Geoscape-derived candidates are never published as accessible by default
- No routing claim without route evidence
- Venue confirmation does not override participant reports
- Private-home entrances are never public
