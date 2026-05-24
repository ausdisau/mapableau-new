import { ZodError } from "zod";

import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { handleBillingApiError, requireInvoiceAccess } from "@/lib/billing/invoice-api-handler";
import { markManualPayment } from "@/lib/billing/invoice-service";
import { manualPaymentSchema } from "@/types/billing";
import { isAdminRole } from "@/lib/auth/roles";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await requireInvoiceAccess(id);
    if (access instanceof Response) return access;
    const isProvider =
      access.invoice.organisationId &&
      (await import("@/lib/prisma").then(({ prisma }) =>
        prisma.organisationMember.findFirst({
          where: {
            userId: access.user.id,
            organisationId: access.invoice.organisationId!,
          },
        })
      ));
    if (!isAdminRole(access.user.primaryRole) && !isProvider) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = manualPaymentSchema.parse(await req.json());
    const invoice = await markManualPayment(
      id,
      access.user.id,
      body.amountCents,
      body.notes
    );
    return jsonOk({ invoice, mfaNote: "MFA verification required in production" });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return handleBillingApiError(e);
  }
}
