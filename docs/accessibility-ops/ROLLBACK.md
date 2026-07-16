# Rollback

1. Set `MAPABLE_ACCESSIBILITY_OPS_ENABLED=false` (hard deny all ops APIs/UI mutations).
2. Leave registry tables dormant — do not drop in the same release as cutover.
3. Disable CI workflow `accessibility-ops-shadow.yml`.
4. Runner secret rotation: change `MAPABLE_ACCESSIBILITY_OPS_RUNNER_SECRET` and pin.
5. Memory store resets on process restart; Prisma rows remain until explicit retirement.

No production release gates exist in Wave 1, so rollback cannot unblock a previously blocked deploy.
