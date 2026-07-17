import { describe, expect, it } from "vitest";

import {
  assertCriticalActionHasText,
  computeMeaningHash,
  renderContent,
} from "@/lib/aura/communication";

describe("Wave 6 — adaptive communication", () => {
  const content = {
    steps: [
      "Go to Entrance B.",
      "Enter through the level doorway.",
      "Use the western lift.",
    ],
    unknowns: ["toilet state"],
    blockers: [],
  };

  it("standard text always available", () => {
    const r = renderContent({ content, mode: "standard" });
    expect(r.standardText.length).toBeGreaterThan(0);
  });

  it("meaning hash unchanged across renderers", () => {
    const hash = computeMeaningHash(content);
    const oneStep = renderContent({ content, mode: "one_step_at_a_time" });
    const plain = renderContent({ content, mode: "plain_language" });
    expect(oneStep.meaningHash).toBe(hash);
    expect(plain.meaningHash).toBe(hash);
  });

  it("critical approval retains text", () => {
    const r = renderContent({
      content: { steps: ["Approve venue contact"] },
      mode: "symbol_supported",
    });
    assertCriticalActionHasText("approve", r);
    expect(r.standardText.length).toBeGreaterThan(0);
  });

  it("diagnosis does not select presentation mode", () => {
    const r = renderContent({
      content,
      mode: "one_step_at_a_time",
      userDiagnosis: "autism",
    });
    expect(r.rendered.length).toBe(3);
  });
});
