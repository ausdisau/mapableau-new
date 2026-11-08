import { z } from "zod";

import { requireAdvertiserAccess } from "@/lib/ads/auth/advertiser-access";
import { userHasAdsPermission } from "@/lib/ads/auth/ads-permissions";
import {
  assertManagerEnabled,
  managerDisabledResponse,
} from "@/lib/ads/manager/flag-gate";
import {
  assertLifecycleTransition,
  ForbiddenLifecycleTransitionError,
  MANAGER_LIFECYCLE_STATUSES,
  type ManagerLifecycleStatus,
} from "@/lib/ads/manager/lifecycle";
import { OrganisationAccessError } from "@/lib/api/organisation-scope";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { apiForbidden, apiUnauthorized, getApiUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  advertiserId: z.string().min(1),
  to: z.enum(MANAGER_LIFECYCLE_STATUSES),
});

/** POST /api/ads/manager/campaigns/[id]/lifecycle — server-owned transitions. */
export async function POST(request: Request, context: Ctx) {
  if (!assertManagerEnabled()) return managerDisabledResponse();

  const user = await getApiUser();
  if (!user) return apiUnauthorized();

  const { id } = await context.params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const spendTransitions: ManagerLifecycleStatus[] = [
    "AUTHORISING",
    "READY_TO_SUBMIT",
    "SUBMITTING",
  ];
  if (spendTransitions.includes(parsed.data.to)) {
    if (!userHasAdsPermission(user, "ads:spend:approve")) {
      return apiForbidden("Missing ads:spend:approve");
    }
  } else if (!userHasAdsPermission(user, "ads:campaigns:write")) {
    return apiForbidden("Missing ads:campaigns:write");
  }

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
  });
  if (!campaign) return jsonError("Campaign not found", 404);

  try {
    assertLifecycleTransition(
      campaign.lifecycleStatus as ManagerLifecycleStatus,
      parsed.data.to,
    );
  } catch (err) {
    if (err instanceof ForbiddenLifecycleTransitionError) {
      return jsonError(err.message, 409);
    }
    throw err;
  }

  const updated = await prisma.adCampaign.update({
    where: { id: campaign.id },
    data: {
      lifecycleStatus: parsed.data.to,
      lifecycleVersion: { increment: 1 },
    },
  });

  await createAuditEvent({
    actorUserId: user.id,
    actorRole: user.primaryRole as never,
    action: "ads.campaign.lifecycle",
    entityType: "AdCampaign",
    entityId: campaign.id,
    metadata: {
      from: campaign.lifecycleStatus,
      to: parsed.data.to,
      version: updated.lifecycleVersion,
    },
  });

  return jsonOk({
    id: updated.id,
    lifecycleStatus: updated.lifecycleStatus,
    lifecycleVersion: updated.lifecycleVersion,
  });
}
