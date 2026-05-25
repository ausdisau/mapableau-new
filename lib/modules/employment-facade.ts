import { createCareRequest } from "@/lib/care/care-request-service";
import { phase3Config } from "@/lib/config/phase3";
import { prisma } from "@/lib/prisma";
import { createTransportBooking } from "@/lib/transport/transport-booking-service";
import type { EmploymentSupportBundle } from "@/types/employment";

export async function createEmploymentSupportBundle(
  applicationId: string,
  actorUserId: string,
): Promise<EmploymentSupportBundle | { skipped: true; reason?: string }> {
  if (!phase3Config.orchestrationEnabled) {
    return { skipped: true, reason: "Orchestration disabled" };
  }

  const key = `job-application-support-bundle-${applicationId}`;
  const existing = await prisma.orchestrationEvent.findUnique({
    where: { idempotencyKey: key },
  });
  if (existing) {
    return {
      applicationId,
      transportBookingId: existing.transportBookingId ?? undefined,
      careRequestId: existing.careRequestId ?? undefined,
      duplicate: true,
    };
  }

  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });
  if (!application) throw new Error("NOT_FOUND");
  if (!application.transportSupportNeeded && !application.careSupportNeeded) {
    return { skipped: true, reason: "No support requested" };
  }

  const interviewStart = new Date(Date.now() + 7 * 86400000);
  const interviewEnd = new Date(interviewStart.getTime() + 3600000);
  const event = await prisma.calendarEvent.create({
    data: {
      eventType: "job_interview",
      title: `Interview support - ${application.job.title}`,
      description: "Support bundle created from job application.",
      startAt: interviewStart,
      endAt: interviewEnd,
      participantId: application.participantId,
      jobApplicationId: application.id,
      jobId: application.jobId,
      createdById: actorUserId,
    },
  });

  const transport = application.transportSupportNeeded
    ? await createTransportBooking({
        participantId: application.participantId,
        pickupAddress: "Pickup address to be confirmed",
        dropoffAddress: application.job.location ?? "Interview location",
        pickupWindowStart: interviewStart,
        pickupWindowEnd: interviewEnd,
        pickupNotes: `Interview transport for ${application.job.title}`,
        status: "draft",
      })
    : null;

  const care = application.careSupportNeeded
    ? await createCareRequest({
        participantId: application.participantId,
        createdById: actorUserId,
        requestType: "employment_support",
        title: `Employment support for ${application.job.title}`,
        description:
          "Support requested from a job application. Confirm details before scheduling.",
        preferredDate: interviewStart,
        address: application.job.location ?? undefined,
        linkedTransportRequired: application.transportSupportNeeded,
      })
    : null;

  await prisma.orchestrationEvent.create({
    data: {
      eventType: "interview_transport_draft_created",
      jobApplicationId: applicationId,
      transportBookingId: transport?.id,
      careRequestId: care?.id,
      idempotencyKey: key,
      createdById: actorUserId,
      metadata: {
        calendarEventId: event.id,
        transportSupportNeeded: application.transportSupportNeeded,
        careSupportNeeded: application.careSupportNeeded,
      },
    },
  });

  return {
    applicationId,
    calendarEventId: event.id,
    transportBookingId: transport?.id,
    careRequestId: care?.id,
  };
}
