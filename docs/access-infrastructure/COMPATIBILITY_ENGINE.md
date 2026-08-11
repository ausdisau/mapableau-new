# Compatibility engine

**Status:** deterministic application logic (no LLM authority)  
**Code:** [`lib/access/infrastructure/engine/evaluate.ts`](../../lib/access/infrastructure/engine/evaluate.ts)

## Input

- Access Passport requirements (participant-confirmed functional needs)
- Activity / vertical context tags
- Target capabilities (evidence-backed)
- Available adjustments
- Evidence freshness / dispute status

## Finding results

| Result | Meaning |
| --- | --- |
| `match` | Capability satisfies requirement with usable evidence |
| `mismatch` | Capability contradicts requirement |
| `unknown` | Missing, stale, disputed, or past review-due evidence |
| `adjustment_available` | Barrier may be addressed by an evidence-backed adjustment |

## Overall state

| State | Rule |
| --- | --- |
| `incompatible` | Any REQUIRED mismatch without viable adjustment |
| `uncertain` | No unresolved REQUIRED mismatch, but REQUIRED unknown remains |
| `compatible_with_adjustment` | All REQUIRED needs satisfiable if adjustments accepted |
| `compatible` | All REQUIRED needs matched without additional adjustment |

Preferences never promote to hard fail.

## Decision owner

Always **PARTICIPANT**. The engine recommends; it does not book, assign, reject, or disclose.

## Prohibited

- Universal accessibility score as truth
- Diagnosis as a matching input
- Silent conversion of unknown → pass/fail
- LLM as authoritative decision maker
