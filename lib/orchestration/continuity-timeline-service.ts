import { phase3Config } from "@/lib/config/phase3";
import { prisma } from "@/lib/prisma";

export type ContinuityTimelineEntry = {
  id: string;
  occurredAt: string;
  category: "orchestration" | "booking" | "care" | "transport" | "message";
  title: string;
  detail?: string;
  entityType?: string;
  entityId?: string;
};

export async function getParticipantContinuityTimeline(
  participantId: string,
  limit = 50
): Promise<ContinuityTimelineEntry[]> {
  const entries: ContinuityTimelineEntry[] = [];

  const [careRequests, jobApplications, careShifts, transportBookings, bookings] =
    await Promise.all([
      prisma.careRequest.findMany({
        where: { participantId },
        select: { id: true },
      }),
      prisma.jobApplication.findMany({
        where: { participantId },
        select: { id: true },
      }),
      prisma.careShift.findMany({
        where: { participantId },
        orderBy: { startAt: "desc" },
        take: limit,
        include: { careRequest: { select: { title: true } } },
      }),
      prisma.transportBooking.findMany({
        where: { participantId },
        orderBy: { pickupWindowStart: "desc" },
        take: limit,
      }),
      prisma.booking.findMany({
        where: { participantId },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);

  const careRequestIds = careRequests.map((r) => r.id);
  const jobApplicationIds = jobApplications.map((a) => a.id);
  const careShiftIds = careShifts.map((s) => s.id);

  const orchestrationEvents =
    careRequestIds.length || jobApplicationIds.length || careShiftIds.length
      ? await prisma.orchestrationEvent.findMany({
          where: {
            OR: [
              ...(careRequestIds.length
                ? [{ careRequestId: { in: careRequestIds } }]
                : []),
              ...(jobApplicationIds.length
                ? [{ jobApplicationId: { in: jobApplicationIds } }]
                : []),
              ...(careShiftIds.length
                ? [{ careShiftId: { in: careShiftIds } }]
                : []),
            ],
          },
          orderBy: { createdAt: "desc" },
          take: limit,
        })
      : [];

  for (const event of orchestrationEvents) {
    entries.push({
      id: event.id,
      occurredAt: event.createdAt.toISOString(),
      category: "orchestration",
      title: formatOrchestrationEvent(event.eventType),
      detail: event.metadata ? JSON.stringify(event.metadata) : undefined,
      entityType: "OrchestrationEvent",
      entityId: event.id,
    });
  }

  for (const shift of careShifts) {
    entries.push({
      id: shift.id,
      occurredAt: shift.startAt.toISOString(),
      category: "care",
      title: shift.careRequest?.title ?? "Care shift",
      detail: `Status: ${shift.status}`,
      entityType: "CareShift",
      entityId: shift.id,
    });
  }

  for (const tb of transportBookings) {
    entries.push({
      id: tb.id,
      occurredAt: tb.pickupWindowStart.toISOString(),
      category: "transport",
      title: `${tb.pickupAddress} → ${tb.dropoffAddress}`,
      detail: `Status: ${tb.status}`,
      entityType: "TransportBooking",
      entityId: tb.id,
    });
  }

  for (const booking of bookings) {
    entries.push({
      id: booking.id,
      occurredAt: booking.createdAt.toISOString(),
      category: "booking",
      title: "Booking",
      detail: `Status: ${booking.status}`,
      entityType: "Booking",
      entityId: booking.id,
    });
  }

  return entries
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    )
    .slice(0, limit);
}

function formatOrchestrationEvent(eventType: string) {
  const labels: Record<string, string> = {
    care_transport_link_created: "Care + transport linked",
    care_transport_cancel_propagated: "Transport cancelled with care shift",
    interview_transport_draft_created: "Interview transport booked (draft)",
    invoice_from_care_shift: "Invoice from care shift",
  };
  return labels[eventType] ?? eventType.replace(/_/g, " ");
}

export async function createInterviewTransportBooking(
  applicationId: string,
  actorUserId: string
) {
  if (!phase3Config.orchestrationEnabled) {
    return { skipped: true };
  }

  const { createInterviewSupportDraft } = await import(
    "./jobs-support-orchestrator"
  );
  return createInterviewSupportDraft(applicationId, actorUserId);
}
