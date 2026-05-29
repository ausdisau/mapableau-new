import { NextResponse } from "next/server";

import { getAuthSessionStatus } from "@/lib/auth/auth-session-status";

/** Legacy auth client shape — prefer GET /api/auth/me for new code. */
export async function GET() {
  const sessionStatus = await getAuthSessionStatus();

  if (sessionStatus.status !== "registered") {
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: sessionStatus.user.id,
      email: sessionStatus.user.email,
      name: sessionStatus.user.name,
    },
  });
}
