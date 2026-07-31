import { ZodError } from "zod";

import {
  handleBookingRouteError,
  requireBookingSession,
  bookingOk,
} from "@/lib/api/booking-route-handler";
import { zodErrorResponse } from "@/lib/api/response";
import {
  assertProviderCanManageBooking,
  createBookingServiceLog,
  getBookingForUser,
} from "@/lib/bookings/booking-service";
import { createServiceLogSchema } from "@/lib/validation/booking-schemas";
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
    if (!existing.permissions.allowedActions.includes("create_service_log")) {
      throw new BookingAccessError("Booking access denied.");
    }

    const parsed = createServiceLogSchema.parse(await req.json());
    const serviceLog = await createBookingServiceLog({
      bookingId,
      createdById: user!.id,
      ...parsed,
    });
    const refreshed = await getBookingForUser(user!, bookingId);
    return bookingOk({ serviceLog, booking: refreshed }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return handleBookingRouteError(e);
  }
}
