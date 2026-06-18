import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

import {
  handlePeerPeersHost,
  redirectLegacySquarePath,
  shouldRunAuthMiddleware,
} from "@/lib/mapable-peers/peer-middleware";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";

function authMisconfiguredResponse(request: NextRequest): NextResponse {
  const acceptsHtml = request.headers.get("accept")?.includes("text/html");

  if (acceptsHtml) {
    return new NextResponse(
      "Authentication is temporarily unavailable. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the deployment environment.",
      {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      },
    );
  }

  return NextResponse.json(
    {
      error: "Authentication is misconfigured",
      code: "SUPABASE_AUTH_MISSING",
    },
    { status: 503 },
  );
}

export default async function middleware(
  request: NextRequest,
  _event: NextFetchEvent,
) {
  const legacySquare = redirectLegacySquarePath(request);
  if (legacySquare) return legacySquare;

  const peerResponse = handlePeerPeersHost(request);
  if (peerResponse) return peerResponse;

  if (!isSupabaseAuthConfigured()) {
    if (shouldRunAuthMiddleware(request.nextUrl.pathname)) {
      return authMisconfiguredResponse(request);
    }
    return NextResponse.next();
  }

  const response = await updateSupabaseSession(request, {
    requireAuth: shouldRunAuthMiddleware(request.nextUrl.pathname),
  });

  return response.response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|css|js)$).*)",
  ],
};
