import { ZodError, z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { issueInvoice } from "@/lib/invoices/invoice-service";
import { prisma } from "@/lib/prisma";

const schema = z.object({ dueInDays: z.number().int().min(1).max(90).optional() });

export async function POST(
  req: Request,
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
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.parse(body);
    const updated = await issueInvoice(
      invoiceId,
      user.id,
      parsed.dueInDays ?? 14
    );
    return jsonOk({ invoice: updated });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (
      e instanceof Error &&
      e.message.startsWith("INVALID_INVOICE_TRANSITION")
    ) {
      return jsonError("Invalid invoice status transition", 400);
    }
    return jsonError("Issue failed", 500);
  }
}
