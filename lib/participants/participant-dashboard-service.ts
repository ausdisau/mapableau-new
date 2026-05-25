import { prisma } from "@/lib/prisma";

export async function getParticipantDashboardData(userId: string) {
  const [upcomingBookings, pendingInvoices, unreadMessages, consents] =
    await Promise.all([
      prisma.booking.findMany({
        where: {
          participantId: userId,
          status: { in: ["requested", "confirmed", "in_progress", "accepted"] },
          requestedStart: { gte: new Date() },
        },
        orderBy: { requestedStart: "asc" },
        take: 5,
        include: {
          assignedOrganisation: { select: { id: true, name: true } },
        },
      }),
      prisma.invoice.findMany({
        where: {
          participantId: userId,
          participantApprovalStatus: "awaiting_participant_approval",
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      prisma.message.count({
        where: {
          conversation: {
            participants: { some: { userId } },
          },
          readReceipts: { none: { userId } },
          senderUserId: { not: userId },
        },
      }),
      prisma.consentRecord.findMany({
        where: { subjectUserId: userId, status: "active" },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          grantedToOrganisation: { select: { name: true } },
        },
      }),
    ]);

  return {
    upcomingBookings,
    pendingApprovals: pendingInvoices,
    unreadMessageCount: unreadMessages,
    activeConsents: consents,
  };
}
