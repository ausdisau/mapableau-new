import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  logAuthEvent,
  requestAuditContext,
} from "@/lib/audit/auth-audit-service";
import { normalizeAuthProvider } from "@/lib/auth/auth-provider";
import { linkProviderToExistingUser } from "@/lib/auth/create-or-link-profile";
import { verifyPendingLinkToken } from "@/lib/auth/link-token";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  token: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const audit = requestAuditContext(request.headers);

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    await logAuthEvent({
      eventType: "login_failed",
      provider: null,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { reason: "invalid_confirm_link_body" },
    });
    return NextResponse.json(
      { error: "Invalid request. Check your details and try again." },
      { status: 400 },
    );
  }

  const payload = verifyPendingLinkToken(body.token);
  if (!payload) {
    await logAuthEvent({
      eventType: "login_failed",
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { reason: "expired_or_invalid_link_token" },
    });
    return NextResponse.json(
      {
        error:
          "This link has expired. Sign in with your email and try connecting your account again.",
      },
      { status: 400 },
    );
  }

  const provider = normalizeAuthProvider(payload.provider);
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    return NextResponse.json(
      { error: "No MapAble account found for this email." },
      { status: 404 },
    );
  }

  const valid = await compare(body.password, user.passwordHash);
  if (!valid) {
    await logAuthEvent({
      eventType: "login_failed",
      userId: user.id,
      provider,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { reason: "invalid_password_for_link" },
    });
    return NextResponse.json(
      { error: "Incorrect password. Please try again." },
      { status: 401 },
    );
  }

  try {
    await linkProviderToExistingUser({
      userId: user.id,
      provider,
      providerSubject: payload.providerSubject,
      email: payload.email,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not link account";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  await logAuthEvent({
    eventType: "login_success",
    userId: user.id,
    provider,
    ipAddress: audit.ipAddress,
    userAgent: audit.userAgent,
    metadata: { method: "oauth_link_confirmed" },
  });

  const nextAuthProvider =
    provider === "microsoft" ? "azure-ad" : provider === "google" ? "google" : null;

  return NextResponse.json({
    ok: true,
    nextAuthProvider,
    message: `${payload.provider} is now linked. You can continue with that sign-in option.`,
  });
}
