import { lockBillableItem } from "@/lib/ndis-gateway/billing/billable-item-lock";
import { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";

/**
 * Lock all billable items in a package/batch before dispatch.
 */
export async function lockBillingPackage(input: {
  organisationId: string;
  actorUserId: string;
  billableItemIds: string[];
  reason?: string | null;
}) {
  const correlationId = createCorrelationId();
  const results = [];
  for (const billableItemId of input.billableItemIds) {
    const locked = await lockBillableItem({
      organisationId: input.organisationId,
      billableItemId,
      actorUserId: input.actorUserId,
      reason: input.reason ?? "lock_billing_package",
    });
    results.push(locked);
  }
  return { correlationId, items: results };
}
