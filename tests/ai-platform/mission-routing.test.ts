import { describe, expect, it } from "vitest";

import { routeMissionDomains } from "@/lib/ai/platform/missions";

describe("Mission routing — deterministic domains", () => {
  it("routes accessible transport objective to transport and access", () => {
    const result = routeMissionDomains({
      objective: "I need accessible transport to my appointment tomorrow.",
    });
    expect(result.allowedDomains).toEqual(
      expect.arrayContaining(["core", "transport", "access"]),
    );
    expect(result.inferredDomains).toContain("transport");
  });

  it("routes interview objective to jobs, care, transport, and access", () => {
    const result = routeMissionDomains({
      objective:
        "I have a job interview and need support getting there with wheelchair-accessible transport.",
    });
    expect(result.allowedDomains).toEqual(
      expect.arrayContaining(["jobs", "care", "transport", "access"]),
    );
  });

  it("does not activate payments for incidental finance mention with interview", () => {
    const result = routeMissionDomains({
      objective: "Job interview tomorrow — worried about pay and transport.",
    });
    expect(result.rejectedDomains).toContain("payments");
    expect(result.allowedDomains).not.toContain("payments");
  });

  it("honours participant domain removal", () => {
    const result = routeMissionDomains({
      objective: "Interview tomorrow with transport needs",
      removedDomains: ["transport"],
    });
    expect(result.rejectedDomains).toContain("transport");
    expect(result.allowedDomains).not.toContain("transport");
  });

  it("honours participant domain addition", () => {
    const result = routeMissionDomains({
      objective: "Get ready for interview",
      addedDomains: ["access"],
    });
    expect(result.allowedDomains).toContain("access");
    expect(result.reasons.access).toBe("participant_added_domain");
  });
});
