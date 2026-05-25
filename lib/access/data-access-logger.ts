import type { MapAbleUserRole, PlatformConsentScope } from "@prisma/client";
import { headers } from "next/headers";

import { getDbClient } from "@/lib/db/db-client";
import type { DataAccessAction } from "@/types/audit";

export interface LogDataAccessInput {
  actorUserId: string;
  actorRole?: MapAbleUserRole | null;
  resourceType: string;
  resourceId?: string | null;
  participantId?: string | null;
  organisationId?: string | null;
  action?: DataAccessAction;
  consentScope?: PlatformConsentScope | null;
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

export async function logDataAccess(input: LogDataAccessInput): Promise<void> {
  const meta = await requestMeta();
  await getDbClient().dataAccessLog.create({
    data: {
      actorUserId: input.actorUserId,
      actorRole: input.actorRole ?? null,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      participantId: input.participantId ?? null,
      organisationId: input.organisationId ?? null,
      action: input.action ?? "read",
      consentScope: input.consentScope ?? null,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    },
  });
}
