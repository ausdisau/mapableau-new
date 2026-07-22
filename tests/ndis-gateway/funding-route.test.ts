import { describe, expect, it } from "vitest";

import { billingFundingTypeToFundingRoute } from "@/lib/ndis-gateway/compatibility/from-billing-funding";
import { fundingSourceTypeToFundingRoute } from "@/lib/ndis-gateway/compatibility/from-funding-source";
import { fundingRouteToFundingSourceType } from "@/lib/ndis-gateway/compatibility/to-funding-source-type";
import { fundingRouteToPaymentRoute } from "@/lib/ndis-gateway/compatibility/to-payment-route";
import type { FundingRoute } from "@/lib/ndis-gateway/domain/funding-route";

describe("fundingSourceTypeToFundingRoute", () => {
  it.each([
    ["ndis_self_managed", "self_managed"],
    ["ndis_plan_managed", "plan_managed"],
    ["ndis_agency_managed", "ndia_managed"],
    ["private_pay", "private_pay"],
    ["aged_care", "unknown"],
    ["employer", "unknown"],
    ["other", "unknown"],
  ] as const)("maps %s → %s", (input, expected) => {
    expect(fundingSourceTypeToFundingRoute(input)).toBe(expected);
  });

  it("maps null and undefined to unknown", () => {
    expect(fundingSourceTypeToFundingRoute(null)).toBe("unknown");
    expect(fundingSourceTypeToFundingRoute(undefined)).toBe("unknown");
  });
});

describe("billingFundingTypeToFundingRoute", () => {
  it.each([
    ["ndis_self_managed", "self_managed"],
    ["ndis_plan_managed", "plan_managed"],
    ["private_card", "private_pay"],
    ["organisation_invoice", "unknown"],
    ["grant", "unknown"],
    ["other", "unknown"],
  ] as const)("maps %s → %s", (input, expected) => {
    expect(billingFundingTypeToFundingRoute(input)).toBe(expected);
  });

  it("never maps private_card to ndia_managed", () => {
    const route = billingFundingTypeToFundingRoute("private_card");
    expect(route).toBe("private_pay");
    expect(route).not.toBe("ndia_managed");
    expect(fundingRouteToFundingSourceType(route)).toBe("private_pay");
    expect(fundingRouteToFundingSourceType(route)).not.toBe(
      "ndis_agency_managed"
    );
  });

  it("never defaults unknown billing types to ndia_managed", () => {
    for (const type of ["grant", "organisation_invoice", "other"] as const) {
      expect(billingFundingTypeToFundingRoute(type)).toBe("unknown");
      expect(billingFundingTypeToFundingRoute(type)).not.toBe("ndia_managed");
    }
  });
});

describe("fundingRouteToPaymentRoute", () => {
  it.each([
    ["self_managed", "self_managed"],
    ["plan_managed", "plan_managed"],
    ["ndia_managed", "ndia_managed"],
    ["private_pay", null],
    ["unknown", null],
  ] as const)("maps %s → %s", (route, expected) => {
    expect(fundingRouteToPaymentRoute(route as FundingRoute)).toBe(expected);
  });
});
