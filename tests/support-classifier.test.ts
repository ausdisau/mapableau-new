import { describe, expect, it } from "vitest";

import {
  applyLocalGuardrailChecks,
  parseSupportClassificationResult,
  supportClassificationResultSchema,
} from "@/lib/mapable-llm/support-classifier/supportCategorySchema";

const samplePayload = {
  categories: [
    {
      code: "personal_care" as const,
      label: "Help getting ready",
      confidence: 0.82,
      reasoning: "Mentions help getting ready for the day.",
    },
    {
      code: "accessible_transport" as const,
      label: "Travel to work",
      confidence: 0.78,
      reasoning: "Needs support getting to work; buses are overwhelming.",
    },
    {
      code: "sensory_access_need" as const,
      label: "Overwhelming buses",
      confidence: 0.71,
      reasoning: "Sensory overwhelm on public transport noted.",
    },
    {
      code: "employment_support" as const,
      label: "Getting to work",
      confidence: 0.65,
      reasoning: "Work attendance is part of the stated goal.",
    },
  ],
  missingInformation: [
    "Preferred days and times for transport",
    "Whether a support worker or taxi/NDIS transport is preferred",
  ],
  guardrailFlags: [
    "not_a_diagnosis",
    "not_ndis_eligibility_decision",
    "not_final_service_recommendation",
  ] as const,
  participantSummary:
    "You described needing help to get ready and travel to work, and that busy buses feel overwhelming. These themes may relate to personal care, accessible transport, sensory access, and employment support. A coordinator can help you explore options — this is not a diagnosis or funding decision.",
  overallConfidence: 0.76,
};

describe("support classification schema", () => {
  it("parses valid structured output", () => {
    const result = parseSupportClassificationResult(samplePayload);
    expect(result.categories).toHaveLength(4);
    expect(result.categories[0].code).toBe("personal_care");
    expect(supportClassificationResultSchema.safeParse(samplePayload).success).toBe(
      true
    );
  });

  it("rejects invalid category codes", () => {
    expect(() =>
      parseSupportClassificationResult({
        ...samplePayload,
        categories: [
          {
            ...samplePayload.categories[0],
            code: "invalid_code",
          },
        ],
      })
    ).toThrow();
  });

  it("adds mandatory guardrail flags locally", () => {
    const withFlags = applyLocalGuardrailChecks({
      ...samplePayload,
      guardrailFlags: [],
    });
    expect(withFlags.guardrailFlags).toContain("not_a_diagnosis");
    expect(withFlags.guardrailFlags).toContain("not_ndis_eligibility_decision");
    expect(withFlags.guardrailFlags).toContain(
      "not_final_service_recommendation"
    );
  });

  it("flags diagnostic language for human review", () => {
    const flagged = applyLocalGuardrailChecks({
      ...samplePayload,
      participantSummary: "You have autism and need transport.",
      guardrailFlags: [
        "not_a_diagnosis",
        "not_ndis_eligibility_decision",
        "not_final_service_recommendation",
      ],
    });
    expect(flagged.guardrailFlags).toContain("may_need_human_review");
  });
});
