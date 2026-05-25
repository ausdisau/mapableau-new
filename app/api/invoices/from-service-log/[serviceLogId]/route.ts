import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { generateInvoiceFromServiceLog } from "@/lib/invoices/invoice-mvp-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ serviceLogId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { serviceLogId } = await params;
  const body = await req.json().catch(() => ({}));

  try {
    const invoice = await generateInvoiceFromServiceLog(
      serviceLogId,
      user.id,
      body.lineAmountCents ?? 10000
    );
    return jsonOk({ invoice }, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "SERVICE_LOG_NOT_APPROVED") {
      return jsonError("Service log must be approved or submitted", 400);
    }
    return jsonError("Generate failed", 500);
  }
}
