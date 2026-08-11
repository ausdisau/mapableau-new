import { describe, expect, it } from "vitest";

import { evaluateCompatibility } from "@/lib/access/infrastructure/engine";
import type { AccessRequirement } from "@/lib/access/infrastructure/types";

/**
 * Privacy / anti-discrimination unit checks for the compatibility engine.
 * API-level authorisation is covered when flags are enabled in integration tests.
 */
describe("access infrastructure privacy boundaries", () => {
  it("does not accept or emit diagnosis as a matching dimension", () => {
    const requirements: AccessRequirement[] = [
      {
        id: "r1",
        passportId: "pp",
        ontologyConceptId: "transport.accessible_vehicle",
        domain: "transport",
        attribute: "accessible_vehicle",
        value: true,
        criticality: "required",
        contextScope: "always",
        timing: "permanent",
        assistance: "independent",
        disclosureScopes: ["transport_provider"],
        userConfirmed: true,
        // notes must never be treated as diagnosis matching keys
        notes: "optional participant note",
      },
    ];
    const result = evaluateCompatibility({
      passportId: "pp",
      entityType: "vehicle",
      entityId: "v1",
      requirements,
      capabilities: [
        {
          id: "c1",
          entityType: "vehicle",
          entityId: "v1",
          ontologyConceptId: "transport.accessible_vehicle",
          attribute: "accessible_vehicle",
          value: true,
          evidenceObservationId: "o1",
          status: "verified",
        },
      ],
      adjustments: [],
    });
    const blob = JSON.stringify(result);
    expect(blob.toLowerCase()).not.toMatch(/cerebral palsy|autism|diagnosis|ndis budget|medication/);
    expect(result.findings.every((f) => f.ontologyConceptId.startsWith("transport."))).toBe(true);
  });

  it("does not reduce desirability by counting support needs", () => {
    const manyReqs: AccessRequirement[] = Array.from({ length: 8 }).map((_, i) => ({
      id: `r${i}`,
      passportId: "pp",
      ontologyConceptId: "transport.accessible_vehicle",
      domain: "transport" as const,
      attribute: "accessible_vehicle",
      value: true,
      criticality: "preference" as const,
      contextScope: "always" as const,
      timing: "permanent" as const,
      assistance: "independent" as const,
      disclosureScopes: [],
      userConfirmed: true,
    }));
    manyReqs.push({
      id: "required-1",
      passportId: "pp",
      ontologyConceptId: "transport.boarding_assistance",
      domain: "transport",
      attribute: "boarding_assistance",
      value: true,
      criticality: "required",
      contextScope: "always",
      timing: "permanent",
      assistance: "required",
      disclosureScopes: ["driver"],
      userConfirmed: true,
    });

    const result = evaluateCompatibility({
      passportId: "pp",
      entityType: "vehicle",
      entityId: "v1",
      requirements: manyReqs,
      capabilities: [
        {
          id: "c1",
          entityType: "vehicle",
          entityId: "v1",
          ontologyConceptId: "transport.boarding_assistance",
          attribute: "boarding_assistance",
          value: true,
          evidenceObservationId: "o1",
          status: "verified",
        },
      ],
      adjustments: [],
    });

    expect(result.state).toBe("compatible");
    expect(result).not.toHaveProperty("vulnerabilityScore");
    expect(result).not.toHaveProperty("employabilityScore");
    expect(result).not.toHaveProperty("burdenScore");
  });
});
