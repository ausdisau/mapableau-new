import { prisma } from "@/lib/prisma";

export async function logSensitiveAccess(params: {
  actorUserId?: string;
  subjectUserId: string;
  resourceType: string;
  resourceId?: string;
  purpose: string;
  consentScope?: string;
}) {
  return prisma.dataAccessLog.create({
    data: {
      actorUserId: params.actorUserId,
      subjectUserId: params.subjectUserId,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      purpose: params.purpose,
      consentScope: params.consentScope,
    },
  });
}
