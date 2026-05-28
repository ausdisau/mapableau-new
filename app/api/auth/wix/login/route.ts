import { NextResponse } from "next/server";

import {
  generateWixOAuthData,
  getWixLoginAuthUrl,
} from "@/lib/auth/wix/wix-client";
import { getWixConfig, isWixEnabled } from "@/lib/auth/wix/wix-config";
import {
  isSafeRedirect,
  setWixOAuthData,
} from "@/lib/auth/wix/wix-session-service";

export async function GET(request: Request) {
  if (!isWixEnabled()) {
    return NextResponse.json({ error: "Wix disabled" }, { status: 503 });
  }

  const { redirectUri, loginOriginUri } = getWixConfig();
  if (!redirectUri || !loginOriginUri) {
    return NextResponse.json(
      { error: "Wix redirect URIs are not configured" },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const rawReturn = url.searchParams.get("returnTo") ?? "/dashboard";
  const returnTo = isSafeRedirect(rawReturn) ? rawReturn : "/dashboard";

  const oauthData = generateWixOAuthData(redirectUri, loginOriginUri);
  await setWixOAuthData({ ...oauthData, returnTo });

  const authUrl = await getWixLoginAuthUrl(oauthData);
  return NextResponse.redirect(authUrl);
}
