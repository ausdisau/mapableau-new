import type { MapAbleUserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { fundingModelLabel, resolveFundingModel } from "./funding-model";

export type PaymentAttemptRow = {
  id: string;
  invoiceId: string;
  invoiceNumber: string | null;
  participantName: string | null;
  providerName: string | null;
  fundingModel: string;
  adapter: string;
  attemptStatus: string;
  paymentStatus: string;
  totalCents: number;
  externalRef: string | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function listPaymentAttemptsForUser(
  userId: string,
  role: MapAbleUserRole,
  filters?: { status?: string; adapter?: string }
): Promise<PaymentAttemptRow[]> {
  let invoiceWhere: Record<string, unknown> = {};

  if (role === "plan_manager") {
    const rels = await prisma.planManagerRelationship.findMany({
      where: { planManagerId: userId, status: "active" },
    });
    const participantIds = rels.map((r) => r.participantId);
    invoiceWhere = { participantId: { in: participantIds } };
  } else if (role === "participant" || role === "family_member") {
    invoiceWhere = { participantId: userId };
  } else if (role !== "mapable_admin") {
    return [];
  }

  const attempts = await prisma.abilityPayPaymentAttempt.findMany({
    where: {
      ...(filters?.status ? { status: filters.status as never } : {}),
      ...(filters?.adapter ? { adapter: filters.adapter as never } : {}),
      invoice: invoiceWhere,
    },
    include: {
      invoice: {
        include: {
          participant: { select: { name: true } },
          provider: { select: { legalName: true } },
          plan: { select: { fundingModel: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return attempts.map((attempt) => {
    const inv = attempt.invoice;
    const model = resolveFundingModel({
      invoiceFundingModel: inv.fundingModel,
      planFundingModel: inv.plan?.fundingModel,
    });

    return {
      id: attempt.id,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      participantName: inv.participant.name,
      providerName: inv.provider?.legalName ?? null,
      fundingModel: fundingModelLabel(model),
      adapter: attempt.adapter,
      attemptStatus: attempt.status,
      paymentStatus: inv.paymentStatus,
      totalCents: inv.totalCents,
      externalRef: attempt.externalRef,
      failureReason: attempt.failureReason,
      createdAt: attempt.createdAt,
      updatedAt: attempt.updatedAt,
    };
  });
}

export async function getReconciliationSummary(role: MapAbleUserRole) {
  if (role !== "mapable_admin" && role !== "plan_manager") {
    return null;
  }

  const [byStatus, byAdapter, failedRecent] = await Promise.all([
    prisma.abilityPayPaymentAttempt.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.abilityPayPaymentAttempt.groupBy({
      by: ["adapter"],
      _count: { id: true },
    }),
    prisma.abilityPayPaymentAttempt.findMany({
      where: { status: "failed" },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: {
        invoice: {
          select: { id: true, invoiceNumber: true, totalCents: true },
        },
      },
    }),
  ]);

  return {
    byStatus: Object.fromEntries(
      byStatus.map((row) => [row.status, row._count.id])
    ),
    byAdapter: Object.fromEntries(
      byAdapter.map((row) => [row.adapter, row._count.id])
    ),
    failedRecent,
  };
}
