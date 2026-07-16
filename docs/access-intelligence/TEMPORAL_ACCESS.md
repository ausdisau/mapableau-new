# Temporal access

**Module:** [`lib/access-intelligence/living/temporal.ts`](../../lib/access-intelligence/living/temporal.ts) — `getAccessStateAt(twin, visitAt)`.

Combines baseline features/edges with:

- `operatingRules` (e.g. Entrance B closes after 18:00 local)
- active / expired incidents (`LiveIncident` status + `expiresAt`)
- scheduled closures

Returns effective features, effective edges, closed element/edge ids, active incidents, and plain-language notes.

## Demo demonstrations

| Condition | Visit time | Effect |
|-----------|------------|--------|
| Entrance B open | ~10:00 Sydney | Level entry available |
| Entrance B closed | after 18:00 local | Element / edges closed |
| Main lift outage | active incident | Main-lift edges blocked; western lift remains |
| Expired incident | `expiresAt` in past | No longer blocks |

Live adapters (`lib/access-intelligence/live/`) resolve operational status separately: live → snapshot → evidence → unavailable.
