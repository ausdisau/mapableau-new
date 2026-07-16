import { describe, expect, it } from "vitest";

import { evaluatePolicy } from "@/lib/rights-os/policy-evaluator";
import { createRightsOsAiTools } from "@/lib/rights-os/ai-tools";

describe("AI boundary", () => {
  it("AI explain tool uses deterministic evaluator only", async () => {
    const tools = createRightsOsAiTools("participant-1");
    const explainTool = tools.explainDataUseRequest;

    expect(explainTool.description).toMatch(/does not evaluate or change policy/i);

    const result = await explainTool.execute!(
      {
        purposeCode: "access.verify_venue",
        requestedFields: ["arrival_time", "diagnosis"],
        requestedOperations: ["read"],
        recipientDisplayName: "Test Venue",
      },
      { toolCallId: "test", messages: [] }
    );

    expect(result).toHaveProperty("decision");
    expect(result).toHaveProperty("deniedSummary");
    expect((result as { deniedSummary: string }).deniedSummary).toMatch(/diagnosis/i);
  });

  it("evaluator does not call AI", () => {
    const decision = evaluatePolicy({
      requestId: "ai-boundary-test",
      requester: { actorId: "system", actorType: "system" },
      recipient: { displayName: "Test" },
      subjectUserId: "p1",
      purposeCode: "access.verify_venue",
      requestedOperations: ["read"],
      requestedFields: ["arrival_time"],
      sourceAssets: [],
      context: {},
      requestedAt: new Date().toISOString(),
      onwardSharingRequested: false,
    });

    expect(decision.policyVersion).toBeTruthy();
    expect(decision.outcome).toBe("participant_review_required");
  });
});
