import { z } from "zod";

import { requireAdvertiserAccess } from "@/lib/ads/auth/advertiser-access";
import { userHasAdsPermission } from "@/lib/ads/auth/ads-permissions";
import {
  assertManagerEnabled,
  managerDisabledResponse,
} from "@/lib/ads/manager/flag-gate";
import {
  assertLifecycleTransition,
  type ManagerLifecycleStatus,
} from "@/lib/ads/manager/lifecycle";
import {
  recordCreativeReviewDecision,
  SelfApprovalError,
} from "@/lib/ads/manager/review";
import { OrganisationAccessError } from "@/lib/api/organisation-scope";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { apiForbidden, apiUnauthorized, getApiUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  advertiserId: z.string().min(1),
  creativeId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED", "CHANGES_REQUESTED"]),
  reasonCodes: z.array(z.string()).default([]),
  notes: z.string().max(2000).optional(),
});

/** POST /api/ads/manager/campaigns/[id]/review — human review; no self-approval. */
export async function POST(request: Request, context: Ctx) {
  if (!assertManagerEnabled()) return managerDisabledResponse();

  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!userHasAdsPermission(user, "ads:review")) {
    return apiForbidden("Missing ads:review");
  }

  const { id } = await context.params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await requireAdvertiserAccess(user, parsed.data.advertiserId);
  } catch (err) {
    if (err instanceof OrganisationAccessError) {
      return apiForbidden(err.message);
    }
    throw err;
  }

  const campaign = await prisma.adCampaign.findFirst({
    where: { id, advertiserId: parsed.data.advertiserId },
    include: { creatives: true },
  });
  if (!campaign) return jsonError("Campaign not found", 404);
  const creative = campaign.creatives.find((c) => c.id === parsed.data.creativeId);
  if (!creative) return jsonError("Creative not found", 404);

  try {
    const review = await recordCreativeReviewDecision({
      creativeId: creative.id,
      reviewerId: user.id,
      campaignCreatedByUserId: campaign.createdByUserId,
      decision: parsed.data.decision,
      reasonCodes: parsed.data.reasonCodes,
      notes: parsed.data.notes,
    });

    const nextLifecycle: ManagerLifecycleStatus =
      parsed.data.decision === "APPROVED"
        ? "APPROVED"
        : parsed.data.decision === "REJECTED"
          ? "REJECTED"
          : "CHANGES_REQUESTED";

    let fromStatus = campaign.lifecycleStatus as ManagerLifecycleStatus;
    if (fromStatus === "DRAFT" || fromStatus === "VALIDATING") {
      assertLifecycleTransition(fromStatus, "AWAITING_REVIEW");
      fromStatus = "AWAITING_REVIEW";
    }
    assertLifecycleTransition(fromStatus, nextLifecycle);

    await prisma.$transaction([
      prisma.adCreative.update({
        where: { id: creative.id },
        data: {
          status:
            parsed.data.decision === "CHANGES_REQUESTED"
              ? "PENDING_REVIEW"
              : parsed.data.decision,
          reviewedAt: new Date(),
          reviewedBy: user.id,
        },
      }),
      prisma.adCampaign.update({
        where: { id: campaign.id },
        data: {
          lifecycleStatus: nextLifecycle,
          lifecycleVersion: { increment: 1 },
          status:
            parsed.data.decision === "APPROVED"
              ? "APPROVED"
              : parsed.data.decision === "REJECTED"
                ? "REJECTED"
                : "PENDING_REVIEW",
        },
      }),
    ]);

    await createAuditEvent({
      actorUserId: user.id,
      actorRole: user.primaryRole as never,
      action: "ads.creative.reviewed",
      entityType: "AdCreative",
      entityId: creative.id,
      metadata: {
        decision: parsed.data.decision,
        reasonCodes: parsed.data.reasonCodes,
        reviewId: review.id,
      },
    });

    return jsonOk({
      reviewId: review.id,
      decision: parsed.data.decision,
      lifecycleStatus: nextLifecycle,
    });
  } catch (err) {
    if (err instanceof SelfApprovalError) {
      return jsonError(err.message, 403);
    }
    return jsonError(err instanceof Error ? err.message : "Review failed", 409);
  }
}
