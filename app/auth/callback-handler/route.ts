import { NextResponse } from "next/server";

import { sanitizeReturnTo } from "@/lib/auth/safe-return-to";
import { getOnboardingStatus } from "@/lib/auth/auth-profile-bridge";
import { runAuthBridgeIfNeeded } from "@/lib/auth/run-auth-bridge";
import { resolvePostLoginPath } from "@/lib/auth/role-onboarding-router";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAuth0Env } from "@/lib/auth0/env";

/**
 * Post-login redirect helper after Auth0 callback completes.
 * Auth0 SDK handles /auth/callback; clients may poll /auth/me then hit this route.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const returnTo = searchParams.get("returnTo");

  const bridge = await runAuthBridgeIfNeeded();
  if (bridge.linkingRequired) {
    return NextResponse.redirect(
      new URL("/login/link-account", getAuth0Env().APP_BASE_URL)
    );
  }

  const user = await getCurrentUser();
  const onboarding = user ? await getOnboardingStatus(user.id) : null;
  const path = resolvePostLoginPath({
    onboardingStatus: onboarding?.status,
    primaryRole: user?.primaryRole,
    returnTo,
  });

  return NextResponse.redirect(
    new URL(sanitizeReturnTo(path), getAuth0Env().APP_BASE_URL)
  );
}
