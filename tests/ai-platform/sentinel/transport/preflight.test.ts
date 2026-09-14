import { describe, expect, it } from "vitest";

import { evaluateTransportPreflightWith } from "@/lib/ai/platform/sentinel/transport/preflight";

describe("Transport Sentinel preflight", () => {
  it("pauses when driver eligibility fails", async () => {
    const result = await evaluateTransportPreflightWith({
      driver: async () => ({
        eligible: false,
        reasons: ["licence has expired"],
      }),
      vehicle: async () => ({ eligible: true, reasons: [] }),
    })({
      tripId: "trip-1",
      driverId: "driver-1",
      vehicleId: "vehicle-1",
      mobilityRequirements: {},
    });

    expect(result.outcome).toBe("PAUSE");
    expect(result.reasonCodes).toContain("TRANSPORT_DRIVER_NOT_ELIGIBLE");
    expect(result.unknownEvidence).toEqual([]);
  });

  it("keeps unknown vehicle access equipment distinct from known incompatibility", async () => {
    const result = await evaluateTransportPreflightWith({
      driver: async () => ({ eligible: true, reasons: [] }),
      vehicle: async () => ({
        eligible: false,
        reasons: ["Access equipment verification missing"],
      }),
    })({
      tripId: "trip-1",
      driverId: "driver-1",
      vehicleId: "vehicle-1",
      mobilityRequirements: { requiresAccessEquipment: true },
    });

    expect(result.outcome).toBe("PAUSE");
    expect(result.reasonCodes).toContain("TRANSPORT_VEHICLE_NOT_ELIGIBLE");
    expect(result.unknownEvidence).toContain("vehicle_access_equipment");
  });

  it("is ready only when both canonical eligibility checks pass", async () => {
    const result = await evaluateTransportPreflightWith({
      driver: async () => ({ eligible: true, reasons: [] }),
      vehicle: async () => ({ eligible: true, reasons: [] }),
    })({
      tripId: "trip-1",
      driverId: "driver-1",
      vehicleId: "vehicle-1",
      mobilityRequirements: {},
    });

    expect(result).toEqual({
      outcome: "READY",
      reasonCodes: [],
      unknownEvidence: [],
      evidence: {
        driverReasons: [],
        vehicleReasons: [],
      },
    });
  });
});
