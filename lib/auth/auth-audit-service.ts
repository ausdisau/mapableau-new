import type {
  AuthLoginEventType,
  AuthProvider,
  AuthSecurityEventType,
} from "@prisma/client";
import { headers } from "next/headers";

import { hashForAudit } from "@/lib/auth/hash-request-meta";
import { prisma } from "@/lib/prisma";

async function requestHashes(): Promise<{
  ipAddressHash?: string;
  userAgentHash?: string;
}> {
  try {
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      undefined;
    const ua = h.get("user-agent") ?? undefined;
    return {
      ipAddressHash: hashForAudit(ip),
      userAgentHash: hashForAudit(ua),
    };
  } catch {
    return {};
  }
}

export async function logAuthLoginEvent(input: {
  userId?: string | null;
  auth0UserId?: string | null;
  provider?: AuthProvider | null;
  eventType: AuthLoginEventType;
  success?: boolean;
  riskLevel?: string;
}) {
  const hashes = await requestHashes();
  await prisma.authLoginEvent.create({
    data: {
      userId: input.userId ?? null,
      auth0UserId: input.auth0UserId ?? null,
      provider: input.provider ?? null,
      eventType: input.eventType,
      success: input.success ?? true,
      riskLevel: input.riskLevel,
      ...hashes,
    },
  });
}

export async function logAuthSecurityEvent(input: {
  userId?: string | null;
  auth0UserId?: string | null;
  eventType: AuthSecurityEventType;
  metadata?: Record<string, unknown>;
}) {
  const hashes = await requestHashes();
  const safeMeta = input.metadata
    ? JSON.parse(
        JSON.stringify(input.metadata, (_k, v) => {
          if (typeof v === "string" && /ndis|password|secret|token/i.test(_k as string)) {
            return "[REDACTED]";
          }
          return v;
        })
      )
    : undefined;

  await prisma.authSecurityEvent.create({
    data: {
      userId: input.userId ?? null,
      auth0UserId: input.auth0UserId ?? null,
      eventType: input.eventType,
      metadata: safeMeta,
      ipAddressHash: hashes.ipAddressHash,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: input.userId ?? null,
      category: "auth_security",
      action: input.eventType,
      metadata: safeMeta,
      ipAddressHash: hashes.ipAddressHash,
    },
  });
}

export async function logAuthAudit(input: {
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  const hashes = await requestHashes();
  await prisma.auditLog.create({
    data: {
      userId: input.userId ?? null,
      category: "auth",
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: (input.metadata ?? undefined) as
        | import("@prisma/client").Prisma.InputJsonValue
        | undefined,
      ipAddressHash: hashes.ipAddressHash,
    },
  });
}
