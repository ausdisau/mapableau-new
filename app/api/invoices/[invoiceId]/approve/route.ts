import { ZodError, z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { approveInvoice } from "@/lib/invoices/invoice-service";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  approvedByRole: z.enum([
    "participant",
    "family_member",
    "plan_manager",
  ]),
  notes: z.string().max(2000).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { invoiceId } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return jsonError("Not found", 404);

  if (
    invoice.participantId !== user.id &&
    user.primaryRole !== "plan_manager" &&
    user.primaryRole !== "family_member"
  ) {
    return jsonError("Forbidden", 403);
  }

  try {
    const parsed = schema.parse(await req.json());
    const updated = await approveInvoice(
      invoiceId,
      user.id,
      parsed.approvedByRole
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
    return jsonError("Approve failed", 500);
  }
}
