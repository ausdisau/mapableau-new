import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import {
  addTicketMessage,
  getSupportTicketForUser,
} from "@/lib/support/ticket-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = await req.json();
  if (!body.body) return jsonError("body required", 400);

  const ticket = await getSupportTicketForUser(
    id,
    user.id,
    isAdminRole(user.primaryRole)
  );
  if (!ticket) return jsonError("Not found", 404);

  const comment = await addTicketMessage({
    ticketId: id,
    authorId: user.id,
    body: body.body,
    isInternal: isAdminRole(user.primaryRole) && body.isInternal === true,
  });

  return jsonOk({ message: comment }, 201);
}
