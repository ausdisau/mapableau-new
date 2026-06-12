import type { MapAbleUserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { logAbilityPayEvent } from "./audit";
import {
  fundingRouteForModel,
  resolveFundingModel,
  type AbilityPayFundingRoute,
} from "./funding-model";
import { initiateNdiaHandoff } from "./ndia-adapter-service";

export type FundingRouteResult = {
  route: AbilityPayFundingRoute;
  paymentAttemptId: string;
  paymentStatus: "ready_to_pay" | "processing";
};

export async function routeApprovedInvoice(params: {
  invoiceId: string;
  actorUserId: string;
  actorRole: MapAbleUserRole;
}): Promise<FundingRouteResult> {
  const invoice = await prisma.abilityPayInvoice.findUnique({
    where: { id: params.invoiceId },
    include: { plan: { select: { fundingModel: true } } },
  });
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");

  const model = resolveFundingModel({
    invoiceFundingModel: invoice.fundingModel,
    planFundingModel: invoice.plan?.fundingModel,
  });
  const route = fundingRouteForModel(model);

  const paymentStatus =
    route.model === "agency_managed" ? "processing" : "ready_to_pay";

  const attempt = await prisma.$transaction(async (tx) => {
    await tx.abilityPayInvoice.update({
      where: { id: params.invoiceId },
      data: {
        fundingModel: model,
        paymentStatus,
      },
    });

    return tx.abilityPayPaymentAttempt.create({
      data: {
        invoiceId: params.invoiceId,
        adapter: route.adapter,
        status: "pending",
        metadata: { fundingModel: model, nextStep: route.nextStep },
      },
    });
  });

  await logAbilityPayEvent({
    action: "abilitypay.payment.initiated",
    entityType: "AbilityPayPaymentAttempt",
    entityId: attempt.id,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    participantId: invoice.participantId,
    metadata: {
      invoiceId: params.invoiceId,
      fundingModel: model,
      adapter: route.adapter,
      nextStep: route.nextStep,
    },
  });

  if (route.model === "agency_managed") {
    try {
      await initiateNdiaHandoff({
        invoiceId: params.invoiceId,
        actorUserId: params.actorUserId,
        actorRole: params.actorRole,
      });
    } catch {
      // Handoff is best-effort; invoice remains in processing for manual follow-up.
    }
  }

  return {
    route,
    paymentAttemptId: attempt.id,
    paymentStatus,
  };
}
