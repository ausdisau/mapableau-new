import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/provider", "/settings"];
const MFA_EXEMPT = ["/auth/mfa", "/login", "/api/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (MFA_EXEMPT.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.id) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (token.mfaEnrollmentRequired && pathname !== "/settings/security") {
    const enroll = new URL("/settings/security", request.url);
    enroll.searchParams.set("required", "1");
    return NextResponse.redirect(enroll);
  }

  if (token.mfaPending && !pathname.startsWith("/auth/mfa")) {
    const mfa = new URL("/auth/mfa", request.url);
    mfa.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(mfa);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/provider/:path*",
    "/settings/:path*",
  ],
};
