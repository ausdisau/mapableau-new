import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { accessDeniedMessage } from "@/lib/access/role-policy";
import { disputeInvoice } from "@/lib/plan-manager/invoice-review-service";
import { disputeSchema } from "@/lib/validation/plan-manager";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("plan_manager:portal");
  if (user instanceof Response) return user;

  const { id } = await params;

  try {
    const body = disputeSchema.parse(await req.json());
    const inbox = await disputeInvoice({
      invoiceId: id,
      planManagerId: user.id,
      actorUserId: user.id,
      reason: body.reason,
    });
    return jsonOk({ inbox });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "CONSENT_REQUIRED") {
      return jsonError(accessDeniedMessage("no_link"), 403);
    }
    return jsonError("Could not flag dispute", 400);
  }
}
