import { NextResponse } from "next/server";

import { requireMfaApiSession } from "@/lib/api/mfa-handler";
import { startTotpEnrollment } from "@/lib/auth/mfa-service";

export async function POST(request: Request) {
  const ctx = await requireMfaApiSession(request as import("next/server").NextRequest);
  if ("error" in ctx) return ctx.error;

  const result = await startTotpEnrollment(ctx.user.id, ctx.user.email);

  return NextResponse.json({
    challengeId: result.challengeId,
    qrDataUrl: result.qrDataUrl,
    manualKey: result.manualKey,
    expiresAt: result.expiresAt.toISOString(),
  });
}
