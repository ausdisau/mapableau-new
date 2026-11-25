import { z } from "zod";

import type { adidIdentity } from "@/lib/auth/adid-config";
import { normalizeAuthEmail } from "@/lib/auth/auth-flow";
import { oauthOnlyPasswordHash } from "@/lib/auth/ensure-oauth-user";
import {
  JURISDICTION_DEFAULTS,
  type MapAbleJurisdiction,
} from "@/lib/config/nz-schemes";
import { prisma } from "@/lib/prisma";

type VerifiedIdentity = NonNullable<ReturnType<typeof adidIdentity>>;
const sessionFields = {
  id: true,
  name: true,
  email: true,
  primaryRole: true,
} as const;

async function linkedAccount(identity: VerifiedIdentity) {
  const link = await prisma.identityProviderLink.findUnique({
    where: {
      provider_externalSubjectId: {
        provider: identity.provider,
        externalSubjectId: identity.subject,
      },
    },
    select: { userId: true },
  });
  if (!link) return undefined;
  // An orphaned link must not attach itself to a new account.
  return prisma.user.findUnique({
    where: { id: link.userId },
    select: sessionFields,
  });
}

export async function resolveAdidUser(
  identity: VerifiedIdentity,
  region: MapAbleJurisdiction = "AU",
) {
  const linked = await linkedAccount(identity);
  if (linked !== undefined) return linked;
  const email =
    identity.verifiedEmail && normalizeAuthEmail(identity.verifiedEmail);
  if (!email || !z.string().email().max(254).safeParse(email).success)
    return null;
  const name = identity.name?.trim().slice(0, 160) || email.split("@")[0];
  const passwordHash = await oauthOnlyPasswordHash();
  try {
    const provisioned = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true },
      });
      if (existing) return null;
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          primaryRole: "participant",
          roleAssignments: { create: { role: "participant", isPrimary: true } },
          participantProfile: {
            create: {
              displayName: name,
              preferredName: name.split(" ")[0],
              jurisdiction: region,
              timezone: JURISDICTION_DEFAULTS[region].timezone,
            },
          },
          accessibilityProfile: { create: {} },
        },
        select: sessionFields,
      });
      await tx.identityProviderLink.create({
        data: {
          userId: user.id,
          provider: identity.provider,
          externalSubjectId: identity.subject,
        },
      });
      await tx.authBridgeEvent.create({
        data: {
          userId: user.id,
          provider: identity.provider,
          eventType: "adid_account_created",
        },
      });
      return user;
    });
    return provisioned ?? (await linkedAccount(identity)) ?? null;
  } catch (error) {
    // Simultaneous callbacks can race either unique key. Only the same identity can resume.
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return (await linkedAccount(identity)) ?? null;
    }
    throw error;
  }
}
