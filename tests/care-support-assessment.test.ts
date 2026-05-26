import { describe, expect, it } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";
import {
  assertParticipantSelf,
  canManageCareSupportSelf,
  canUseCoordinatorPortal,
  CareSupportAccessError,
} from "@/lib/care-support/access-control";
import { buildPlanSummaryFromSections } from "@/lib/care-support/plan-summary";
import { providerFinderUrlFromDestination } from "@/lib/care-support/referral-service";

describe("Care support permissions", () => {
  it("allows participant care self for assessments", () => {
    expect(canManageCareSupportSelf({ id: "p1", primaryRole: "participant", roles: ["participant"] } as never)).toBe(
      true
    );
  });

  it("allows coordinator portal", () => {
    expect(canUseCoordinatorPortal({ id: "c1", primaryRole: "support_coordinator", roles: ["support_coordinator"] } as never)).toBe(
      true
    );
    expect(hasPermission("support_coordinator", "coordinator:portal")).toBe(true);
  });

  it("denies participant self mismatch", () => {
    expect(() =>
      assertParticipantSelf({ id: "p1", primaryRole: "participant", roles: ["participant"] } as never, "other")
    ).toThrow(CareSupportAccessError);
  });
});

describe("plan summary rollup", () => {
  it("builds non-sensitive preview", () => {
    const summary = buildPlanSummaryFromSections({
      goals: ["Independence", "Community"],
      dailyLiving: { notes: "x" },
      accessNeedsSummary: "Wheelchair access",
    });
    expect(summary.goalCount).toBe(2);
    expect(summary.hasDailyLiving).toBe(true);
    expect(summary.accessNeedsSummary).toContain("Wheelchair");
  });
});

describe("referral provider finder URL", () => {
  it("builds query string from destination", () => {
    const url = providerFinderUrlFromDestination({ q: "OT", suburb: "Sydney" });
    expect(url).toContain("/provider-finder?");
    expect(url).toContain("q=OT");
  });
});
