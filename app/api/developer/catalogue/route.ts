import { jsonError, jsonOk } from "@/lib/api/response";
import {
  isDeveloperPlatformEnabled,
  isDeveloperSandboxEnabled,
} from "@/lib/config/connected-capability-flags";
import {
  getDeveloperPlatformShell,
  sandboxTaylorWorkflowProjection,
} from "@/lib/developer-platform";

export async function GET(req: Request) {
  if (!isDeveloperPlatformEnabled()) {
    return jsonError("MapAble Developers is not enabled", 503);
  }

  const url = new URL(req.url);
  const sandbox =
    url.searchParams.get("sandbox") === "1" && isDeveloperSandboxEnabled();

  return jsonOk({
    platform: getDeveloperPlatformShell(),
    sandboxWorkflow: sandbox ? sandboxTaylorWorkflowProjection() : null,
    partnerWrites: false,
    unrestrictedParticipantData: false,
    productionClaimState: "scaffold",
  });
}
