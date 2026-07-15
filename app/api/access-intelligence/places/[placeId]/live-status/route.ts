import { calculateLiveReliability } from "@/lib/access-intelligence/decision-engine";
import { isAccessIntelligenceError } from "@/lib/access-intelligence/errors";
import { getAccessIntelligenceRepository } from "@/lib/access-intelligence/repositories";

type Ctx = { params: Promise<{ placeId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { placeId } = await ctx.params;
    const incidents = await getAccessIntelligenceRepository().getLiveIncidents(placeId);
    const reliability = calculateLiveReliability(incidents);
    return Response.json({
      placeId,
      checkedAt: new Date().toISOString(),
      incidents,
      ...reliability,
      adapter: "demo_mock_live_feed",
      note: "Demo adapter only — not a live BMS integration.",
    });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 503 });
    }
    return Response.json(
      {
        error: "Live status unavailable.",
        code: "LIVE_STATUS_UNAVAILABLE",
        recoveryHint: "Use last verified building information.",
      },
      { status: 503 },
    );
  }
}
