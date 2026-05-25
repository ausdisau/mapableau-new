import type { PanelActor } from "@/lib/access-control/panel-access";
import { assertParticipantSelfAccess } from "@/lib/access-control/panel-access";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function getParticipantDashboard(actor: PanelActor) {
  await assertParticipantSelfAccess(actor, actor.id, "ParticipantDashboard");

  const [
    profile,
    accessibility,
    upcomingBookings,
    pendingInvoices,
    activeConsents,
    openComplaints,
    waitlist,
  ] = await Promise.all([
    prisma.participantProfile.findUnique({ where: { userId: actor.id } }),
    prisma.accessibilityProfile.findUnique({ where: { userId: actor.id } }),
    prisma.booking.findMany({
      where: {
        participantId: actor.id,
        status: { in: ["requested", "awaiting_provider_acceptance", "confirmed", "in_progress"] },
      },
      orderBy: { requestedStart: "asc" },
      take: 5,
      include: { assignedOrganisation: { select: { id: true, name: true } } },
    }),
    prisma.invoice.count({
      where: {
        participantId: actor.id,
        status: { in: ["draft", "preflight_required"] },
        participantApprovedAt: null,
      },
    }),
    prisma.consentRecord.count({
      where: { subjectUserId: actor.id, status: "active" },
    }),
    prisma.complaint.count({
      where: {
        participantId: actor.id,
        status: { in: ["open", "investigating", "escalated"] },
      },
    }),
    prisma.waitlistRequest.count({
      where: { participantId: actor.id, status: "waiting" },
    }),
  ]);

  return {
    profile,
    accessibility,
    upcomingBookings,
    pendingInvoices,
    activeConsents,
    openComplaints,
    waitlist,
  };
}

export async function getParticipantTimeline(actor: PanelActor) {
  await assertParticipantSelfAccess(actor, actor.id, "ParticipantTimeline");

  const [bookings, incidents, complaints, consents] = await Promise.all([
    prisma.bookingTimelineEvent.findMany({
      where: { booking: { participantId: actor.id } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { booking: { select: { id: true, bookingType: true } } },
    }),
    prisma.incidentReport.findMany({
      where: { participantId: actor.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true, status: true, createdAt: true },
    }),
    prisma.complaint.findMany({
      where: { participantId: actor.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.consentRecord.findMany({
      where: { subjectUserId: actor.id },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ]);

  return { bookings, incidents, complaints, consents };
}

export async function getProviderShortlist(actor: PanelActor) {
  await assertParticipantSelfAccess(actor, actor.id, "ProviderShortlist");

  const consents = await prisma.consentRecord.findMany({
    where: {
      subjectUserId: actor.id,
      status: "active",
      grantedToOrganisationId: { not: null },
    },
    include: {
      grantedToOrganisation: {
        select: {
          id: true,
          name: true,
          verificationStatus: true,
          bookingEligible: true,
          serviceRegions: true,
        },
      },
    },
    take: 10,
  });

  const organisations = consents
    .map((c) => c.grantedToOrganisation)
    .filter((o): o is NonNullable<typeof o> => o != null);

  const verified = await prisma.organisation.findMany({
    where: {
      verificationStatus: "verified",
      bookingEligible: true,
      status: "active",
    },
    select: {
      id: true,
      name: true,
      serviceRegions: true,
      organisationType: true,
    },
    take: 8,
  });

  return { consented: organisations, suggested: verified };
}

export async function logParticipantProfileView(
  actor: PanelActor,
  participantId: string
) {
  await createAuditEvent({
    actorUserId: actor.id,
    actorRole: actor.primaryRole,
    action: "profile.viewed",
    entityType: "ParticipantProfile",
    participantId,
  });
}
