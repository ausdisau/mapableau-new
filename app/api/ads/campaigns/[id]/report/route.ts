import { getCampaignForOrgUser } from "@/lib/ads/access";
import { getCampaignReport } from "@/lib/ads/reporting-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;
  const campaign = await getCampaignForOrgUser(id, user.id);
  if (!campaign) return jsonError("Campaign not found", 404);

  const report = await getCampaignReport(id);
  return jsonOk({ report });
}
