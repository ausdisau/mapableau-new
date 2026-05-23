import { describe, expect, it } from "vitest";

import {
  canTransitionBookingStatus,
  toCoreBookingStatus,
  toPrismaBookingStatus,
} from "@/lib/domain/booking-status";

describe("booking status transitions", () => {
  it("allows requested to accepted", () => {
    expect(canTransitionBookingStatus("requested", "accepted")).toBe(true);
  });

  it("maps prisma confirmed to accepted core status", () => {
    expect(toCoreBookingStatus("confirmed")).toBe("accepted");
    expect(toPrismaBookingStatus("accepted")).toBe("confirmed");
  });

  it("rejects invalid transition from draft to paid", () => {
    expect(canTransitionBookingStatus("draft", "paid")).toBe(false);
  });

  it("allows completed to invoiced", () => {
    expect(canTransitionBookingStatus("completed", "invoiced")).toBe(true);
  });

  it("allows invoiced to paid", () => {
    expect(canTransitionBookingStatus("invoiced", "paid")).toBe(true);
  });
});
