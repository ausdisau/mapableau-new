import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { physicalErrorResponse } from "@/lib/access-intelligence/physical/api-helpers";
import { getPhysicalConfigurationSnapshot } from "@/lib/access-intelligence/physical/configuration";

export async function GET() {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    return Response.json({
      configuration: getPhysicalConfigurationSnapshot(),
      fictionalNotice:
        "Harbour Civic Centre Physical Systems use labelled fictional devices and simulated actuation only.",
    });
  } catch (error) {
    return physicalErrorResponse(error);
  }
}
