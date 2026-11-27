import { NextResponse } from "next/server";
import { clerkEntryDestination } from "../../../../lib/legacy-entry";

type Context = { params: Promise<{ legacy: string[] }> };
const headers = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
};
const retired = new Set([
  "password",
  "session",
  "create-session",
  "callback",
  "google",
  "google/callback",
]);

function unavailable(action: string) {
  return retired.has(action)
    ? NextResponse.json(
        {
          error: "This sign-in method was retired. Use the Clerk sign-in page.",
          signInUrl: "/sign-in",
        },
        { status: 410, headers },
      )
    : new Response(null, { status: 404, headers });
}

export async function GET(request: Request, context: Context) {
  const action = (await context.params).legacy.join("/");
  if (action === "login")
    return NextResponse.redirect(clerkEntryDestination(request.url), {
      headers,
    });
  if (action === "logout")
    return NextResponse.redirect(new URL("/auth/logout", request.url), {
      headers,
    });
  if (action === "session")
    return NextResponse.redirect(new URL("/api/identity/me", request.url), {
      headers,
    });
  return unavailable(action);
}

export async function POST(_request: Request, context: Context) {
  return unavailable((await context.params).legacy.join("/"));
}
