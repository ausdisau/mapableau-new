import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { requireMfaApiSession } from "@/lib/api/mfa-handler";
import { isTrustedDevice } from "@/lib/auth/mfa-service";

export async function POST(request: Request) {
  const ctx = await requireMfaApiSession(request as import("next/server").NextRequest);
  if ("error" in ctx) return ctx.error;

  const cookieStore = await cookies();
  const deviceToken = cookieStore.get("mapable_trusted_device")?.value;

  const trusted = await isTrustedDevice(ctx.user.id, deviceToken);
  if (!trusted) {
    return NextResponse.json({ ok: false });
  }

  return NextResponse.json({
    ok: true,
    sessionUpdate: { mfaVerifiedAt: Date.now() },
  });
}
