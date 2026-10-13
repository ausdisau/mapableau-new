import {
  handleBookingRouteError,
  requireBookingSession,
  bookingOk,
} from "@/lib/api/booking-route-handler";
import {
  assertProviderCanManageBooking,
  getBookingForUser,
  startBooking,
} from "@/lib/bookings/booking-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { user, error } = await requireBookingSession();
  if (error) return error;

  const { bookingId } = await params;

  try {
    await assertProviderCanManageBooking(user!, bookingId);
    const booking = await startBooking(bookingId, user!.id);
    const refreshed = await getBookingForUser(user!, booking.id);
    return bookingOk({ booking: refreshed });
  } catch (e) {
    return handleBookingRouteError(e);
  }
}
