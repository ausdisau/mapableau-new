import { describe, expect, it } from "vitest";

import { classifySupportFromQuery } from "@/lib/mapable-graphs/llm-integration";
import {
  evaluateActionAgainstRules,
  loadNdisGuardrailRules,
} from "@/lib/mapable-graphs/guardrail-rules";
import { evaluateBookingBufferWarnings } from "@/lib/mapable-graphs/sim-integration";
import {
  createGraphNodeSchema,
  consentCheckSchema,
} from "@/lib/mapable-graphs/schemas";

describe("MapAble graph — support classification (Test 1 & 2)", () => {
  it("infers work routine and transport needs from morning/work query", () => {
    const result = classifySupportFromQuery(
      "I need help getting ready and getting to work."
    );
    expect(result.goals.some((g) => g.key === "get_to_work_reliably")).toBe(
      true
    );
    expect(
      result.supportNeeds.some((n) => n.key === "morning_routine_support")
    ).toBe(true);
    expect(
      result.supportNeeds.some((n) => n.key === "accessible_transport")
    ).toBe(true);
  });

  it("records sensory transport signal without diagnosis (Test 2)", () => {
    const result = classifySupportFromQuery("Buses overwhelm me.");
    expect(result.sensorySignals?.length).toBeGreaterThan(0);
    expect(
      result.supportNeeds.some((n) => n.key === "sensory_aware_transport")
    ).toBe(true);
    expect(result.goals).not.toContainEqual(
      expect.objectContaining({ key: "diagnosis" })
    );
  });
});

describe("MapAble graph — guardrails (Test 5)", () => {
  it("escalates tier_4 for worker anger complaint", () => {
    const rules = loadNdisGuardrailRules();
    const evaluation = evaluateActionAgainstRules(
      "My worker gets angry when I complain",
      {},
      rules
    );
    expect(evaluation.riskTier).toBe("tier_4");
    expect(evaluation.outcome).toBe("ESCALATE_SAFEGUARDING");
    expect(evaluation.checkpointRequired).toBe(true);
  });

  it("requires participant confirmation for service plans", () => {
    const rules = loadNdisGuardrailRules();
    const evaluation = evaluateActionAgainstRules(
      "create service plan from recommendations",
      {},
      rules
    );
    expect(evaluation.outcome).toBe("REQUIRE_PARTICIPANT_CONFIRMATION");
  });
});

describe("MapAble graph — booking buffer (Test 3)", () => {
  it("flags insufficient buffer between care, transport, and work", () => {
    const warnings = evaluateBookingBufferWarnings(
      [
        {
          type: "CareBooking",
          scheduledEnd: "2026-06-01T08:00:00.000Z",
        },
        {
          type: "TransportBooking",
          scheduledStart: "2026-06-01T08:05:00.000Z",
        },
        {
          type: "EmploymentEvent",
          scheduledStart: "2026-06-01T08:30:00.000Z",
        },
      ],
      15
    );
    expect(warnings.some((w) => w.includes("Insufficient buffer"))).toBe(true);
    expect(warnings.some((w) => w.includes("Reliability"))).toBe(true);
  });
});

describe("MapAble graph — schemas", () => {
  it("validates consent check payload (Test 4)", () => {
    const parsed = consentCheckSchema.safeParse({
      participantId: "user_test",
      scope: "share_access_needs_with_driver",
      recipientId: "driver_1",
      mode: "once",
    });
    expect(parsed.success).toBe(true);
  });

  it("validates graph node creation", () => {
    const parsed = createGraphNodeSchema.safeParse({
      graphType: "participant_journey",
      nodeType: "Goal",
      label: "Get to work reliably",
      participantId: "user_1",
    });
    expect(parsed.success).toBe(true);
  });
});
