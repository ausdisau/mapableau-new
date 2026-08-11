import { describe, expect, it } from "vitest";

import {
  evaluateCompatibility,
  summariseCompatibilityForParticipant,
} from "@/lib/access/infrastructure/engine";
import type { AccessAdjustment, AccessCapability, AccessRequirement } from "@/lib/access/infrastructure/types";

function req(
  partial: Partial<AccessRequirement> & Pick<AccessRequirement, "id" | "ontologyConceptId" | "criticality">,
): AccessRequirement {
  return {
    passportId: "pp-1",
    domain: "transport",
    attribute: partial.ontologyConceptId.split(".").pop() ?? "attr",
    contextScope: "always",
    timing: "permanent",
    assistance: "independent",
    disclosureScopes: ["transport_provider"],
    userConfirmed: true,
    value: true,
    ...partial,
  };
}

function cap(
  partial: Partial<AccessCapability> & Pick<AccessCapability, "id" | "ontologyConceptId" | "value">,
): AccessCapability & { observationStatus?: AccessCapability["status"]; disputed?: boolean; reviewDue?: string | null } {
  return {
    entityType: "vehicle",
    entityId: "veh-1",
    attribute: "x",
    evidenceObservationId: "obs-1",
    status: "verified",
    observationStatus: "verified",
    ...partial,
  };
}

describe("compatibility engine", () => {
  it("returns compatible when all required capabilities match", () => {
    const result = evaluateCompatibility({
      passportId: "pp-1",
      entityType: "vehicle",
      entityId: "veh-1",
      requirements: [
        req({ id: "r1", ontologyConceptId: "transport.accessible_vehicle", criticality: "required" }),
      ],
      capabilities: [
        cap({ id: "c1", ontologyConceptId: "transport.accessible_vehicle", value: true }),
      ],
      adjustments: [],
    });
    expect(result.state).toBe("compatible");
    expect(result.summary.matched).toBe(1);
    expect(result.decisionOwner).toBe("PARTICIPANT");
  });

  it("returns incompatible on mandatory mismatch without adjustment", () => {
    const result = evaluateCompatibility({
      passportId: "pp-1",
      entityType: "vehicle",
      entityId: "veh-1",
      requirements: [
        req({
          id: "r1",
          ontologyConceptId: "mobility_movement.minimum_clear_width_mm",
          criticality: "required",
          comparator: "gte",
          value: 800,
          domain: "mobility_movement",
        }),
      ],
      capabilities: [
        cap({
          id: "c1",
          ontologyConceptId: "mobility_movement.minimum_clear_width_mm",
          value: 700,
        }),
      ],
      adjustments: [],
    });
    expect(result.state).toBe("incompatible");
    expect(result.summary.mismatched).toBe(1);
  });

  it("returns uncertain when evidence is missing", () => {
    const result = evaluateCompatibility({
      passportId: "pp-1",
      entityType: "vehicle",
      entityId: "veh-1",
      requirements: [
        req({ id: "r1", ontologyConceptId: "transport.boarding_assistance", criticality: "required" }),
      ],
      capabilities: [],
      adjustments: [],
    });
    expect(result.state).toBe("uncertain");
    expect(result.summary.unknown).toBe(1);
  });

  it("returns compatible_with_adjustment when adjustment available", () => {
    const adjustments: AccessAdjustment[] = [
      {
        id: "adj-1",
        entityType: "vehicle",
        entityId: "veh-1",
        ontologyConceptId: "transport.boarding_assistance",
        summary: "Driver will provide boarding assistance on request",
        status: "venue_reported",
      },
    ];
    const result = evaluateCompatibility({
      passportId: "pp-1",
      entityType: "vehicle",
      entityId: "veh-1",
      requirements: [
        req({ id: "r1", ontologyConceptId: "transport.boarding_assistance", criticality: "required" }),
      ],
      capabilities: [],
      adjustments,
    });
    expect(result.state).toBe("compatible_with_adjustment");
    expect(result.summary.adjustments).toBe(1);
  });

  it("does not promote preference mismatch to incompatible", () => {
    const result = evaluateCompatibility({
      passportId: "pp-1",
      entityType: "place",
      entityId: "place-1",
      requirements: [
        req({
          id: "r1",
          ontologyConceptId: "sensory_regulation.quiet_space",
          criticality: "preference",
          domain: "sensory_regulation",
        }),
        req({
          id: "r2",
          ontologyConceptId: "transport.accessible_vehicle",
          criticality: "required",
        }),
      ],
      capabilities: [
        cap({
          id: "c1",
          ontologyConceptId: "sensory_regulation.quiet_space",
          value: false,
          entityType: "place",
          entityId: "place-1",
        }),
        cap({
          id: "c2",
          ontologyConceptId: "transport.accessible_vehicle",
          value: true,
        }),
      ],
      adjustments: [],
    });
    expect(result.state).toBe("compatible");
    expect(result.preferenceUnmetConceptIds).toContain("sensory_regulation.quiet_space");
  });

  it("treats stale or disputed evidence as unknown", () => {
    const result = evaluateCompatibility({
      passportId: "pp-1",
      entityType: "vehicle",
      entityId: "veh-1",
      requirements: [
        req({ id: "r1", ontologyConceptId: "transport.accessible_vehicle", criticality: "required" }),
      ],
      capabilities: [
        {
          ...cap({ id: "c1", ontologyConceptId: "transport.accessible_vehicle", value: true }),
          observationStatus: "outdated",
        },
      ],
      adjustments: [],
    });
    expect(result.state).toBe("uncertain");
  });

  it("treats disputed evidence as unknown", () => {
    const result = evaluateCompatibility({
      passportId: "pp-1",
      entityType: "vehicle",
      entityId: "veh-1",
      requirements: [
        req({ id: "r1", ontologyConceptId: "transport.accessible_vehicle", criticality: "required" }),
      ],
      capabilities: [
        {
          ...cap({ id: "c1", ontologyConceptId: "transport.accessible_vehicle", value: true }),
          disputed: true,
        },
      ],
      adjustments: [],
    });
    expect(result.state).toBe("uncertain");
  });

  it("never invents a universal score in participant summary", () => {
    const result = evaluateCompatibility({
      passportId: "pp-1",
      entityType: "vehicle",
      entityId: "veh-1",
      requirements: [
        req({ id: "r1", ontologyConceptId: "transport.accessible_vehicle", criticality: "required" }),
      ],
      capabilities: [
        cap({ id: "c1", ontologyConceptId: "transport.accessible_vehicle", value: true }),
      ],
      adjustments: [],
    });
    const summary = summariseCompatibilityForParticipant(result);
    expect(summary.toLowerCase()).not.toMatch(/%|score|87|ranking/);
    expect(summary).toMatch(/decide/i);
  });
});
