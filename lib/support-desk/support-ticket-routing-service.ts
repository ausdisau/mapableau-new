import { prisma } from "@/lib/prisma";

export async function routeTicketToQueue(category: string) {
  const admins = await prisma.user.findMany({
    where: { primaryRole: "mapable_admin" },
    take: 1,
    select: { id: true },
  });
  return admins[0]?.id ?? null;
}

export function queueLabelForCategory(category: string): string {
  if (category === "safeguarding_concern") return "Safety";
  if (category === "billing_question") return "Billing";
  if (category === "complaint") return "Complaints";
  return "General";
}
