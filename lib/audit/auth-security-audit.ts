import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AuthSecurityEventType =
  | "mfa_enrolled"
  | "mfa_removed"
  | "mfa_challenge_success"
  | "mfa_challenge_failed"
  | "recovery_code_used"
  | "trusted_device_added"
  | "trusted_device_removed"
  | "step_up_required"
  | "step_up_completed";

export async function logAuthSecurityEvent({
  eventType,
  userId,
  metadata = {},
  ipAddress,
  userAgent,
}: {
  eventType: AuthSecurityEventType;
  userId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  try {
    await prisma.authSecurityEvent.create({
      data: {
        eventType,
        userId: userId ?? undefined,
        metadata: metadata as Prisma.InputJsonValue,
        ipAddress: ipAddress ?? undefined,
        userAgent: userAgent ?? undefined,
      },
    });
  } catch (error) {
    console.error("[auth-security-audit]", eventType, error);
  }
}

export function requestSecurityContext(headers: Headers) {
  return {
    ipAddress:
      headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headers.get("x-real-ip") ??
      null,
    userAgent: headers.get("user-agent"),
  };
}
