import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

import { resolveNextAuthSecret } from "@/lib/auth/nextauth-env";
import {
  handlePeerPeersHost,
  redirectLegacySquarePath,
  shouldRunAuthMiddleware,
} from "@/lib/mapable-peers/peer-middleware";

let cachedAuthSecret: string | undefined;
let cachedAuthMiddleware: ReturnType<typeof withAuth> | undefined;

function getAuthMiddleware(): ReturnType<typeof withAuth> | null {
  const secret = resolveNextAuthSecret();
  if (!secret) return null;

  if (secret !== cachedAuthSecret) {
    cachedAuthSecret = secret;
    cachedAuthMiddleware = withAuth({
      pages: { signIn: "/login" },
      secret,
    });
  }

  return cachedAuthMiddleware ?? null;
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

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  const legacySquare = redirectLegacySquarePath(request);
  if (legacySquare) return legacySquare;

  const peerResponse = handlePeerPeersHost(request);
  if (peerResponse) return peerResponse;

  if (shouldRunAuthMiddleware(request.nextUrl.pathname)) {
    const authMiddleware = getAuthMiddleware();
    if (!authMiddleware) {
      return authMisconfiguredResponse(request);
    }

    return authMiddleware(request as NextRequestWithAuth, event);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|css|js)$).*)",
  ],
};
