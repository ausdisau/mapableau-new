import { calculateLiveReliability } from "@/lib/access-intelligence/decision-engine";
import { isAccessIntelligenceError } from "@/lib/access-intelligence/errors";
import { resolveLiveStatus } from "@/lib/access-intelligence/live";
import { getAccessIntelligenceRepository } from "@/lib/access-intelligence/repositories";

type Ctx = { params: Promise<{ placeId: string }> };

export async function GET(request: Request, ctx: Ctx) {
  try {
    const { placeId } = await ctx.params;
    const url = new URL(request.url);
    const subjectKind = url.searchParams.get("subjectKind") as
      | "feature"
      | "element"
      | "segment"
      | "place"
      | null;
    const subjectId = url.searchParams.get("subjectId");

    const incidents = await getAccessIntelligenceRepository().getLiveIncidents(placeId);
    const reliability = calculateLiveReliability(incidents);

    const resolved = subjectId
      ? await resolveLiveStatus({
          placeId,
          subjectKind: subjectKind ?? undefined,
          subjectId,
        })
      : await resolveLiveStatus({
          placeId,
          subjectKind: "element",
          subjectId: "hcc-lift-west",
        });

    return Response.json({
      placeId,
      checkedAt: new Date().toISOString(),
      incidents,
      ...reliability,
      live: resolved,
      adapter:
        resolved.resolution === "live"
          ? resolved.observation?.sourceKind ?? "live"
          : resolved.resolution,
      note:
        resolved.resolution === "live"
          ? "Live adapter observation (may be demo BMS when ACCESS_INTELLIGENCE_BMS_URL is unset)."
          : "Fell back from live adapters to last-known snapshot/evidence — not a claimed live BMS connection.",
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
