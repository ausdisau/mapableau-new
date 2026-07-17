import { jsonError, jsonOk } from "@/lib/api/response";
import { getAcademyCatalogueShell, getAcademySsoArchitecture } from "@/lib/academy";
import { isAcademyEnabled } from "@/lib/config/connected-capability-flags";

export async function GET() {
  if (!isAcademyEnabled()) {
    return jsonError("MapAble Academy is not enabled", 503);
  }

  return jsonOk({
    catalogue: getAcademyCatalogueShell(),
    sso: getAcademySsoArchitecture(),
    productionClaimState: "scaffold",
  });
}
