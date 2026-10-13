import {
  handleBookingRouteError,
  requireBookingSession,
  bookingOk,
} from "@/lib/api/booking-route-handler";
import {
  disputeBooking,
  getBookingForUser,
} from "@/lib/bookings/booking-service";
import { disputeBookingSchema } from "@/lib/validation/booking-schemas";
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
    if (!existing.permissions.allowedActions.includes("dispute")) {
      throw new BookingAccessError("Booking access denied.");
    }

    const parsed = disputeBookingSchema.parse(await req.json());
    const booking = await disputeBooking(
      bookingId,
      user!.id,
      parsed.reason
    );
    const refreshed = await getBookingForUser(user!, booking.id);
    return bookingOk({ booking: refreshed });
  } catch (e) {
    return handleBookingRouteError(e);
  }
}
