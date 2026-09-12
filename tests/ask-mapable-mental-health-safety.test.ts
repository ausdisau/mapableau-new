import { describe, expect, it } from "vitest";

import {
  assessMentalHealthSafety,
  buildMentalHealthSafetyResponse,
} from "@/lib/ask-mapable";

describe("MapAble Companion mental health safety", () => {
  it("does not turn ordinary distress into a suicide prediction", () => {
    const assessment = assessMentalHealthSafety("I'm overwhelmed and can't cope today");

    expect(assessment.state).toBe("distress");
    expect(assessment.requiresHumanReview).toBe(false);
    expect(buildMentalHealthSafetyResponse(assessment)).toBeNull();
  });

  it("intercepts explicit suicidal concern without declaring immediate danger", () => {
    const assessment = assessMentalHealthSafety("I've been thinking about suicide");
    const response = buildMentalHealthSafetyResponse(assessment);

    expect(assessment.state).toBe("suicidal_concern");
    expect(assessment.requiresHumanReview).toBe(true);
    expect(response?.filters.mentalHealthSafety).toMatchObject({
      prediction: false,
      referralAcceptanceClaimed: false,
    });
    expect(response?.answer).toMatch(/qualified human should assess suicide risk/i);
  });

  it("routes explicit current intent to immediate danger guidance", () => {
    const assessment = assessMentalHealthSafety(
      "I want to die and I have a plan right now",
    );
    const response = buildMentalHealthSafetyResponse(assessment);

    expect(assessment.state).toBe("immediate_danger");
    expect(assessment.requiresEmergencyAdvice).toBe(true);
    expect(response?.actions.some((action) => action.href === "tel:000")).toBe(true);
    expect(response?.actions.some((action) => action.href === "/help/crisis#accessible-contact")).toBe(true);
  });

  it("keeps terse uncertainty inside the safety pathway after a safety question", () => {
    const assessment = assessMentalHealthSafety("I'm not sure", [
      {
        role: "assistant",
        content:
          "Are you in immediate danger of hurting yourself right now, or have you already hurt yourself?",
      },
    ]);

    expect(assessment.state).toBe("immediate_danger");
    expect(assessment.matchedSignals).toContain(
      "safety_question_uncertain_or_affirmative_reply",
    );
  });

  it("does not interpret an isolated yes as a crisis signal without safety context", () => {
    expect(assessMentalHealthSafety("yes").state).toBe("none");
  });
});
