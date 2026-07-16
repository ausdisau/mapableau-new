import { describe, expect, it } from "vitest";

import { bindGuideFacts, FactBinderError } from "@/lib/access-intelligence/guides";

describe("System 3 guide FactBinder", () => {
  it("requires evidence bindings for factual sentences", () => {
    expect(() =>
      bindGuideFacts([
        {
          heading: "Entrance",
          facts: [
            {
              sentenceKey: "s1",
              text: "The entrance is step-free.",
              evidenceLabel: "none",
              sourceKind: "assessor",
            },
          ],
        },
      ]),
    ).toThrow(FactBinderError);
  });

  it("rejects legal compliance claims", () => {
    expect(() =>
      bindGuideFacts([
        {
          heading: "Compliance",
          facts: [
            {
              sentenceKey: "s2",
              text: "This venue is legally accessible and compliant.",
              evidenceLabel: "assessor 2026",
              evidenceAssetId: "ea1",
              sourceKind: "assessor",
            },
          ],
        },
      ]),
    ).toThrow(/compliance/i);
  });

  it("keeps unknowns labelled", () => {
    const bound = bindGuideFacts([
      {
        heading: "Lift",
        facts: [
          {
            sentenceKey: "s3",
            text: "Lift status is unknown.",
            evidenceLabel: "no evidence",
            sourceKind: "unknown",
          },
        ],
      },
    ]);
    expect(bound.evidenceReferences).toHaveLength(1);
  });
});
