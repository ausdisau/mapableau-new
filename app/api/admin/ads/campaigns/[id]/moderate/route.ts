import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { moderateCampaign } from "@/lib/ads/moderation-service";
import { moderateCampaignSchema } from "@/lib/ads/schemas";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const { id } = await params;
  const body = await req.json();
  const parsed = moderateCampaignSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = await moderateCampaign(user.id, id, parsed.data);
  if (!result.ok) return jsonError(result.error, 400);

  return jsonOk({ campaign: result.campaign });
}
