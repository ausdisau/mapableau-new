import { prisma } from "@/lib/prisma";
import type { ConsentScope } from "@/types/mapable";

export type FoodSensitiveAccessPurpose =
  | "order_fulfilment"
  | "invoice_review"
  | "admin_support";

export async function logSensitiveAccess(params: {
  actorUserId?: string | null;
  subjectUserId: string;
  resourceType: string;
  resourceId?: string | null;
  purpose: FoodSensitiveAccessPurpose;
  consentScope?: ConsentScope | string | null;
}) {
  if (!params.actorUserId || params.actorUserId === params.subjectUserId) {
    return null;
  }

  return prisma.dataAccessLog.create({
    data: {
      actorUserId: params.actorUserId,
      subjectUserId: params.subjectUserId,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      purpose: params.purpose,
      consentScope: params.consentScope ?? null,
    },
  });
}
