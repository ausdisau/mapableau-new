import type { ServiceRequestApprovalStatus } from "@prisma/client";

import type { UserRole } from "@/types/mapable";

import {
  createQuotationDraftFromRequest,
  evaluateApprovalGate,
  recordServiceRequestApproval,
} from "./service-quotation-service";

export async function onCareRequestSubmitted(params: {
  careRequestId: string;
  actorUserId: string;
}) {
  await evaluateApprovalGate(params.careRequestId);
  return createQuotationDraftFromRequest({
    careRequestId: params.careRequestId,
    actorUserId: params.actorUserId,
  });
}

export async function onServiceRequestApprovalRecorded(params: {
  careRequestId: string;
  actorUserId: string;
  actorRole: UserRole;
  decision: ServiceRequestApprovalStatus;
  reason?: string;
  metadata?: Record<string, unknown>;
}) {
  const approval = await recordServiceRequestApproval(params);
  await evaluateApprovalGate(params.careRequestId);

  const quotation = await createQuotationDraftFromRequest({
    careRequestId: params.careRequestId,
    actorUserId: params.actorUserId,
  });

  return { approval, quotation };
}
