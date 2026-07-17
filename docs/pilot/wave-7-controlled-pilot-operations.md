# Wave 7 — Controlled Pilot Operations

MapAble NDIS Gateway **Wave 7** adds organisation-scoped `ControlledPilot` runtime authority for limited, fail-closed pilot operations.

## Non-negotiable rules

- **Pilot approval ≠ production approval.** Approving a ControlledPilot does not authorise production NDIA claiming or national go-live.
- **Empty allowlists deny.** Empty `supportItemAllowlist`, `fundingRouteAllowlist`, or `integrationProfileIds` deny all matching traffic.
- **Limited live off by default.** `limitedLiveEnabled` defaults to `false` in schema and API create payloads.
- **No AI enrolment/approval.** Humans record decisions; services refuse AI auto-transition.
- **Wave 6 assessments are optional string refs** (`assuranceAssessmentId`, `goLiveAssessmentId`). Wave 6 is not implemented in-product.
- **`NdiaPilotApprovalRecord` is not ControlledPilot authority.** Legacy NDIA readiness must never authorise claims or pilot gates.
- **No real NDIA submission** from Wave 7 pilot surfaces. There is no “Submit to NDIA” control on pilot admin/participant UIs.

## Surface area

| Area | Path |
| --- | --- |
| Core libraries | `lib/pilot/*` |
| Admin APIs | `/api/admin/pilots/*` |
| Participant APIs | `/api/participant/pilots/*` |
| Admin UI | `/admin/pilot` |
| Participant UI | `/participant/pilots` |
| Enforcement flag | `PILOT_ENFORCEMENT_ENABLED` (default `false`) |

## Related docs

See sibling files in `docs/pilot/` for lifecycle, enrolment, limits, gateway, ops, safety, change, finance, and closure.
