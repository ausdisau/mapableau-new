import type { MapAbleUserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface LogDataAccessInput {
  actorUserId: string;
  actorRole?: MapAbleUserRole | null;
  subjectUserId: string;
  resourceType: string;
  resourceId?: string | null;
  action: string;
  consentVerified?: boolean;
  metadata?: Record<string, unknown>;
}

export async function logDataAccess(input: LogDataAccessInput): Promise<void> {
  await prisma.dataAccessLog.create({
    data: {
      actorUserId: input.actorUserId,
      actorRole: input.actorRole ?? null,
      subjectUserId: input.subjectUserId,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      action: input.action,
      consentVerified: input.consentVerified ?? false,
      metadata: input.metadata
        ? (JSON.parse(JSON.stringify(input.metadata)) as object)
        : undefined,
    },
  });
}
