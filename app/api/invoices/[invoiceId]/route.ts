import { ZodError, z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { updateInvoiceStatus } from "@/lib/invoices/invoice-service";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  status: z.enum([
    "draft",
    "issued",
    "awaiting_participant_approval",
    "awaiting_plan_manager",
    "partially_paid",
    "paid",
    "overdue",
    "disputed",
    "void",
    "voided",
  ]),
});

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
      booking: {
        select: {
          id: true,
          bookingType: true,
          requestedStart: true,
          status: true,
        },
      },
      organisation: { select: { id: true, name: true } },
      preflightResults: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!invoice) return jsonError("Not found", 404);

  if (!isAdminRole(user.primaryRole) && invoice.participantId !== user.id) {
    if (invoice.organisationId) {
      const member = await prisma.organisationMember.findFirst({
        where: { userId: user.id, organisationId: invoice.organisationId },
      });
      if (!member) return jsonError("Forbidden", 403);
    } else {
      return jsonError("Forbidden", 403);
    }
  }

  return jsonOk({ invoice });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { invoiceId } = await params;

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return jsonError("Not found", 404);

  const canEdit =
    isAdminRole(user.primaryRole) ||
    (invoice.organisationId &&
      (await prisma.organisationMember.findFirst({
        where: { userId: user.id, organisationId: invoice.organisationId },
      })));

  if (!canEdit) return jsonError("Forbidden", 403);

  try {
    const parsed = patchSchema.parse(await req.json());
    const status = parsed.status === "void" ? "void" : parsed.status;
    const updated = await updateInvoiceStatus(
      invoiceId,
      status,
      user.id
    );
    return jsonOk({ invoice: updated });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (
      e instanceof Error &&
      e.message.startsWith("INVALID_INVOICE_TRANSITION")
    ) {
      return jsonError("Invalid status transition", 400);
    }
    return jsonError("Update failed", 500);
  }
}
