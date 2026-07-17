import type { NdisBillingRoute } from "@prisma/client";

import { createDocumentPackage } from "@/lib/ndis-gateway/documents/document-package-service";
import { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";

export async function generateRouteDocument(input: {
  organisationId: string;
  actorUserId: string;
  billingRoute: NdisBillingRoute;
  billableItemIds: string[];
  participantId?: string | null;
  billingBatchId?: string | null;
}) {
  const correlationId = createCorrelationId();
  const result = await createDocumentPackage({
    organisationId: input.organisationId,
    actorUserId: input.actorUserId,
    billingRoute: input.billingRoute,
    billableItemIds: input.billableItemIds,
    participantId: input.participantId,
    billingBatchId: input.billingBatchId,
  });

  return {
    ...result,
    workflowCorrelationId: correlationId,
  };
}
