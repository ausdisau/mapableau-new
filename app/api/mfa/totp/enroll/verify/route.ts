import { NextResponse } from "next/server";
import { z } from "zod";

import { requireMfaApiSession } from "@/lib/api/mfa-handler";
import { completeTotpEnrollment } from "@/lib/auth/mfa-service";

const bodySchema = z.object({
  challengeId: z.string().min(1),
  code: z.string().min(6).max(8),
});

export async function POST(request: Request) {
  const ctx = await requireMfaApiSession(request as import("next/server").NextRequest);
  if ("error" in ctx) return ctx.error;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await completeTotpEnrollment(
    ctx.user.id,
    body.challengeId,
    body.code,
    ctx.audit,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    recoveryCodes: result.recoveryCodes,
  });
}
