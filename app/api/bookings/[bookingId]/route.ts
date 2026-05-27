import { ZodError } from "zod";

import {
  handleBookingRouteError,
  requireBookingSession,
  bookingOk,
} from "@/lib/api/booking-route-handler";
import { zodErrorResponse } from "@/lib/api/response";
import {
  getBookingForUser,
  updateBookingDetails,
} from "@/lib/bookings/booking-service";
import { updateBookingSchema } from "@/lib/validation/booking-schemas";
import { BookingAccessError } from "@/lib/bookings/booking-access-policy";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { user, error } = await requireBookingSession();
  if (error) return error;

  const { bookingId } = await params;

  try {
    const booking = await getBookingForUser(user!, bookingId);
    return bookingOk({ booking });
  } catch (e) {
    if (e instanceof BookingAccessError && e.code === "BOOKING_NOT_FOUND") {
      return handleBookingRouteError(e);
    }
    if (e instanceof BookingAccessError) {
      return handleBookingRouteError(e);
    }
    return handleBookingRouteError(e);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { user, error } = await requireBookingSession();
  if (error) return error;

  const { bookingId } = await params;

  try {
    const existing = await getBookingForUser(user!, bookingId);
    if (!existing.permissions.canUpdate) {
      throw new BookingAccessError("Booking access denied.");
    }

    const parsed = updateBookingSchema.parse(await req.json());
    const booking = await updateBookingDetails(bookingId, parsed, user!.id);
    const refreshed = await getBookingForUser(user!, booking.id);
    return bookingOk({ booking: refreshed });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return handleBookingRouteError(e);
  }
}
