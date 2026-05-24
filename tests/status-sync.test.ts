import { describe, expect, it } from "vitest";

import {
  mapCareRequestStatusToBooking,
  mapCareShiftStatusToBooking,
  mapTransportStatusToBooking,
} from "@/lib/bookings/status-sync";

describe("status-sync mappers", () => {
  it("maps care request submitted to requested", () => {
    expect(mapCareRequestStatusToBooking("submitted")).toBe("requested");
  });

  it("maps transport in_transit to in_progress", () => {
    expect(mapTransportStatusToBooking("in_transit")).toBe("in_progress");
  });

  it("maps approved shift to completed booking", () => {
    expect(mapCareShiftStatusToBooking("approved")).toBe("completed");
  });

  it("returns null for draft care request", () => {
    expect(mapCareRequestStatusToBooking("draft")).toBeNull();
  });
});
