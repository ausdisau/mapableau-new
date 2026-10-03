import {
  handleBookingRouteError,
  requireBookingSession,
  bookingOk,
} from "@/lib/api/booking-route-handler";
import { cancelBooking, getBookingForUser } from "@/lib/bookings/booking-service";
import { cancelBookingSchema } from "@/lib/validation/booking-schemas";
import { BookingAccessError } from "@/lib/bookings/booking-access-policy";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { user, error } = await requireBookingSession();
  if (error) return error;

  const { bookingId } = await params;

  try {
    const existing = await getBookingForUser(user!, bookingId);
    if (!existing.permissions.allowedActions.includes("cancel")) {
      throw new BookingAccessError("Booking access denied.");
    }

    const body = cancelBookingSchema.safeParse(await req.json().catch(() => ({})));
    const booking = await cancelBooking(
      bookingId,
      user!.id,
      body.success ? body.data.reason : undefined
    );
    const refreshed = await getBookingForUser(user!, booking.id);
    return bookingOk({ booking: refreshed });
  } catch (e) {
    return handleBookingRouteError(e);
  }
}
