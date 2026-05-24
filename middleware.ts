import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isAuth0Configured } from "@/lib/config/auth-env";

export async function middleware(request: NextRequest) {
  if (!isAuth0Configured()) {
    return NextResponse.next();
  }

  if (!request.nextUrl.pathname.startsWith("/auth/")) {
    return NextResponse.next();
  }

  const { auth0 } = await import("@/lib/auth/auth0");
  return auth0.middleware(request);
}

export const config = {
  matcher: ["/auth/:path*"],
};
