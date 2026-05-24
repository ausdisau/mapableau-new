import { NextResponse } from "next/server";
import { z } from "zod";

import { requireMfaApiSession } from "@/lib/api/mfa-handler";
import { logAuthSecurityEvent } from "@/lib/audit/auth-security-audit";
import {
  STEP_UP_ACTIONS,
  type StepUpAction,
} from "@/lib/auth/mfa-policy";
import {
  createDeviceToken,
  registerTrustedDevice,
  verifyRecoveryCode,
  verifyTotpCode,
} from "@/lib/auth/mfa-service";
import { stepUpUntilTimestamp } from "@/lib/auth/require-step-up";

const bodySchema = z.object({
  code: z.string().min(6).max(16),
  mode: z.enum(["login", "step_up"]),
  action: z.string().optional(),
  useRecoveryCode: z.boolean().optional(),
  trustDevice: z.boolean().optional(),
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

  const verifyResult = body.useRecoveryCode
    ? await verifyRecoveryCode(ctx.user.id, body.code, ctx.audit)
    : await verifyTotpCode(ctx.user.id, body.code, ctx.audit);

  if (!verifyResult.ok) {
    return NextResponse.json({ error: verifyResult.error }, { status: 401 });
  }

  let deviceToken: string | undefined;
  if (body.trustDevice) {
    deviceToken = createDeviceToken();
    await registerTrustedDevice(
      ctx.user.id,
      deviceToken,
      "Trusted browser",
      ctx.audit,
    );
  }

  const sessionUpdate: {
    mfaVerifiedAt: number;
    stepUpUntil?: number;
  } = {
    mfaVerifiedAt: Date.now(),
  };

  if (body.mode === "step_up") {
    sessionUpdate.stepUpUntil = stepUpUntilTimestamp();
    const action =
      body.action &&
      STEP_UP_ACTIONS.includes(body.action as StepUpAction)
        ? (body.action as StepUpAction)
        : undefined;
    await logAuthSecurityEvent({
      eventType: "step_up_completed",
      userId: ctx.user.id,
      ipAddress: ctx.audit.ipAddress,
      userAgent: ctx.audit.userAgent,
      metadata: { action },
    });
  }

  const response = NextResponse.json({
    ok: true,
    sessionUpdate,
    deviceToken,
    codesRemaining:
      "codesRemaining" in verifyResult
        ? verifyResult.codesRemaining
        : undefined,
  });

  if (deviceToken) {
    response.cookies.set("mapable_trusted_device", deviceToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });
  }

  return response;
}
