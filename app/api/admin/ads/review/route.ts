import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listCampaignsPendingReview } from "@/lib/ads/ad-review-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const campaigns = await listCampaignsPendingReview();
  return jsonOk({ campaigns });
}
