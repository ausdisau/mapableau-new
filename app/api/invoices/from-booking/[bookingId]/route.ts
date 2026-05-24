import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { userCanAccessBooking } from "@/lib/bookings/booking-access";
import { createInvoiceDraftFromBooking } from "@/lib/invoices/invoice-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { bookingId } = await params;

  if (!(await userCanAccessBooking(user, bookingId))) {
    return jsonError("Forbidden", 403);
  }

  try {
    const invoice = await createInvoiceDraftFromBooking(bookingId, user.id);
    return jsonOk({ invoice }, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "BOOKING_NOT_READY_FOR_INVOICE") {
      return jsonError("Booking must be completed before invoicing", 400);
    }
    if (e instanceof Error && e.message === "BOOKING_NOT_FOUND") {
      return jsonError("Booking not found", 404);
    }
    return jsonError("Create invoice failed", 500);
  }
}
