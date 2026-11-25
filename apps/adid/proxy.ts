import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import {
  NextResponse,
  type NextFetchEvent,
  type NextRequest,
} from "next/server";
import { hasClerkTenant } from "./lib/clerk-config";

const isProtected = createRouteMatcher([
  "/dashboard(.*)",
  "/account(.*)",
  "/api/identity(.*)",
]);
const withClerk = clerkMiddleware(async (auth, request) => {
  if (isProtected(request)) await auth.protect();
});

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (hasClerkTenant()) return withClerk(request, event);
  if (request.nextUrl.pathname.startsWith("/api/identity")) {
    return NextResponse.json(
      { error: "Identity service unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (isProtected(request))
    return NextResponse.redirect(new URL("/sign-in", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
