import { describe, expect, it } from "vitest";

import {
  PLAN_MANAGER_EXPORT_QUOTA_FREE,
  PLAN_MANAGER_EXPORT_QUOTA_PRO,
  featuresForPlan,
} from "@/lib/billing-core/entitlements";
import {
  REVENUE_BUNDLES,
  bundlesForPlan,
  getBundleById,
} from "@/lib/billing-core/bundles";

describe("revenue bundle catalog", () => {
  it("defines all pilot bundles", () => {
    expect(REVENUE_BUNDLES.length).toBe(5);
    expect(getBundleById("plan_manager_office")?.subscriptionPlans).toContain(
      "plan_manager_pro"
    );
  });

  it("maps provider_pro to Provider Ops bundle", () => {
    const bundles = bundlesForPlan("provider_pro");
    expect(bundles.some((b) => b.id === "provider_ops")).toBe(true);
  });
});

describe("entitlements feature map", () => {
  it("grants plan manager features on plan_manager_pro", () => {
    const features = featuresForPlan("plan_manager_pro");
    expect(features).toContain("plan_manager_exports");
    expect(features).toContain("abilitypay_ai_assist");
  });

  it("exports higher quota for pro than free tier", () => {
    expect(PLAN_MANAGER_EXPORT_QUOTA_PRO).toBeGreaterThan(
      PLAN_MANAGER_EXPORT_QUOTA_FREE
    );
  });
});
