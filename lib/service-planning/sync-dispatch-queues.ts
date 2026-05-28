import { syncOperationalQueues } from "@/lib/dispatch-console/dispatch-service";
import { isServicePlanningEnabled } from "@/lib/service-planning/config";

/** Sync all operational dispatch queue sources (care, transport, incidents). */
export async function syncAllDispatchQueues(actorUserId: string) {
  if (!isServicePlanningEnabled()) {
    return { skipped: true, reason: "SERVICE_PLANNING_DISABLED" };
  }
  return syncOperationalQueues(actorUserId);
}
