# ContinuityOS rollback

1. Set `MAPABLE_CONTINUITY_OS_ENABLED=false` (and child flags).
2. Leave additive Prisma tables in place (expand-contract).
3. `/life-events` and `/recovery` UIs become non-operational against APIs (503).
4. Existing Care/Transport/Incident flows remain unaffected.
5. Open recovery cases remain readable for audit but workers must honour stop/disabled flags.
