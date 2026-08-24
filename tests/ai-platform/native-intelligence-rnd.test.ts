import { afterEach, describe, expect, it } from "vitest";

import {
  assertMustUseCanonicalGateway,
  assertNativeModelCannotExecuteAction,
  assertProvenancePresent,
  buildLabsNativeIntelligenceView,
  canAutoPromoteModel,
  createTrainingProposal,
  getModel,
  isModelAllowedForTask,
  listModels,
  resolveModelForCapability,
  retrieveGovernedKnowledge,
  routeNativeIntelligenceTask,
  runLocalInference,
  trainingProposalTemplate,
} from "@/lib/ai/platform";

describe("MapAble-native intelligence R&D", () => {
  afterEach(() => {
    delete process.env.MAPABLE_NATIVE_INTELLIGENCE_RND_ENABLED;
    delete process.env.MAPABLE_LOCAL_MODEL_ROUTING_ENABLED;
  });

  it("extends the canonical registry with portfolio metadata (single registry)", () => {
    const models = listModels();
    expect(models.some((m) => m.id === "google/gemini-3.5-flash")).toBe(true);
    expect(models.some((m) => m.id === "mapable/local-small-intent-v0")).toBe(
      true
    );
    const local = getModel("mapable/local-small-intent-v0");
    expect(local?.deploymentType).toBe("local_oss");
    expect(local?.evaluationStatus).toBe("labs_only");
    expect(local?.rndOnly).toBe(true);
    expect(local?.prohibitedDataClasses).toContain("safeguarding");
  });

  it("rejects when R&D flag is off (fail-closed)", () => {
    const decision = routeNativeIntelligenceTask({
      capabilityKey: "native.intent_classification",
      taskKind: "intent_classification",
      dataClasses: ["public"],
      consentGranted: true,
      cloudAvailable: true,
    });
    expect(decision.ok).toBe(false);
    if (!decision.ok) {
      expect(decision.reason).toBe("rnd_disabled");
      expect(decision.mayExecuteAction).toBe(false);
    }
  });

  it("rejects an unapproved model", () => {
    process.env.MAPABLE_NATIVE_INTELLIGENCE_RND_ENABLED = "true";
    const decision = routeNativeIntelligenceTask({
      capabilityKey: "native.intent_classification",
      taskKind: "intent_classification",
      dataClasses: ["public"],
      consentGranted: true,
      cloudAvailable: true,
      requestedModelId: "totally/unknown-model",
    });
    expect(decision.ok).toBe(false);
    if (!decision.ok) {
      expect(decision.reason).toBe("unapproved_model");
    }
  });

  it("rejects a prohibited data class", () => {
    process.env.MAPABLE_NATIVE_INTELLIGENCE_RND_ENABLED = "true";
    process.env.MAPABLE_LOCAL_MODEL_ROUTING_ENABLED = "true";
    const decision = routeNativeIntelligenceTask({
      capabilityKey: "native.intent_classification",
      taskKind: "intent_classification",
      dataClasses: ["safeguarding"],
      consentGranted: true,
      cloudAvailable: false,
      requestedModelId: "mapable/local-small-intent-v0",
    });
    expect(decision.ok).toBe(false);
    if (!decision.ok) {
      expect(decision.reason).toBe("prohibited_data_class");
    }
  });

  it("uses fallback / degraded local route on model outage when local routing on", () => {
    process.env.MAPABLE_NATIVE_INTELLIGENCE_RND_ENABLED = "true";
    process.env.MAPABLE_LOCAL_MODEL_ROUTING_ENABLED = "true";
    const decision = routeNativeIntelligenceTask({
      capabilityKey: "native.plain_language_explanation",
      taskKind: "plain_language_explanation",
      dataClasses: ["public"],
      consentGranted: true,
      cloudAvailable: false,
      requestedModelId: "mapable/local-explain-v0",
    });
    expect(decision.ok).toBe(true);
    if (decision.ok) {
      expect(decision.routeKind).toBe("local_oss");
      expect(decision.mayExecuteAction).toBe(false);
    }
  });

  it("falls back to deterministic on cloud outage without local routing", () => {
    process.env.MAPABLE_NATIVE_INTELLIGENCE_RND_ENABLED = "true";
    const decision = routeNativeIntelligenceTask({
      capabilityKey: "search.nl_interpreter",
      taskKind: "plain_language_explanation",
      dataClasses: ["public"],
      consentGranted: true,
      cloudAvailable: false,
      requestedModelId: "google/gemini-3.5-flash",
      productionCapability: true,
    });
    expect(decision.ok).toBe(false);
    if (!decision.ok) {
      expect(decision.reason).toBe("model_outage");
      expect(decision.useDeterministicFallback).toBe(true);
    }
  });

  it("falls back to local/open-weight on cloud outage when local routing is enabled", () => {
    process.env.MAPABLE_NATIVE_INTELLIGENCE_RND_ENABLED = "true";
    process.env.MAPABLE_LOCAL_MODEL_ROUTING_ENABLED = "true";
    const decision = routeNativeIntelligenceTask({
      capabilityKey: "native.plain_language_explanation",
      taskKind: "plain_language_explanation",
      dataClasses: ["public"],
      consentGranted: true,
      cloudAvailable: false,
      requestedModelId: "google/gemini-3.5-flash",
      productionCapability: false,
    });
    expect(decision.ok).toBe(true);
    if (decision.ok) {
      expect(decision.routeKind).toBe("local_oss");
      expect(decision.usedFallback).toBe(true);
      expect(decision.fallbackFromModelId).toBe("google/gemini-3.5-flash");
      expect(decision.mayExecuteAction).toBe(false);
    }
  });

  it("allows a local route when both flags are on", () => {
    process.env.MAPABLE_NATIVE_INTELLIGENCE_RND_ENABLED = "true";
    process.env.MAPABLE_LOCAL_MODEL_ROUTING_ENABLED = "true";
    const decision = routeNativeIntelligenceTask({
      capabilityKey: "native.intent_classification",
      taskKind: "intent_classification",
      dataClasses: ["public"],
      consentGranted: true,
      cloudAvailable: true,
      requestedModelId: "mapable/local-small-intent-v0",
    });
    expect(decision.ok).toBe(true);
    if (decision.ok) {
      expect(decision.routeKind).toBe("local_oss");
      expect(decision.modelId).toBe("mapable/local-small-intent-v0");
    }

    const inference = runLocalInference({
      modelId: "mapable/local-small-intent-v0",
      taskKind: "intent_classification",
      inputText: "I need accessible transport to work",
    });
    expect(inference.ok).toBe(true);
    if (inference.ok) {
      expect(inference.productionSupported).toBe(false);
      expect(inference.labsOnly).toBe(true);
      expect(inference.structured?.intent).toBe("transport");
    }
  });

  it("blocks model authority bypass attempts", () => {
    process.env.MAPABLE_NATIVE_INTELLIGENCE_RND_ENABLED = "true";
    const decision = routeNativeIntelligenceTask({
      capabilityKey: "native.mission_explanation",
      taskKind: "mission_explanation",
      dataClasses: ["public"],
      consentGranted: true,
      cloudAvailable: true,
      requestedAuthorityCeiling: "DETERMINISTIC_EXECUTE_VIA_SERVICE",
    });
    expect(decision.ok).toBe(false);
    if (!decision.ok) {
      expect(decision.reason).toBe("authority_bypass_attempt");
      expect(decision.authorityRaised).toBe(false);
    }

    const gatewayGuard = assertMustUseCanonicalGateway("search.nl_interpreter");
    expect(gatewayGuard.bypassAllowed).toBe(false);
  });

  it("preserves retrieval provenance and filters non-operational claims", () => {
    const result = retrieveGovernedKnowledge({
      query: "consent",
      includeNonOperational: false,
    });
    expect(result.provenancePreserved).toBe(true);
    expect(result.hits.length).toBeGreaterThan(0);
    for (const hit of result.hits) {
      expect(assertProvenancePresent(hit).ok).toBe(true);
      expect(hit.provenance.operationalTruth).toBe(true);
      expect(hit.provenance.sourceId).toBeTruthy();
    }
    expect(result.filteredNonOperational).toBeGreaterThanOrEqual(1);
  });

  it("never lets an R&D model execute an action", () => {
    const gate = assertNativeModelCannotExecuteAction(
      "mapable/local-small-intent-v0"
    );
    expect(gate.allowed).toBe(false);
    expect(gate.reason).toBe("action_execution_forbidden");

    process.env.MAPABLE_NATIVE_INTELLIGENCE_RND_ENABLED = "true";
    process.env.MAPABLE_LOCAL_MODEL_ROUTING_ENABLED = "true";
    const decision = routeNativeIntelligenceTask({
      capabilityKey: "native.intent_classification",
      taskKind: "intent_classification",
      dataClasses: ["public"],
      consentGranted: true,
      cloudAvailable: true,
      requestedModelId: "mapable/local-small-intent-v0",
    });
    expect(decision.mayExecuteAction).toBe(false);
  });

  it("blocks production capabilities from silently switching to unevaluated/R&D models", () => {
    process.env.MAPABLE_NATIVE_INTELLIGENCE_RND_ENABLED = "true";
    process.env.MAPABLE_LOCAL_MODEL_ROUTING_ENABLED = "true";
    const decision = routeNativeIntelligenceTask({
      capabilityKey: "search.nl_interpreter",
      taskKind: "intent_classification",
      dataClasses: ["public"],
      consentGranted: true,
      cloudAvailable: true,
      requestedModelId: "mapable/local-small-intent-v0",
      productionCapability: true,
    });
    expect(decision.ok).toBe(false);
    if (!decision.ok) {
      expect(decision.reason).toBe("production_unevaluated_switch");
    }
  });

  it("does not auto-promote models and keeps Labs labelling honest", () => {
    expect(canAutoPromoteModel()).toBe(false);
    const view = buildLabsNativeIntelligenceView({ decision: null });
    expect(view.experimental).toBe(true);
    expect(view.productionSupported).toBe(false);
    expect(view.participantFacingClaimAllowed).toBe(false);
  });

  it("rejects training proposals without insufficiency evidence or with prohibited sources", () => {
    const template = trainingProposalTemplate();
    const missing = createTrainingProposal({
      ...template,
      id: "tp-1",
      insufficiencyEvidence: "   ",
    });
    expect(missing.ok).toBe(false);

    const scraped = createTrainingProposal({
      ...template,
      id: "tp-2",
      insufficiencyEvidence: "Rules alone miss rare phrasing patterns in eval set.",
      datasetCard: {
        ...template.datasetCard,
        name: "bad",
        purpose: "test",
        provenance: "scraped personal story forum dump",
        consentOrLicense: "none",
        deIdentification: "none",
        representativenessNotes: "unknown",
        deletionWithdrawalProcess: "n/a",
        evalSplitDescription: "n/a",
      },
    });
    expect(scraped.ok).toBe(false);
  });

  it("keeps the production gateway as the only capability model resolver", () => {
    // R&D local models are not allowlisted for production interpreter tasks.
    expect(
      isModelAllowedForTask(
        "mapable/local-small-intent-v0",
        "search.nl_interpreter"
      )
    ).toBe(false);

    const resolved = resolveModelForCapability({
      capabilityKey: "search.nl_interpreter",
      taskModelId: "mapable/local-small-intent-v0",
    });
    // Either blocked by allowlist / kill switch / config — never silently accepts R&D model.
    if (resolved.ok) {
      expect(resolved.modelId).not.toBe("mapable/local-small-intent-v0");
    } else {
      expect(resolved.useDeterministicFallback).toBe(true);
    }
  });
});
