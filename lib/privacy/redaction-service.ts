import type { DataClassification } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { classifyField } from "@/lib/privacy/data-classification";
import { shouldRedactField } from "@/lib/privacy/field-access-policy";
import type { MapAbleUserRole } from "@prisma/client";

const REDACTED = "[Redacted]";

export async function logSensitiveFieldAccess(params: {
  actorUserId: string;
  fieldKey: string;
  classification: DataClassification;
  entityType: string;
  entityId: string;
  participantId?: string;
  granted: boolean;
}) {
  await prisma.sensitiveDataAccessLog.create({
    data: {
      actorUserId: params.actorUserId,
      fieldKey: params.fieldKey,
      classification: params.classification,
      entityType: params.entityType,
      entityId: params.entityId,
      participantId: params.participantId,
      granted: params.granted,
    },
  });
}

export function redactRecord<T extends Record<string, unknown>>(
  record: T,
  role: MapAbleUserRole,
  options?: { isOwner?: boolean; fields?: string[] }
): T {
  const keys = options?.fields ?? Object.keys(record);
  const out = { ...record } as T;
  for (const key of keys) {
    if (
      shouldRedactField(role, key, options?.isOwner) &&
      record[key] != null
    ) {
      (out as Record<string, unknown>)[key] = REDACTED;
    }
  }
  return out;
}

export function redactValue(fieldKey: string): string {
  void classifyField(fieldKey);
  return REDACTED;
}
