import { prisma } from "@/lib/prisma";

import { assertPlanManagerInvoiceAccess } from "./access-control";
import type { CurrentUser } from "@/lib/auth/current-user";

export async function listPlanManagerInvoices(actor: CurrentUser) {
  const links = await prisma.foodInvoiceLink.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      order: {
        select: {
          id: true,
          participantId: true,
          totalAmount: true,
          currency: true,
          status: true,
          invoiceStatus: true,
          createdAt: true,
        },
      },
    },
  });

  const allowed = [];
  for (const link of links) {
    try {
      await assertPlanManagerInvoiceAccess(actor, link.order.participantId);
      allowed.push({
        ...link,
        ndisReviewStatus: "review_required",
        order: {
          id: link.order.id,
          totalAmount: link.order.totalAmount,
          currency: link.order.currency,
          status: link.order.status,
          invoiceStatus: link.order.invoiceStatus,
          createdAt: link.order.createdAt,
        },
      });
    } catch {
      // skip without consent
    }
  }
  return allowed;
}
