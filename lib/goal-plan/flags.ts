/**
 * Goal Plan -> Access exploration handoff.
 * Default off and client-visible only; no server authority is granted by this flag.
 */
export function isGoalPlanAccessHandoffEnabled(
  env: {
    NEXT_PUBLIC_MAPABLE_GOAL_ACCESS_HANDOFF_ENABLED?: string;
  } = {
    NEXT_PUBLIC_MAPABLE_GOAL_ACCESS_HANDOFF_ENABLED:
      process.env.NEXT_PUBLIC_MAPABLE_GOAL_ACCESS_HANDOFF_ENABLED,
  },
): boolean {
  return env.NEXT_PUBLIC_MAPABLE_GOAL_ACCESS_HANDOFF_ENABLED === "true";
}
