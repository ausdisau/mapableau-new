import { NextResponse } from "next/server";

import { clearAppSession } from "@/lib/auth/auth-bridge-session";
import { isSafeRedirect } from "@/lib/auth/safe-redirect";

export async function POST(request: Request) {
  await clearAppSession();

  let returnTo = "/login";
  try {
    const body = (await request.json()) as { returnTo?: string };
    if (body.returnTo && isSafeRedirect(body.returnTo)) {
      returnTo = body.returnTo;
    }
  } catch {
    // ignore invalid body
  }

  return NextResponse.json({ ok: true, redirectTo: returnTo });
}

export async function GET(request: Request) {
  await clearAppSession();

  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo");
  const destination =
    returnTo && isSafeRedirect(returnTo) ? returnTo : "/login";

  return NextResponse.redirect(destination);
}
