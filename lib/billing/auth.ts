import { NextResponse } from "next/server";

import { auth } from "@/app/lib/auth";

export async function requireAuthUserId(): Promise<
  { userId: string } | NextResponse<{ error: string }>
> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { userId: session.user.id };
}

export function isAuthError(
  result: { userId: string } | NextResponse<{ error: string }>
): result is NextResponse<{ error: string }> {
  return result instanceof NextResponse;
}
