import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import {
  assertCanViewBillingInvoice,
  BillingAccessError,
} from "@/lib/billing/access";
import { hasBillingPermission } from "@/lib/billing/permissions";
import { exportPaymentToCsv } from "@/lib/payouts/export-service";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { paymentId } = await params;

  const payment = await prisma.billingPayment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      userId: true,
      providerId: true,
      invoiceId: true,
    },
  });
  if (!payment) return jsonError("Payment not found", 404);

  const isPlatformAdmin =
    isAdminRole(user.primaryRole) ||
    hasPermission(user.primaryRole, "billing:manage_payouts") ||
    hasBillingPermission(user.primaryRole, "billing:view_all");

  if (payment.userId !== user.id && !isPlatformAdmin) {
    try {
      await assertCanViewBillingInvoice(user, payment.invoiceId);
    } catch (err) {
      if (err instanceof BillingAccessError) {
        return jsonError(err.message, err.status);
      }
      throw err;
    }
  }

  const result = await exportPaymentToCsv(paymentId);
  if (!result.ok) return jsonError(result.error, 404);

  return new Response(result.csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="payout-${paymentId}.csv"`,
    },
  });
}
