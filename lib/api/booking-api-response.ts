import type { BookingErrorCode } from "@/types/bookings";

export function bookingError(
  code: BookingErrorCode,
  message: string,
  status: number,
  details?: unknown
) {
  return Response.json(
    {
      error: message,
      code,
      ...(details !== undefined ? { details } : {}),
    },
    { status }
  );
}

export function bookingNotFound() {
  return bookingError(
    "BOOKING_NOT_FOUND",
    "We could not find that booking. Check the link or try your bookings list.",
    404
  );
}

export function bookingAccessDenied() {
  return bookingError(
    "BOOKING_ACCESS_DENIED",
    "You do not have permission to access this booking.",
    403
  );
}

export function bookingConsentRequired() {
  return bookingError(
    "BOOKING_CONSENT_REQUIRED",
    "Consent is required before sharing accessibility or booking details with this provider.",
    403
  );
}

export function bookingInvalidTransition(message?: string) {
  return bookingError(
    "BOOKING_INVALID_STATUS_TRANSITION",
    message ??
      "This action is not available for the booking in its current state.",
    409
  );
}

export function bookingProviderNotEligible(message?: string) {
  return bookingError(
    "BOOKING_PROVIDER_NOT_ELIGIBLE",
    message ??
      "This provider organisation is not eligible to accept bookings yet.",
    403
  );
}

export function bookingAssigneeNotEligible(message?: string) {
  return bookingError(
    "BOOKING_ASSIGNEE_NOT_ELIGIBLE",
    message ?? "The selected worker, driver, or practitioner is not eligible for this booking.",
    403
  );
}

export function bookingValidationFailed(details?: unknown) {
  return bookingError(
    "BOOKING_VALIDATION_FAILED",
    "Some booking details need to be corrected before we can continue.",
    400,
    details
  );
}

export function mapBookingServiceError(error: unknown): Response | null {
  if (!(error instanceof Error)) return null;

  switch (error.message) {
    case "BOOKING_NOT_FOUND":
      return bookingNotFound();
    case "BOOKING_ACCESS_DENIED":
      return bookingAccessDenied();
    case "BOOKING_CONSENT_REQUIRED":
      return bookingConsentRequired();
    case "BOOKING_INVALID_STATUS_TRANSITION":
      return bookingInvalidTransition();
    case "BOOKING_PROVIDER_NOT_ELIGIBLE":
      return bookingProviderNotEligible();
    case "BOOKING_ASSIGNEE_NOT_ELIGIBLE":
      return bookingAssigneeNotEligible(error.cause ? String(error.cause) : undefined);
    case "SERVICE_LOG_NOT_ALLOWED":
      return bookingInvalidTransition(
        "A service log can only be created after the booking is completed or accepted according to policy."
      );
    case "INVOICE_EVIDENCE_REQUIRED":
      return bookingInvalidTransition(
        "An invoice can only be created after service evidence has been submitted and approved."
      );
    default:
      return null;
  }
}
