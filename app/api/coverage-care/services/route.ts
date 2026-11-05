import { jsonOk } from "@/lib/api/response";
import { requireCoverageCareEnabledResponse } from "@/lib/coverage-care/api-helpers";
import { listCoverageCareServices } from "@/lib/coverage-care/listing-service";

export async function GET(request: Request) {
  const disabled = requireCoverageCareEnabledResponse();
  if (disabled) return disabled;

  const url = new URL(request.url);
  const listings = listCoverageCareServices({
    discipline: url.searchParams.get("discipline") ?? undefined,
    regionQuery: url.searchParams.get("region") ?? undefined,
  });
  return jsonOk({ listings });
}
