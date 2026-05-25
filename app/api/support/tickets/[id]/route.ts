import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { getSupportTicketForUser } from "@/lib/support/ticket-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;

  const ticket = await getSupportTicketForUser(
    id,
    user.id,
    isAdminRole(user.primaryRole)
  );
  if (!ticket) return jsonError("Not found", 404);
  return jsonOk({ ticket });
}
