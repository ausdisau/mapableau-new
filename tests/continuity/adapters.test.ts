import { describe, expect, it } from "vitest";

import { isClinicalAppointment } from "@/lib/continuity/adapters/appointments-adapter";
import { providerSubstitutionRequiresCoordinatorApproval } from "@/lib/continuity/provider-failure/provider-failure-service";

describe("adapters and provider-failure", () => {
  it("appointment adapter recognises clinical labels", () => {
    expect(isClinicalAppointment("GP visit")).toBe(true);
    expect(isClinicalAppointment("Physio")).toBe(true);
    expect(isClinicalAppointment("Occupational therapy")).toBe(true);
    expect(isClinicalAppointment("Speech pathology")).toBe(true);
    expect(isClinicalAppointment("Community day trip")).toBe(false);
    expect(isClinicalAppointment(null)).toBe(false);
  });

  it("provider substitution always needs coordinator approval", () => {
    expect(providerSubstitutionRequiresCoordinatorApproval()).toBe(true);
  });
});
