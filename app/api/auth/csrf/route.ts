import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

/** Minimal CSRF token for legacy NextAuth clients during migration. */
export async function GET() {
  const csrfToken = randomUUID();
  const response = NextResponse.json({ csrfToken });
  response.cookies.set("next-auth.csrf-token", `${csrfToken}|${csrfToken}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
