# Wave 17 migration runbook

Migration: `20260716320000_wave17_inclusive_life_planner`

Run:

- `pnpm prisma format --schema prisma/schema.prisma`
- `pnpm prisma validate --schema prisma/schema.prisma`
- `pnpm prisma generate`
- `pnpm type-check`
- `pnpm vitest run tests/participation`

The migration extends `ParticipationGoalStatus`, adds Wave 17 enums, extends `participation_goals`, and creates participation/community tables. It does not drop prior tables or remove legacy enum values.

After deploy, keep all Wave 17 flags false until human rollout approval. `WAVE17_AUTO_PUBLISH_OPPORTUNITIES` must remain false.
