import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  assertPaidPlanNeutrality,
  clearAccessIntelligenceBridge,
  clearAuraBridge,
  clearRunnerNoncesForTests,
  createAccessibilityAssetVersion,
  deriveAssetCriticality,
  ensureBaselineAccessibilityRules,
  evaluateShadowRules,
  getAccessibilityOpsFeatureFlags,
  ingestSignedTestResults,
  linkAccessibilityAssetDependency,
  listAccessibilityAssets,
  probeAccessIntelligenceCompose,
  probeAuraCompose,
  registerAccessIntelligenceBridge,
  registerAccessibilityAsset,
  registerAuraBridge,
  resetMemoryStore,
  runAccessIntelligenceRegressionIfAvailable,
  seedAccessibilityOpsPilot,
  buildSignedTestResult,
  verifySignedTestResult,
} from "@/lib/accessibility-ops";

beforeEach(() => {
  process.env.MAPABLE_ACCESSIBILITY_OPS_ENABLED = "true";
  process.env.MAPABLE_ACCESSIBILITY_ASSET_REGISTRY_ENABLED = "true";
  process.env.MAPABLE_ACCESSIBILITY_RULE_REGISTRY_ENABLED = "true";
  process.env.MAPABLE_ACCESSIBILITY_TEST_LAB_ENABLED = "true";
  process.env.MAPABLE_ACCESSIBILITY_OPS_MODE = "shadow";
  process.env.MAPABLE_ACCESSIBILITY_OPS_USE_MEMORY = "true";
  process.env.MAPABLE_ACCESSIBILITY_OPS_RUNNER_SECRET = "test-runner-secret";
  resetMemoryStore();
  clearAccessIntelligenceBridge();
  clearAuraBridge();
  clearRunnerNoncesForTests();
});

afterEach(() => {
  resetMemoryStore();
  clearAccessIntelligenceBridge();
  clearAuraBridge();
  clearRunnerNoncesForTests();
});

describe("feature flags", () => {
  it("exposes typed flag map", () => {
    const flags = getAccessibilityOpsFeatureFlags();
    expect(flags.opsEnabled).toBe(true);
    expect(flags.gateWebReleases).toBe(false);
  });
});

describe("asset registry", () => {
  it("registers assets with versions, ownership and dependencies", async () => {
    const button = await registerAccessibilityAsset({
      stableKey: "test.ds.button",
      assetClass: "digital",
      assetType: "design_system_component",
      title: "Button",
      criticality: "important",
      ownerUserId: "user-1",
      organisationId: "org-1",
    });
    expect(button.owners[0]?.userId).toBe("user-1");

    const version = await createAccessibilityAssetVersion(button.id, {
      versionLabel: "1.0.0",
    });
    expect(version.contentHash).toBeTruthy();

    const page = await registerAccessibilityAsset({
      stableKey: "test.route.statement",
      assetClass: "digital",
      assetType: "route",
      title: "Accessibility statement",
      criticality: "important",
      organisationId: "org-1",
      purposeTags: ["login"],
    });
    // purpose tag elevates to essential when using derive path — explicit criticality wins
    expect(page.criticality).toBe("important");

    await linkAccessibilityAssetDependency(page.id, button.id, "uses_component");
    const listed = await listAccessibilityAssets("org-1");
    expect(listed.length).toBe(2);
    expect(listed.find((a) => a.id === page.id)?.dependencies[0]?.dependsOnAssetId).toBe(
      button.id
    );
  });

  it("denies duplicate stable keys in the same org", async () => {
    await registerAccessibilityAsset({
      stableKey: "dup.key",
      assetClass: "digital",
      assetType: "page",
      title: "A",
      criticality: "informational",
      organisationId: "org-a",
    });
    await expect(
      registerAccessibilityAsset({
        stableKey: "dup.key",
        assetClass: "digital",
        assetType: "page",
        title: "B",
        criticality: "informational",
        organisationId: "org-a",
      })
    ).rejects.toThrow("ASSET_STABLE_KEY_CONFLICT");
  });

  it("derives safety-critical from purpose tags", () => {
    expect(
      deriveAssetCriticality({
        assetType: "component",
        purposeTags: ["stop_aura"],
      })
    ).toBe("safety_critical");
  });
});

