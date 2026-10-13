import type { BookingStatus, BookingType } from "@prisma/client";

import {
  handleBookingRouteError,
  requireBookingSession,
  bookingOk,
} from "@/lib/api/booking-route-handler";
import { listBookingsForUser } from "@/lib/bookings/booking-service";
import { listBookingsQuerySchema } from "@/lib/validation/booking-schemas";

export async function GET(req: Request) {
  const { user, error } = await requireBookingSession();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const filters = listBookingsQuerySchema.parse({
      status: searchParams.get("status") ?? undefined,
      module: searchParams.get("module") ?? undefined,
    });

    const bookings = await listBookingsForUser(user!, {
      status: filters.status as BookingStatus | undefined,
      module: filters.module as BookingType | undefined,
    });
    return bookingOk({ bookings });
  } catch (e) {
    return handleBookingRouteError(e);
  }
}
