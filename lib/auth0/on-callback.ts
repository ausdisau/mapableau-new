import type { OnCallbackHook } from "@auth0/nextjs-auth0/types";
import { NextResponse } from "next/server";

import { requestAccountLink } from "@/lib/auth/account-linking-service";
import {
  createOrLinkMapableProfile,
  type Auth0IdentityPayload,
} from "@/lib/auth/create-or-link-mapable-profile";
import { sanitizeReturnTo } from "@/lib/auth/safe-return-to";
import { resolvePostLoginPath } from "@/lib/auth/role-onboarding-router";
import { getAuth0Env } from "@/lib/auth0/env";
import { prisma } from "@/lib/prisma";

export const mapableOnCallback: OnCallbackHook = async (error, ctx, session) => {
  const env = getAuth0Env();

  if (error || !session?.user?.sub) {
    return NextResponse.redirect(
      new URL("/login?error=auth", env.APP_BASE_URL)
    );
  }

  const sub = session.user.sub;
  const identity: Auth0IdentityPayload = {
    sub,
    email:
      typeof session.user.email === "string" ? session.user.email : undefined,
    email_verified:
      typeof session.user.email_verified === "boolean"
        ? session.user.email_verified
        : undefined,
    name:
      typeof session.user.name === "string" ? session.user.name : undefined,
    provider: sub.startsWith("google-oauth2|") ? "google" : "auth0",
    providerUserId: sub.includes("|") ? sub.split("|")[1] : undefined,
  };

  const result = await createOrLinkMapableProfile(identity);

  if (result.status === "linking_required") {
    const { confirmUrl } = await requestAccountLink({
      existingUserId: result.existingUserId,
      auth0UserId: sub,
      email: result.email,
      identity: {
        provider: identity.provider,
        providerUserId: identity.providerUserId,
        email_verified: identity.email_verified,
      },
    });
    return NextResponse.redirect(new URL(confirmUrl, env.APP_BASE_URL));
  }

  const onboarding = await prisma.profileOnboardingStatus.findUnique({
    where: { userId: result.profileId },
  });
  const returnTo = ctx.returnTo ?? undefined;
  const path = resolvePostLoginPath({
    onboardingStatus: onboarding?.status,
    primaryRole: onboarding?.roleSelected ?? undefined,
    returnTo: typeof returnTo === "string" ? returnTo : null,
  });

  return NextResponse.redirect(
    new URL(sanitizeReturnTo(path), env.APP_BASE_URL)
  );
};
