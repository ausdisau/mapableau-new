import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { addTicketMessage } from "@/lib/support-desk/support-ticket-service";
import { canViewTicket } from "@/lib/support-desk/support-desk-access-policy";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { ticketId } = await params;
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket || !canViewTicket(user, ticket)) return jsonError("Forbidden", 403);
  const messages = await prisma.supportTicketMessage.findMany({
    where: {
      ticketId,
      ...(user.primaryRole === "mapable_admin" ? {} : { isInternal: false }),
    },
    orderBy: { createdAt: "asc" },
  });
  return jsonOk({ messages });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { ticketId } = await params;
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket || !canViewTicket(user, ticket)) return jsonError("Forbidden", 403);
  const body = await req.json();
  const message = await addTicketMessage({
    ticketId,
    authorId: user.id,
    body: body.body,
    isInternal: body.isInternal,
  });
  return jsonOk({ message }, 201);
}
