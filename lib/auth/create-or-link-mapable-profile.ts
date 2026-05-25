import type { MapAbleUserRole } from "@prisma/client";

import { logAuthLoginEvent, logAuthSecurityEvent } from "@/lib/auth/auth-audit-service";
import { isPrivilegedRole } from "@/lib/auth/privileged-roles";
import { prisma } from "@/lib/prisma";

export type Auth0IdentityPayload = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  /** Google subject when connection is google-oauth2 */
  providerUserId?: string;
  provider?: "auth0" | "google";
};

export type BridgeResult =
  | { status: "linked"; profileId: string; userId: string }
  | { status: "created"; profileId: string; userId: string }
  | { status: "linking_required"; existingUserId: string; email: string };

export async function createOrLinkMapableProfile(
  identity: Auth0IdentityPayload
): Promise<BridgeResult> {
  const auth0UserId = identity.sub;
  const email = identity.email?.toLowerCase().trim();
  const provider = identity.provider ?? "auth0";

  const existingLink = await prisma.authIdentityLink.findUnique({
    where: { auth0UserId },
    include: { user: true },
  });

  if (existingLink) {
    await prisma.authIdentityLink.update({
      where: { id: existingLink.id },
      data: {
        lastLoginAt: new Date(),
        email: email ?? existingLink.email,
        emailVerified: identity.email_verified ?? existingLink.emailVerified,
        providerUserId: identity.providerUserId ?? existingLink.providerUserId,
      },
    });
    await logAuthLoginEvent({
      userId: existingLink.userId,
      auth0UserId,
      provider,
      eventType: "login",
    });
    return {
      status: "linked",
      profileId: existingLink.userId,
      userId: existingLink.userId,
    };
  }

  if (email) {
    const userByEmail = await prisma.user.findUnique({ where: { email } });
    if (userByEmail) {
      await logAuthSecurityEvent({
        userId: userByEmail.id,
        auth0UserId,
        eventType: "account_link_requested",
        metadata: { email },
      });
      return {
        status: "linking_required",
        existingUserId: userByEmail.id,
        email,
      };
    }
  }

  const name = identity.name ?? email?.split("@")[0] ?? "MapAble user";

  const user = await prisma.user.create({
    data: {
      name,
      email: email ?? `${auth0UserId.replace("|", "_")}@auth.mapable.local`,
      passwordHash: null,
      primaryRole: "participant",
      profileOnboardingStatus: {
        create: { status: "pending_role" },
      },
    },
  });

  await prisma.authIdentityLink.create({
    data: {
      userId: user.id,
      auth0UserId,
      provider,
      providerUserId: identity.providerUserId,
      email,
      emailVerified: identity.email_verified ?? false,
      lastLoginAt: new Date(),
    },
  });

  await logAuthLoginEvent({
    userId: user.id,
    auth0UserId,
    provider,
    eventType: "callback",
  });

  return { status: "created", profileId: user.id, userId: user.id };
}

export async function completeOnboardingRole(
  userId: string,
  role: MapAbleUserRole,
  privacyConsentAt: Date
) {
  const needsApproval = isPrivilegedRole(role);

  await prisma.profileOnboardingStatus.upsert({
    where: { userId },
    create: {
      userId,
      roleSelected: role,
      privacyConsentAt,
      status: needsApproval ? "pending_approval" : "complete",
      approvedAt: needsApproval ? undefined : new Date(),
    },
    update: {
      roleSelected: role,
      privacyConsentAt,
      status: needsApproval ? "pending_approval" : "complete",
      approvedAt: needsApproval ? undefined : new Date(),
    },
  });

  await prisma.profileRole.upsert({
    where: { userId_role: { userId, role } },
    create: {
      userId,
      role,
      status: needsApproval ? "pending_approval" : "approved",
      approvedAt: needsApproval ? undefined : new Date(),
    },
    update: {
      status: needsApproval ? "pending_approval" : "approved",
    },
  });

  if (!needsApproval) {
    await prisma.user.update({
      where: { id: userId },
      data: { primaryRole: role },
    });
  }
}
