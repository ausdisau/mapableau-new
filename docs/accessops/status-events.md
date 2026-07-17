# Status events

Operational status is event-sourced via `AccessStatusEvent`. Current status is a projection.

## Rules

- Missing feed updates become `stale`, not available.
- Sensor state and operator state may conflict — conflicts remain visible.
- Planned and unplanned outages are distinct.
- Reopening requires a new event.
- Public descriptions contain no sensitive operational detail.
- Accreditation is not live status.
