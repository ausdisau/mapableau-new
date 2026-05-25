import { ZodError } from "zod";

import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  handleBillingApiError,
  requireInvoiceAccess,
  requireInvoiceSession,
} from "@/lib/billing/invoice-api-handler";
import { getInvoiceDetail } from "@/lib/billing/invoice-service";
import { calculateInvoiceTotals, calculateLineTotal } from "@/lib/billing/invoice-total-service";
import { patchInvoiceSchema } from "@/types/billing";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await requireInvoiceAccess(id);
    if (access instanceof Response) return access;
    const invoice = await getInvoiceDetail(access.user, id);
    return jsonOk({ invoice });
  } catch (e) {
    return handleBillingApiError(e);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await requireInvoiceAccess(id);
    if (access instanceof Response) return access;
    const body = patchInvoiceSchema.parse(await req.json());
    if (access.invoice.status !== "draft") {
      return Response.json({ error: "Only draft invoices can be edited" }, { status: 409 });
    }

    if (body.lines) {
      const totals = calculateInvoiceTotals(
        body.lines.map((l) => ({
          quantity: l.quantity,
          unitAmountCents: l.unitAmountCents,
          privatePayAmountCents: l.privatePayAmountCents,
        }))
      );
      await prisma.invoiceLine.deleteMany({ where: { invoiceId: id } });
      await prisma.invoice.update({
        where: { id },
        data: {
          notes: body.notes,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
          subtotalCents: totals.subtotalCents,
          taxCents: totals.taxCents,
          totalCents: totals.totalCents,
          privatePayCents: totals.privatePayCents,
          lines: {
            create: body.lines.map((l) => ({
              description: l.description,
              plainDescription: l.plainDescription,
              serviceDate: new Date(l.serviceDate),
              quantity: l.quantity,
              unitAmountCents: l.unitAmountCents,
              totalAmountCents: calculateLineTotal({
                quantity: l.quantity,
                unitAmountCents: l.unitAmountCents,
              }),
              supportItemCode: l.supportItemCode,
              claimableByNdis: l.claimableByNdis ?? false,
              privatePayAmountCents: l.privatePayAmountCents,
              ndisClaimableAmountCents: l.ndisClaimableAmountCents,
              taxCode: l.taxCode,
              xeroAccountCode: l.xeroAccountCode,
              xeroTaxType: l.xeroTaxType,
            })),
          },
        },
      });
    } else {
      await prisma.invoice.update({
        where: { id },
        data: {
          notes: body.notes,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        },
      });
    }

    const invoice = await getInvoiceDetail(access.user, id);
    return jsonOk({ invoice });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return handleBillingApiError(e);
  }
}
