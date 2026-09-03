import { describe, expect, it } from "vitest";

import { projectPassportCompatibility } from "@/lib/passport";
import type {
  AccessCapability,
  AccessRequirement,
} from "@/lib/access/infrastructure/types";

function requirement(
  id: string,
  criticality: AccessRequirement["criticality"] = "required",
): AccessRequirement {
  return {
    id: `req-${id}`,
    passportId: "passport-1",
    ontologyConceptId: id,
    domain: "mobility_movement",
    attribute: "step_free",
    criticality,
    contextScope: "always",
    timing: "permanent",
    assistance: "independent",
    disclosureScopes: ["service_provider"],
    userConfirmed: true,
  };
}

function capability(
  id: string,
  value: boolean | number | string,
  status: AccessCapability["status"] = "verified",
): AccessCapability {
  return {
    id: `cap-${id}`,
    entityType: "place",
    entityId: "venue-1",
    ontologyConceptId: id,
    attribute: "step_free",
    value,
    evidenceObservationId: "obs-1",
    status,
  };
}

describe("passport compatibility projection", () => {
  it("reports met requirements when capabilities satisfy them", () => {
    const projection = projectPassportCompatibility({
      requirements: [requirement("step-free-entry")],
      capabilities: [capability("step-free-entry", true)],
    });

    expect(projection.state).toBe("compatible");
    expect(projection.requiredMet).toContain("step-free-entry");
    expect(projection.requiredUnmet).toHaveLength(0);
    expect(projection.participantDecisionRequired).toBe(false);
  });

  it("surfaces explicit gaps for unmet required features", () => {
    const projection = projectPassportCompatibility({
      requirements: [requirement("step-free-entry"), requirement("lift", "preference")],
      capabilities: [capability("step-free-entry", false)],
    });

    expect(projection.state).toBe("incompatible");
    expect(projection.requiredUnmet).toContain("step-free-entry");
    expect(projection.gaps.some((g) => g.outcome === "unmet")).toBe(true);
    expect(projection.participantDecisionRequired).toBe(true);
  });

  it("treats missing evidence as uncertain, not accessible", () => {
    const projection = projectPassportCompatibility({
      requirements: [requirement("accessible-toilet")],
      capabilities: [],
    });

    expect(projection.state).toBe("uncertain");
    expect(projection.requiredUncertain).toContain("accessible-toilet");
    expect(projection.limitations[0]).toMatch(/unknown evidence/i);
    expect(projection.participantDecisionRequired).toBe(true);
  });
});
