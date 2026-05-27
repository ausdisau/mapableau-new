import { describe, expect, it } from "vitest";

import {
  mobilityFromAccessibilityProfile,
  mobilityRequirementLabels,
  parseMobilityRequirements,
} from "@/lib/transport/mobility-schema";

describe("mobility-schema", () => {
  it("maps accessibility profile transport fields", () => {
    const mobility = mobilityFromAccessibilityProfile({
      transportRequirements: {
        requiresWheelchairAccessibleVehicle: true,
        requiresHoist: true,
        assistanceAnimalPresent: true,
      },
      mobilityNeeds: [],
    });
    expect(mobility.requiresWheelchairAccessible).toBe(true);
    expect(mobility.requiresHoist).toBe(true);
    expect(mobility.assistanceAnimalPresent).toBe(true);
  });

  it("infers assistance animal from mobility needs", () => {
    const mobility = mobilityFromAccessibilityProfile({
      transportRequirements: {},
      mobilityNeeds: ["assistance_animal"],
    });
    expect(mobility.assistanceAnimalPresent).toBe(true);
  });

  it("produces human-readable labels", () => {
    const labels = mobilityRequirementLabels(
      parseMobilityRequirements({
        requiresHoist: true,
        passengerCount: 2,
      })
    );
    expect(labels).toContain("Hoist required");
    expect(labels.some((l) => l.includes("2 passengers"))).toBe(true);
  });
});
