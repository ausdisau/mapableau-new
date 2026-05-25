import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth0 } from "@/lib/auth0/client";
import { getAuth0Env } from "@/lib/auth0/env";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/admin",
  "/care",
  "/provider",
  "/worker",
  "/driver",
  "/employer",
];

function isProtectedPath(pathname: string): boolean {
  if (pathname.startsWith("/onboarding")) return true;
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export async function middleware(
  request: NextRequest,
  event: NextFetchEvent
) {
  if (getAuth0Env().AUTH_PROVIDER !== "auth0") {
    const { default: withAuth } = await import("next-auth/middleware");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return withAuth({ pages: { signIn: "/login" } })(request as any, event);
  }

  const authResponse = await auth0.middleware(request);
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/auth")) {
    return authResponse;
  }

  if (isProtectedPath(pathname)) {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      const login = new URL("/auth/login", request.url);
      login.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(login);
    }
  }

  return authResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
