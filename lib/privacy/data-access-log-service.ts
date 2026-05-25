import type { DataClassification } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function logDataAccess(input: {
  actorUserId: string;
  subjectUserId?: string;
  resourceType: string;
  resourceId?: string;
  classification: DataClassification;
  purpose: string;
}) {
  return prisma.dataAccessLog.create({
    data: {
      actorUserId: input.actorUserId,
      subjectUserId: input.subjectUserId,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      classification: input.classification,
      purpose: input.purpose,
    },
  });
}
