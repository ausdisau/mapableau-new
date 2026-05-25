import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import {
  getSupportTicketForUser,
  updateTicketStatus,
} from "@/lib/support/ticket-service";

export async function PATCH(
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
  if (!body.status) return jsonError("status required", 400);

  const ticket = await updateTicketStatus(id, body.status, user.id, {
    resolutionSummary: body.resolutionSummary,
  });
  return jsonOk({ ticket });
}
