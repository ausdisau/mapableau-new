import type { SsoProvider } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { remainingSystemsConfig } from "@/lib/config/remaining-systems";
import { createAuditEvent } from "@/lib/audit/audit-event-service";

export async function linkProviderIdentity(params: {
  userId: string;
  provider: SsoProvider;
  providerUserId: string;
  email?: string;
}) {
  if (!remainingSystemsConfig.enterpriseSsoEnabled) {
    throw new Error("SSO_DISABLED");
  }

  const link = await prisma.authIdentityLink.upsert({
    where: {
      provider_providerUserId: {
        provider: params.provider,
        providerUserId: params.providerUserId,
      },
    },
    create: params,
    update: { email: params.email },
  });

  await prisma.authProviderEvent.create({
    data: {
      userId: params.userId,
      eventType: "provider_linked",
      provider: params.provider,
    },
  });

  await createAuditEvent({
    actorUserId: params.userId,
    action: "auth.provider_linked",
    entityType: "AuthIdentityLink",
    entityId: link.id,
    metadata: { provider: params.provider },
  });

  return link;
}

export async function countLoginMethods(userId: string): Promise<number> {
  const links = await prisma.authIdentityLink.count({ where: { userId } });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  const hasPassword = Boolean(user?.passwordHash);
  return links + (hasPassword ? 1 : 0);
}
