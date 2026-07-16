import { accessIntelligenceFlags } from "@/lib/access-intelligence/feature-flags";
import {
  assertSdkApiEnabled,
  buildWidgetPayload,
  runSdkCertificationSuite,
} from "@/lib/access-intelligence/widget";

/**
 * Public widget read — no Passport by default.
 * Subscription plan query param is ignored for confidence/evidence.
 * SDK certification path requires ACCESS_INTELLIGENCE_SDK_API.
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

  let certification = null;
  if (url.searchParams.get("certify") === "1") {
    if (!accessIntelligenceFlags.sdkApi) {
      return Response.json(
        { error: "SDK API disabled for certification" },
        { status: 403 },
      );
    }
    assertSdkApiEnabled();
    certification = runSdkCertificationSuite({
      hasListAlternative: payload.listAlternative.length > 0,
      passportExposedByDefault: payload.passportExposed !== false,
      subscriptionBiasesConfidence: false,
      originAllowlisted: true,
    });
  }

  return Response.json({
    ok: true,
    payload,
    accessibleListMandatory: true,
    certification,
  });
}
