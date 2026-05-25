import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

import {
  applyWixCorsToResponse,
  shouldApplyWixCors,
  wixPreflightResponse,
} from "@/lib/integrations/wix/cors";

const authMiddleware = withAuth({
  pages: { signIn: "/login" },
});

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (shouldApplyWixCors(request)) {
    if (request.method === "OPTIONS") {
      return wixPreflightResponse(request);
    }
    const response = NextResponse.next();
    return applyWixCorsToResponse(request, response);
  }

  return authMiddleware(
    request as Parameters<typeof authMiddleware>[0],
    event,
  );
}

export const config = {
  matcher: [
    "/care/:path*",
    "/provider/care/:path*",
    "/worker/:path*",
    "/api/search/autocomplete",
    "/api/search/autocomplete/:path*",
  ],
};
