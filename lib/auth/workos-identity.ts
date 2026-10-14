import type { User } from "@prisma/client";

import { normalizeAuthEmail } from "@/lib/auth/auth-flow";
import { ensureOAuthUser } from "@/lib/auth/ensure-oauth-user";
import { prisma } from "@/lib/prisma";

const PROVIDER = "workos-authkit";

/**
 * Resolve a WorkOS subject to a MapAble user. Existing subject links win;
 * first sign-in may link only by WorkOS-verified email. No external metadata
 * or organization role is copied into MapAble authorization fields.
 */
export async function resolveAndLinkWorkOSIdentity(input: {
  externalSubjectId: string;
  verifiedEmail: string;
  name?: string | null;
}): Promise<User> {
  const email = normalizeAuthEmail(input.verifiedEmail);
  const existingLink = await prisma.identityProviderLink.findUnique({
    where: {
      provider_externalSubjectId: {
        provider: PROVIDER,
        externalSubjectId: input.externalSubjectId,
      },
    },
  });

  if (existingLink) {
    const linkedUser = await prisma.user.findUnique({
      where: { id: existingLink.userId },
    });
    if (!linkedUser) {
      throw new Error("WorkOS identity link points to a missing MapAble user.");
    }

    if (existingLink.externalEmail !== email) {
      await prisma.identityProviderLink.update({
        where: { id: existingLink.id },
        data: { externalEmail: email },
      });
    }
    return linkedUser;
  }

  const user = await ensureOAuthUser({ email, name: input.name });
  const link = await prisma.identityProviderLink.upsert({
    where: {
      provider_externalSubjectId: {
        provider: PROVIDER,
        externalSubjectId: input.externalSubjectId,
      },
    },
    create: {
      userId: user.id,
      provider: PROVIDER,
      externalSubjectId: input.externalSubjectId,
      externalEmail: email,
      metadataJson: { authority: "workos", authorizationSource: "prisma" },
    },
    update: { externalEmail: email },
  });

  // Protect against a concurrent first-login race linking this subject elsewhere.
  if (link.userId !== user.id) {
    throw new Error("WorkOS identity is already linked to another MapAble user.");
  }

  return user;
}
