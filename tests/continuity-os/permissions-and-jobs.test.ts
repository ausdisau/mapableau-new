import { describe, expect, it } from "vitest";

import type { CurrentUser } from "@/lib/auth/current-user";
import {
  canActivateLifeEvent,
  canSelectRecoveryOption,
  canViewLifeEvent,
  canViewOrganisationContinuity,
} from "@/lib/continuity-os/permissions";
import { shouldRunContinuityJob } from "@/lib/continuity-os/jobs/background";
import { searchRegionalRecoveryOptions } from "@/lib/continuity-os/regional/capacity";
import { ContinuityOsError } from "@/lib/continuity-os/errors";

const participant: CurrentUser = {
  id: "p1",
  email: "p@test.com",
  name: "Participant",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "participant",
  roles: ["participant"],
};

const admin: CurrentUser = {
  id: "a1",
  email: "a@test.com",
  name: "Admin",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "mapable_admin",
  roles: ["mapable_admin"],
};

describe("ContinuityOS permissions", () => {
  it("allows participant to activate and view own life event", () => {
    expect(canActivateLifeEvent(participant, "p1")).toBe(true);
    expect(canViewLifeEvent(participant, "p1")).toBe(true);
    expect(canSelectRecoveryOption(participant, "p1")).toBe(true);
  });

  it("denies admin unrestricted life-event content access", () => {
    expect(canViewLifeEvent(admin, "p1")).toBe(false);
    expect(canViewOrganisationContinuity(admin)).toBe(true);
  });
});

describe("Background jobs and regional search", () => {
  it("does not run jobs when disabled or stopped", () => {
    expect(
      shouldRunContinuityJob({
        enabled: false,
        missionStopped: false,
        mode: "shadow",
      })
    ).toBe(false);
    expect(
      shouldRunContinuityJob({
        enabled: true,
        missionStopped: true,
        mode: "shadow",
      })
    ).toBe(false);
  });

  it("regional options forbid automatic assignment", () => {
    process.env.MAPABLE_CONTINUITY_OS_ENABLED = "true";
    process.env.MAPABLE_REGIONAL_RECOVERY_ENABLED = "true";
    try {
      const options = searchRegionalRecoveryOptions({
        needs: ["transport", "care"],
      });
      expect(options.length).toBeGreaterThan(0);
      expect(
        options.every((o) => o.automaticAssignmentForbidden === true)
      ).toBe(true);
      expect(
        options.every((o) => o.status !== ("verified_available" as never))
      ).toBe(true);
    } finally {
      delete process.env.MAPABLE_CONTINUITY_OS_ENABLED;
      delete process.env.MAPABLE_REGIONAL_RECOVERY_ENABLED;
    }
  });

  it("throws when regional recovery disabled", () => {
    delete process.env.MAPABLE_CONTINUITY_OS_ENABLED;
    delete process.env.MAPABLE_REGIONAL_RECOVERY_ENABLED;
    expect(() => searchRegionalRecoveryOptions({ needs: ["transport"] })).toThrow(
      ContinuityOsError
    );
  });
});
