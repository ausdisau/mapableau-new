import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, zodErrorResponse } from "@/lib/api/response";
import { generateMonthlyStatement } from "@/lib/abilitypay/export-service";
import { requireAbilityPayPermission } from "@/lib/abilitypay/api-helpers";
import { exportStatementSchema } from "@/types/abilitypay";

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

  const parsed = exportStatementSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const { html, fileName } = await generateMonthlyStatement({
      userId: user.id,
      planId: parsed.data.planId,
      month: parsed.data.month,
    });

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Export failed";
    if (message.includes("quota") || message.includes("EXPORT_QUOTA")) {
      return jsonError(message, 402);
    }
    return jsonError(message, 400);
  }
}
