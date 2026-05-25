import type { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function createRehabPlan(params: {
  participantId: string;
  createdByTherapistId?: string;
  goalsSummary?: string;
  interventions?: string;
  reviewDate?: Date;
  participantVisibleSummary: string;
  actorUserId: string;
}) {
  const plan = await prisma.rehabPlan.create({
    data: {
      participantId: params.participantId,
      createdByTherapistId: params.createdByTherapistId,
      goalsSummary: params.goalsSummary,
      interventions: params.interventions,
      reviewDate: params.reviewDate,
      participantVisibleSummary: params.participantVisibleSummary,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "moves.rehab_plan.created",
    entityType: "RehabPlan",
    entityId: plan.id,
    participantId: params.participantId,
  });

  return plan;
}

export async function getRehabPlanForParticipant(
  planId: string,
  participantId: string,
) {
  return prisma.rehabPlan.findFirst({
    where: { id: planId, participantId },
    include: { goals: true },
  });
}

export async function submitHomeVisitRiskCheck(params: {
  therapyAppointmentId: string;
  actorUserId: string;
  checklist: Prisma.InputJsonValue;
}) {
  const appt = await prisma.therapyAppointment.findUniqueOrThrow({
    where: { id: params.therapyAppointmentId },
  });
  if (appt.deliveryMode !== "home_visit") {
    throw new Error("NOT_HOME_VISIT");
  }

  return prisma.homeVisitRiskCheck.upsert({
    where: { therapyAppointmentId: params.therapyAppointmentId },
    create: {
      therapyAppointmentId: params.therapyAppointmentId,
      checklistJson: params.checklist,
      completedAt: new Date(),
      completedById: params.actorUserId,
    },
    update: {
      checklistJson: params.checklist,
      completedAt: new Date(),
      completedById: params.actorUserId,
    },
  });
}

export async function addEquipmentRecommendation(params: {
  therapyAppointmentId: string;
  itemName: string;
  marketplaceUrl?: string;
  notes?: string;
  actorUserId: string;
}) {
  const rec = await prisma.equipmentRecommendation.create({
    data: {
      therapyAppointmentId: params.therapyAppointmentId,
      itemName: params.itemName,
      marketplaceUrl: params.marketplaceUrl,
      notes: params.notes,
    },
  });
  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "moves.equipment.recommended",
    entityType: "EquipmentRecommendation",
    entityId: rec.id,
  });
  return rec;
}
