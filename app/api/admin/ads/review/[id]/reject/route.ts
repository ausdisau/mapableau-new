import { ZodError } from "zod";

import { rejectCampaign } from "@/lib/ads/ad-review-service";
import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { adReviewDecisionSchema } from "@/types/ads";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const { id } = await params;

  try {
    const body = await req.json();
    adReviewDecisionSchema.parse({ decision: "rejected", notes: body.notes });

    const campaign = await rejectCampaign({
      campaignId: id,
      reviewerId: user.id,
      notes: body.notes,
    });

    return jsonOk({ campaign });
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    return jsonError("Could not reject campaign", 500);
  }
}
