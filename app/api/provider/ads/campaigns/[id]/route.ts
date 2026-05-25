import { ZodError } from "zod";

import { updateProviderCampaign } from "@/lib/ads/campaign-service";
import { submitCampaignForReview } from "@/lib/ads/ad-review-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { updateAdCampaignSchema } from "@/types/ads";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateAdCampaignSchema.parse(body);

    const memberships = await prisma.organisationMember.findMany({
      where: { userId: user.id },
      select: { organisationId: true },
    });
    const orgIds = memberships.map((m) => m.organisationId);

    const campaign = await updateProviderCampaign({
      campaignId: id,
      organisationIds: orgIds,
      actorUserId: user.id,
      input: parsed,
    });

    if (body.submitForReview === true) {
      await submitCampaignForReview({
        campaignId: id,
        actorUserId: user.id,
      });
    }

    return jsonOk({ campaign });
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    if (error instanceof Error && error.message === "CAMPAIGN_NOT_FOUND") {
      return jsonError("Campaign not found", 404);
    }
    if (error instanceof Error && error.message.startsWith("PROHIBITED_TARGETING")) {
      return jsonError("Targeting uses prohibited sensitive fields", 400);
    }
    return jsonError("Could not update campaign", 500);
  }
}
