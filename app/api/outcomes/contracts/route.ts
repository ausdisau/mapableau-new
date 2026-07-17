import { jsonError, jsonOk } from "@/lib/api/response";
import {
  isOutcomeContractsEnabled,
  isOutcomesEnabled,
} from "@/lib/config/connected-capability-flags";
import { taylorFirstDayOutcome } from "@/lib/outcomes-ledger";

export async function GET(req: Request) {
  if (!isOutcomesEnabled() || !isOutcomeContractsEnabled()) {
    return jsonError("MapAble Outcomes contracts are not enabled", 503);
  }

  const url = new URL(req.url);
  if (url.searchParams.get("fixture") !== "taylor") {
    return jsonError("Only synthetic fixture=taylor is available in this slice", 400);
  }

  const { contract } = taylorFirstDayOutcome();
  return jsonOk({
    contract,
    successScore: null,
    productionClaimState: "synthetic",
  });
}
