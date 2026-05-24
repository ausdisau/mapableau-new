import { describe, expect, it } from "vitest";

import {
  matchDriverTraining,
  matchVehicleCapabilities,
} from "@/lib/transport-osm/capability-matcher";
import { PlaceholderRoutingProvider } from "@/lib/transport-osm/routing/placeholder-provider";

describe("transport-osm capability matcher", () => {
  it("flags non-wheelchair vehicle", () => {
    const result = matchVehicleCapabilities(
      { requiresWheelchairAccessible: true },
      {
        wheelchairAccessible: false,
        rampAvailable: false,
        liftAvailable: false,
        assistanceAnimalFriendly: true,
        seatedCapacity: 4,
        wheelchairSpaces: 0,
      }
    );
    expect(result.ok).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("flags driver without hoist training", () => {
    const result = matchDriverTraining(
      { hoistRequired: true },
      {
        accessibilityTrainingStatus: "verified",
        driverCapabilities: [],
      }
    );
    expect(result.ok).toBe(false);
  });
});

describe("placeholder routing", () => {
  it("returns route with legs", async () => {
    const provider = new PlaceholderRoutingProvider();
    const route = await provider.route({
      coordinates: [
        { lat: -37.81, lng: 144.96 },
        { lat: -37.82, lng: 144.97 },
      ],
    });
    expect(route.distanceMeters).toBeGreaterThan(0);
    expect(route.durationSeconds).toBeGreaterThan(0);
    expect(route.legs.length).toBe(1);
  });
});

describe("trip status labels", () => {
  it("includes quoted status label", async () => {
    const { TRANSPORT_STATUS_LABELS } = await import("@/types/transport-osm");
    expect(TRANSPORT_STATUS_LABELS.quoted).toBe("Quoted");
  });
});
