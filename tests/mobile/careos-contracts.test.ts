
import { describe, expect, it } from "vitest";
import {
  careosMissionDetailSchema,
  createAppointmentMissionRequestSchema,
  confirmMissionActionRequestSchema,
} from "@mapable/careos-contracts";

describe("careos mobile contracts", () => {
  it("accepts appointment mission create payload", () => {
    const parsed = createAppointmentMissionRequestSchema.parse({
      goalText: "Help me attend physiotherapy next Tuesday.",
      idempotencyKey: "11111111-1111-4111-8111-111111111111",
    });
    expect(parsed.goalText).toContain("physiotherapy");
  });

  it("requires separate domain confirmation", () => {
    const parsed = confirmMissionActionRequestSchema.parse({
      confirmationId: "conf_care",
      domain: "care",
      decision: "grant",
      idempotencyKey: "22222222-2222-4222-8222-222222222222",
    });
    expect(parsed.domain).toBe("care");
  });

  it("validates mission detail shape", () => {
    const detail = careosMissionDetailSchema.parse({
      id: "m1",
      missionType: "appointment",
      status: "needs_decision",
      desiredOutcome: "Attend physiotherapy",
      whatChanged: "Options ready",
      whyItMatters: "Provider needs approval by Friday",
      needsDecision: true,
      whoIsWaiting: "You",
      whatHappensNext: "Confirm Care and Transport separately",
      updatedAt: new Date().toISOString(),
      authoritySummary: "Participant authority required",
      unknownInformation: [],
      recommendations: [],
      humanReviewItems: [],
      evidence: [],
      uncertainties: [],
      pendingConfirmations: [],
      receipts: [],
      dependencyLabels: [],
      nonAiPathwayAvailable: true,
      appointment: null,
    });
    expect(detail.nonAiPathwayAvailable).toBe(true);
  });
});
