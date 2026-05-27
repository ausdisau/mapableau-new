import type { Prisma } from "@prisma/client";
import type { MapAbleUserRole } from "@prisma/client";
import { headers } from "next/headers";

import { computeRecordHash, getLastAuditRecordHash } from "@/lib/audit/audit-integrity-service";
import { prisma } from "@/lib/prisma";
import {
  logAuditEventSchema,
  type LogAuditEventInput,
} from "@/lib/validation/reporting-audit";
import type { AuditAction } from "@/types/mapable";

const SENSITIVE_KEY_PATTERN = /ndis|password|secret|clinical|narrative|message|address/i;

function redactMetadata(
  metadata?: Record<string, unknown> | null
): Record<string, unknown> | undefined {
  if (!metadata) return undefined;
  return JSON.parse(
    JSON.stringify(metadata, (key, value) => {
      if (typeof value === "string" && SENSITIVE_KEY_PATTERN.test(String(key))) {
        return "[REDACTED]";
      }
      return value;
    })
  ) as Record<string, unknown>;
}

function redactSnapshot(
  snapshot?: Record<string, unknown> | null
): Record<string, unknown> | undefined {
  return redactMetadata(snapshot);
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

export type CreateAuditEventInput = LogAuditEventInput & {
  action: AuditAction | string;
  actorRole?: MapAbleUserRole | null;
};

export async function logAuditEvent(input: CreateAuditEventInput): Promise<string> {
  const parsed = logAuditEventSchema.parse(input);
  const meta = await requestMeta();
  const previousHash = await getLastAuditRecordHash();

  const safeBefore = redactSnapshot(parsed.beforeJson);
  const safeAfter = redactSnapshot(parsed.afterJson);
  const safeMetadata = redactMetadata(parsed.metadata ?? undefined);

  const hashPayload = {
    action: parsed.action,
    domain: parsed.domain ?? "platform",
    entityType: parsed.entityType,
    entityId: parsed.entityId,
    participantId: parsed.participantId,
    outcome: parsed.outcome ?? "success",
  };

  const recordHash = computeRecordHash(hashPayload, previousHash);

  const log = await prisma.auditLog.create({
    data: {
      actorUserId: parsed.actorUserId ?? null,
      actorRole: (parsed.actorRole as MapAbleUserRole | undefined) ?? null,
      organisationId: parsed.organisationId ?? null,
      action: parsed.action,
      domain: parsed.domain ?? "platform",
      entityType: parsed.entityType,
      entityId: parsed.entityId ?? null,
      participantId: parsed.participantId ?? null,
      providerId: parsed.providerId ?? parsed.organisationId ?? null,
      beforeJson: (safeBefore ?? undefined) as Prisma.InputJsonValue | undefined,
      afterJson: (safeAfter ?? undefined) as Prisma.InputJsonValue | undefined,
      riskLevel: parsed.riskLevel ?? "low",
      outcome: parsed.outcome ?? "success",
      reason: parsed.reason ?? null,
      metadata: (safeMetadata ?? undefined) as Prisma.InputJsonValue | undefined,
      requestId: parsed.requestId ?? null,
      correlationId: parsed.correlationId ?? null,
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent ?? null,
      previousHash,
      recordHash,
    },
  });

  return log.id;
}

export async function logAdminSensitiveAccess(params: {
  actorUserId: string;
  actorRole: MapAbleUserRole;
  entityType: string;
  entityId: string;
  participantId?: string;
  organisationId?: string;
  accessReason?: string;
}): Promise<string> {
  return logAuditEvent({
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    organisationId: params.organisationId,
    action: "admin.accessed_sensitive_record",
    domain: "admin",
    entityType: params.entityType,
    entityId: params.entityId,
    participantId: params.participantId,
    riskLevel: "high",
    outcome: "success",
    reason: params.accessReason ?? "Sensitive record viewed",
  });
}

export async function listAuditLogs(filters: {
  action?: string;
  domain?: string;
  organisationId?: string;
  participantId?: string;
  limit?: number;
  cursor?: string;
}) {
  const limit = Math.min(filters.limit ?? 100, 500);
  return prisma.auditLog.findMany({
    where: {
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.domain ? { domain: filters.domain } : {}),
      ...(filters.organisationId ? { organisationId: filters.organisationId } : {}),
      ...(filters.participantId ? { participantId: filters.participantId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      actorUser: { select: { name: true, email: true } },
    },
  });
}

export async function getAuditLogById(eventId: string) {
  return prisma.auditLog.findUnique({
    where: { id: eventId },
    include: {
      actorUser: { select: { name: true, email: true } },
      organisation: { select: { name: true } },
    },
  });
}

/** @deprecated Use logAuditEvent — kept for backward compatibility */
export async function createAuditEvent(input: CreateAuditEventInput): Promise<void> {
  await logAuditEvent(input);
}
