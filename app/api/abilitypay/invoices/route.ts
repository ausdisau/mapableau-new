import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requireAbilityPayAccess, requireAbilityPayPermission } from "@/lib/abilitypay/api-helpers";
import { createInvoice, listInvoicesForUser } from "@/lib/abilitypay/invoice-service";
import { createInvoiceSchema } from "@/types/abilitypay";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const denied = requireAbilityPayAccess(user);
  if (denied) return denied;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const participantId = url.searchParams.get("participantId") ?? undefined;

  const invoices = await listInvoicesForUser(user.id, user.primaryRole, {
    status,
    participantId,
  });
  return jsonOk({ invoices });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const denied = requireAbilityPayPermission(user, "abilitypay:invoice:upload");
  if (denied) return denied;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const invoice = await createInvoice(user.id, parsed.data);
  return jsonOk({ invoice }, 201);
}
