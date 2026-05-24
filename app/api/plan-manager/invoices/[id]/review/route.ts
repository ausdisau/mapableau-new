import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { accessDeniedMessage } from "@/lib/access/role-policy";
import { reviewInvoice } from "@/lib/plan-manager/invoice-review-service";
import { invoiceReviewSchema } from "@/lib/validation/plan-manager";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("plan_manager:portal");
  if (user instanceof Response) return user;

  const { id } = await params;

  try {
    const body = invoiceReviewSchema.parse(await req.json());
    const result = await reviewInvoice({
      invoiceId: id,
      planManagerId: user.id,
      actorUserId: user.id,
      status: body.status,
      notes: body.notes,
    });
    return jsonOk({ inbox: result });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "CONSENT_REQUIRED") {
      return jsonError(accessDeniedMessage("no_link"), 403);
    }
    return jsonError("Could not review invoice", 400);
  }
}
