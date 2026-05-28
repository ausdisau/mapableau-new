import { syncAllDispatchQueues } from "@/lib/service-planning/sync-dispatch-queues";

export async function runPlatformDispatchSync(actorUserId: string) {
  return syncAllDispatchQueues(actorUserId);
}
