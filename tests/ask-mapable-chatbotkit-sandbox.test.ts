import { describe, expect, it } from "vitest";

import {
  assertChatBotKitSandboxTrial,
  compareChatBotKitTrial,
  syntheticPublicTrialFixture,
  type PublicConversationBackend,
  type TrialObservation,
} from "@/lib/ask-mapable/adapters/chatbotkit-sandbox";

const syntheticFixture = {
  scenarioId: "synthetic-access-01",
  prompt: "Find a support provider for a fictitious person",
  sourceIds: ["fixture-outlet-01"],
  synthetic: true,
} as const;

function observations(
  backend: PublicConversationBackend,
  latencyMs: number,
  costUsd: number,
): TrialObservation[] {
  return Array.from({ length: 20 }, (_, index) => ({
    scenarioId: `synthetic-test-${index}`,
    backend,
    citationGrounded: true,
    noUnverifiedClaims: true,
    privateDataProtected: true,
    advertiserIndependent: true,
    accessible: true,
    fallbackAvailable: true,
    latencyMs,
    costUsd,
  }));
}

describe("ChatBotKit optional synthetic trial gate", () => {
  it("does not permit the candidate in production or without an explicit flag", () => {
    expect(() => assertChatBotKitSandboxTrial(syntheticFixture, {})).toThrow(
      "MAPABLE_CHATBOTKIT_TRIAL_DISABLED",
    );
    expect(() => assertChatBotKitSandboxTrial(syntheticFixture, {
      NODE_ENV: "production",
      MAPABLE_CHATBOTKIT_EVAL_ENABLED: "true",
    })).toThrow("MAPABLE_CHATBOTKIT_TRIAL_DISABLED");
    expect(assertChatBotKitSandboxTrial(syntheticFixture, {
      NODE_ENV: "test",
      MAPABLE_CHATBOTKIT_EVAL_ENABLED: "true",
    }).scenarioId).toBe("synthetic-access-01");
  });

  it("rejects extra personal or advertising fields rather than silently passing them to a vendor", () => {
    expect(syntheticPublicTrialFixture.safeParse({
      ...syntheticFixture,
      participantId: "real-person",
    }).success).toBe(false);
    expect(syntheticPublicTrialFixture.safeParse({
      ...syntheticFixture,
      advertiserBid: 1000,
    }).success).toBe(false);
    expect(syntheticPublicTrialFixture.safeParse({
      ...syntheticFixture,
      synthetic: false,
    }).success).toBe(false);
  });
});

describe("bounded vendor comparison", () => {
  it("never promotes an unpaired or undersized sample", () => {
    const result = compareChatBotKitTrial(
      observations("mapable-native", 1000, 0.02).slice(0, 10),
      observations("chatbotkit", 700, 0.01).slice(0, 10),
    );
    expect(result.decision).toBe("insufficient_evidence");
    expect(result.productionApproved).toBe(false);
  });

  it("hard-fails if advertising contaminates answers or evidence claims are unsupported", () => {
    const candidate = observations("chatbotkit", 500, 0.01);
    candidate[0] = { ...candidate[0]!, advertiserIndependent: false };
    candidate[1] = { ...candidate[1]!, noUnverifiedClaims: false };
    const result = compareChatBotKitTrial(observations("mapable-native", 1000, 0.02), candidate);
    expect(result.decision).toBe("reject");
    expect(result.productionApproved).toBe(false);
  });

  it("requires a measurable improvement and never grants automatic deployment", () => {
    const baseline = observations("mapable-native", 1000, 0.02);
    const improvement = observations("chatbotkit", 700, 0.019);
    const result = compareChatBotKitTrial(baseline, improvement);
    expect(result.decision).toBe("further_review");
    expect(result.evaluatedPairs).toBe(20);
    expect(result.productionApproved).toBe(false);

    expect(compareChatBotKitTrial(
      baseline, observations("chatbotkit", 980, 0.019),
    ).decision).toBe("not_preferred");
  });

  it("blocks material cost regression even if it answers faster", () => {
    const result = compareChatBotKitTrial(
      observations("mapable-native", 1000, 0.02),
      observations("chatbotkit", 300, 0.04),
    );
    expect(result.decision).toBe("not_preferred");
  });
});
