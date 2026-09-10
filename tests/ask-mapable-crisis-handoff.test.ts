import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAgentRun: vi.fn(),
}));

vi.mock("@/lib/ai/agent-ops/agent-run-service", () => ({
  createAgentRun: mocks.createAgentRun,
}));

import {
  buildCrisisHandoffAuditSummary,
  normaliseCrisisCommunicationAccess,
  recordCrisisHumanAssistanceRequest,
} from "@/lib/ask-mapable/crisis-handoff";

describe("MapAble crisis human handoff", () => {
  beforeEach(() => {
    mocks.createAgentRun.mockReset();
    mocks.createAgentRun.mockResolvedValue({ id: "run-123" });
  });

  it("keeps only allow-listed communication access values", () => {
    expect(
      normaliseCrisisCommunicationAccess([
        "aac_or_typed",
        "unknown-value",
        "extra_response_time",
        "aac_or_typed",
      ]),
    ).toEqual(["aac_or_typed", "extra_response_time"]);
  });

  it("builds a minimal audit summary without crisis free text", () => {
    const summary = buildCrisisHandoffAuditSummary({
      sessionId: "session-abc",
      communicationAccess: ["relay_or_text_preferred"],
    });

    expect(summary).toEqual({
      source: "mapable_crisis_support",
      referralState: "USER_INITIATED",
      handoffState: "HUMAN_ASSISTANCE_REQUESTED",
      requestType: "mapable_human_assistance",
      communicationAccess: ["relay_or_text_preferred"],
      sessionId: "session-abc",
      freeTextStored: false,
      externalAcceptanceConfirmed: false,
    });
    expect(JSON.stringify(summary)).not.toContain("reason");
  });

  it("records high-risk human review without claiming acceptance", async () => {
    const result = await recordCrisisHumanAssistanceRequest({
      userId: "user-1",
      sessionId: "session-1",
      communicationAccess: ["aac_or_typed"],
    });

    expect(mocks.createAgentRun).toHaveBeenCalledWith(
      expect.objectContaining({
        agentType: "safeguarding_triage",
        riskTier: "high",
        humanReviewRequired: true,
        participantConfirmationRequired: false,
        inputSummary: expect.objectContaining({
          freeTextStored: false,
          externalAcceptanceConfirmed: false,
        }),
      }),
    );
    expect(result).toEqual({
      recorded: true,
      runId: "run-123",
      state: "HUMAN_ASSISTANCE_REQUESTED",
      externalAcceptanceConfirmed: false,
      freeTextStored: false,
    });
  });

  it("does not pretend persistence succeeded when AgentRun is disabled", async () => {
    mocks.createAgentRun.mockResolvedValue({ id: null, skipped: true });

    const result = await recordCrisisHumanAssistanceRequest({
      userId: "user-1",
    });

    expect(result.recorded).toBe(false);
    expect(result.externalAcceptanceConfirmed).toBe(false);
  });
});
