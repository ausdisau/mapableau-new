import { jsonError, jsonOk } from "@/lib/api/response";
import {
  buildTaylorCommunicationDevicePassport,
  createShadowRepairRequest,
} from "@/lib/at-lifecycle-os";
import {
  isAtLifecycleEnabled,
  isEquipmentPassportEnabled,
  isEquipmentRepairEnabled,
} from "@/lib/config/connected-capability-flags";

export async function GET(req: Request) {
  if (!isAtLifecycleEnabled() || !isEquipmentPassportEnabled()) {
    return jsonError("MapAble Equipment is not enabled", 503);
  }

  const url = new URL(req.url);
  if (url.searchParams.get("fixture") !== "taylor") {
    return jsonError("Only synthetic fixture=taylor is available in this slice", 400);
  }

  let passport = buildTaylorCommunicationDevicePassport();
  if (
    url.searchParams.get("repair") === "1" &&
    isEquipmentRepairEnabled()
  ) {
    passport = createShadowRepairRequest(
      passport,
      "Shadow-mode repair request — device intermittent charge."
    );
  }

  return jsonOk({
    passport,
    clinicalPrescription: false,
    mode: "shadow",
    productionClaimState: "synthetic",
  });
}
