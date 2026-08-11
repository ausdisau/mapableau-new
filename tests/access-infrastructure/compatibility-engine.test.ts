import { describe, expect, it } from "vitest";

import {
  evaluateCompatibility,
  toCompatibilityApiResponse,
  type AccessAdjustment,
  type AccessCapability,
  type AccessRequirement,
} from "@/lib/access/infrastructure";

function req(
  partial: Partial<AccessRequirement> &
    Pick<AccessRequirement, "id" | "ontologyConceptId" | "criticality">,
): AccessRequirement {
  return {
    passportId: "passport-1",
    domain: "mobility_movement",
    attribute: "step_free",
    contextScope: "always",
    timing: "permanent",
    assistance: "independent",
    disclosureScopes: ["private"],
    userConfirmed: true,
    comparator: "eq",
    value: true,
    ...partial,
  };
}

function cap(
  partial: Partial<AccessCapability> &
    Pick<AccessCapability, "id" | "ontologyConceptId" | "value" | "status">,
): AccessCapability {
  return {
    entityType: "place",
    entityId: "place-1",
    placeId: "place-1",
    attribute: "step_free",
    evidenceObservationId: `obs-${partial.id}`,
    ...partial,
  };
}

describe("deterministic compatibility engine", () => {
  it("required match → compatible with decisionOwner PARTICIPANT", () => {
    const result = evaluateCompatibility({
      passportId: "passport-1",
      entityType: "place",
      entityId: "place-1",
      requirements: [
        req({
          id: "r1",
          ontologyConceptId: "mobility_movement.step_free",
          criticality: "required",
        }),
      ],
      capabilities: [
        cap({
          id: "c1",
          ontologyConceptId: "mobility_movement.step_free",
          value: true,
          status: "verified",
        }),
      ],
    });
    expect(result.state).toBe("compatible");
    expect(result.decisionOwner).toBe("PARTICIPANT");
    expect(result.participantDecisionRequired).toBe(true);
    expect(result.requiredMetConceptIds).toContain("mobility_movement.step_free");
    const api = toCompatibilityApiResponse(result);
    expect(api.decisionOwner).toBe("PARTICIPANT");
  });

  it("required mismatch → incompatible", () => {
    const result = evaluateCompatibility({
      passportId: "passport-1",
      entityType: "place",
      entityId: "place-1",
      requirements: [
        req({
          id: "r1",
          ontologyConceptId: "mobility_movement.step_free",
          criticality: "required",
          value: true,
        }),
      ],
      capabilities: [
        cap({
          id: "c1",
          ontologyConceptId: "mobility_movement.step_free",
          value: false,
          status: "verified",
        }),
      ],
    });
    expect(result.state).toBe("incompatible");
    expect(result.requiredUnmetConceptIds).toContain(
      "mobility_movement.step_free",
    );
  });

  it("required unknown when capability missing → uncertain", () => {
    const result = evaluateCompatibility({
      passportId: "passport-1",
      entityType: "place",
      entityId: "place-1",
      requirements: [
        req({
          id: "r1",
          ontologyConceptId: "hearing.hearing_augmentation",
          domain: "hearing",
          attribute: "hearing_augmentation",
          criticality: "required",
        }),
      ],
      capabilities: [],
    });
    expect(result.state).toBe("uncertain");
    expect(result.requiredUncertainConceptIds).toContain(
      "hearing.hearing_augmentation",
    );
  });

  it("stale / disputed evidence → UNKNOWN not mismatch", () => {
    for (const status of ["outdated", "disputed", "unknown"] as const) {
      const result = evaluateCompatibility({
        passportId: "passport-1",
        entityType: "place",
        entityId: "place-1",
        requirements: [
          req({
            id: "r1",
            ontologyConceptId: "mobility_movement.step_free",
            criticality: "required",
          }),
        ],
        capabilities: [
          cap({
            id: "c1",
            ontologyConceptId: "mobility_movement.step_free",
            value: false,
            status,
          }),
        ],
      });
      expect(result.state).toBe("uncertain");
      expect(result.needResults[0]?.result).toBe("UNKNOWN");
    }
  });

  it("adjustment available for required mismatch → compatible_with_adjustment", () => {
    const adjustments: AccessAdjustment[] = [
      {
        id: "adj-1",
        entityType: "place",
        entityId: "place-1",
        ontologyConceptId: "mobility_movement.step_free",
        summary: "Staff-assisted entrance",
        status: "venue_reported",
      },
    ];
    const result = evaluateCompatibility({
      passportId: "passport-1",
      entityType: "place",
      entityId: "place-1",
      requirements: [
        req({
          id: "r1",
          ontologyConceptId: "mobility_movement.step_free",
          criticality: "required",
          value: true,
        }),
      ],
      capabilities: [
        cap({
          id: "c1",
          ontologyConceptId: "mobility_movement.step_free",
          value: false,
          status: "verified",
        }),
      ],
      adjustments,
    });
    expect(result.state).toBe("compatible_with_adjustment");
    expect(result.adjustmentIds).toContain("adj-1");
  });

  it("preference mismatch does not force incompatible", () => {
    const result = evaluateCompatibility({
      passportId: "passport-1",
      entityType: "place",
      entityId: "place-1",
      requirements: [
        req({
          id: "r1",
          ontologyConceptId: "mobility_movement.step_free",
          criticality: "required",
        }),
        req({
          id: "r2",
          ontologyConceptId: "sensory_regulation.quiet_space",
          domain: "sensory_regulation",
          attribute: "quiet_space",
          criticality: "preference",
        }),
      ],
      capabilities: [
        cap({
          id: "c1",
          ontologyConceptId: "mobility_movement.step_free",
          value: true,
          status: "verified",
        }),
        cap({
          id: "c2",
          ontologyConceptId: "sensory_regulation.quiet_space",
          value: false,
          status: "observed",
          attribute: "quiet_space",
        }),
      ],
    });
    expect(result.state).toBe("compatible");
    expect(result.preferenceUnmetConceptIds).toContain(
      "sensory_regulation.quiet_space",
    );
  });

  it("numeric gte clear width match", () => {
    const result = evaluateCompatibility({
      passportId: "passport-1",
      entityType: "place",
      entityId: "place-1",
      requirements: [
        req({
          id: "r1",
          ontologyConceptId: "mobility_movement.minimum_clear_width_mm",
          attribute: "minimum_clear_width_mm",
          criticality: "required",
          comparator: "gte",
          value: 850,
          unit: "mm",
        }),
      ],
      capabilities: [
        cap({
          id: "c1",
          ontologyConceptId: "mobility_movement.minimum_clear_width_mm",
          attribute: "minimum_clear_width_mm",
          value: 870,
          status: "verified",
          unit: "mm",
        }),
      ],
    });
    expect(result.state).toBe("compatible");
  });

  it("revoked disclosure concept treated as UNKNOWN", () => {
    const result = evaluateCompatibility({
      passportId: "passport-1",
      entityType: "place",
      entityId: "place-1",
      requirements: [
        req({
          id: "r1",
          ontologyConceptId: "mobility_movement.step_free",
          criticality: "required",
        }),
      ],
      capabilities: [
        cap({
          id: "c1",
          ontologyConceptId: "mobility_movement.step_free",
          value: true,
          status: "verified",
        }),
      ],
      revokedDisclosureConceptIds: ["mobility_movement.step_free"],
    });
    expect(result.state).toBe("uncertain");
    expect(result.needResults[0]?.result).toBe("UNKNOWN");
  });

  it("cross-context activity_specific skipped when no activity", () => {
    const result = evaluateCompatibility({
      passportId: "passport-1",
      entityType: "place",
      entityId: "place-1",
      activity: null,
      requirements: [
        req({
          id: "r1",
          ontologyConceptId: "mobility_movement.step_free",
          criticality: "required",
          contextScope: "activity_specific",
        }),
      ],
      capabilities: [],
    });
    expect(result.state).toBe("compatible");
    expect(result.needResults).toHaveLength(0);
  });
});
