import type { ComplaintStatus, ComplaintType } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase4Config } from "@/lib/config/phase4";
import {
  createIncident,
  submitIncident,
} from "@/lib/incidents/incident-service";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

export const SAFETY_COMPLAINT_TYPES: ComplaintType[] = [
  "unsafe_service",
  "discrimination_or_disrespect",
];

export type CreateComplaintInput = {
  participantId: string;
  createdById: string;
  type: ComplaintType;
  title: string;
  description: string;
  bookingId?: string;
  invoiceId?: string;
  timesheetId?: string;
  organisationId?: string;
};

function mapComplaintToIncidentCategory(
  type: ComplaintType
): "unsafe_care" | "unsafe_transport" | "privacy_concern" | "complaint" {
  if (type === "unsafe_service") return "unsafe_care";
  if (type === "privacy_concern") return "privacy_concern";
  return "complaint";
}

export async function createComplaint(input: CreateComplaintInput) {
  if (!phase4Config.disputesWorkflowEnabled) {
    throw new Error("COMPLAINTS_DISABLED");
  }

  let organisationId = input.organisationId;
  if (!organisationId && input.bookingId) {
    const b = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: { assignedOrganisationId: true, participantId: true },
    });
    if (b?.participantId !== input.participantId) {
      throw new Error("BOOKING_ACCESS_DENIED");
    }
    organisationId = b?.assignedOrganisationId ?? undefined;
  }

  const complaint = await prisma.complaint.create({
    data: {
      participantId: input.participantId,
      createdById: input.createdById,
      organisationId,
      bookingId: input.bookingId,
      invoiceId: input.invoiceId,
      timesheetId: input.timesheetId,
      type: input.type,
      status: "submitted",
      title: input.title,
      description: input.description,
    },
  });

  await prisma.complaintEvent.create({
    data: {
      complaintId: complaint.id,
      eventType: "created",
      actorUserId: input.createdById,
      body: "Complaint submitted.",
    },
  });

  await createAuditEvent({
    actorUserId: input.createdById,
    action: "complaint.created",
    entityType: "Complaint",
    entityId: complaint.id,
    participantId: input.participantId,
    organisationId: organisationId ?? undefined,
    metadata: { type: input.type },
  });

  let escalatedIncidentId: string | undefined;
  if (SAFETY_COMPLAINT_TYPES.includes(input.type)) {
    escalatedIncidentId = await escalateComplaintToIncident(
      complaint.id,
      input
    );
  }

  const admins = await prisma.user.findMany({
    where: { primaryRole: "mapable_admin" },
    select: { id: true },
  });
  for (const a of admins) {
    await notifyUser(
      a.id,
      "safeguarding",
      escalatedIncidentId
        ? "Safety complaint escalated to incident workflow"
        : "New complaint submitted",
      input.title
    );
  }

  return prisma.complaint.findUnique({
    where: { id: complaint.id },
    include: { events: { orderBy: { createdAt: "asc" } } },
  });
}

async function escalateComplaintToIncident(
  complaintId: string,
  input: CreateComplaintInput
): Promise<string | undefined> {
  if (!phase4Config.incidentReportingEnabled) {
    return undefined;
  }

  try {
    const incident = await createIncident({
      category: mapComplaintToIncidentCategory(input.type),
      severity: input.type === "unsafe_service" ? "high" : "medium",
      title: `Complaint escalation: ${input.title}`,
      description: input.description,
      reportedById: input.createdById,
      participantId: input.participantId,
      bookingId: input.bookingId,
      organisationId: input.organisationId,
      safeguardingConcern: true,
      immediateRiskPresent: input.type === "unsafe_service",
    });

    await submitIncident(incident.id, input.createdById);

    await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: "escalated_to_incident",
        safetyEscalated: true,
        escalatedIncidentId: incident.id,
      },
    });

    await prisma.complaintEvent.create({
      data: {
        complaintId,
        eventType: "escalated_to_incident",
        actorUserId: input.createdById,
        body: "This complaint was escalated to the incident and safeguarding workflow for review.",
      },
    });

    await createAuditEvent({
      actorUserId: input.createdById,
      action: "complaint.escalated_to_incident",
      entityType: "Complaint",
      entityId: complaintId,
      participantId: input.participantId,
      metadata: { incidentId: incident.id },
    });

    return incident.id;
  } catch {
    return undefined;
  }
}

export async function getComplaintById(complaintId: string) {
  return prisma.complaint.findUnique({
    where: { id: complaintId },
    include: {
      events: { orderBy: { createdAt: "asc" } },
      responses: { orderBy: { createdAt: "asc" } },
      participant: { select: { id: true, name: true } },
      organisation: { select: { id: true, name: true } },
    },
  });
}

export async function updateComplaintStatus(params: {
  complaintId: string;
  status: ComplaintStatus;
  actorUserId: string;
  resolutionSummary?: string;
}) {
  const before = await prisma.complaint.findUnique({
    where: { id: params.complaintId },
  });
  if (!before) throw new Error("NOT_FOUND");

  const complaint = await prisma.complaint.update({
    where: { id: params.complaintId },
    data: {
      status: params.status,
      resolutionSummary: params.resolutionSummary,
      closedAt:
        params.status === "closed" || params.status === "resolved"
          ? new Date()
          : undefined,
    },
  });

  await prisma.complaintEvent.create({
    data: {
      complaintId: complaint.id,
      eventType: "status_changed",
      actorUserId: params.actorUserId,
      body: `Status updated to ${params.status}.`,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "complaint.status_updated",
    entityType: "Complaint",
    entityId: complaint.id,
    participantId: complaint.participantId,
    metadata: { from: before.status, to: params.status },
  });

  return complaint;
}

export async function addComplaintResponse(params: {
  complaintId: string;
  responderId: string;
  body: string;
  isInternal?: boolean;
}) {
  const complaint = await prisma.complaint.findUnique({
    where: { id: params.complaintId },
  });
  if (!complaint) throw new Error("NOT_FOUND");

  await prisma.complaintResponse.create({
    data: {
      complaintId: params.complaintId,
      responderId: params.responderId,
      body: params.body,
      isInternal: params.isInternal ?? false,
    },
  });

  await createAuditEvent({
    actorUserId: params.responderId,
    action: params.isInternal
      ? "complaint.internal_note"
      : "complaint.responded",
    entityType: "Complaint",
    entityId: params.complaintId,
    participantId: complaint.participantId,
  });

  if (!params.isInternal) {
    await notifyUser(
      complaint.participantId,
      "support",
      "Update on your complaint",
      "Someone has responded to your complaint. Sign in to view."
    );
  }

  return getComplaintById(params.complaintId);
}
