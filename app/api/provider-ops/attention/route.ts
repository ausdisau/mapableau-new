import { jsonError, jsonOk } from "@/lib/api/response";
import {
  isProviderAttentionQueueEnabled,
  isProviderOpsEnabled,
} from "@/lib/config/connected-capability-flags";
import { buildSyntheticAttentionQueue } from "@/lib/provider-ops";

export async function GET(req: Request) {
  if (!isProviderOpsEnabled() || !isProviderAttentionQueueEnabled()) {
    return jsonError("MapAble Provider attention queue is not enabled", 503);
  }

  const url = new URL(req.url);
  if (url.searchParams.get("fixture") !== "taylor") {
    return jsonError("Only synthetic fixture=taylor is available in this slice", 400);
  }

  const projection = buildSyntheticAttentionQueue();
  return jsonOk({
    projection,
    isReadOnly: true,
    participantRiskLabels: false,
    workerRankings: false,
    productionClaimState: "synthetic",
  });
}
