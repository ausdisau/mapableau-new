import type { AbilityPayConsentScopeType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export class AbilityPayConsentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AbilityPayConsentError";
  }
}

export async function assertAbilityPayConsent(params: {
  subjectUserId: string;
  actorUserId: string;
  planId?: string | null;
  scope: AbilityPayConsentScopeType;
}) {
  if (params.actorUserId === params.subjectUserId) {
    return;
  }

  const grant = await prisma.abilityPayConsentGrant.findFirst({
    where: {
      subjectUserId: params.subjectUserId,
      grantedToUserId: params.actorUserId,
      scope: params.scope,
      isActive: true,
      AND: [
        { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        ...(params.planId
          ? [{ OR: [{ planId: params.planId }, { planId: null }] }]
          : []),
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  if (!grant) {
    throw new AbilityPayConsentError("CONSENT_REQUIRED");
  }
}
