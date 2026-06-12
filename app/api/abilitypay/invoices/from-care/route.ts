import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAbilityPayPermission } from "@/lib/abilitypay/api-helpers";
import { createDraftInvoiceFromCareServiceLog } from "@/lib/abilitypay/care-intake-service";
import { z } from "zod";

const bodySchema = z.object({
  careServiceLogId: z.string().min(1),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const denied = requireAbilityPayPermission(user, "abilitypay:invoice:upload");
  if (denied) return denied;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return jsonError("careServiceLogId is required", 400);
  }

  try {
    const result = await createDraftInvoiceFromCareServiceLog({
      careServiceLogId: body.careServiceLogId,
      actorUserId: user.id,
      actorRole: user.primaryRole,
    });
    return jsonOk({
      invoiceId: result.invoice.id,
      created: result.created,
      status: result.invoice.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Intake failed";
    const status =
      message === "CARE_LOG_NOT_CONFIRMED" ? 400 : message === "CARE_LOG_NOT_FOUND" ? 404 : 500;
    return jsonError(message, status);
  }
}
