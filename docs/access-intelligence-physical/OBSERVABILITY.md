# Observability — Physical Systems

## Goals

Detect mode misuse, kernel deny spikes, dispatch failures, and SLO burn — without logging Access Passport contents or other sensitive personal data.

## Metrics (minimum set)

| Metric | Type | Labels (safe) |
|--------|------|---------------|
| `ai_physical_mode` | gauge | `mode` |
| `ai_physical_safety_decisions_total` | counter | `allowed`, `check_code` |
| `ai_physical_actions_transitions_total` | counter | `from`, `to` |
| `ai_physical_actions_terminal_total` | counter | `state` (`succeeded`\|`failed`\|`timed_out`\|`cancelled`) |
| `ai_physical_dispatch_latency_ms` | histogram | `adapter_id`, `mock` |
| `ai_physical_approval_wait_ms` | histogram | `action_type` |
| `ai_physical_idempotency_hits_total` | counter | — |
| `ai_physical_adapter_errors_total` | counter | `adapter_id`, `code` |
| `ai_physical_observations_total` | counter | `source_type` |
| `ai_physical_sse_disconnects_total` | counter | — |
| `ai_physical_live_flag` | gauge | `enabled` (0/1) |

Use placeId hashes or internal ids sparingly; prefer venue cohort labels in multi-tenant pilots.

## Logs

**Allowed:** action id, placeId, elementId, mode, actor role, check codes, HTTP status, adapter id, mock/connected flags, error codes.

**Forbidden (no passport logging):**

- Passport JSON or requirement lists
- Health notes / diagnosis strings
- Raw chat transcripts
- Photo/video binaries or EXIF
- Full street addresses beyond placeId
- Consent field values beyond field **keys** already approved

## Traces

Optional span around Gateway `dispatching` with adapter id only. Do not attach tool args that contain passport objects.

## Alerts (supervised pilot)

- Live flag flipped unexpectedly
- Spike in `kernel_internal_error` denies
- Dispatch timeout rate above SLO
- Approval wait P95 above SLO
- Adapter `connected=true` while mode is demo

## Related

[SLOS.md](./SLOS.md) · [CONSENT_AND_PRIVACY.md](./CONSENT_AND_PRIVACY.md) · [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)
