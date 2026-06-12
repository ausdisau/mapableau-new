import type { MapAbleUserRole } from "@prisma/client";

import { billingCoreConfig } from "@/lib/billing-core/config";
import { createCustomerPortalSession } from "@/lib/billing-core/portal-service";
import { prisma } from "@/lib/prisma";

import { logAbilityPayEvent } from "./audit";
import { resolveFundingModel, supportsStripeSavedPaymentMethods } from "./funding-model";

export type AbilityPayBillingPortalResult =
  | { ok: true; portalUrl: string }
  | { ok: false; error: string; code?: "NOT_APPLICABLE" | "STRIPE_NOT_CONFIGURED" };

function participantIdForPortal(params: {
  actorUserId: string;
  actorRole: MapAbleUserRole;
  participantId?: string;
}) {
  if (
    params.actorRole === "plan_manager" ||
    params.actorRole === "mapable_admin"
  ) {
    return params.participantId;
  }
  return params.actorUserId;
}

export async function createAbilityPayBillingPortalSession(params: {
  actorUserId: string;
  actorRole: MapAbleUserRole;
  participantId?: string;
  returnPath?: string;
}): Promise<AbilityPayBillingPortalResult> {
  const participantId = participantIdForPortal(params);
  if (!participantId) {
    return {
      ok: false,
      error: "Participant is required for billing portal access",
      code: "NOT_APPLICABLE",
    };
  }

  const plan = await prisma.abilityPayParticipantPlan.findFirst({
    where: { participantId, status: "active" },
    orderBy: { updatedAt: "desc" },
    select: { fundingModel: true },
  });

  const model = resolveFundingModel({
    planFundingModel: plan?.fundingModel,
  });
  if (!supportsStripeSavedPaymentMethods(model)) {
    return {
      ok: false,
      error: "Saved cards are only available for self-managed and private-pay plans",
      code: "NOT_APPLICABLE",
    };
  }

  const returnUrl = params.returnPath
    ? `${billingCoreConfig.appUrl}${params.returnPath.startsWith("/") ? params.returnPath : `/${params.returnPath}`}`
    : `${billingCoreConfig.appUrl}/abilitypay/payment-methods`;

  const result = await createCustomerPortalSession({
    userId: participantId,
    role: "participant",
    returnUrl,
    createCustomerIfMissing: true,
  });

  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      code: result.error === "Stripe is not configured"
        ? "STRIPE_NOT_CONFIGURED"
        : undefined,
    };
  }

  await logAbilityPayEvent({
    action: "abilitypay.billing_portal.opened",
    entityType: "BillingAccount",
    entityId: participantId,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    participantId,
    metadata: { returnUrl },
  });

  return { ok: true, portalUrl: result.portalUrl };
}
