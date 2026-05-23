import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createPaymentIntentForLegacyInvoice } from "@/lib/stripe/payment-intents";
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
  if (invoice.participantId !== user.id) {
    return jsonError("Forbidden", 403);
  }

  const amountCents =
    invoice.participantGapCents > 0
      ? invoice.participantGapCents
      : invoice.totalCents;

  if (amountCents <= 0) {
    return jsonError("No participant payment required", 400);
  }

  const result = await createPaymentIntentForLegacyInvoice({
    invoiceId,
    amountCents,
    userId: user.id,
    currency: invoice.currency,
  });

  if (!result.ok) {
    return jsonError(result.error ?? "Payment intent failed", 500);
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { stripePaymentIntentId: result.paymentIntentId },
  });

  return jsonOk({
    clientSecret: result.clientSecret,
    paymentIntentId: result.paymentIntentId,
  });
}
