import type { Prisma, TransportDataAccessType } from "@prisma/client";
import { headers } from "next/headers";

import type { CurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export async function logDataAccess(params: {
  actor: CurrentUser;
  resourceType: string;
  resourceId: string;
  accessType: TransportDataAccessType;
  participantId?: string;
  organisationId?: string;
  metadata?: Record<string, unknown>;
}) {
  let ipAddress: string | undefined;
  let userAgent: string | undefined;
  try {
    const h = await headers();
    ipAddress = h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? undefined;
    userAgent = h.get("user-agent") ?? undefined;
  } catch {
    // No Next.js request context (unit tests, background jobs).
  }

  await prisma.dataAccessLog.create({
    data: {
      actorUserId: params.actor.id,
      actorRole: params.actor.primaryRole,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      accessType: params.accessType,
      participantId: params.participantId,
      organisationId: params.organisationId,
      metadata: (params.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      ipAddress,
      userAgent,
    },
  });
}
