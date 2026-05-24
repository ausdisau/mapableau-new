import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AuthEventType =
  | "login_success"
  | "login_failed"
  | "provider_linked"
  | "provider_unlinked"
  | "role_changed"
  | "mfa_challenge"
  | "suspicious_login"
  | "link_confirmation_required";

export type LogAuthEventInput = {
  eventType: AuthEventType;
  userId?: string | null;
  provider?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logAuthEvent({
  eventType,
  userId,
  provider,
  ipAddress,
  userAgent,
  metadata = {},
}: LogAuthEventInput) {
  try {
    await prisma.authEvent.create({
      data: {
        eventType,
        userId: userId ?? undefined,
        provider: provider ?? undefined,
        ipAddress: ipAddress ?? undefined,
        userAgent: userAgent ?? undefined,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    console.error("[auth-audit] Failed to log event", eventType, error);
  }
}

export function requestAuditContext(headers: Headers) {
  return {
    ipAddress:
      headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headers.get("x-real-ip") ??
      null,
    userAgent: headers.get("user-agent"),
  };
}