describe("rule registry and shadow evaluation", () => {
  it("seeds baseline rules and returns cannot_tell without runner evidence", async () => {
    await ensureBaselineAccessibilityRules();
    const asset = await registerAccessibilityAsset({
      stableKey: "test.component.focus",
      assetClass: "digital",
      assetType: "component",
      title: "Dialog",
      criticality: "safety_critical",
      purposeTags: ["refusal_path"],
    });
    await createAccessibilityAssetVersion(asset.id, { versionLabel: "1" });

    const evaluation = evaluateShadowRules({ assetId: asset.id });
    expect(evaluation.blocking).toBe(false);
    expect(evaluation.results.length).toBeGreaterThan(0);
    const focus = evaluation.results.find(
      (r) => r.ruleStableKey === "mapable.ds.visible_focus"
    );
    expect(focus?.outcome).toBe("manual_review_required");
    expect(focus?.reasonCodes).toContain("SHADOW_MODE");
  });

  it("ignores commercial plan for outcomes and severity", async () => {
    await ensureBaselineAccessibilityRules();
    const asset = await registerAccessibilityAsset({
      stableKey: "test.component.plan",
      assetClass: "digital",
      assetType: "component",
      title: "Dialog",
      criticality: "essential",
    });
    const withoutPlan = evaluateShadowRules({ assetId: asset.id });
    const withPlan = evaluateShadowRules({
      assetId: asset.id,
      commercialPlan: "enterprise_platinum",
    });
    expect(() => assertPaidPlanNeutrality(withPlan, withoutPlan)).not.toThrow();
  });
});

describe("compose adapters", () => {
  it("reports AI and AURA unavailable on main until bridges register", async () => {
    expect(probeAccessIntelligenceCompose().status).toBe("unavailable_on_main");
    expect(probeAuraCompose().status).toBe("unavailable_on_main");

    registerAccessIntelligenceBridge({
      regressionRunner: true,
      runRegression: async () => ({ runId: "reg-1" }),
    });
    const run = await runAccessIntelligenceRegressionIfAvailable({
      syntheticProfileIds: ["power-chair"],
      placeIds: ["harbour"],
      correlationId: "c1",
    });
    expect(run.invoked).toBe(true);
    expect(run.runId).toBe("reg-1");

    registerAuraBridge({
      careOsMissionAvailable: true,
      executionGuardActive: true,
      stopProtocolAvailable: true,
    });
    expect(probeAuraCompose().status).toBe("execution_guard_active");
  });
});

describe("signed runners", () => {
  it("verifies signatures and rejects replay", () => {
    const signed = buildSignedTestResult({
      runnerId: "test-runner",
      runnerVersion: "0.1.0",
      ruleStableKey: "mapable.doc.pdf_structure",
      ruleVersionId: "rv1",
      assetVersionId: "av1",
      environment: "test",
      testedAt: new Date().toISOString(),
      outcome: "failed",
      reasonCodes: ["MISSING_HEADINGS"],
    });
    expect(verifySignedTestResult(signed).ok).toBe(true);

    const tampered = { ...signed, outcome: "passed" };
    expect(verifySignedTestResult(tampered).ok).toBe(false);
  });

  it("ingests signed results into shadow evaluation without blocking", async () => {
    await ensureBaselineAccessibilityRules();
    const asset = await registerAccessibilityAsset({
      stableKey: "test.doc.pack",
      assetClass: "digital",
      assetType: "generated_document",
      title: "Visit pack",
      criticality: "essential",
    });
    const version = await createAccessibilityAssetVersion(asset.id, {
      versionLabel: "1",
    });
    const signed = buildSignedTestResult({
      runnerId: "test-runner",
      runnerVersion: "0.1.0",
      ruleStableKey: "mapable.doc.pdf_structure",
      ruleVersionId: "rv1",
      assetVersionId: version.id,
      environment: "test",
      testedAt: new Date().toISOString(),
      outcome: "failed",
      reasonCodes: ["MISSING_HEADINGS"],
    });
    const ingested = ingestSignedTestResults({
      assetId: asset.id,
      assetVersionId: version.id,
      results: [signed],
    });
    expect(ingested.blocking).toBe(false);
    expect(ingested.acceptedCount).toBe(1);
    const pdf = ingested.evaluation.results.find(
      (r) => r.ruleStableKey === "mapable.doc.pdf_structure"
    );
    expect(pdf?.outcome).toBe("failed");
  });
});

describe("pilot seed", () => {
  it("seeds Harbour / Visit Pack / transport / widget assets", async () => {
    const seeded = await seedAccessibilityOpsPilot({
      ownerUserId: "pilot-owner",
      organisationId: null,
    });
    expect(Object.keys(seeded.assets).length).toBeGreaterThanOrEqual(6);
    expect(seeded.blocking).toBe(false);
    expect(seeded.assets.harbour.canonicalDomainRef).toContain("access_place:");
    expect(seeded.evaluations.length).toBeGreaterThan(0);
  });
});
