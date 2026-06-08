import { listCampaignsForOrganisation, createCampaign } from "@/lib/ads/campaign-service";
import { createCampaignSchema } from "@/lib/ads/schemas";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const organisationId = new URL(req.url).searchParams.get("organisationId");
  if (!organisationId) {
    return jsonError("organisationId is required", 400);
  }

  const campaigns = await listCampaignsForOrganisation(organisationId);
  return jsonOk({ campaigns });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json();
  const organisationId = body.organisationId as string | undefined;
  if (!organisationId) return jsonError("organisationId is required", 400);

  const parsed = createCampaignSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = await createCampaign(user, organisationId, parsed.data);
  if (!result.ok) return jsonError(result.error, 400);

  return jsonOk({ campaign: result.campaign }, 201);
}
