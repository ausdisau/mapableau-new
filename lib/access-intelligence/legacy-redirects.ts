import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Legacy marketing URLs consolidated into Access Intelligence Verify.
 * Permanent redirect preserves bookmarks and sitemap entries.
 */
export function redirectLegacyAccessIntelligencePaths(
  request: NextRequest,
): NextResponse | null {
  const { pathname } = request.nextUrl;

  if (pathname === "/verify-my-venue" || pathname.startsWith("/verify-my-venue/")) {
    const rest =
      pathname === "/verify-my-venue"
        ? ""
        : pathname.slice("/verify-my-venue".length);
    const target = new URL(`/verify${rest}`, request.url);
    target.search = request.nextUrl.search;
    return NextResponse.redirect(target, 308);
  }

  return null;
}
