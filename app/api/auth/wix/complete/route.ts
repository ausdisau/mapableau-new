import { NextResponse } from "next/server";

import { mintNextAuthSessionForUser } from "@/lib/auth/auth-bridge-session";
import { verifyWixBridgeToken } from "@/lib/auth/wix/wix-bridge-session";
import { isWixEnabled } from "@/lib/auth/wix/wix-config";

export async function GET(request: Request) {
  if (!isWixEnabled()) {
    return NextResponse.redirect("/login?error=wix_disabled");
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect("/login?error=wix_invalid_bridge");
  }

  const payload = await verifyWixBridgeToken(token);
  if (!payload) {
    return NextResponse.redirect("/login?error=wix_invalid_bridge");
  }

  try {
    const returnTo = await mintNextAuthSessionForUser({
      userId: payload.userId,
      returnTo: payload.returnTo,
    });
    return NextResponse.redirect(returnTo);
  } catch {
    return NextResponse.redirect("/login?error=wix_session_failed");
  }
}
