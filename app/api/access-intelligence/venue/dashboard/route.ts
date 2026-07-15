import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { DEMO_SCENARIOS } from "@/lib/access-intelligence/demo-data";
import { isAccessIntelligenceError } from "@/lib/access-intelligence/errors";
import { calculateRemediationPriority } from "@/lib/access-intelligence/remediation-priority";
import { getAccessIntelligenceRepository } from "@/lib/access-intelligence/repositories";

const querySchema = z.object({
  placeId: z.string().min(1),
});

/**
 * Venue Studio dashboard. Demo mode is open; production should gate by venue-owner role.
 */
export async function GET(request: Request) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const placeId =
      new URL(request.url).searchParams.get("placeId") ??
      "place-mapable-community-hub";
    const parsed = querySchema.safeParse({ placeId });
    if (!parsed.success) {
      return Response.json(
        { error: "placeId is required.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }
    const dashboard = await getAccessIntelligenceRepository().getVenueDashboard(
      parsed.data.placeId,
    );
    const remediation = dashboard.remediationHints.slice(0, 3).map((hint, i) => ({
      ...hint,
      priority: calculateRemediationPriority({
        peopleAffected: 40 - i * 10,
        barrierSeverity: 4 - i,
        journeyFrequency: 4,
        evidenceConfidence: 0.7,
        estimatedEffort: 2 + i,
      }),
    }));
    return Response.json({
      roleGate: {
        required: "venue_owner_or_admin",
        demoBypass: true,
        note: "Production must enforce organisation membership for this place.",
      },
      dashboard,
      remediation,
      demoScenarios: DEMO_SCENARIOS,
    });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 400 });
    }
    return Response.json(
      { error: "Could not load venue dashboard.", code: "REPOSITORY_UNAVAILABLE" },
      { status: 503 },
    );
  }
}
