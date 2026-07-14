
import { apiSuccessResponse } from "@/lib/platform/api/errors";
import {
  isMobileAuthContext,
  requireMobileAuth,
} from "@/lib/mobile/auth";
import {
  mobileAppConfig,
  mobileFeatureFlagPayload,
} from "@/lib/config/mobile-app";

export async function GET(req: Request) {
  const auth = await requireMobileAuth(req);
  if (!isMobileAuthContext(auth)) return auth;

  const navigationMode =
    auth.role === "support_worker" && mobileAppConfig.workerEnabled
      ? "worker"
      : auth.role === "support_coordinator" && mobileAppConfig.coordinatorEnabled
        ? "coordinator"
        : "participant";

  return apiSuccessResponse({
    appRole: auth.role,
    organisationId: auth.organisationId,
    participantId: auth.participantId,
    flags: mobileFeatureFlagPayload(),
    minimumSupportedVersion: mobileAppConfig.minimumSupportedVersion,
    humanHelpPhone: process.env.MAPABLE_HUMAN_HELP_PHONE ?? null,
    navigationMode,
  });
}
