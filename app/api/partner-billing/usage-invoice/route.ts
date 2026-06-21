import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import { generateMonthlyApiUsageInvoice } from "@/lib/partner-billing/usage-invoice-service";
import { z } from "zod";

const usageInvoiceSchema = z.object({
  organisationId: z.string().cuid(),
  periodLabel: z.string().min(1),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  includedCalls: z.number().int().positive().optional(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!hasPermission(user.primaryRole, "admin:billing:read")) {
    return jsonError("Forbidden", 403);
  }

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = usageInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid usage invoice request", 400);
  }

  const result = await generateMonthlyApiUsageInvoice({
    organisationId: parsed.data.organisationId,
    periodLabel: parsed.data.periodLabel,
    periodStart: new Date(parsed.data.periodStart),
    periodEnd: new Date(parsed.data.periodEnd),
    includedCalls: parsed.data.includedCalls,
  });

  if (!result.ok) {
    return jsonError(result.error, 404);
  }

  return jsonOk(result);
}
