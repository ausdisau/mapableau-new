import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, zodErrorResponse } from "@/lib/api/response";
import { exportClaimPackCsv } from "@/lib/abilitypay/export-service";
import { requireAbilityPayPermission } from "@/lib/abilitypay/api-helpers";
import { exportClaimPackSchema } from "@/types/abilitypay";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const denied = requireAbilityPayPermission(user, "abilitypay:export");
  if (denied) return denied;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = exportClaimPackSchema.safeParse(body ?? {});
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { csv, fileName } = await exportClaimPackCsv({
    userId: user.id,
    invoiceIds: parsed.data.invoiceIds,
    planId: parsed.data.planId,
  });

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
