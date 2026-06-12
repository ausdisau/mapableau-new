import { describe, expect, it } from "vitest";

import {
  billingFundingTypeForModel,
  fundingModelLabel,
  fundingRouteForModel,
  resolveFundingModel,
  supportsStripeSavedPaymentMethods,
} from "@/lib/abilitypay/funding-model";

describe("fundingRouteForModel", () => {
  it("routes plan_managed to export adapter", () => {
    expect(fundingRouteForModel("plan_managed")).toEqual({
      model: "plan_managed",
      adapter: "plan_export",
      nextStep: "export",
    });
  });

  it("routes self_managed to stripe checkout", () => {
    expect(fundingRouteForModel("self_managed")).toEqual({
      model: "self_managed",
      adapter: "stripe_checkout",
      nextStep: "pay",
    });
  });

  it("routes agency_managed to ndia handoff", () => {
    expect(fundingRouteForModel("agency_managed")).toEqual({
      model: "agency_managed",
      adapter: "ndia_claim",
      nextStep: "ndia_handoff",
    });
  });
});

describe("resolveFundingModel", () => {
  it("prefers invoice-level funding model", () => {
    expect(
      resolveFundingModel({
        invoiceFundingModel: "self_managed",
        planFundingModel: "plan_managed",
      })
    ).toBe("self_managed");
  });

  it("falls back to plan funding model", () => {
    expect(
      resolveFundingModel({
        invoiceFundingModel: null,
        planFundingModel: "private_pay",
      })
    ).toBe("private_pay");
  });

  it("defaults to plan_managed", () => {
    expect(resolveFundingModel({})).toBe("plan_managed");
  });
});

describe("billingFundingTypeForModel", () => {
  it("maps self_managed to ndis_self_managed billing type", () => {
    expect(billingFundingTypeForModel("self_managed")).toBe("ndis_self_managed");
  });

  it("returns null for agency_managed", () => {
    expect(billingFundingTypeForModel("agency_managed")).toBeNull();
  });
});

describe("supportsStripeSavedPaymentMethods", () => {
  it("allows self_managed and private_pay", () => {
    expect(supportsStripeSavedPaymentMethods("self_managed")).toBe(true);
    expect(supportsStripeSavedPaymentMethods("private_pay")).toBe(true);
  });

  it("disallows plan_managed and agency_managed", () => {
    expect(supportsStripeSavedPaymentMethods("plan_managed")).toBe(false);
    expect(supportsStripeSavedPaymentMethods("agency_managed")).toBe(false);
  });
});

describe("fundingModelLabel", () => {
  it("returns human-readable labels", () => {
    expect(fundingModelLabel("plan_managed")).toBe("Plan-managed");
    expect(fundingModelLabel("private_pay")).toBe("Private pay");
  });
});
