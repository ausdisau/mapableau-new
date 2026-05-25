import { describe, expect, it } from "vitest";

import {
  bookingStatusFromCareRequest,
  bookingStatusFromCareShift,
  bookingStatusFromTransportBooking,
} from "@/lib/bookings/status-sync";
import {
  estimateRouteFromCoordinates,
  placeholderRouteEstimate,
} from "@/lib/routing/dynamic-route-service";
import { CARE_STATUS_LABELS } from "@/types/care";
import { JOB_APPLICATION_STATUS_LABELS } from "@/types/employment";
import { TRANSPORT_STATUS_LABELS } from "@/types/transport";

describe("care booking status sync", () => {
  it("maps care lifecycle states onto the Booking spine", () => {
    expect(bookingStatusFromCareRequest("submitted")).toBe("requested");
    expect(bookingStatusFromCareRequest("awaiting_provider_response")).toBe(
      "awaiting_provider_acceptance",
    );
    expect(bookingStatusFromCareRequest("confirmed")).toBe("confirmed");
    expect(bookingStatusFromCareShift("checked_in")).toBe("in_progress");
    expect(bookingStatusFromCareShift("approved")).toBe("completed");
  });

  it("exposes plain-language care labels", () => {
    expect(CARE_STATUS_LABELS.awaiting_provider_response).toBe(
      "Awaiting provider response",
    );
  });
});

describe("transport booking status sync", () => {
  it("maps transport trip states onto Booking statuses", () => {
    expect(bookingStatusFromTransportBooking("requested")).toBe("requested");
    expect(
      bookingStatusFromTransportBooking("awaiting_operator_response"),
    ).toBe("awaiting_provider_acceptance");
    expect(bookingStatusFromTransportBooking("in_transit")).toBe("in_progress");
    expect(bookingStatusFromTransportBooking("completed")).toBe("completed");
  });

  it("keeps transport status labels text-first", () => {
    expect(TRANSPORT_STATUS_LABELS.participant_on_board).toBe(
      "Participant on board",
    );
  });
});

describe("employment support labels", () => {
  it("labels interview support state clearly", () => {
    expect(JOB_APPLICATION_STATUS_LABELS.interview_requested).toBe(
      "Interview requested",
    );
  });
});

describe("dynamic transport routing", () => {
  it("estimates straight-line trip distance and duration", () => {
    const estimate = estimateRouteFromCoordinates({
      pickupLat: -33.8688,
      pickupLng: 151.2093,
      dropoffLat: -33.815,
      dropoffLng: 151.0011,
    });

    expect(estimate.distanceKm).toBeGreaterThan(15);
    expect(estimate.distanceKm).toBeLessThan(25);
    expect(estimate.durationMinutes).toBeGreaterThanOrEqual(5);
  });

  it("has a deterministic placeholder when coordinates are unavailable", () => {
    expect(placeholderRouteEstimate()).toEqual({
      distanceKm: 12,
      durationMinutes: 30,
      source: "placeholder",
    });
  });
});
