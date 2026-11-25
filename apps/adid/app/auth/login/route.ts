import { NextResponse } from "next/server";
import { clerkEntryDestination } from "../../../lib/legacy-entry";

// Bookmarks from the supplied ADiD portal use screen_hint=signup on the login URL.
export function GET(request: Request) {
  return NextResponse.redirect(clerkEntryDestination(request.url), {
    headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
}
