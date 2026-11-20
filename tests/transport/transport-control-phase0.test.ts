import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  assertNoRealLocationFields,
  parseTransportControlEvent,
} from "@/lib/transport/events/transport-control-event-schemas";
import {
  mergeMobilityRequirementsStrictest,
  passengerCountOf,
  wheelchairSecurementDemandOf,
} from "@/lib/transport/mobility-schema";
import { mintSocketAuthTokenForUser } from "@/lib/realtime/mint-socket-token";

describe("mobility strictest merge", () => {
  it("ORs boolean needs so later false cannot erase earlier true", () => {
    const merged = mergeMobilityRequirementsStrictest(
      { requiresWheelchairAccessible: true, requiresRamp: true },
      { requiresWheelchairAccessible: false, requiresHoist: true }
    );
    expect(merged.requiresWheelchairAccessible).toBe(true);
    expect(merged.requiresRamp).toBe(true);
    expect(merged.requiresHoist).toBe(true);
  });

  it("sums capacity helpers correctly", () => {
    expect(passengerCountOf({})).toBe(1);
    expect(passengerCountOf({ passengerCount: 3 })).toBe(3);
    expect(
      wheelchairSecurementDemandOf({ requiresWheelchairAccessible: true })
    ).toBe(1);
    expect(
      wheelchairSecurementDemandOf({
        requiresWheelchairAccessible: true,
        canTransferFromWheelchair: true,
      })
    ).toBe(0);
  });
});

describe("transport control event contracts", () => {
  it("parses status/assignment envelopes with aggregateVersion + sequence", () => {
    const event = parseTransportControlEvent({
      id: "evt-1",
      type: "transport.trip.assigned",
      tripId: "trip-1",
      organisationId: "org-1",
      aggregateVersion: 2,
      sequence: 10,
      occurredAt: "2026-06-01T09:00:00.000Z",
      outboxRecommended: true,
      payload: {
        driverId: "d1",
        vehicleId: "v1",
        roomGrantGeneration: 2,
      },
    });
    expect(event.type).toBe("transport.trip.assigned");
    expect(event.aggregateVersion).toBe(2);
  });

  it("rejects real location fields", () => {
    expect(() =>
      assertNoRealLocationFields({ payload: { lat: -33.8, lng: 151.2 } })
    ).toThrow(/real location/);
  });

  it("requires advisoryOnly on route-ready events", () => {
    expect(() =>
      parseTransportControlEvent({
        id: "evt-2",
        type: "transport.route.advisory_ready",
        tripId: "trip-1",
        aggregateVersion: 1,
        sequence: 1,
        occurredAt: "2026-06-01T09:00:00.000Z",
        outboxRecommended: true,
        payload: {
          estimateId: "est-1",
          provider: "mock",
          advisoryOnly: true,
          sourceLabel: "mock (advisory)",
        },
      })
    ).not.toThrow();
  });
});

describe("socket token mint (Next.js helper)", () => {
  beforeEach(() => {
    process.env.SOCKETIO_AUTH_SECRET = "test-socket-secret-32chars-min!!";
  });
  afterEach(() => {
    delete process.env.SOCKETIO_AUTH_SECRET;
  });

  it("mints expiring tokens", () => {
    const { token, expiresAt } = mintSocketAuthTokenForUser({
      userId: "u1",
      role: "transport_operator",
      roomGrants: ["user:u1"],
    });
    expect(token.split(".")).toHaveLength(2);
    expect(Date.parse(expiresAt)).toBeGreaterThan(Date.now());
  });
});
