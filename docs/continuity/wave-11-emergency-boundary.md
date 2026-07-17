# Wave 11 — Emergency boundary

AURA (including every specialist) MUST NOT invoke emergency services. Blocked action slugs:

- `emergency.dispatch`
- `emergency.contact_000`
- `emergency.call_ambulance`
- `emergency.call_police`
- `emergency.call_fire`
- `emergency.mental_health_crisis_dispatch`
- `emergency.after_hours_safety_line`

The `service_recovery` specialist manifest lists these in `prohibitedActionSlugs`. The `EmergencyBoundaryError` throws if any code path tries to invoke one, or if a plan narrative claims an emergency action.

Cases at safety thresholds are escalated to a human safety officer via `escalateContinuityCase({ reason: "emergency_boundary_reached" })`.
