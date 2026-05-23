import { prisma } from "@/lib/prisma";

export async function getParticipantDashboard(participantId: string) {
  const [profile, upcomingCare, upcomingTransport, unpaidInvoices, goals] =
    await Promise.all([
      prisma.participantProfile.findUnique({ where: { userId: participantId } }),
      prisma.careShift.findMany({
        where: {
          participantId,
          status: { in: ["scheduled", "confirmed", "in_progress"] },
        },
        orderBy: { startAt: "asc" },
        take: 5,
      }),
      prisma.transportBooking.findMany({
        where: {
          participantId,
          status: {
            in: ["requested", "confirmed", "driver_en_route", "in_transit"],
          },
        },
        orderBy: { pickupWindowStart: "asc" },
        take: 5,
      }),
      prisma.invoice.count({
        where: {
          participantId,
          status: {
            in: ["approved_for_invoicing", "stripe_payment_pending", "partially_paid"],
          },
        },
      }),
      prisma.participantSupportGoal.findMany({
        where: { participantId, status: "active" },
        take: 5,
      }),
    ]);

  return {
    profile,
    upcomingCare,
    upcomingTransport,
    unpaidInvoices,
    goals,
  };
}

export async function listServiceHistory(participantId: string) {
  const [careShifts, transportBookings] = await Promise.all([
    prisma.careShift.findMany({
      where: { participantId, status: "completed" },
      orderBy: { startAt: "desc" },
      take: 20,
    }),
    prisma.transportBooking.findMany({
      where: { participantId, status: "completed" },
      orderBy: { pickupWindowStart: "desc" },
      take: 20,
    }),
  ]);
  return { careShifts, transportBookings };
}
