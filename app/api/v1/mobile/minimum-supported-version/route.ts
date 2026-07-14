
import { apiSuccessResponse } from "@/lib/platform/api/errors";
import { mobileAppConfig } from "@/lib/config/mobile-app";

export async function GET() {
  return apiSuccessResponse({
    version: mobileAppConfig.minimumSupportedVersion,
  });
}
