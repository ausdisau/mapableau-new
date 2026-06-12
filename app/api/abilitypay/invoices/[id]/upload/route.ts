import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { attachInvoiceFile } from "@/lib/abilitypay/invoice-service";
import { requireAbilityPayPermission } from "@/lib/abilitypay/api-helpers";
import { canViewInvoice } from "@/lib/abilitypay/policy";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const denied = requireAbilityPayPermission(user, "abilitypay:invoice:upload");
  if (denied) return denied;

  const { id } = await context.params;
  if (!(await canViewInvoice(user, id))) {
    return jsonError("Invoice not found", 404);
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return jsonError("A file is required", 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const attachment = await attachInvoiceFile(id, user.id, {
    buffer,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
  });

  return jsonOk({ attachment }, 201);
}
