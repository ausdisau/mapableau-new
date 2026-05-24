import { NextResponse } from "next/server";

/**
 * Post-OAuth entry. Token exchange is handled by NextAuth at
 * /api/auth/callback/google and /api/auth/callback/azure-ad.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next");
  const target = new URL("/auth/complete", url.origin);
  if (next) target.searchParams.set("next", next);
  return NextResponse.redirect(target);
}
