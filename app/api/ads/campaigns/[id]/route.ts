import { getCampaignForOrgUser } from "@/lib/ads/access";
import { updateCampaign as updateCampaignService } from "@/lib/ads/campaign-service";
import { updateCampaignSchema } from "@/lib/ads/schemas";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;
  const campaign = await getCampaignForOrgUser(id, user.id);
  if (!campaign) return jsonError("Campaign not found", 404);

  return jsonOk({ campaign });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateCampaignSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = await updateCampaignService(user, id, parsed.data);
  if (!result.ok) return jsonError(result.error, 400);

  return jsonOk({ campaign: result.campaign });
}
