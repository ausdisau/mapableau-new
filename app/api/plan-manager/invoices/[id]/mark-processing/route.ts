import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { accessDeniedMessage } from "@/lib/access/role-policy";
import { markInvoiceProcessing } from "@/lib/plan-manager/payment-status-service";
import { paymentStatusSchema } from "@/lib/validation/plan-manager";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("plan_manager:portal");
  if (user instanceof Response) return user;

  const { id } = await params;

  try {
    const body = paymentStatusSchema.parse(await req.json().catch(() => ({})));
    const record = await markInvoiceProcessing({
      invoiceId: id,
      planManagerId: user.id,
      actorUserId: user.id,
      reference: body.reference,
      notes: body.notes,
    });
    return jsonOk({ record });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "CONSENT_REQUIRED") {
      return jsonError(accessDeniedMessage("no_link"), 403);
    }
    return jsonError("Could not update payment status", 400);
  }
}
