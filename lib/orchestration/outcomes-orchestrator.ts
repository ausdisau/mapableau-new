import { linkSupportActivityToGoal } from "@/lib/outcomes/support-activity-link-service";
import { isModuleEnabled } from "@/lib/feature-flags/server-feature-flag";

export async function linkActivityToOutcomeGoal(params: {
  goalId: string;
  activityType: string;
  activityId: string;
  actorUserId: string;
}) {
  if (!(await isModuleEnabled("outcomes_tracker_enabled"))) {
    return { skipped: true };
  }
  return linkSupportActivityToGoal(params);
}
