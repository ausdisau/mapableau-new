import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import {
  escalateSupportTicket,
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

  const canEscalate =
    hasPermission(user.primaryRole, "support:manage:any") ||
    body.category === "incident_or_safety";

  if (!canEscalate) {
    const ticket = await getSupportTicketForUser(id, user.id, false);
    if (!ticket || ticket.createdById !== user.id) {
      return jsonError("Forbidden", 403);
    }
  }

  const reason = body.reason ?? "Escalated for review";
  const ticket = await escalateSupportTicket(id, reason, user.id);
  return jsonOk({ ticket });
}
