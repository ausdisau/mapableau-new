import { describe, expect, it } from "vitest";

import {
  accessibilityProfileToRequirements,
  countSelectedRequirements,
} from "@/lib/access/experience/requirement-profile";
import { buildAccessToGoHandoff } from "@/lib/access/experience/access-route-handoff";

describe("Access mobility preference integrity", () => {
  it("keeps assistance animal independent when another mobility aid is primary", () => {
    const profile = accessibilityProfileToRequirements({
      mobilityNeeds: ["manual_wheelchair", "assistance_animal"],
    });

    expect(profile.mobilityAidPreference).toBe("manual_wheelchair");
    expect(profile.wheelchairUser).toBe(true);
    expect(profile.assistanceAnimal).toBe(true);
  });

  it("counts scooter as an effective selected mobility requirement", () => {
    const profile = accessibilityProfileToRequirements({
      mobilityNeeds: ["mobility_scooter"],
    });

    expect(profile.mobilityAidPreference).toBe("mobility_scooter");
    expect(profile.stepFreeRequired).toBe(false);
    expect(countSelectedRequirements(profile)).toBeGreaterThan(0);
  });

  it("passes scooter step-free constraints into MapAble Go handoff", () => {
    const profile = accessibilityProfileToRequirements({
      mobilityNeeds: ["mobility_scooter"],
    });

    const query = buildAccessToGoHandoff({
      destinationPlaceId: "place-1",
      requirements: profile,
    });

    expect(query.stepFreeRequired).toBe("1");
  });
});
