# OGC SensorThings profile

Pinned adapter profile: **OGC SensorThings API Sensing 1.1** (read path only).

## Rules

- Endpoints allowlisted; conformance checked; pagination bounded.
- `$filter` / `$select` / `$expand` safely constructed; injection blocked.
- Phenomenon time and result time remain distinct.
- Observations do not directly mutate asset status.
- No Tasking / device actuation.
