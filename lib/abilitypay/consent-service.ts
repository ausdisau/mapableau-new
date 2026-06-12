import type { AbilityPayConsentScopeType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { logAbilityPayEvent } from "./audit";

export async function grantAbilityPayConsent(params: {
  subjectUserId: string;
  grantedToUserId: string;
  planId?: string;
  scope: AbilityPayConsentScopeType;
  expiresAt?: Date;
  actorUserId: string;
}) {
  const grant = await prisma.abilityPayConsentGrant.create({
    data: {
      subjectUserId: params.subjectUserId,
      grantedToUserId: params.grantedToUserId,
      planId: params.planId,
      scope: params.scope,
      expiresAt: params.expiresAt,
      isActive: true,
    },
  });

  await logAbilityPayEvent({
    action: "abilitypay.consent.granted",
    entityType: "AbilityPayConsentGrant",
    entityId: grant.id,
    actorUserId: params.actorUserId,
    participantId: params.subjectUserId,
    metadata: { scope: params.scope, grantedToUserId: params.grantedToUserId },
  });

  return grant;
}

export async function revokeAbilityPayConsent(
  grantId: string,
  actorUserId: string
) {
  const grant = await prisma.abilityPayConsentGrant.update({
    where: { id: grantId },
    data: { isActive: false },
  });

  await logAbilityPayEvent({
    action: "abilitypay.consent.revoked",
    entityType: "AbilityPayConsentGrant",
    entityId: grantId,
    actorUserId,
    participantId: grant.subjectUserId,
  });

  return grant;
}

export async function hasActiveConsent(params: {
  subjectUserId: string;
  grantedToUserId: string;
  scope: AbilityPayConsentScopeType;
  planId?: string;
}) {
  const grant = await prisma.abilityPayConsentGrant.findFirst({
    where: {
      subjectUserId: params.subjectUserId,
      grantedToUserId: params.grantedToUserId,
      scope: params.scope,
      planId: params.planId,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
  return grant !== null;
}
