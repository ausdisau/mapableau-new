# Support Intelligence v0.1 — Rollback

1. Set `MAPABLE_SUPPORT_INTEL_KILL_SWITCH=true` or unset `MAPABLE_SUPPORT_INTEL_ENABLED`.
2. Confirm `/api/support-intelligence/status` shows `live: false`.
3. Keep migration `20261128050000_support_intelligence_v01` applied (forward-only).
4. Do not delete `support_intel_*` or `AuditEvent` rows.
5. Redeploy prior application SHA only if a code defect remains after flags are off.
