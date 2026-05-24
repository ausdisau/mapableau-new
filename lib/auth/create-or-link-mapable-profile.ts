import type { SessionData } from "@auth0/nextjs-auth0/types";

import { logAuthBridgeEvent } from "@/lib/auth/auth-audit-service";
import { ensureOnboardingStatus } from "@/lib/auth/role-onboarding-router";
import { prisma } from "@/lib/prisma";

export interface Auth0IdentityInput {
  auth0UserId: string;
  email: string;
  name?: string | null;
  provider: string;
}

export type ProfileBridgeOutcome =
  | {
      status: "linked";
      profileId: string;
      created: false;
    }
  | {
      status: "created";
      profileId: string;
      created: true;
    }
  | {
      status: "linking_required";
      profileId: string;
      existingEmail: string;
    };

function extractProvider(auth0UserId: string): string {
  const [provider] = auth0UserId.split("|");
  return provider || "auth0";
}

export function identityFromSession(session: SessionData): Auth0IdentityInput | null {
  const auth0UserId = session.user.sub;
  const email = session.user.email;
  if (!auth0UserId || !email) return null;

  return {
    auth0UserId,
    email: email.toLowerCase(),
    name: session.user.name ?? session.user.nickname ?? null,
    provider: extractProvider(auth0UserId),
  };
}

export async function createOrLinkMapableProfile(
  identity: Auth0IdentityInput,
  options: { allowDirectEmailLink?: boolean } = {},
): Promise<ProfileBridgeOutcome> {
  const existingLink = await prisma.authIdentityLink.findUnique({
    where: { auth0UserId: identity.auth0UserId },
    include: { profile: true },
  });

  if (existingLink) {
    await prisma.authIdentityLink.update({
      where: { id: existingLink.id },
      data: { lastUsedAt: new Date(), email: identity.email },
    });

    await logAuthBridgeEvent({
      profileId: existingLink.profileId,
      eventType: "identity_linked",
      source: "create_or_link_mapable_profile",
      provider: identity.provider,
      metadata: { action: "existing_link_used" },
    });

    return {
      status: "linked",
      profileId: existingLink.profileId,
      created: false,
    };
  }

  const emailMatch = await prisma.user.findUnique({
    where: { email: identity.email },
    include: { authIdentityLinks: true },
  });

  if (emailMatch) {
    const hasOtherAuthLink = emailMatch.authIdentityLinks.some(
      (link) => link.auth0UserId !== identity.auth0UserId,
    );

    if (hasOtherAuthLink || !options.allowDirectEmailLink) {
      await logAuthBridgeEvent({
        profileId: emailMatch.id,
        eventType: "account_linking_required",
        source: "create_or_link_mapable_profile",
        provider: identity.provider,
        metadata: { email: identity.email },
      });

      return {
        status: "linking_required",
        profileId: emailMatch.id,
        existingEmail: identity.email,
      };
    }

    await prisma.authIdentityLink.create({
      data: {
        profileId: emailMatch.id,
        auth0UserId: identity.auth0UserId,
        provider: identity.provider,
        email: identity.email,
        lastUsedAt: new Date(),
      },
    });

    await logAuthBridgeEvent({
      profileId: emailMatch.id,
      eventType: "identity_linked",
      source: "create_or_link_mapable_profile",
      provider: identity.provider,
      metadata: { action: "email_match_linked" },
    });

    return {
      status: "linked",
      profileId: emailMatch.id,
      created: false,
    };
  }

  const user = await prisma.user.create({
    data: {
      email: identity.email,
      name: identity.name?.trim() || identity.email.split("@")[0] || "MapAble user",
      primaryRole: "participant",
      passwordHash: null,
    },
  });

  await prisma.authIdentityLink.create({
    data: {
      profileId: user.id,
      auth0UserId: identity.auth0UserId,
      provider: identity.provider,
      email: identity.email,
      lastUsedAt: new Date(),
    },
  });

  await ensureOnboardingStatus(user.id);

  await logAuthBridgeEvent({
    profileId: user.id,
    eventType: "profile_created",
    source: "create_or_link_mapable_profile",
    provider: identity.provider,
  });

  return {
    status: "created",
    profileId: user.id,
    created: true,
  };
}
