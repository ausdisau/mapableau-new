import { describe, expect, it } from "vitest";

import {
  actionRequiresStepUp,
  roleRequiresMfaEnrollment,
} from "@/lib/auth/mfa-policy";

describe("mfa-policy", () => {
  it("requires MFA enrollment for privileged roles", () => {
    expect(roleRequiresMfaEnrollment("provider_admin")).toBe(true);
    expect(roleRequiresMfaEnrollment("mapable_admin")).toBe(true);
    expect(roleRequiresMfaEnrollment("participant")).toBe(false);
  });

  it("requires step-up for support worker participant notes", () => {
    expect(
      actionRequiresStepUp("view_participant_notes", "support_worker"),
    ).toBe(true);
  });

  it("requires step-up for driver pickup details", () => {
    expect(
      actionRequiresStepUp("view_trip_pickup_details", "driver"),
    ).toBe(true);
  });

  it("requires step-up for NDIS plan documents for participants", () => {
    expect(
      actionRequiresStepUp("view_ndis_plan_documents", "participant"),
    ).toBe(true);
  });
});
