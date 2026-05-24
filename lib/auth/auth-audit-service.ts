import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";

export type AuthBridgeEventType =
  | "login_success"
  | "login_failed"
  | "logout"
  | "auth0_callback_received"
  | "profile_created"
  | "identity_linked"
  | "identity_unlinked"
  | "unsafe_return_to_rejected"
  | "account_linking_required"
  | "suspicious_login";

export interface LogAuthBridgeEventInput {
  profileId?: string | null;
  eventType: AuthBridgeEventType;
  source: string;
  provider?: string | null;
  metadata?: Record<string, unknown>;
}

async function requestMeta(): Promise<{ ipAddress?: string; userAgent?: string }> {
  try {
    const h = await headers();
    return {
      ipAddress:
        h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        h.get("x-real-ip") ??
        undefined,
      userAgent: h.get("user-agent") ?? undefined,
    };
  } catch {
    return {};
  }
}

function sanitizeMetadata(metadata?: Record<string, unknown>) {
  if (!metadata) return {};
  return JSON.parse(
    JSON.stringify(metadata, (_key, value) => {
      if (
        typeof _key === "string" &&
        /password|secret|token|ndis|clinical/i.test(_key)
      ) {
        return "[REDACTED]";
      }
      return value;
    }),
  );
}

export async function logAuthBridgeEvent(input: LogAuthBridgeEventInput) {
  const meta = await requestMeta();
  await prisma.authBridgeEvent.create({
    data: {
      profileId: input.profileId ?? null,
      eventType: input.eventType,
      source: input.source,
      provider: input.provider ?? null,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: sanitizeMetadata(input.metadata),
    },
  });
}
