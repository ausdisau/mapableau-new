import { describe, expect, it } from "vitest";

import {
  allowsRegisteredProviderDirectClaim,
  resolveClaimPath,
  type FundingRoute,
} from "@/lib/ndis-gateway/domain/funding-route";
import type { ProviderRegistrationContext } from "@/lib/ndis-gateway/domain/provider";

const registered: ProviderRegistrationContext = {
  claimed: true,
  registrationNumber: "4050000001",
  active: true,
};

const unregistered: ProviderRegistrationContext = {
  claimed: false,
  registrationNumber: null,
  active: false,
};

describe("resolveClaimPath", () => {
  it("allows NDIA-managed + registered provider multiple paths", () => {
    const decision = resolveClaimPath("ndia_managed", registered);
    expect(decision.blocked).toBe(false);
    expect(decision.allowedKinds).toEqual(
      expect.arrayContaining([
        "ndia_direct",
        "approved_aggregator",
        "portal_export",
        "manual_claim",
      ])
    );
    expect(decision.allowedKinds).not.toContain("plan_manager_invoice");
    expect(decision.allowedKinds).not.toContain("self_managed_invoice");
    expect(decision.allowedKinds).not.toContain("ordinary_billing");
  });

  it("blocks NDIA-managed when provider is not registered", () => {
    const decision = resolveClaimPath("ndia_managed", unregistered);
    expect(decision.blocked).toBe(true);
    expect(decision.blockCode).toBe("PROVIDER_NOT_REGISTERED");
    expect(decision.allowedKinds).toEqual([]);
  });

  it("routes plan-managed to plan manager invoice only", () => {
    const decision = resolveClaimPath("plan_managed", registered);
    expect(decision.blocked).toBe(false);
    expect(decision.primaryKind).toBe("plan_manager_invoice");
    expect(decision.allowedKinds).toEqual(["plan_manager_invoice"]);
  });

  it("routes self-managed to participant invoice only", () => {
    const decision = resolveClaimPath("self_managed", registered);
    expect(decision.blocked).toBe(false);
    expect(decision.primaryKind).toBe("self_managed_invoice");
    expect(decision.allowedKinds).toEqual(["self_managed_invoice"]);
  });

  it("routes private_pay to ordinary billing only", () => {
    const decision = resolveClaimPath("private_pay", registered);
    expect(decision.blocked).toBe(false);
    expect(decision.primaryKind).toBe("ordinary_billing");
    expect(decision.allowedKinds).toEqual(["ordinary_billing"]);
  });

  it("blocks unknown and requires human correction", () => {
    const decision = resolveClaimPath("unknown", registered);
    expect(decision.blocked).toBe(true);
    expect(decision.requiresHumanCorrection).toBe(true);
    expect(decision.blockCode).toBe("FUNDING_ROUTE_UNKNOWN");
    expect(decision.allowedKinds).toEqual([]);
  });

  it.each([
    ["self_managed", false],
    ["plan_managed", false],
    ["private_pay", false],
    ["unknown", false],
    ["ndia_managed", true],
  ] as const)(
    "allowsRegisteredProviderDirectClaim(%s) → %s",
    (route, expected) => {
      expect(allowsRegisteredProviderDirectClaim(route as FundingRoute)).toBe(
        expected
      );
    }
  );

  it("private_pay path never includes NDIA submission kinds", () => {
    const decision = resolveClaimPath("private_pay", registered);
    for (const kind of [
      "ndia_direct",
      "approved_aggregator",
      "portal_export",
      "manual_claim",
    ] as const) {
      expect(decision.allowedKinds).not.toContain(kind);
    }
  });
});
