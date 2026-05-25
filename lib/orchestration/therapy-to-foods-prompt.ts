import { prisma } from "@/lib/prisma";

/**
 * Suggests meal delivery when participant has multiple therapy appointments in a week.
 * Returns prompt payload only — no automatic ordering.
 */
export async function getTherapyToFoodsPrompt(participantId: string) {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const count = await prisma.therapyAppointment.count({
    where: {
      participantId,
      startsAt: { gte: weekStart },
      status: { in: ["confirmed", "completed", "in_progress"] },
    },
  });

  if (count < 2) return null;

  return {
    promptKey: "therapy_to_foods",
    title: "Would meal delivery help this week?",
    message:
      "You have several therapy sessions booked. Some participants use MapAble Foods to simplify meals during busy weeks. You can browse meals without any obligation.",
    href: "/foods",
  };
}
