import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listCampaignsPendingReview } from "@/lib/ads/moderation-service";
import { getAdminAdsSummary } from "@/lib/ads/reporting-service";

export async function GET(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view");

  if (view === "summary") {
    const summary = await getAdminAdsSummary();
    return jsonOk({ summary });
  }

  const campaigns = await listCampaignsPendingReview();
  return jsonOk({ campaigns });
}
