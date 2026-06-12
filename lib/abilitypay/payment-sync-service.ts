import type { MapAbleUserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { logAbilityPayEvent } from "./audit";

export type AbilityPayPaymentSyncStatus = "paid" | "failed" | "refunded";

export async function syncAbilityPayFromBillingInvoice(
  billingInvoiceId: string,
  status: AbilityPayPaymentSyncStatus,
  metadata?: {
    actorUserId?: string;
    actorRole?: MapAbleUserRole;
    sessionId?: string;
    paymentIntentId?: string;
    failureReason?: string;
  }
) {
  const abilityPayInvoice = await prisma.abilityPayInvoice.findFirst({
    where: { billingInvoiceId },
    include: {
      paymentAttempts: {
        where: { adapter: "stripe_checkout" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!abilityPayInvoice) return null;

  const paymentStatus =
    status === "paid"
      ? "paid"
      : status === "failed"
        ? "failed"
        : "refunded";
  const attemptStatus =
    status === "paid"
      ? "succeeded"
      : status === "failed"
        ? "failed"
        : "refunded";

  const attempt = abilityPayInvoice.paymentAttempts[0];

  await prisma.$transaction(async (tx) => {
    await tx.abilityPayInvoice.update({
      where: { id: abilityPayInvoice.id },
      data: { paymentStatus },
    });

    if (attempt) {
      await tx.abilityPayPaymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: attemptStatus,
          billingInvoiceId,
          externalRef:
            metadata?.sessionId ?? metadata?.paymentIntentId ?? attempt.externalRef,
          failureReason: metadata?.failureReason,
        },
      });
    }
  });

  const auditAction =
    status === "paid"
      ? "abilitypay.payment.paid"
      : status === "failed"
        ? "abilitypay.payment.failed"
        : "abilitypay.payment.refunded";

  await logAbilityPayEvent({
    action: auditAction,
    entityType: "AbilityPayInvoice",
    entityId: abilityPayInvoice.id,
    actorUserId: metadata?.actorUserId,
    actorRole: metadata?.actorRole,
    participantId: abilityPayInvoice.participantId,
    metadata: {
      billingInvoiceId,
      paymentAttemptId: attempt?.id,
      sessionId: metadata?.sessionId,
      paymentIntentId: metadata?.paymentIntentId,
      failureReason: metadata?.failureReason,
    },
  });

  return { abilityPayInvoiceId: abilityPayInvoice.id, paymentStatus };
}

export async function syncAbilityPayFromBillingMetadata(params: {
  billingInvoiceId: string;
  abilityPayInvoiceId?: string;
  status: AbilityPayPaymentSyncStatus;
  sessionId?: string;
  paymentIntentId?: string;
  failureReason?: string;
}) {
  if (params.abilityPayInvoiceId) {
    const linked = await prisma.abilityPayInvoice.findFirst({
      where: {
        id: params.abilityPayInvoiceId,
        billingInvoiceId: params.billingInvoiceId,
      },
      select: { id: true },
    });
    if (!linked) return null;
  }

  return syncAbilityPayFromBillingInvoice(params.billingInvoiceId, params.status, {
    sessionId: params.sessionId,
    paymentIntentId: params.paymentIntentId,
    failureReason: params.failureReason,
  });
}
