import { jsonError, jsonOk } from "@/lib/api/response";
import {
  isOutcomeReceiptsEnabled,
  isOutcomesEnabled,
} from "@/lib/config/connected-capability-flags";
import { taylorFirstDayOutcome } from "@/lib/outcomes-ledger";

export async function GET(req: Request) {
  if (!isOutcomesEnabled() || !isOutcomeReceiptsEnabled()) {
    return jsonError("MapAble Outcomes receipts are not enabled", 503);
  }

  const url = new URL(req.url);
  if (url.searchParams.get("fixture") !== "taylor") {
    return jsonError("Only synthetic fixture=taylor is available in this slice", 400);
  }

  const { receipt } = taylorFirstDayOutcome();
  return jsonOk({
    receipt,
    immutable: true,
    providerEditable: false,
    productionClaimState: "synthetic",
  });
}
