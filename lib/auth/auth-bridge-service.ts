import type { SessionData } from "@auth0/nextjs-auth0/types";

import { logAuthBridgeEvent } from "@/lib/auth/auth-audit-service";
import {
  createOrLinkMapableProfile,
  identityFromSession,
} from "@/lib/auth/create-or-link-mapable-profile";
import { resolvePostAuthRedirect } from "@/lib/auth/role-onboarding-router";
import { resolveReturnTo } from "@/lib/auth/return-to";
import { prisma } from "@/lib/prisma";

export interface AuthBridgeSessionMeta {
  mapableProfileId?: string;
  mapableLinkingRequired?: boolean;
  mapablePendingLinkProfileId?: string;
}

export interface AuthBridgeCallbackResult {
  redirectPath: string;
  sessionMeta: AuthBridgeSessionMeta;
}

export async function processAuthBridgeSession(
  session: SessionData,
): Promise<AuthBridgeSessionMeta> {
  const identity = identityFromSession(session);
  if (!identity) {
    await logAuthBridgeEvent({
      eventType: "login_failed",
      source: "auth_bridge_service",
      metadata: { reason: "missing_identity_claims" },
    });
    return {};
  }

  const outcome = await createOrLinkMapableProfile(identity);

  if (outcome.status === "linking_required") {
    return {
      mapableLinkingRequired: true,
      mapablePendingLinkProfileId: outcome.profileId,
    };
  }

  await logAuthBridgeEvent({
    profileId: outcome.profileId,
    eventType: "login_success",
    source: "auth_bridge_service",
    provider: identity.provider,
    metadata: { created: outcome.created },
  });

  return {
    mapableProfileId: outcome.profileId,
  };
}

export async function resolveAuthBridgeRedirect(
  sessionMeta: AuthBridgeSessionMeta,
  returnTo?: string | null,
): Promise<string> {
  if (sessionMeta.mapableLinkingRequired && sessionMeta.mapablePendingLinkProfileId) {
    return `/account/link-confirm?profileId=${encodeURIComponent(sessionMeta.mapablePendingLinkProfileId)}`;
  }

  if (!sessionMeta.mapableProfileId) {
    return "/login?error=missing_profile";
  }

  const onboardingRedirect = await resolvePostAuthRedirect(sessionMeta.mapableProfileId);
  return resolveReturnTo(returnTo, onboardingRedirect);
}

export async function getProfileIdFromAuth0Session(
  session: SessionData,
): Promise<string | null> {
  const meta = session as SessionData & AuthBridgeSessionMeta;
  if (meta.mapableProfileId) return meta.mapableProfileId;

  const auth0UserId = session.user.sub;
  if (!auth0UserId) return null;

  const link = await prisma.authIdentityLink.findUnique({
    where: { auth0UserId },
    select: { profileId: true },
  });

  return link?.profileId ?? null;
}
