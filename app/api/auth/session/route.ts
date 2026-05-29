import { NextResponse } from "next/server";

import { getAuthSessionStatus } from "@/lib/auth/auth-session-status";

/** Legacy NextAuth session shape for cached clients during migration. */
export async function GET() {
  const sessionStatus = await getAuthSessionStatus();

  if (sessionStatus.status !== "registered") {
    return NextResponse.json({});
  }

  return NextResponse.json({
    user: {
      id: sessionStatus.user.id,
      email: sessionStatus.user.email,
      name: sessionStatus.user.name,
      role: sessionStatus.user.primaryRole,
    },
    expires: new Date(Date.now() + 86_400_000).toISOString(),
  });
}
