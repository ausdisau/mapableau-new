import { getBillingSummary } from "@/server/billing/billingRoutes";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const { invoiceId } = await params;
  return getBillingSummary(req, invoiceId);
}
