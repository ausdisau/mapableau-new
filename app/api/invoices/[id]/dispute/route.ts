import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { participantDisputeInvoice } from "@/lib/invoices/invoice-mvp-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = await req.json();
  if (!body.reason) return jsonError("reason required", 400);

  try {
    const invoice = await participantDisputeInvoice(id, user.id, body.reason);
    return jsonOk({ invoice });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return jsonError("Forbidden", 403);
    }
    return jsonError("Dispute failed", 500);
  }
}
