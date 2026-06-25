import { getPlaceAccessSummary } from "@/lib/access-map/domain-score-service";
import { getPlaceById } from "@/lib/access-map/access-place-service";
import { listActiveAlertsForPlace } from "@/lib/access-alerts/access-alert-service";
import { listPublishedReportsForPlace } from "@/lib/access-reviews/access-report-service";
import { jsonError, jsonOk } from "@/lib/api/response";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params;
  const place = await getPlaceById(placeId, true);
  if (!place) return jsonError("Place not found", 404);

  const [summary, alerts, reports] = await Promise.all([
    getPlaceAccessSummary(placeId),
    listActiveAlertsForPlace(placeId),
    listPublishedReportsForPlace(placeId, 5),
  ]);

  return jsonOk({
    placeId,
    accessSummary: summary,
    activeAlerts: alerts,
    recentReports: reports.map((r) => ({
      id: r.id,
      reportType: r.reportType,
      reviewBody: r.reviewBody,
      submittedAt: r.submittedAt ?? r.createdAt,
    })),
    claimedByVenue: Boolean(place.venueProfile),
  });
}
