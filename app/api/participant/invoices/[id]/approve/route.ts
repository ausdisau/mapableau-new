import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk, jsonError } from "@/lib/api/response";
import { approveParticipantInvoice } from "@/lib/invoices/invoice-panel-service";
import { PanelAccessError } from "@/lib/access-control/panel-access";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("invoice:read:self");
  if (user instanceof Response) return user;

  const { id } = await params;

  try {
    const invoice = await approveParticipantInvoice(user, id);
    return jsonOk({ invoice });
  } catch (e) {
    if (e instanceof PanelAccessError) {
      return jsonError(e.message, e.code === "CONSENT_REQUIRED" ? 403 : 403);
    }
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Invoice not found", 404);
    }
    throw e;
  }
}
