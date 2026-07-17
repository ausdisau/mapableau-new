import { describe, expect, it } from "vitest";

import {
  AccountabilityWorkflowError,
  assertSeparationOfDuties,
} from "@/lib/accountability/publication-workflow";
import { hasPermission } from "@/lib/auth/permissions";

describe("accountability separation of duties", () => {
  it("blocks preparer from approve and publish stages", () => {
    expect(() =>
      assertSeparationOfDuties("user-a", "user-a", "approve")
    ).toThrow(AccountabilityWorkflowError);
    expect(() =>
      assertSeparationOfDuties("user-a", "user-a", "publish")
    ).toThrow(AccountabilityWorkflowError);
  });

  it("allows a different actor to approve or publish", () => {
    expect(() =>
      assertSeparationOfDuties("user-a", "user-b", "approve")
    ).not.toThrow();
    expect(() =>
      assertSeparationOfDuties("user-a", "user-b", "publish")
    ).not.toThrow();
  });
});

describe("accountability permissions", () => {
  it("grants granular accountability permissions to mapable_admin", () => {
    expect(hasPermission("mapable_admin", "accountability:prepare_snapshot")).toBe(
      true
    );
    expect(
      hasPermission("mapable_admin", "accountability:approve_publication")
    ).toBe(true);
    expect(hasPermission("mapable_admin", "accountability:publish")).toBe(true);
  });

  it("allows participants to read public and submit challenges", () => {
    expect(hasPermission("participant", "accountability:read_public")).toBe(true);
    expect(hasPermission("participant", "accountability:submit_challenge")).toBe(
      true
    );
    expect(
      hasPermission("participant", "accountability:approve_publication")
    ).toBe(false);
  });
});
