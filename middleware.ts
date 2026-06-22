import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { resolveNextAuthSecret } from "@/lib/auth/nextauth-env";
import {
  handlePeerPeersHost,
  redirectLegacySquarePath,
  shouldRunAuthMiddleware,
} from "@/lib/mapable-peers/peer-middleware";

/** Match NextAuth secure cookie naming on HTTPS (Vercel, production). */
function usesSecureSessionCookies(request: NextRequest): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim() === "https";
  }
  return request.nextUrl.protocol === "https:";
}

function authMisconfiguredResponse(request: NextRequest): NextResponse {
  const acceptsHtml = request.headers.get("accept")?.includes("text/html");

  if (acceptsHtml) {
    return new NextResponse(
      "Authentication is temporarily unavailable. Configure NEXTAUTH_SECRET in the deployment environment.",
      {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      },
    );
  }

  return NextResponse.json(
    {
      error: "Authentication is misconfigured",
      code: "AUTH_SECRET_MISSING",
    },
    { status: 503 },
  );
}

function redirectToLogin(request: NextRequest): NextResponse {
  const login = new URL("/login", request.url);
  const callbackPath =
    request.nextUrl.pathname + request.nextUrl.search;
  login.searchParams.set("callbackUrl", callbackPath);
  return NextResponse.redirect(login);
}

export default async function middleware(request: NextRequest) {
  const legacySquare = redirectLegacySquarePath(request);
  if (legacySquare) return legacySquare;

  const peerResponse = handlePeerPeersHost(request);
  if (peerResponse) return peerResponse;

  if (shouldRunAuthMiddleware(request.nextUrl.pathname)) {
    const secret = resolveNextAuthSecret();
    if (!secret) {
      return authMisconfiguredResponse(request);
    }

    const token = await getToken({
      req: request,
      secret,
      secureCookie: usesSecureSessionCookies(request),
    });

    if (!token) {
      return redirectToLogin(request);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|css|js)$).*)",
  ],
};
