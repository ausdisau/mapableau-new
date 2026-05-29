import { prisma } from "@/lib/prisma";
import { auditIntegrationAction } from "@/lib/integrations/integration-audit-service";

const PROVIDER = "wix";

export async function linkWixIdentity(input: {
  userId: string;
  externalSubjectId: string;
  email?: string;
}) {
  await prisma.identityProviderLink.upsert({
    where: {
      provider_externalSubjectId: {
        provider: PROVIDER,
        externalSubjectId: input.externalSubjectId,
      },
    },
    create: {
      userId: input.userId,
      provider: PROVIDER,
      externalSubjectId: input.externalSubjectId,
      externalEmail: input.email,
    },
    update: {
      externalEmail: input.email,
    },
  });

  await auditIntegrationAction({
    integrationKey: "wix",
    action: "identity_linked",
    actorUserId: input.userId,
    metadata: { externalSubjectId: input.externalSubjectId },
  });
}

export async function findPendingEmailCollision(email: string) {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  const pending = await prisma.authIdentityLink.findFirst({
    where: { email, status: "pending" },
  });
  return { existingUser, pending };
}

export async function createPendingIdentityLink(input: {
  externalId: string;
  email: string;
}) {
  return prisma.authIdentityLink.create({
    data: {
      provider: PROVIDER,
      externalId: input.externalId,
      email: input.email,
      status: "pending",
    },
  });
}
