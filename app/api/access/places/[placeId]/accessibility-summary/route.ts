import { jsonError, jsonOk } from "@/lib/api/response";
import { accessibilityReviewsV1Enabled } from "@/lib/config/accessibility-reviews";
import { getAccessibilitySummaryForPlace } from "@/lib/access-reviews/review-summary-service";
import { expireStaleAlerts } from "@/lib/access-reviews/issue-timeline-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  if (!accessibilityReviewsV1Enabled) {
    return jsonError("Accessibility reviews are not enabled", 404);
  }

  const { placeId } = await params;
  await expireStaleAlerts();
  const summary = await getAccessibilitySummaryForPlace(placeId);
  return jsonOk({ summary });
}
