import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { evaluateRuntimeGate } from "@/lib/entitlements/runtime-gate";
import * as entitlementService from "@/lib/entitlements/entitlement-service";
import { isKnownFeatureKey } from "@/lib/entitlements/feature-policy";

describe("runtime feature gate (Wave 8)", () => {
  const ORIG_ENV = process.env;
  beforeEach(() => {
    process.env = { ...ORIG_ENV };
  });
  afterEach(() => {
    process.env = ORIG_ENV;
    vi.restoreAllMocks();
  });

  it("rejects unknown feature keys", async () => {
    const result = await evaluateRuntimeGate({
      featureKey: "not.a.thing",
      organisationId: "org_1",
      environment: "sandbox",
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("unknown_feature_key");
  });

  it("rejects when env flag is disabled", async () => {
    process.env.NDIS_WAVE8_TEST_FEATURE = "false";
    const result = await evaluateRuntimeGate({
      featureKey: "ndis.claim.submit",
      organisationId: "org_1",
      environment: "sandbox",
      envFlag: "NDIS_WAVE8_TEST_FEATURE",
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("env_flag_disabled");
  });

  it("rejects when no active entitlement exists (env flag alone is not enough)", async () => {
    process.env.NDIS_WAVE8_TEST_FEATURE = "true";
    vi.spyOn(entitlementService, "getActiveEntitlement").mockResolvedValue(null);
    const result = await evaluateRuntimeGate({
      featureKey: "ndis.claim.submit",
      organisationId: "org_1",
      environment: "sandbox",
      envFlag: "NDIS_WAVE8_TEST_FEATURE",
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("no_active_entitlement");
  });

  it("production requires GA approval even with entitlement and env flag", async () => {
    process.env.NDIS_WAVE8_TEST_FEATURE = "true";
    vi.spyOn(entitlementService, "getActiveEntitlement").mockResolvedValue({
      id: "e1",
      organisationId: "org_1",
      featureKey: "ndis.claim.submit",
      environment: "production",
      status: "active",
      grantedById: null,
      grantedAt: new Date(),
      expiresAt: null,
      configJson: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    const result = await evaluateRuntimeGate({
      featureKey: "ndis.claim.submit",
      organisationId: "org_1",
      environment: "production",
      envFlag: "NDIS_WAVE8_TEST_FEATURE",
      gaApproved: false,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("production_requires_ga_approval");
  });

  it("allows only when ALL conditions hold", async () => {
    process.env.NDIS_WAVE8_TEST_FEATURE = "true";
    vi.spyOn(entitlementService, "getActiveEntitlement").mockResolvedValue({
      id: "e1",
      organisationId: "org_1",
      featureKey: "ndis.claim.submit",
      environment: "production",
      status: "active",
      grantedById: null,
      grantedAt: new Date(),
      expiresAt: null,
      configJson: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    const result = await evaluateRuntimeGate({
      featureKey: "ndis.claim.submit",
      organisationId: "org_1",
      environment: "production",
      envFlag: "NDIS_WAVE8_TEST_FEATURE",
      gaApproved: true,
    });
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe("ok");
  });

  it("known feature key list is closed", () => {
    expect(isKnownFeatureKey("ndis.claim.submit")).toBe(true);
    expect(isKnownFeatureKey("random.thing")).toBe(false);
  });
});
