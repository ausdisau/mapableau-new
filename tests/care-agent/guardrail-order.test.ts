import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/care-agent", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/care-agent")>();
  return {
    ...actual,
    isCareAgentLlmEnabled: vi.fn(() => true),
    runCareIntakeWithLlm: vi.fn(),
    runCareTaskTransformerWithLlm: vi.fn(),
    runWorkerCapabilityWithLlm: vi.fn(),
    runCarePlanExplainerWithLlm: vi.fn(),
  };
});

import {
  runCareIntakeWithLlm,
  runCarePlanExplainerWithLlm,
  runCareTaskTransformerWithLlm,
  runWorkerCapabilityWithLlm,
} from "@/lib/care-agent";
import { runCareGuardrailAgent } from "@/server/agents/care/careGuardrailAgent";
import { runCareIntakeAgent } from "@/server/agents/care/careIntakeAgent";
import { runCareTaskTransformer } from "@/server/agents/care/careTaskTransformer";
import { transformCareSupportAsync } from "@/server/agents/careSupportTransformer";
import { runWorkerCapabilityAgent } from "@/server/agents/care/workerCapabilityAgent";

const baseInput = {
  sessionId: "guardrail-order",
  message:
    "Am I NDIS eligible? I need medication reminders and safeguarding help at home.",
  assessmentSignals: {
    medicationPrompting: true,
    safeguardingConcern: true,
  },
  preferences: {},
};

describe("guardrail order with LLM path", () => {
  beforeEach(() => {
    const intake = runCareIntakeAgent(baseInput);
    const draft = runCareTaskTransformer(baseInput, intake);
    const capabilities = runWorkerCapabilityAgent(intake, draft);
    const guardrail = runCareGuardrailAgent({
      intake,
      carePlanDraft: draft,
      requiredCapabilities: capabilities,
      preferences: baseInput.preferences,
      sessionOnly: true,
    });

    vi.mocked(runCareIntakeWithLlm).mockResolvedValue({
      intake,
      meta: { source: "llm", confidence: 0.95, fallbackUsed: false, llmProvider: "ollama" },
    });
    vi.mocked(runCareTaskTransformerWithLlm).mockResolvedValue({
      carePlanDraft: draft,
      meta: { source: "llm", confidence: 0.95, fallbackUsed: false, llmProvider: "ollama" },
    });
    vi.mocked(runWorkerCapabilityWithLlm).mockResolvedValue({
      requiredCapabilities: capabilities,
      meta: { source: "llm", confidence: 0.95, fallbackUsed: false, llmProvider: "ollama" },
    });
    vi.mocked(runCarePlanExplainerWithLlm).mockResolvedValue({
      summary: "Draft care plan summary for review.",
      meta: { source: "llm", confidence: 0.9, fallbackUsed: false, llmProvider: "ollama" },
    });

    expect(guardrail.guardrailDecision.humanReviewRequired).toBe(true);
  });

  it("still requires human review when LLM intake is used", async () => {
    const output = await transformCareSupportAsync(baseInput);
    expect(output.guardrailDecision.humanReviewRequired).toBe(true);
    expect(output.guardrailDecision.autoAssignWorkers).toBe(false);
    expect(output.audit.pipelineVersion).toBe("care-support-transformer-v2");
    expect(output.audit.llm?.enabled).toBe(true);
    expect(
      output.audit.agentDecisions.some(
        (d) => d.agent === "careGuardrailAgent" && d.source === "rules",
      ),
    ).toBe(true);
  });
});
