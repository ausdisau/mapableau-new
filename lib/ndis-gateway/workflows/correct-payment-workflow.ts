import type { NdisCorrectionType } from "@prisma/client";

import { createReplacementBillableItem } from "@/lib/ndis-gateway/billing/billable-item-correction";
import { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";

export async function correctPaymentWorkflow(input: {
  organisationId: string;
  actorUserId: string;
  originalBillableItemId: string;
  correctionType: NdisCorrectionType;
  reason: string;
  patches: Parameters<typeof createReplacementBillableItem>[0]["patches"];
}) {
  const correlationId = createCorrelationId();
  const result = await createReplacementBillableItem({
    organisationId: input.organisationId,
    originalBillableItemId: input.originalBillableItemId,
    actorUserId: input.actorUserId,
    correctionType: input.correctionType,
    reason: input.reason,
    patches: input.patches,
  });
  return { correlationId, ...result };
}
