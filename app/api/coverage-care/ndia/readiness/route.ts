import { jsonError, jsonOk } from "@/lib/api/response";
import {
  mapCoverageCareError,
  requireCoverageCareEnabledResponse,
} from "@/lib/coverage-care/api-helpers";
import { resolveCoverageCareProviderAdmin } from "@/lib/coverage-care/demo-actor";
import { getCoverageCareNdiaReadiness } from "@/lib/coverage-care/ndia-readiness";

export async function GET() {
  const disabled = requireCoverageCareEnabledResponse();
  if (disabled) return disabled;

  const actor = await resolveCoverageCareProviderAdmin();
  if (!actor) return jsonError("Unauthorized", 401);

  try {
    return jsonOk({ readiness: getCoverageCareNdiaReadiness() });
  } catch (error) {
    return mapCoverageCareError(error);
  }
}
