import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import type { ProjectMilestoneStatus } from "@prisma/client";

import { notifyMilestoneUpdate } from "./home-modification-service";

export async function getProject(params: { projectId: string }) {
  return prisma.homeModificationProject.findUnique({
    where: { id: params.projectId },
    include: {
      milestones: { orderBy: { sortOrder: "asc" } },
      request: true,
    },
  });
}

export async function createDefaultMilestones(projectId: string) {
  const defaults = [
    { title: "Assessment booked", sortOrder: 0 },
    { title: "Quote accepted", sortOrder: 1 },
    { title: "Installation scheduled", sortOrder: 2 },
  ];

  return Promise.all(
    defaults.map((m) =>
      prisma.projectMilestone.create({
        data: {
          projectId,
          title: m.title,
          sortOrder: m.sortOrder,
          status: "pending",
        },
      })
    )
  );
}

export async function updateMilestone(params: {
  milestoneId: string;
  actorUserId: string;
  participantId: string;
  projectId: string;
  status: ProjectMilestoneStatus;
  notes?: string;
}) {
  const milestone = await prisma.projectMilestone.update({
    where: { id: params.milestoneId },
    data: {
      status: params.status,
      ...(params.status === "completed"
        ? { completedAt: new Date() }
        : {}),
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "home_modification.milestone_updated",
    entityType: "ProjectMilestone",
    entityId: params.milestoneId,
    participantId: params.participantId,
    metadata: { status: params.status },
  });

  await notifyMilestoneUpdate(
    params.participantId,
    "Project milestone updated",
    `${milestone.title} is now ${params.status.replace(/_/g, " ")}.`,
    params.projectId
  );

  return milestone;
}

export async function bookOtAssessment(params: {
  requestId: string;
  assessorId: string;
  scheduledAt: Date;
  actorUserId: string;
  participantId: string;
}) {
  const assessment = await prisma.homeModificationAssessment.create({
    data: {
      requestId: params.requestId,
      assessorId: params.assessorId,
      scheduledAt: params.scheduledAt,
      status: "scheduled",
    },
  });

  const booking = await prisma.booking.create({
    data: {
      participantId: params.participantId,
      bookingType: "care",
      requestedStart: params.scheduledAt,
      status: "requested",
      participantNotes: "OT/access assessment for home modifications",
      createdById: params.actorUserId,
    },
  });

  await prisma.homeModificationAssessment.update({
    where: { id: assessment.id },
    data: { bookingId: booking.id },
  });

  await prisma.homeModificationRequest.update({
    where: { id: params.requestId },
    data: { status: "assessment_booked" },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "home_modification.assessment_booked",
    entityType: "HomeModificationAssessment",
    entityId: assessment.id,
    participantId: params.participantId,
    metadata: { bookingId: booking.id },
  });

  return { assessment, booking };
}

export async function uploadHomeModificationDocument(params: {
  requestId: string;
  participantId: string;
  uploadedById: string;
  fileName: string;
  mimeType?: string;
  storageKey?: string;
  documentType?: string;
}) {
  const doc = await prisma.homeModificationDocument.create({
    data: {
      requestId: params.requestId,
      participantId: params.participantId,
      uploadedById: params.uploadedById,
      fileName: params.fileName,
      mimeType: params.mimeType,
      storageKey: params.storageKey,
      documentType: params.documentType ?? "photo",
      visibility: "private_to_participant",
    },
  });

  await createAuditEvent({
    actorUserId: params.uploadedById,
    action: "home_modification.document_uploaded",
    entityType: "HomeModificationDocument",
    entityId: doc.id,
    participantId: params.participantId,
    metadata: { visibility: "private_to_participant" },
  });

  return doc;
}
