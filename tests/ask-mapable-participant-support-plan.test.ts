import { describe, expect, it } from "vitest";

import {
  buildConsentedSupportSummary,
  createEmptyParticipantSupportPlan,
  normaliseParticipantSupportPlan,
} from "@/lib/ask-mapable/participant-support-plan";

describe("participant-authored support plan", () => {
  it("starts empty and makes no claim about clinical safety", () => {
    const plan = createEmptyParticipantSupportPlan();

    expect(plan).toEqual({
      noticeFirst: "",
      thingsICanTry: "",
      groundingPeoplePlaces: "",
      peopleIChoose: "",
      professionalSupports: "",
      saferEnvironment: "",
      communicationAccess: "",
    });
    expect(JSON.stringify(plan).toLowerCase()).not.toContain("risk score");
    expect(JSON.stringify(plan).toLowerCase()).not.toContain("safe: true");
  });

  it("normalises text length without adding diagnosis, location or contacts", () => {
    const plan = normaliseParticipantSupportPlan({
      noticeFirst: `  ${"a".repeat(1300)}  `,
      communicationAccess: "Please give me time to use AAC.",
    });

    expect(plan.noticeFirst).toHaveLength(1200);
    expect(plan.communicationAccess).toBe("Please give me time to use AAC.");
    expect(plan).not.toHaveProperty("diagnosis");
    expect(plan).not.toHaveProperty("location");
    expect(plan).not.toHaveProperty("phone");
  });

  it("includes only sections the participant explicitly selects", () => {
    const plan = normaliseParticipantSupportPlan({
      noticeFirst: "I stop replying quickly.",
      thingsICanTry: "Move somewhere quieter.",
      peopleIChoose: "Alex",
      communicationAccess: "Text or AAC works best.",
    });

    const summary = buildConsentedSupportSummary({
      plan,
      selectedFields: ["thingsICanTry", "communicationAccess"],
    });

    expect(summary.selectedFields).toEqual([
      "thingsICanTry",
      "communicationAccess",
    ]);
    expect(summary.sections).toEqual([
      { label: "Things I can try", value: "Move somewhere quieter." },
      { label: "How I communicate", value: "Text or AAC works best." },
    ]);
    expect(JSON.stringify(summary)).not.toContain("Alex");
    expect(JSON.stringify(summary)).not.toContain("I stop replying quickly");
  });

  it("does not create a share payload when nothing is selected", () => {
    const plan = normaliseParticipantSupportPlan({
      thingsICanTry: "Listen to music.",
    });

    expect(
      buildConsentedSupportSummary({ plan, selectedFields: [] }),
    ).toBeNull();
  });

  it("does not include empty sections even when selected", () => {
    const plan = createEmptyParticipantSupportPlan();
    const summary = buildConsentedSupportSummary({
      plan,
      selectedFields: ["professionalSupports"],
    });

    expect(summary).toBeNull();
  });

  it("never claims the plan or preview was externally accepted", () => {
    const plan = normaliseParticipantSupportPlan({
      professionalSupports: "Lifeline if I choose to call.",
    });
    const summary = buildConsentedSupportSummary({
      plan,
      selectedFields: ["professionalSupports"],
    });

    expect(summary?.externalAcceptanceConfirmed).toBe(false);
    expect(summary?.sent).toBe(false);
  });
});
