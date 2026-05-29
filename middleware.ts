import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

import {
  handlePeerPeersHost,
  redirectLegacySquarePath,
  shouldRunAuthMiddleware,
} from "@/lib/mapable-peers/peer-middleware";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const legacySquare = redirectLegacySquarePath(request);
  if (legacySquare) return legacySquare;

  const peerResponse = handlePeerPeersHost(request);
  if (peerResponse) return peerResponse;

  if (shouldRunAuthMiddleware(request.nextUrl.pathname)) {
    return updateSession(request, { requireAuth: true });
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|css|js)$).*)",
  ],
};
