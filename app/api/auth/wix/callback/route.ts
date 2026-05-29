import { NextResponse } from "next/server";

import { fetchWixMemberProfile } from "@/lib/auth/wix/wix-client";
import { createWixBridgeToken } from "@/lib/auth/wix/wix-bridge-session";
import { isWixEnabled } from "@/lib/auth/wix/wix-config";
import {
  createPendingIdentityLink,
  findPendingEmailCollision,
  linkWixIdentity,
} from "@/lib/auth/wix/wix-profile-bridge";
import { consumeWixOAuthData } from "@/lib/auth/wix/wix-session-service";
import { auditIntegrationAction } from "@/lib/integrations/integration-audit-service";

export async function POST(request: Request) {
  if (!isWixEnabled()) {
    return NextResponse.json({ error: "Wix disabled" }, { status: 503 });
  }

  let body: { code?: string; state?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { code, state } = body;
  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing code or state", redirectTo: "/login?error=wix_missing_params" },
      { status: 400 }
    );
  }

  const stored = await consumeWixOAuthData();
  if (!stored || stored.state !== state) {
    return NextResponse.json({
      redirectTo: "/login?error=wix_invalid_state",
    });
  }

  let profile;
  try {
    profile = await fetchWixMemberProfile(stored, code, state);
  } catch {
    return NextResponse.json({
      redirectTo: "/login?error=wix_exchange_failed",
    });
  }

  if (!profile.email) {
    return NextResponse.json({
      redirectTo: "/login?error=wix_no_email",
    });
  }

  const collision = await findPendingEmailCollision(profile.email);
  if (collision.existingUser && collision.pending) {
    await createPendingIdentityLink({
      externalId: profile.memberId,
      email: profile.email,
    });
    return NextResponse.json({ redirectTo: "/login?link=pending" });
  }

  const user = collision.existingUser;
  if (!user) {
    return NextResponse.json({
      redirectTo:
        "/login?error=no_account&hint=Register first then sign in with Wix",
    });
  }

  await linkWixIdentity({
    userId: user.id,
    externalSubjectId: profile.memberId,
    email: profile.email,
  });

  await auditIntegrationAction({
    integrationKey: "wix",
    action: "login_callback",
    actorUserId: user.id,
    metadata: { email: profile.email, memberId: profile.memberId },
  });

  const bridgeToken = await createWixBridgeToken({
    userId: user.id,
    returnTo: stored.returnTo,
  });

  const completeUrl = `/api/auth/wix/complete?token=${encodeURIComponent(bridgeToken)}`;
  return NextResponse.json({ completeUrl });
}
