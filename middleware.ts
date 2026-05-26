import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

import {
  handlePeerPeersHost,
  redirectLegacySquarePath,
  shouldRunAuthMiddleware,
} from "@/lib/mapable-peers/peer-middleware";

const authMiddleware = withAuth({
  pages: { signIn: "/login" },
});

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  const legacySquare = redirectLegacySquarePath(request);
  if (legacySquare) return legacySquare;

  const peerResponse = handlePeerPeersHost(request);
  if (peerResponse) return peerResponse;

  if (shouldRunAuthMiddleware(request.nextUrl.pathname)) {
    return authMiddleware(request as NextRequestWithAuth, event);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|css|js)$).*)",
  ],
};
