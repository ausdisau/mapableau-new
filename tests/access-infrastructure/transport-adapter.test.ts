import { describe, expect, it } from "vitest";

import {
  assessTransportCompatibility,
  filterSufficientlyCompatibleVehicles,
  projectVehicleCapabilities,
} from "@/lib/access/infrastructure/adapters/transport";
import type { AccessRequirement } from "@/lib/access/infrastructure/types";

function transportReq(
  id: string,
  ontologyConceptId: string,
  value: string | number | boolean = true,
  criticality: AccessRequirement["criticality"] = "required",
): AccessRequirement {
  return {
    id,
    passportId: "pp-t",
    ontologyConceptId,
    domain: ontologyConceptId.startsWith("mobility") ? "mobility_movement" : "transport",
    attribute: ontologyConceptId.split(".").pop()!,
    value,
    comparator: typeof value === "number" ? "gte" : "eq",
    criticality,
    contextScope: "always",
    timing: "permanent",
    assistance: "independent",
    disclosureScopes: ["transport_provider"],
    userConfirmed: true,
  };
}

describe("transport access adapter", () => {
  it("projects vehicle capabilities without accessible=true as sole mechanism", () => {
    const caps = projectVehicleCapabilities({
      vehicleId: "veh-syn-1",
      accessibleVehicle: true,
      doorClearWidthMm: 850,
      boardingAssistance: true,
      evidenceStatus: "verified",
    });
    expect(caps.some((c) => c.ontologyConceptId === "transport.accessible_vehicle")).toBe(true);
    expect(caps.some((c) => c.ontologyConceptId === "mobility_movement.minimum_clear_width_mm")).toBe(
      true,
    );
  });

  it("flags vehicle too small as incompatible", () => {
    const report = assessTransportCompatibility({
      passportId: "pp-t",
      requirements: [
        transportReq("r1", "mobility_movement.minimum_clear_width_mm", 800),
        transportReq("r2", "transport.accessible_vehicle", true),
      ],
      vehicle: {
        vehicleId: "veh-small",
        accessibleVehicle: true,
        doorClearWidthMm: 700,
        evidenceStatus: "verified",
      },
      pickup: {
        placeId: "pickup-1",
        segment: "pickup",
        stepFree: true,
        evidenceStatus: "verified",
      },
      destination: {
        placeId: "dest-1",
        segment: "destination",
        stepFree: true,
        accessibleDropoff: true,
        evidenceStatus: "verified",
      },
    });
    expect(report.segments.find((s) => s.segment === "vehicle")?.state).toBe("incompatible");
    expect(report.productionClaim).toBe("none");
    expect(report.decisionOwner).toBe("PARTICIPANT");
  });

  it("keeps destination unknown when destination evidence missing", () => {
    const report = assessTransportCompatibility({
      passportId: "pp-t",
      requirements: [transportReq("r1", "transport.accessible_vehicle", true)],
      vehicle: {
        vehicleId: "veh-ok",
        accessibleVehicle: true,
        evidenceStatus: "verified",
      },
      pickup: {
        placeId: "pickup-1",
        segment: "pickup",
        stepFree: true,
        evidenceStatus: "observed",
      },
      destination: null,
    });
    const vehicle = report.segments.find((s) => s.segment === "vehicle");
    const destination = report.segments.find((s) => s.segment === "destination");
    expect(vehicle?.state).toBe("compatible");
    expect(destination?.state).toBe("uncertain");
    expect(report.overall).toBe("uncertain");
  });

  it("treats unknown vehicle evidence as uncertain not fail", () => {
    const report = assessTransportCompatibility({
      passportId: "pp-t",
      requirements: [transportReq("r1", "transport.accessible_vehicle", true)],
      vehicle: {
        vehicleId: "veh-unk",
        accessibleVehicle: true,
        evidenceStatus: "unknown",
      },
    });
    expect(report.segments.find((s) => s.segment === "vehicle")?.state).toBe("uncertain");
  });

  it("filters replacement candidates to sufficiently compatible only", () => {
    const filtered = filterSufficientlyCompatibleVehicles(
      [{ vehicleId: "a" }, { vehicleId: "b" }, { vehicleId: "c" }],
      (id) => {
        if (id === "a") return "compatible";
        if (id === "b") return "uncertain";
        return "incompatible";
      },
    );
    expect(filtered.map((v) => v.vehicleId)).toEqual(["a"]);
  });

  it("exposes separate segment labels rather than one icon", () => {
    const report = assessTransportCompatibility({
      passportId: "pp-t",
      requirements: [transportReq("r1", "transport.accessible_vehicle", true)],
      vehicle: {
        vehicleId: "veh-ok",
        accessibleVehicle: true,
        evidenceStatus: "verified",
      },
    });
    const labels = report.segments.map((s) => s.segment);
    expect(labels).toEqual(["vehicle", "pickup", "route", "destination"]);
  });
});
