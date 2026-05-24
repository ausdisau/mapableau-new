import type { CareRequestType } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase3Config } from "@/lib/config/phase3";
import { createCareRequest } from "@/lib/care/care-request-service";
import { createInterviewSupportDraft } from "@/lib/orchestration/jobs-support-orchestrator";
import { createTransportBooking } from "@/lib/transport/transport-booking-service";
import { submitTransportWithBooking } from "@/lib/modules/transport-facade";
import { linkBookingToCareRequest, submitCareRequestWithBooking } from "@/lib/modules/care-facade";
import { prisma } from "@/lib/prisma";
import type { EmploymentSupportBundleView } from "@/types/employment";

export async function getEmploymentSupportBundle(
  applicationId: string,
): Promise<EmploymentSupportBundleView> {
  const app = await prisma.jobApplication.findUniqueOrThrow({
    where: { id: applicationId },
    include: {
      calendarEvents: { take: 1, orderBy: { startAt: "asc" } },
    },
  });

  const orch = await prisma.orchestrationEvent.findMany({
    where: { jobApplicationId: applicationId },
    orderBy: { createdAt: "desc" },
  });

  let transportBooking: { id: string; status: string } | null = null;
  const transportEvent = orch.find(
    (e) => e.eventType === "interview_transport_draft_created",
  );
  if (transportEvent?.transportBookingId) {
    const tb = await prisma.transportBooking.findUnique({
      where: { id: transportEvent.transportBookingId },
      select: { id: true, status: true },
    });
    if (tb) transportBooking = tb;
  }

  const careRequest = await prisma.careRequest.findFirst({
    where: {
      participantId: app.participantId,
      requestType: "employment_support",
      description: { contains: applicationId },
    },
    select: { id: true, status: true },
    orderBy: { createdAt: "desc" },
  });

  return {
    applicationId,
    transportBooking,
    careRequest: careRequest
      ? { id: careRequest.id, status: careRequest.status }
      : null,
    calendarEventId: app.calendarEvents[0]?.id ?? null,
  };
}

/**
 * Promotes orchestration placeholders into bookable care/transport records.
 */
export async function activateEmploymentSupportBundle(
  applicationId: string,
  actorUserId: string,
  opts?: {
    interviewAt?: string;
    pickupAddress?: string;
    dropoffAddress?: string;
  },
): Promise<EmploymentSupportBundleView> {
  const app = await prisma.jobApplication.findUniqueOrThrow({
    where: { id: applicationId },
    include: { job: true },
  });

  if (!phase3Config.orchestrationEnabled) {
    return getEmploymentSupportBundle(applicationId);
  }

  let transportBookingId: string | undefined;

  if (app.transportSupportNeeded) {
    const key = `job-interview-transport-${applicationId}`;
    let orch = await prisma.orchestrationEvent.findUnique({
      where: { idempotencyKey: key },
    });

    if (!orch) {
      await createInterviewSupportDraft(applicationId, actorUserId);
      orch = await prisma.orchestrationEvent.findUnique({
        where: { idempotencyKey: key },
      });
    }

    if (!orch?.transportBookingId) {
      const interviewAt = opts?.interviewAt
        ? new Date(opts.interviewAt)
        : new Date(Date.now() + 7 * 86400000);

      const tb = await createTransportBooking({
        participantId: app.participantId,
        pickupAddress: opts?.pickupAddress ?? "Home address — to confirm",
        dropoffAddress:
          opts?.dropoffAddress ?? app.job.location ?? "Interview location",
        pickupWindowStart: new Date(interviewAt.getTime() - 3600000),
        pickupWindowEnd: interviewAt,
        pickupNotes: `Interview transport for ${app.job.title}`,
        status: "draft",
      });

      transportBookingId = tb.id;

      await prisma.orchestrationEvent.upsert({
        where: { idempotencyKey: key },
        create: {
          eventType: "interview_transport_draft_created",
          jobApplicationId: applicationId,
          transportBookingId: tb.id,
          idempotencyKey: key,
          createdById: actorUserId,
        },
        update: { transportBookingId: tb.id },
      });

      await submitTransportWithBooking(tb.id, actorUserId);
    } else {
      transportBookingId = orch.transportBookingId;
      await submitTransportWithBooking(orch.transportBookingId, actorUserId);
    }
  }

  if (app.careSupportNeeded) {
    const existing = await prisma.careRequest.findFirst({
      where: {
        participantId: app.participantId,
        requestType: "employment_support",
        description: { contains: applicationId },
      },
    });

    if (!existing) {
      const cr = await createCareRequest({
        participantId: app.participantId,
        createdById: actorUserId,
        requestType: "employment_support" as CareRequestType,
        title: `Employment support — ${app.job.title}`,
        description: `Linked to job application ${applicationId}`,
        linkedTransportRequired: false,
      });
      await linkBookingToCareRequest(cr.id, actorUserId);
      await submitCareRequestWithBooking(cr.id, actorUserId);
    }
  }

  await createAuditEvent({
    actorUserId,
    action: "employment.support_bundle_activated",
    entityType: "JobApplication",
    entityId: applicationId,
    participantId: app.participantId,
    metadata: { transportBookingId },
  });

  return getEmploymentSupportBundle(applicationId);
}
