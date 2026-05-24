import { NextResponse } from "next/server";

import { requireMfaApiSession } from "@/lib/api/mfa-handler";
import { listMfaMethods } from "@/lib/auth/mfa-service";

export async function GET(request: Request) {
  const ctx = await requireMfaApiSession(request as import("next/server").NextRequest);
  if ("error" in ctx) return ctx.error;

  const methods = await listMfaMethods(ctx.user.id);

  return NextResponse.json({
    methods: methods.map((m) => ({
      id: m.id,
      type: m.type,
      label: m.label,
      isPrimary: m.isPrimary,
      enabledAt: m.enabledAt?.toISOString() ?? null,
      status:
        m.type === "email"
          ? "coming_soon"
          : m.type === "sms"
            ? "coming_soon"
            : m.type === "webauthn"
              ? "phase_2"
              : "active",
    })),
    placeholders: {
      email: "Email codes — coming soon",
      sms: "SMS — not used as primary MFA",
      webauthn: "Passkey / security key — Phase 2",
    },
  });
}
