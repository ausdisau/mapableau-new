import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { markInvoicePaid } from "@/lib/invoices/invoice-service";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { invoiceId } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return jsonError("Not found", 404);

  if (invoice.organisationId) {
    const member = await prisma.organisationMember.findFirst({
      where: { userId: user.id, organisationId: invoice.organisationId },
    });
    if (!member) return jsonError("Forbidden", 403);
  } else {
    return jsonError("Forbidden", 403);
  }

  try {
    const updated = await markInvoicePaid(invoiceId, user.id);
    return jsonOk({ invoice: updated });
  } catch (e) {
    if (
      e instanceof Error &&
      e.message.startsWith("INVALID_INVOICE_TRANSITION")
    ) {
      return jsonError("Invalid invoice status transition", 400);
    }
    return jsonError("Mark paid failed", 500);
  }
}
