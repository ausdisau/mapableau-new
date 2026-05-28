import { allocationConfig } from "@/lib/config/allocation";
import { phase5Config } from "@/lib/config/phase5";
import { phase6Config } from "@/lib/config/phase6";

export const servicePlanningConfig = {
  enabled: process.env.SERVICE_PLANNING_ENABLED !== "false",
  careAllocation: allocationConfig,
  routeOptimisation: phase5Config.routeOptimisationEnabled,
  dispatchConsole: phase6Config.dispatchConsoleEnabled,
  aiMatchingRequireHumanReview: phase5Config.aiMatchingRequireHumanReview,
};

export function isServicePlanningEnabled(): boolean {
  return servicePlanningConfig.enabled;
}
