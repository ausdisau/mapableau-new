import { NextResponse } from "next/server";

import { clearNextAuthSession } from "@/lib/auth/auth-bridge-session";
import { getWixLogoutUrl } from "@/lib/auth/wix/wix-client";
import { getWixConfig, isWixEnabled } from "@/lib/auth/wix/wix-config";

export async function GET(request: Request) {
  await clearNextAuthSession();

  if (!isWixEnabled()) {
    return NextResponse.redirect("/login");
  }

  const url = new URL(request.url);
  const postLogout =
    url.searchParams.get("returnTo") ?? getWixConfig().loginOriginUri ?? "/login";

  try {
    const logoutUrl = await getWixLogoutUrl(postLogout);
    return NextResponse.redirect(logoutUrl);
  } catch {
    return NextResponse.redirect(postLogout);
  }
}
