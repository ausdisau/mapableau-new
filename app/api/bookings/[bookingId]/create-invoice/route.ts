import {
  handleBookingRouteError,
  requireBookingSession,
  bookingOk,
} from "@/lib/api/booking-route-handler";
import {
  createBookingInvoice,
  getBookingForUser,
} from "@/lib/bookings/booking-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { user, error } = await requireBookingSession();
  if (error) return error;

  const { bookingId } = await params;

  try {
    const existing = await getBookingForUser(user!, bookingId);
    if (!existing.permissions.allowedActions.includes("create_invoice")) {
      return handleBookingRouteError(new Error("BOOKING_ACCESS_DENIED"));
    }

    const invoice = await createBookingInvoice(bookingId, user!.id);
    const refreshed = await getBookingForUser(user!, bookingId);
    return bookingOk({ invoice, booking: refreshed }, 201);
  } catch (e) {
    return handleBookingRouteError(e);
  }
}
