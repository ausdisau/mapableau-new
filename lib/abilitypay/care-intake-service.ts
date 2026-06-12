import type { MapAbleUserRole } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

import { prisma } from "@/lib/prisma";

import { logAbilityPayEvent } from "./audit";
import { validateAbilityPayInvoice } from "./invoice-validation-service";

type SupportRecord = Record<string, unknown>;

function lineItemsFromCareLog(params: {
  supportsDelivered: unknown;
  serviceDate: Date;
  durationMinutes?: number | null;
}) {
  const supports = Array.isArray(params.supportsDelivered)
    ? (params.supportsDelivered as SupportRecord[])
    : [];

  if (supports.length === 0) {
    const hours = params.durationMinutes
      ? Math.max(1, Math.round(params.durationMinutes / 60))
      : 1;
    return [
      {
        description: "Care support delivered",
        serviceDate: params.serviceDate,
        quantity: hours,
        unitPriceCents: 0,
        totalCents: 0,
        supportItemCode: undefined as string | undefined,
        sortOrder: 0,
      },
    ];
  }

  return supports.map((support, index) => {
    const description = String(
      support.name ?? support.description ?? `Support ${index + 1}`
    );
    const unitPriceCents =
      typeof support.unitPriceCents === "number" ? support.unitPriceCents : 0;
    const quantity =
      typeof support.quantity === "number"
        ? support.quantity
        : params.durationMinutes
          ? Math.max(1, Math.round(params.durationMinutes / 60))
          : 1;
    const totalCents = Math.round(quantity * unitPriceCents);

    return {
      description,
      serviceDate: params.serviceDate,
      quantity,
      unitPriceCents,
      totalCents,
      supportItemCode:
        typeof support.supportItemCode === "string"
          ? support.supportItemCode
          : undefined,
      sortOrder: index,
    };
  });
}

async function resolveAbilityPayProvider(organisationId: string) {
  return prisma.abilityPayProvider.findFirst({
    where: { organisationId, isActive: true },
    orderBy: { createdAt: "asc" },
  });
}

async function resolveActivePlan(participantId: string) {
  return prisma.abilityPayParticipantPlan.findFirst({
    where: { participantId, status: "active" },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createDraftInvoiceFromCareServiceLog(params: {
  careServiceLogId: string;
  actorUserId: string;
  actorRole: MapAbleUserRole;
}) {
  const existing = await prisma.abilityPayInvoice.findFirst({
    where: {
      sourceType: "care_service_log",
      sourceRefId: params.careServiceLogId,
    },
  });
  if (existing) {
    return { invoice: existing, created: false as const };
  }

  const log = await prisma.careServiceLog.findUnique({
    where: { id: params.careServiceLogId },
    include: { careShift: true, careBooking: true },
  });
  if (!log) throw new Error("CARE_LOG_NOT_FOUND");
  if (log.status !== "confirmed") {
    throw new Error("CARE_LOG_NOT_CONFIRMED");
  }

  const provider = await resolveAbilityPayProvider(log.organisationId);
  const plan = await resolveActivePlan(log.participantId);
  const serviceDate =
    log.careShift?.startAt ??
    log.confirmedAt ??
    log.submittedAt ??
    log.createdAt;

  const lineData = lineItemsFromCareLog({
    supportsDelivered: log.supportsDelivered,
    serviceDate,
    durationMinutes: log.durationMinutes,
  });

  const subtotalCents = lineData.reduce((sum, line) => sum + line.totalCents, 0);

  const invoice = await prisma.abilityPayInvoice.create({
    data: {
      participantId: log.participantId,
      createdById: params.actorUserId,
      providerId: provider?.id,
      planId: plan?.id,
      fundingModel: plan?.fundingModel,
      status: "submitted",
      paymentStatus: "pending_review",
      sourceType: "care_service_log",
      sourceRefId: params.careServiceLogId,
      issueDate: serviceDate,
      subtotalCents,
      totalCents: subtotalCents,
      notes: log.notes ?? undefined,
      lineItems: {
        create: lineData.map((line) => ({
          description: line.description,
          serviceDate: line.serviceDate,
          quantity: new Decimal(line.quantity),
          unitPriceCents: line.unitPriceCents,
          totalCents: line.totalCents,
          supportItemCode: line.supportItemCode,
          sortOrder: line.sortOrder,
        })),
      },
    },
    include: { lineItems: true, provider: true },
  });

  await validateAbilityPayInvoice(invoice.id);

  await logAbilityPayEvent({
    action: "abilitypay.invoice.created",
    entityType: "AbilityPayInvoice",
    entityId: invoice.id,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    participantId: log.participantId,
    organisationId: log.organisationId,
    metadata: {
      sourceType: "care_service_log",
      careServiceLogId: params.careServiceLogId,
    },
  });

  return { invoice, created: true as const };
}
