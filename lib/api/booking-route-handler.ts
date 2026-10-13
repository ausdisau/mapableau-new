import { ZodError } from "zod";

import {
  bookingAccessDenied,
  bookingNotFound,
  bookingValidationFailed,
  mapBookingServiceError,
} from "@/lib/api/booking-api-response";
import { jsonOk } from "@/lib/api/response";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  BookingAccessError,
  assertCanViewBooking,
} from "@/lib/bookings/booking-access-policy";
import type { CurrentUser } from "@/lib/auth/current-user";

export async function requireBookingSession() {
  const user = await requireApiSession();
  if (user instanceof Response) return { user: null, error: user };
  return { user, error: null };
}

export function handleBookingRouteError(error: unknown): Response {
  if (error instanceof ZodError) {
    return bookingValidationFailed(error.flatten());
  }

  if (error instanceof BookingAccessError) {
    if (error.code === "BOOKING_NOT_FOUND") return bookingNotFound();
    if (error.code === "BOOKING_CONSENT_REQUIRED") {
      return mapBookingServiceError(new Error("BOOKING_CONSENT_REQUIRED"))!;
    }
    return bookingAccessDenied();
  }

  const mapped = mapBookingServiceError(error);
  if (mapped) return mapped;

  console.error("[booking-api]", error);
  return Response.json(
    {
      error: "Something went wrong while processing your booking request.",
      code: "BOOKING_VALIDATION_FAILED",
    },
    { status: 500 }
  );
}

export async function assertBookingAccess(
  user: CurrentUser,
  booking: Parameters<typeof assertCanViewBooking>[1]
) {
  try {
    await assertCanViewBooking(user, booking);
  } catch (error) {
    if (error instanceof BookingAccessError) throw error;
    throw new BookingAccessError("Booking access denied.");
  }
}

export function bookingOk<T>(payload: T, status = 200) {
  return jsonOk(payload, status);
}
