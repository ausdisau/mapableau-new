import type { AccessMarkerSummary } from "@/lib/access-markers/types";

/**
 * Build a transport planning deep-link for the MapAble Transport module.
 * Falls back to the new-trip form with destination query params.
 */
export function buildPlanAccessibleTransportUrl(
  summary: AccessMarkerSummary
): string {
  const params = new URLSearchParams();
  params.set("placeId", summary.placeId);
  params.set("destinationName", summary.name);
  if (summary.latitude != null && summary.longitude != null) {
    params.set("destinationLat", String(summary.latitude));
    params.set("destinationLng", String(summary.longitude));
  }
  if (summary.preferredAccessibleEntrance) {
    params.set("preferredEntrance", summary.preferredAccessibleEntrance);
  }
  if (summary.accessibleDropoffPoint) {
    params.set("accessibleDropoff", summary.accessibleDropoffPoint);
  }
  if (summary.activeAlerts.length) {
    params.set(
      "accessWarnings",
      summary.activeAlerts.map((a) => a.body).join(" | ").slice(0, 500)
    );
  }
  params.set("accessScore", String(Math.round(summary.overallScore)));
  params.set("confidenceScore", String(Math.round(summary.confidenceScore)));
  params.set("from", "access-marker");

  return `/dashboard/transport/new?${params.toString()}`;
}
