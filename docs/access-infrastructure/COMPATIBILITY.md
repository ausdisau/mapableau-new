# Access Compatibility Engine

**Status:** deterministic evaluator behind `MAPABLE_ACCESS_COMPATIBILITY_ENGINE_ENABLED`  
**Public claim:** none  
**Code:** `lib/access/infrastructure/compatibility-engine.ts`

## Principle

Compatibility is contextual and evidence-backed. It is **never** a universal accessibility percentage score.

The system proposes. **`decisionOwner` is always `PARTICIPANT`.**

## Prompt ↔ repository vocabulary

| Prompt term | Repository state |
| --- | --- |
| `COMPATIBLE` | `compatible` |
| `COMPATIBLE_WITH_ADJUSTMENT` | `compatible_with_adjustment` |
| `UNCERTAIN` | `uncertain` |
| `KNOWN_MISMATCH` | `incompatible` |

## Per-need results

For each applicable requirement:

| Result | Meaning |
| --- | --- |
| `MATCH` | Decisive evidence satisfies the need |
| `MISMATCH` | Decisive evidence contradicts the need |
| `UNKNOWN` | Missing, stale, disputed, or weak evidence |
| `ADJUSTMENT_AVAILABLE` | An adjustment may satisfy the need |

**Unknown must never become Yes or No.**

## Overall aggregation

1. Any unresolved **required** `MISMATCH` → `incompatible`
2. Else any **required** `UNKNOWN` → `uncertain`
3. Else any **required** `ADJUSTMENT_AVAILABLE` → `compatible_with_adjustment`
4. Else → `compatible`

Preference mismatches never force `incompatible`.

## API

```http
POST /api/access-infrastructure/compatibility
```

Requires session. Evaluates the caller's Access Passport against the target entity. Persists `AccessCompatibilityRecord` when enabled.

Response always includes:

```json
{
  "decisionOwner": "PARTICIPANT",
  "participantDecisionRequired": true
}
```
