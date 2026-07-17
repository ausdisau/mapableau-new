# Incident response

Operational and security incident tracking for assurance.

## Models

- `IncidentReport` — participant-facing incident intake
- `OperationalIncident` — operational/security incidents
- `SecurityFinding` — may link to incident reports
- `IncidentResponseExercise` — tabletop exercise records

## Policy

- Possible reportable incidents flagged via `possibleReportableIncident`
- Rollback policy references on-call notification (`lib/assurance/go-live/rollback-policy.ts`)

## Admin

`/admin/assurance/incidents`

**Disclaimers**

- Internal readiness ≠ certification, registration, or NDIA approval.
- Feature flags ≠ readiness. No AI agent may sign or approve production go-live.
- Incident records in MapAble do not satisfy NDIS Commission notification obligations without human review.
