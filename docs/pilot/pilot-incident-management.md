# Pilot incident management

Wave 7 **links** existing `IncidentReport` rows to a ControlledPilot — it does not create a second incident system.

API: `POST /api/admin/pilots/[pilotId]/incidents` with `{ incidentId }`.

Reportability state uses `PilotReportabilityState` transitions.
