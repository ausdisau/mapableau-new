import type { MapAbleUserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { logAbilityPayEvent } from "./audit";
import { resolveFundingModel } from "./funding-model";

export async function confirmPlanManagedPayment(params: {
  invoiceId: string;
  actorUserId: string;
  actorRole: MapAbleUserRole;
  notes?: string;
}) {
  if (params.actorRole !== "plan_manager" && params.actorRole !== "mapable_admin") {
    throw new Error("PLAN_MANAGER_REQUIRED");
  }

  const invoice = await prisma.abilityPayInvoice.findUnique({
    where: { id: params.invoiceId },
    include: {
      plan: { select: { fundingModel: true } },
      paymentAttempts: {
        where: { adapter: { in: ["plan_export", "manual"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");

  const model = resolveFundingModel({
    invoiceFundingModel: invoice.fundingModel,
    planFundingModel: invoice.plan?.fundingModel,
  });
  if (model !== "plan_managed") {
    throw new Error("NOT_PLAN_MANAGED");
  }

  if (invoice.status !== "approved" && invoice.status !== "exported") {
    throw new Error("INVALID_STATUS");
  }

  if (invoice.paymentStatus === "paid") {
    throw new Error("ALREADY_PAID");
  }

  const attempt = invoice.paymentAttempts[0];

  await prisma.$transaction(async (tx) => {
    await tx.abilityPayInvoice.update({
      where: { id: params.invoiceId },
      data: { paymentStatus: "paid" },
    });

    if (attempt) {
      await tx.abilityPayPaymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: "succeeded",
          adapter: "manual",
          metadata: {
            ...(typeof attempt.metadata === "object" && attempt.metadata
              ? (attempt.metadata as object)
              : {}),
            confirmedBy: params.actorUserId,
            confirmedAt: new Date().toISOString(),
            notes: params.notes,
          },
        },
      });
    } else {
      await tx.abilityPayPaymentAttempt.create({
        data: {
          invoiceId: params.invoiceId,
          adapter: "manual",
          status: "succeeded",
          metadata: {
            confirmedBy: params.actorUserId,
            confirmedAt: new Date().toISOString(),
            notes: params.notes,
          },
        },
      });
    }
  });

  await logAbilityPayEvent({
    action: "abilitypay.payment.paid",
    entityType: "AbilityPayInvoice",
    entityId: params.invoiceId,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    participantId: invoice.participantId,
    metadata: {
      adapter: "manual",
      notes: params.notes,
      paymentAttemptId: attempt?.id,
    },
  });

  return { invoiceId: params.invoiceId, paymentStatus: "paid" as const };
}
