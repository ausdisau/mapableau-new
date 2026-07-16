import { describe, expect, it } from "vitest";

import { careTaskLlmSchema } from "@/lib/care-agent/schemas";

describe("careTaskLlmSchema", () => {
  it("accepts valid task payloads", () => {
    const parsed = careTaskLlmSchema.parse({
      tasks: [
        { name: "Showering assistance", intensity: "standard" },
        { name: "Two-person hoist transfer", intensity: "high" },
      ],
      confidence: 0.88,
    });
    expect(parsed.tasks).toHaveLength(2);
    expect(parsed.tasks[1]?.intensity).toBe("high");
  });

  it("rejects empty task lists", () => {
    expect(() =>
      careTaskLlmSchema.parse({
        tasks: [],
        confidence: 0.9,
      }),
    ).toThrow();
  });
});
