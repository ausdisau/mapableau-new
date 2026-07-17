import type { NdisBillingRoute } from "@prisma/client";

import {
  allowsMultiParticipantGrouping,
  requiresSingleParticipantInvoice,
} from "@/lib/ndis-gateway/routing/route-policy";

export type GroupableBillable = {
  id: string;
  participantId: string | null;
  billingRoute: NdisBillingRoute;
};

export type BillableGroup = {
  billingRoute: NdisBillingRoute;
  participantId: string | null;
  /** When NDIA multi-participant, participantId is null and billableItemIds span participants. */
  multiParticipant: boolean;
  billableItemIds: string[];
};

/**
 * Group billable items for batching/invoicing.
 * Self/plan/private → one participant per group.
 * NDIA → may group all items of that route together.
 */
export function groupBillableItemsForBatching(
  items: GroupableBillable[]
): BillableGroup[] {
  if (items.length === 0) return [];

  const byRoute = new Map<NdisBillingRoute, GroupableBillable[]>();
  for (const item of items) {
    const list = byRoute.get(item.billingRoute) ?? [];
    list.push(item);
    byRoute.set(item.billingRoute, list);
  }

  const groups: BillableGroup[] = [];
  for (const [billingRoute, routeItems] of byRoute) {
    if (allowsMultiParticipantGrouping(billingRoute)) {
      groups.push({
        billingRoute,
        participantId: null,
        multiParticipant: true,
        billableItemIds: routeItems.map((i) => i.id),
      });
      continue;
    }

    if (
      requiresSingleParticipantInvoice(billingRoute) ||
      !allowsMultiParticipantGrouping(billingRoute)
    ) {
      const byParticipant = new Map<string, GroupableBillable[]>();
      for (const item of routeItems) {
        const key = item.participantId ?? `none:${item.id}`;
        const list = byParticipant.get(key) ?? [];
        list.push(item);
        byParticipant.set(key, list);
      }
      for (const [participantKey, pItems] of byParticipant) {
        groups.push({
          billingRoute,
          participantId: participantKey.startsWith("none:")
            ? null
            : participantKey,
          multiParticipant: false,
          billableItemIds: pItems.map((i) => i.id),
        });
      }
    }
  }

  return groups;
}
