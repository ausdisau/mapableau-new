import { phase3Config } from "@/lib/config/phase3";
import { createTransportBooking } from "@/lib/transport/transport-booking-service";
import { prisma } from "@/lib/prisma";

export async function createInterviewSupportDraft(
  applicationId: string,
  actorUserId: string
) {
  if (!phase3Config.orchestrationEnabled) {
    return { skipped: true };
  }

  const key = `job-interview-transport-${applicationId}`;
  const existing = await prisma.orchestrationEvent.findUnique({
    where: { idempotencyKey: key },
  });
  if (existing?.transportBookingId) {
    return {
      duplicate: true,
      transportBookingId: existing.transportBookingId,
    };
  }
  if (existing) return { duplicate: true };

  const app = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      job: { include: { employerOrganisation: true } },
      participant: { include: { participantProfile: true } },
    },
  });
  if (!app?.transportSupportNeeded) {
    return { skipped: true, reason: "Transport not requested" };
  }

  const interviewAt = new Date(Date.now() + 7 * 86400000);
  const homeAddress =
    app.participant.participantProfile?.homeSuburb ??
    "Home address to be confirmed";
  const workplaceAddress =
    app.job.location ??
    app.job.employerOrganisation?.name ??
    "Interview location to be confirmed";

  const transportBooking = await createTransportBooking({
    participantId: app.participantId,
    pickupAddress: homeAddress,
    dropoffAddress: workplaceAddress,
    pickupWindowStart: new Date(interviewAt.getTime() - 3600000),
    pickupWindowEnd: interviewAt,
    pickupNotes: `Job interview transport — ${app.job.title}`,
    status: "draft",
  });

  await prisma.calendarEvent.create({
    data: {
      eventType: "job_interview",
      title: `Interview transport — ${app.job.title}`,
      description: "Linked transport booking draft — confirm pickup details",
      startAt: transportBooking.pickupWindowStart,
      endAt: interviewAt,
      participantId: app.participantId,
      jobApplicationId: app.id,
      jobId: app.jobId,
      createdById: actorUserId,
    },
  });

  await prisma.orchestrationEvent.create({
    data: {
      eventType: "interview_transport_draft_created",
      jobApplicationId: applicationId,
      transportBookingId: transportBooking.id,
      idempotencyKey: key,
      createdById: actorUserId,
      metadata: {
        transportBookingId: transportBooking.id,
        bookable: true,
      },
    },
  });

  return { transportBooking, calendarLinked: true };
}
