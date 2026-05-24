import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import { completeXeroOAuth } from "@/lib/xero/xero-oauth-service";
import { stripeConfig } from "@/lib/stripe/config";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return NextResponse.redirect(
      `${stripeConfig.appUrl}/provider/settings/xero?error=missing_params`
    );
  }

  try {
    await completeXeroOAuth({
      code,
      state,
      connectedByUserId: user.id,
    });
    return NextResponse.redirect(
      `${stripeConfig.appUrl}/provider/settings/xero?connected=1`
    );
  } catch {
    return NextResponse.redirect(
      `${stripeConfig.appUrl}/provider/settings/xero?error=oauth_failed`
    );
  }
}
