import type { CurrentUser } from "@/lib/auth/current-user";
import { checkConsent } from "@/lib/consent/consent-service";
import { prisma } from "@/lib/prisma";

import { logSensitiveAccess } from "./data-access-log";

export async function listPlanManagerFoodInvoices(user: CurrentUser) {
  const invoices = await prisma.foodInvoiceLink.findMany({
    where: { status: { in: ["created", "sent", "under_review"] } },
    include: { order: { include: { items: true, vendor: true } } },
    orderBy: { createdAt: "desc" },
  });

  const visible = [];
  for (const invoice of invoices) {
    const hasConsent =
      (await checkConsent({ subjectUserId: invoice.order.participantId, grantedToUserId: user.id, scope: "foods.invoice_share" })) ||
      (await checkConsent({ subjectUserId: invoice.order.participantId, grantedToUserId: user.id, scope: "plan_manager.invoice_access" }));
    if (!hasConsent) continue;
    await logSensitiveAccess({
      actorUserId: user.id,
      subjectUserId: invoice.order.participantId,
      resourceType: "FoodInvoiceLink",
      resourceId: invoice.id,
      purpose: "invoice_review",
      consentScope: "foods.invoice_share",
    });
    visible.push({ ...invoice, ndisReviewRequired: true });
  }

  return visible;
}

export const listFoodInvoicesForPlanManager = listPlanManagerFoodInvoices;

