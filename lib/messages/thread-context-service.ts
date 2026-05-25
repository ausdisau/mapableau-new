import { prisma } from "@/lib/prisma";
import type { ThreadContextLinks } from "@/types/messages";

export async function getThreadContextLinks(
  threadId: string
): Promise<ThreadContextLinks> {
  const thread = await prisma.communicationThread.findUnique({
    where: { id: threadId },
  });
  if (!thread) return {};

  const links: ThreadContextLinks = {};

  if (thread.bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: thread.bookingId },
      select: { id: true, bookingType: true, status: true },
    });
    if (booking) {
      links.booking = {
        id: booking.id,
        title: `${booking.bookingType} booking (${booking.status})`,
        href: `/dashboard/bookings/${booking.id}`,
      };
    }
  }

  if (thread.invoiceId) {
    links.invoice = {
      id: thread.invoiceId,
      title: "Linked invoice",
      href: `/dashboard/invoices/${thread.invoiceId}`,
    };
  }

  if (thread.serviceAgreementId) {
    links.serviceAgreement = {
      id: thread.serviceAgreementId,
      title: "Service agreement",
      href: `/dashboard/agreements/${thread.serviceAgreementId}`,
    };
  }

  if (thread.supportTicketId) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: thread.supportTicketId },
      select: { id: true, title: true },
    });
    if (ticket) {
      links.supportTicket = {
        id: ticket.id,
        title: ticket.title,
        href: `/dashboard/support/${ticket.id}`,
      };
    }
  }

  if (thread.transportTripId) {
    links.transportTrip = {
      id: thread.transportTripId,
      title: "Transport trip",
      href: `/dashboard/transport/${thread.transportTripId}`,
    };
  }

  return links;
}

export async function getParticipantSummaries(threadId: string) {
  const participants = await prisma.communicationThreadParticipant.findMany({
    where: { threadId, leftAt: null },
    include: { profile: { select: { id: true, name: true, primaryRole: true, email: true } } },
  });
  return participants.map((p) => ({
    profileId: p.profileId,
    displayName: p.displayName,
    role: p.role,
    name: p.profile.name,
    primaryRole: p.profile.primaryRole,
    email: p.profile.email,
    profileHref: `/dashboard/profile/${p.profileId}`,
  }));
}
