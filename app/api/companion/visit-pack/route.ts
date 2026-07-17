import { jsonError, jsonOk } from "@/lib/api/response";
import {
  buildTaylorVisitPack,
  COMPANION_ARCHITECTURE,
  getMobileCapabilityProfile,
} from "@/lib/companion";
import {
  isCompanionEnabled,
  isCompanionOfflineEnabled,
} from "@/lib/config/connected-capability-flags";

export async function GET(req: Request) {
  if (!isCompanionEnabled() || !isCompanionOfflineEnabled()) {
    return jsonError("MapAble Companion offline packs are not enabled", 503);
  }

  const url = new URL(req.url);
  if (url.searchParams.get("fixture") !== "taylor") {
    return jsonError("Only synthetic fixture=taylor is available in this slice", 400);
  }

  return jsonOk({
    architecture: COMPANION_ARCHITECTURE,
    mobileCapability: getMobileCapabilityProfile(),
    visitPack: buildTaylorVisitPack(),
    storage: {
      unrestrictedLocalStorage: false,
      encryptedSecureStorage: true,
      continuousLocation: false,
      backgroundRecording: false,
    },
    productionClaimState: "synthetic",
  });
}
