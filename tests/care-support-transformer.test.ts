import { beforeEach, describe, expect, it, vi } from "vitest";

import { transformCareSupport, transformCareSupportAsync } from "@/server/agents/careSupportTransformer";
import { careSupportTransformInputSchema } from "@/server/agents/care/types";

vi.mock("@/lib/care-agent", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/care-agent")>();
  return {
    ...actual,
    isCareAgentLlmEnabled: vi.fn(() => false),
  };
});

const baseInput = {
  sessionId: "test-session-1",
  message:
    "I need a support worker for showering and dressing on Tuesday morning in Parramatta.",
  assessmentSignals: {},
  preferences: {},
};

describe("careSupportTransformInputSchema", () => {
  it("requires sessionId and message", () => {
    expect(() =>
      careSupportTransformInputSchema.parse({ sessionId: "s", message: "" })
    ).toThrow();
    expect(
      careSupportTransformInputSchema.parse({
        sessionId: "s",
        message: "help",
      })
    ).toBeTruthy();
  });
});

describe("Care and Support Agentic Transformer", () => {
  it("1. converts plain-language care requests into structured care tasks", () => {
    const output = transformCareSupport(baseInput);
    expect(output.carePlanDraft.requestType).toBe("personal_care");
    expect(output.carePlanDraft.tasks.length).toBeGreaterThan(0);
    expect(output.carePlanDraft.tasks[0]?.name).toBeTruthy();
    expect(output.carePlanDraft.title.length).toBeGreaterThan(3);
    expect(output.carePlanDraft.description).toContain("showering");
  });

  it("2. produces a participant-facing summary", () => {
    const output = transformCareSupport(baseInput);
    expect(output.participantFacingSummary.length).toBeGreaterThan(40);
    expect(output.participantFacingSummary.toLowerCase()).toContain("draft");
    expect(output.participantFacingSummary.toLowerCase()).not.toContain(
      "you are ndis eligible"
    );
  });

  it("3. creates Support Journey Graph patch", () => {
    const output = transformCareSupport(baseInput);
    expect(output.supportJourneyPatch.version).toBe(1);
    expect(output.supportJourneyPatch.sessionId).toBe(baseInput.sessionId);
    expect(
      output.supportJourneyPatch.nodes.some((n) => n.id === "intake")
    ).toBe(true);
    expect(
      output.supportJourneyPatch.nodes.some((n) => n.id === "booking_gate")
    ).toBe(true);
    expect(output.supportJourneyPatch.nodes.find((n) => n.id === "booking_gate")
      ?.status).toBe("blocked");
    expect(output.supportJourneyPatch.edges.length).toBeGreaterThan(0);
    expect(output.supportJourneyPatch.pendingConfirmationGate).toBeTruthy();
  });

  it("4. flags required worker capabilities", () => {
    const output = transformCareSupport({
      ...baseInput,
      message:
        "Need two-person hoist transfer and behaviour support during personal care.",
      assessmentSignals: { manualHandling: true, behaviourSupport: true },
    });
    const ids = output.requiredCapabilities.map((c) => c.id);
    expect(ids).toContain("high_intensity_competency");
    expect(ids).toContain("manual_handling_awareness");
    expect(ids).toContain("behaviour_support");
    expect(ids).toContain("personal_care_scope");
  });

  it("5. applies guardrails", () => {
    const output = transformCareSupport({
      ...baseInput,
      message:
        "Am I NDIS eligible? I need medication reminders and safeguarding help at home.",
      assessmentSignals: {
        medicationPrompting: true,
        safeguardingConcern: true,
      },
    });
    expect(output.guardrailDecision.autoAssignWorkers).toBe(false);
    expect(output.guardrailDecision.autoFinalizeBooking).toBe(false);
    expect(output.guardrailDecision.humanReviewRequired).toBe(true);
    expect(output.guardrailDecision.appliedRules).toContain("no_diagnose");
    expect(output.guardrailDecision.appliedRules).toContain(
      "no_ndis_eligibility_determination"
    );
    expect(output.audit.guardrailTriggers).toContain(
      "ndis_eligibility_not_determined"
    );
    expect(
      output.missingInformation.some((m) =>
        m.toLowerCase().includes("funding")
      )
    ).toBe(true);
  });

  it("6. requires participant confirmation before booking", () => {
    const output = transformCareSupport(baseInput);
    expect(output.carePlanDraft.status).toBe("needs_confirmation");
    expect(output.carePlanDraft.bookingStatus).toBe(
      "blocked_until_participant_confirmation"
    );
    expect(
      output.checkpoints.some(
        (c) =>
          c.type === "PARTICIPANT_CONFIRMATION" && c.requiredBeforeBooking
      )
    ).toBe(true);
    expect(
      output.checkpoints.some((c) => c.id === "participant_confirm_personal_care")
    ).toBe(true);
    expect(output.guardrailDecision.personalCareConfirmationRequired).toBe(
      true
    );
  });

  it("7. emits audit metadata", () => {
    const output = transformCareSupport(baseInput);
    expect(output.audit.sessionId).toBe(baseInput.sessionId);
    expect(output.audit.transformId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    expect(output.audit.pipelineVersion).toContain("care-support-transformer");
    expect(output.audit.inputHash).toMatch(/^[a-f0-9]{64}$/);
    expect(output.audit.agentDecisions.length).toBeGreaterThanOrEqual(5);
    expect(
      output.audit.agentDecisions.some((d) => d.agent === "careIntakeAgent")
    ).toBe(true);
  });

  it("session-only transform redacts access notes without confirmation", () => {
    const output = transformCareSupport({
      sessionId: "anon-session",
      message: "Community access on Friday",
      assessmentSignals: {},
      preferences: {
        shareAccessibility: true,
        accessRequirementsSummary: "Wheelchair user — do not share yet",
      },
    });
    expect(output.carePlanDraft.accessRequirementsSummary).toBeUndefined();
    expect(output.audit.redactedFields).toContain("accessRequirementsSummary");
    expect(
      output.missingInformation.some((m) => m.toLowerCase().includes("sign in"))
    ).toBe(true);
  });

  it("minimal message yields missing information", () => {
    const output = transformCareSupport({
      sessionId: "minimal",
      message: "I need help",
      assessmentSignals: {},
      preferences: {},
    });
    expect(output.missingInformation.length).toBeGreaterThan(0);
    expect(output.carePlanDraft.requestType).toBe("other");
  });
});

describe("transformCareSupportAsync with LLM enabled", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.doMock("@/lib/care-agent", () => ({
      isCareAgentLlmEnabled: vi.fn(() => true),
      runCareIntakeWithLlm: vi.fn().mockImplementation(async (input: typeof baseInput) => {
        const { runCareIntakeAgent } = await import("@/server/agents/care/careIntakeAgent");
        return {
          intake: runCareIntakeAgent(input),
          meta: { source: "llm", confidence: 0.9, fallbackUsed: false, llmProvider: "vllm" },
        };
      }),
      runCareTaskTransformerWithLlm: vi.fn().mockImplementation(async (input, intake) => {
        const { runCareTaskTransformer } = await import("@/server/agents/care/careTaskTransformer");
        return {
          carePlanDraft: runCareTaskTransformer(input, intake),
          meta: { source: "llm", confidence: 0.9, fallbackUsed: false, llmProvider: "vllm" },
        };
      }),
      runWorkerCapabilityWithLlm: vi.fn().mockImplementation(async (intake, draft) => {
        const { runWorkerCapabilityAgent } = await import(
          "@/server/agents/care/workerCapabilityAgent"
        );
        return {
          requiredCapabilities: runWorkerCapabilityAgent(intake, draft),
          meta: { source: "llm", confidence: 0.9, fallbackUsed: false, llmProvider: "vllm" },
        };
      }),
      runCarePlanExplainerWithLlm: vi.fn().mockImplementation(async (params) => {
        const { runCarePlanExplainer } = await import("@/server/agents/care/carePlanExplainer");
        return {
          summary: runCarePlanExplainer(params),
          meta: { source: "llm", confidence: 0.9, fallbackUsed: false, llmProvider: "vllm" },
        };
      }),
    }));
  });

  it("uses v2 pipeline version and llm audit when enabled", async () => {
    const { transformCareSupportAsync: transformAsync } = await import(
      "@/server/agents/careSupportTransformer"
    );
    const output = await transformAsync(baseInput);
    expect(output.audit.pipelineVersion).toBe("care-support-transformer-v2");
    expect(output.audit.llm?.enabled).toBe(true);
    expect(output.audit.llm?.provider).toBe("vllm");
    expect(output.audit.agentDecisions.some((d) => d.source === "llm")).toBe(true);
  });
});
