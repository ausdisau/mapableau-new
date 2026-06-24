import { jsonError, jsonOk } from "@/lib/api/response";
import { donationStatusQuerySchema } from "@/lib/donations/schemas";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = donationStatusQuerySchema.safeParse({
    session_id: searchParams.get("session_id"),
  });
  if (!parsed.success) {
    return jsonError("session_id is required", 400);
  }

  const donation = await prisma.donation.findFirst({
    where: { stripeCheckoutSessionId: parsed.data.session_id },
    select: {
      status: true,
      amountCents: true,
      currency: true,
      paidAt: true,
    },
  });

  if (!donation) {
    return jsonError("Donation not found", 404);
  }

  return jsonOk({
    status: donation.status,
    amountCents: donation.amountCents,
    currency: donation.currency,
    paidAt: donation.paidAt?.toISOString() ?? null,
  });
}
