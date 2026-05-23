import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { mapInvoiceToXeroPayload } from "@/lib/xero/xero-invoice-mapper";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { invoiceId } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      lines: true,
      participant: { select: { name: true, email: true } },
    },
  });
  if (!invoice) return jsonError("Not found", 404);

  const allowed =
    isAdminRole(user.primaryRole) ||
    invoice.participantId === user.id ||
    (invoice.organisationId
      ? await prisma.organisationMember.findFirst({
          where: {
            userId: user.id,
            organisationId: invoice.organisationId,
          },
        })
      : null);

  if (!allowed) return jsonError("Forbidden", 403);

  const payload = mapInvoiceToXeroPayload(invoice, {
    redactDescriptions: !isAdminRole(user.primaryRole),
  });

  return jsonOk({ xero: payload });
}
