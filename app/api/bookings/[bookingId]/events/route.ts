import {
  handleBookingRouteError,
  requireBookingSession,
  bookingOk,
} from "@/lib/api/booking-route-handler";
import { getBookingForUser } from "@/lib/bookings/booking-service";
import { listBookingEvents } from "@/lib/bookings/booking-event-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { user, error } = await requireBookingSession();
  if (error) return error;

  const { bookingId } = await params;

  try {
    const booking = await getBookingForUser(user!, bookingId);
    if (!booking.permissions.allowedActions.includes("view_events")) {
      return handleBookingRouteError(new Error("BOOKING_ACCESS_DENIED"));
    }

    const events = await listBookingEvents(bookingId);
    return bookingOk({ events });
  } catch (e) {
    return handleBookingRouteError(e);
  }
}
