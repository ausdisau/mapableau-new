import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { createDemoPassports } from "@/lib/access-intelligence/demo-data";
import { physicalErrorResponse } from "@/lib/access-intelligence/physical/api-helpers";

export async function GET() {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const passports = createDemoPassports(userId);
    return Response.json({
      passports,
      fictionalNotice:
        "Demo passports for Physical Systems planning. Functional requirements only — no diagnosis inference.",
    });
  } catch (error) {
    return physicalErrorResponse(error);
  }
}
