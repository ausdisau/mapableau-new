import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk, jsonError } from "@/lib/api/response";
import { assertInvoiceAccess } from "@/lib/billing/invoice-access-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { syncInvoiceToXeroAccounting } from "@/lib/xero/xero-invoice-sync-service";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { invoiceId } = await params;
  let invoice;
  try {
    invoice = await assertInvoiceAccess(user, invoiceId);
  } catch {
    return jsonError("Forbidden", 404);
  }
  if (!invoice.organisationId) {
    return jsonError("Invoice has no provider organisation", 400);
  }

  const xeroPerm = await requireApiPermission("xero:manage");
  if (xeroPerm instanceof Response) {
    const member = await prisma.organisationMember.findFirst({
      where: { userId: user.id, organisationId: invoice.organisationId },
    });
    if (!member) return jsonError("Forbidden", 403);
  }

  const result = await syncInvoiceToXeroAccounting(
    invoiceId,
    user.id,
    invoice.organisationId
  );
  return jsonOk(result);
}
