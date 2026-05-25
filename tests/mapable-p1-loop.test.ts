import { describe, expect, it } from "vitest";

import { haversineKm } from "@/lib/map/distance-service";
import { roleRequiresApproval } from "@/types/roles";
import { canGenerateInvoiceFromServiceLog } from "@/lib/service-logs/service-log-service";
import { resolveBookingEligibility } from "@/lib/providers/provider-org-profile-service";

describe("P1 thin slice helpers", () => {
  it("calculates distance between coordinates", () => {
    const d = haversineKm(-33.87, 151.21, -37.81, 144.96);
    expect(d).toBeGreaterThan(0);
  });

  it("provider admin requires approval at onboarding", () => {
    expect(roleRequiresApproval("provider_admin")).toBe(true);
  });

  it("allows invoice from approved service log", () => {
    expect(canGenerateInvoiceFromServiceLog("approved")).toBe(true);
    expect(canGenerateInvoiceFromServiceLog("draft")).toBe(false);
  });

  it("does not mark eligible until verified", () => {
    expect(resolveBookingEligibility("not_started", "eligible")).toBe(
      "submitted"
    );
    expect(resolveBookingEligibility("verified", "eligible")).toBe("eligible");
  });
});
