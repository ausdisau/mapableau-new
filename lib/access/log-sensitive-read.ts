import type { DataClassification } from "@prisma/client";

import { logDataAccess } from "@/lib/privacy/data-access-log-service";

export async function logSensitiveRead(input: {
  actorUserId: string;
  subjectUserId?: string;
  resourceType: string;
  resourceId?: string;
  classification: DataClassification;
  purpose: string;
}) {
  return logDataAccess(input);
}
