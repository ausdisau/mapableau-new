import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import { assignSupportTicket } from "@/lib/support/ticket-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!hasPermission(user.primaryRole, "support:manage:any")) {
    return jsonError("Forbidden", 403);
  }

  const { id } = await params;
  const body = await req.json();
  const assignee = body.assignedAdminId ?? user.id;

  const ticket = await assignSupportTicket(id, assignee, user.id);
  return jsonOk({ ticket });
}
