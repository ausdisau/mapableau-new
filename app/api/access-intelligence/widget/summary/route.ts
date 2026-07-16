import { accessIntelligenceFlags } from "@/lib/access-intelligence/feature-flags";
import { buildWidgetPayload } from "@/lib/access-intelligence/widget";

/**
 * Public widget read — no Passport by default.
 * Subscription plan query param is ignored for confidence/evidence.
 */
export async function GET(request: Request) {
  if (!accessIntelligenceFlags.widget) {
    return Response.json({ error: "Feature disabled" }, { status: 403 });
  }
  const url = new URL(request.url);
  const accessPlaceId = url.searchParams.get("accessPlaceId") ?? "";
  if (!accessPlaceId) {
    return Response.json({ error: "accessPlaceId required" }, { status: 400 });
  }

  const payload = buildWidgetPayload({
    accessPlaceId,
    placeName: url.searchParams.get("placeName") ?? "Place",
    subscriptionPlan: url.searchParams.get("plan") ?? undefined,
    features: [
      {
        type: "step_free",
        summary: "Step-free entrance",
        source: "assessor",
        observedAt: "2026-01-15",
        confidenceLabel: "good",
        unknown: false,
      },
      {
        type: "lift",
        summary: "Unknown",
        source: "none",
        observedAt: null,
        confidenceLabel: "very limited",
        unknown: true,
      },
    ],
    incidents: [],
  });

  return Response.json({
    ok: true,
    payload,
    accessibleListMandatory: true,
  });
}
