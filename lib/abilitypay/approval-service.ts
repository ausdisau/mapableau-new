import type { MapAbleUserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { logAbilityPayEvent } from "./audit";
import { recalcBudgetSpent } from "./plan-service";

const HUMAN_APPROVER_ROLES: MapAbleUserRole[] = [
  "participant",
  "family_member",
  "plan_manager",
];

export function assertHumanApprover(role: MapAbleUserRole) {
  if (!HUMAN_APPROVER_ROLES.includes(role)) {
    throw new Error("HUMAN_APPROVAL_REQUIRED");
  }
}

export async function approveInvoice(params: {
  invoiceId: string;
  actorUserId: string;
  actorRole: MapAbleUserRole;
  notes?: string;
}) {
  assertHumanApprover(params.actorRole);

  const invoice = await prisma.abilityPayInvoice.findUnique({
    where: { id: params.invoiceId },
  });
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");

  if (
    params.actorRole === "participant" ||
    params.actorRole === "family_member"
  ) {
    if (invoice.participantId !== params.actorUserId) {
      throw new Error("NOT_AUTHORISED");
    }
    if (invoice.status !== "awaiting_participant") {
      throw new Error("INVALID_STATUS");
    }
  }

  const [updated, event] = await prisma.$transaction([
    prisma.abilityPayInvoice.update({
      where: { id: params.invoiceId },
      data: {
        status: "approved",
        paymentStatus: "approved",
      },
    }),
    prisma.abilityPayApprovalEvent.create({
      data: {
        invoiceId: params.invoiceId,
        actorUserId: params.actorUserId,
        decision: "approved",
        notes: params.notes,
      },
    }),
  ]);

  if (updated.planId) {
    await recalcBudgetSpent(updated.planId);
  }

  await logAbilityPayEvent({
    action: "abilitypay.invoice.approved",
    entityType: "AbilityPayInvoice",
    entityId: params.invoiceId,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    participantId: updated.participantId,
    metadata: { approvalEventId: event.id },
  });

  return { invoice: updated, event };
}

export async function rejectInvoice(params: {
  invoiceId: string;
  actorUserId: string;
  actorRole: MapAbleUserRole;
  notes: string;
}) {
  assertHumanApprover(params.actorRole);

  const invoice = await prisma.abilityPayInvoice.findUnique({
    where: { id: params.invoiceId },
  });
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");

  const [updated, event] = await prisma.$transaction([
    prisma.abilityPayInvoice.update({
      where: { id: params.invoiceId },
      data: {
        status: "rejected",
        paymentStatus: "rejected",
      },
    }),
    prisma.abilityPayApprovalEvent.create({
      data: {
        invoiceId: params.invoiceId,
        actorUserId: params.actorUserId,
        decision: "rejected",
        notes: params.notes,
      },
    }),
  ]);

  await logAbilityPayEvent({
    action: "abilitypay.invoice.rejected",
    entityType: "AbilityPayInvoice",
    entityId: params.invoiceId,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    participantId: updated.participantId,
    metadata: { approvalEventId: event.id, notes: params.notes },
  });

  return { invoice: updated, event };
}

export async function queryInvoice(params: {
  invoiceId: string;
  actorUserId: string;
  actorRole: MapAbleUserRole;
  notes: string;
}) {
  assertHumanApprover(params.actorRole);

  const event = await prisma.abilityPayApprovalEvent.create({
    data: {
      invoiceId: params.invoiceId,
      actorUserId: params.actorUserId,
      decision: "queried",
      notes: params.notes,
    },
  });

  const invoice = await prisma.abilityPayInvoice.findUnique({
    where: { id: params.invoiceId },
  });

  await logAbilityPayEvent({
    action: "abilitypay.invoice.queried",
    entityType: "AbilityPayInvoice",
    entityId: params.invoiceId,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    participantId: invoice?.participantId,
    metadata: { notes: params.notes },
  });

  return event;
}
