import { logAuthBridgeEvent } from "@/lib/auth/auth-audit-service";
import { prisma } from "@/lib/prisma";

export interface LinkedIdentityView {
  id: string;
  auth0UserId: string;
  provider: string;
  email: string | null;
  linkedAt: Date;
  lastUsedAt: Date | null;
}

export async function getLinkedIdentities(profileId: string): Promise<LinkedIdentityView[]> {
  const links = await prisma.authIdentityLink.findMany({
    where: { profileId },
    orderBy: { linkedAt: "asc" },
  });

  return links.map((link) => ({
    id: link.id,
    auth0UserId: link.auth0UserId,
    provider: link.provider,
    email: link.email,
    linkedAt: link.linkedAt,
    lastUsedAt: link.lastUsedAt,
  }));
}

export async function linkIdentityToProfile(input: {
  profileId: string;
  auth0UserId: string;
  provider: string;
  email?: string | null;
}) {
  const existing = await prisma.authIdentityLink.findUnique({
    where: { auth0UserId: input.auth0UserId },
  });

  if (existing && existing.profileId !== input.profileId) {
    throw new Error("IDENTITY_ALREADY_LINKED");
  }

  const link = await prisma.authIdentityLink.upsert({
    where: { auth0UserId: input.auth0UserId },
    create: {
      profileId: input.profileId,
      auth0UserId: input.auth0UserId,
      provider: input.provider,
      email: input.email ?? null,
      lastUsedAt: new Date(),
    },
    update: {
      email: input.email ?? undefined,
      lastUsedAt: new Date(),
    },
  });

  await logAuthBridgeEvent({
    profileId: input.profileId,
    eventType: "identity_linked",
    source: "account_linking_service",
    provider: input.provider,
  });

  return link;
}

export async function unlinkIdentity(input: {
  profileId: string;
  linkId: string;
}) {
  const links = await prisma.authIdentityLink.findMany({
    where: { profileId: input.profileId },
  });

  if (links.length <= 1) {
    throw new Error("LAST_IDENTITY_CANNOT_BE_UNLINKED");
  }

  const target = links.find((link) => link.id === input.linkId);
  if (!target) {
    throw new Error("LINK_NOT_FOUND");
  }

  await prisma.authIdentityLink.delete({ where: { id: target.id } });

  await logAuthBridgeEvent({
    profileId: input.profileId,
    eventType: "identity_unlinked",
    source: "account_linking_service",
    provider: target.provider,
    metadata: { auth0UserId: target.auth0UserId },
  });
}

export async function confirmEmailLink(input: {
  profileId: string;
  auth0UserId: string;
  provider: string;
  email: string;
}) {
  const user = await prisma.user.findUnique({ where: { id: input.profileId } });
  if (!user || user.email.toLowerCase() !== input.email.toLowerCase()) {
    throw new Error("EMAIL_MISMATCH");
  }

  return linkIdentityToProfile(input);
}
