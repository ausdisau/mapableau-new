import type { DataClassification, MapAbleUserRole } from "@prisma/client";

import { classifyField } from "@/lib/privacy/data-classification";
import { logSensitiveFieldAccess } from "@/lib/privacy/redaction-service";

const DATA_CLASS_LIST: DataClassification[] = [
  "public",
  "internal",
  "participant_controlled",
  "sensitive_disability",
  "sensitive_health",
  "ndis_plan_data",
  "financial",
  "safeguarding",
  "clinical",
  "credential_document",
];

const ROLE_SENSITIVE_ACCESS: Partial<Record<MapAbleUserRole, DataClassification[]>> = {
  mapable_admin: DATA_CLASS_LIST,
  participant: [
    "participant_controlled",
    "sensitive_disability",
    "ndis_plan_data",
    "financial",
  ],
  provider_admin: ["internal", "financial"],
  support_worker: ["internal"],
  driver: ["internal"],
  support_coordinator: ["ndis_plan_data", "internal"],
  plan_manager: ["ndis_plan_data", "financial", "internal"],
};

export async function canAccessField(params: {
  actorUserId: string;
  role: MapAbleUserRole;
  fieldKey: string;
  entityType: string;
  entityId: string;
  participantId?: string;
  isOwner?: boolean;
}): Promise<boolean> {
  const classification = classifyField(params.fieldKey);
  if (classification === "public") return true;

  if (params.isOwner && classification === "participant_controlled") {
    return true;
  }

  const allowed = ROLE_SENSITIVE_ACCESS[params.role] ?? [];
  const granted =
    allowed.includes(classification) ||
    params.role === "mapable_admin";

  if (granted) {
    await logSensitiveFieldAccess({
      actorUserId: params.actorUserId,
      fieldKey: params.fieldKey,
      classification,
      entityType: params.entityType,
      entityId: params.entityId,
      participantId: params.participantId,
      granted: true,
    });
  }

  return granted;
}

export function shouldRedactField(
  role: MapAbleUserRole,
  fieldKey: string,
  isOwner?: boolean
): boolean {
  const classification = classifyField(fieldKey);
  if (classification === "public") return false;
  if (isOwner && classification === "participant_controlled") return false;
  const allowed = ROLE_SENSITIVE_ACCESS[role] ?? [];
  return !allowed.includes(classification) && role !== "mapable_admin";
}
