import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

export async function notifyTicketStatusChange(
  ticketId: string,
  recipientId: string,
  status: string
) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) return;
  await notifyUser(
    recipientId,
    "support",
    "Support ticket update",
    `${ticket.title} — status: ${status.replace(/_/g, " ")}`
  );
}
