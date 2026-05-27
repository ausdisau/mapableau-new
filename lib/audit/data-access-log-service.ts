import type { MapAbleUserRole, Prisma } from "@prisma/client";
import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  logDataAccessSchema,
  type LogDataAccessInput,
} from "@/lib/validation/reporting-audit";

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

export type LogDataAccessParams = LogDataAccessInput & {
  actorRole?: MapAbleUserRole | null;
};

export async function logDataAccess(input: LogDataAccessParams): Promise<string> {
  const parsed = logDataAccessSchema.parse(input);
  const meta = await requestMeta();

  const log = await prisma.dataAccessLog.create({
    data: {
      actorUserId: parsed.actorUserId ?? null,
      actorRole: (parsed.actorRole as MapAbleUserRole | undefined) ?? null,
      organisationId: parsed.organisationId ?? null,
      entityType: parsed.entityType,
      entityId: parsed.entityId ?? null,
      participantId: parsed.participantId ?? null,
      sensitivityLevel: parsed.sensitivityLevel ?? "internal",
      consentGrantId: parsed.consentGrantId ?? null,
      accessReason: parsed.accessReason ?? null,
      result: parsed.result ?? "allowed",
      metadata: (parsed.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent ?? null,
    },
  });

  return log.id;
}

export async function listDataAccessLogs(filters: {
  participantId?: string;
  organisationId?: string;
  actorUserId?: string;
  entityType?: string;
  limit?: number;
}) {
  const limit = Math.min(filters.limit ?? 100, 500);
  return prisma.dataAccessLog.findMany({
    where: {
      ...(filters.participantId ? { participantId: filters.participantId } : {}),
      ...(filters.organisationId ? { organisationId: filters.organisationId } : {}),
      ...(filters.actorUserId ? { actorUserId: filters.actorUserId } : {}),
      ...(filters.entityType ? { entityType: filters.entityType } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      actorUser: { select: { name: true, email: true } },
    },
  });
}

export async function getParticipantDataAccessHistory(participantUserId: string, limit = 50) {
  return listDataAccessLogs({ participantId: participantUserId, limit });
}
