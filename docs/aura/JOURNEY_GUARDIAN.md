# Journey World Model & Guardian (Wave 7)

Participant-controlled mission monitor plus a composed journey world.

## Flags

| Flag | Role |
|---|---|
| `MAPABLE_AURA_ENABLED` | Master gate |
| `MAPABLE_AURA_WORLD_MODEL_ENABLED` | Journey world composition |
| `MAPABLE_AURA_JOURNEY_GUARDIAN_ENABLED` | Guardian monitoring |
| `MAPABLE_AURA_SENSORTHINGS_ENABLED` | SensorThings ingest |

## Safety

- `processLiftOutage` enforces **mission ownership** (`participantId === userId`) before ingesting trusted SensorThings observations — blocks forged safety events
- `simulateLiftOutage` / `processLiftOutage` require a **pre-existing journey world** → `AURA_WORLD_NOT_FOUND`
- On outage, Guardian creates an alert and a **`venue_verification_request`** draft to venue reception — never auto-executes

## Meaning hash

`computeMeaningHash` includes `steps` in the SHA-256 canonical payload so adaptive presentation modes reflect route-direction changes.

## Door-to-room preflight

`runDoorToRoomPreflight` compiles `ParticipantRequirementSet` into hard constraints on the query AST. Staff-only policy exclusions are labelled separately from unverified fallbacks in the UI.
