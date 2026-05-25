import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { assignTicket } from "@/lib/support-desk/support-ticket-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const { ticketId } = await params;
  const body = await req.json();
  if (!body.adminId) return jsonError("adminId required", 400);
  await assignTicket(ticketId, body.adminId, user.id);
  return jsonOk({ ok: true });
}
