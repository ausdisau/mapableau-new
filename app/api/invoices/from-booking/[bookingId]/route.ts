import { jsonOk } from "@/lib/api/response";
import { handleBillingApiError, requireInvoiceSession } from "@/lib/billing/invoice-api-handler";
import { createInvoiceFromBooking } from "@/lib/billing/invoice-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const user = await requireInvoiceSession();
    if (user instanceof Response) return user;
    const { bookingId } = await params;
    const invoice = await createInvoiceFromBooking(bookingId, user.id);
    return jsonOk({ invoice }, 201);
  } catch (e) {
    return handleBillingApiError(e);
  }
}
