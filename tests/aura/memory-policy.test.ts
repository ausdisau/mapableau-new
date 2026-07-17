import { describe, expect, it } from "vitest";

import { assessMemoryWrite } from "@/lib/aura/memory/policy";

describe("memory policy", () => {
  it("rejects prohibited memory class outright", () => {
    const result = assessMemoryWrite({
      participantId: "p1",
      scope: "session",
      memoryClass: "prohibited",
      key: "anything",
      valueJson: { x: 1 },
      writtenByModel: false,
      participantConfirmed: true,
    });
    expect(result.verdict).toBe("denied");
    if (result.verdict === "denied")
      expect(result.code).toBe("prohibited_memory_class");
  });

  it("rejects auto-save from model output", () => {
    const result = assessMemoryWrite({
      participantId: "p1",
      scope: "participant_persistent",
      memoryClass: "preference",
      key: "communication_style",
      valueJson: { style: "plain" },
      writtenByModel: true,
      participantConfirmed: true,
    });
    expect(result.verdict).toBe("denied");
    if (result.verdict === "denied")
      expect(result.code).toBe("auto_save_from_model_output");
  });

  it("rejects prohibited-topic keys even in allow-listed class", () => {
    const result = assessMemoryWrite({
      participantId: "p1",
      scope: "session",
      memoryClass: "preference",
      key: "medical_diagnosis_summary",
      valueJson: { text: "..." },
      writtenByModel: false,
      participantConfirmed: true,
    });
    expect(result.verdict).toBe("denied");
    if (result.verdict === "denied")
      expect(result.code).toBe("prohibited_memory_class");
  });

  it("participant-persistent requires explicit confirmation", () => {
    const result = assessMemoryWrite({
      participantId: "p1",
      scope: "participant_persistent",
      memoryClass: "preference",
      key: "communication_style",
      valueJson: { style: "plain" },
      writtenByModel: false,
      participantConfirmed: false,
    });
    expect(result.verdict).toBe("denied");
    if (result.verdict === "denied")
      expect(result.code).toBe("not_participant_confirmed");
  });

  it("allows a well-formed participant-confirmed write", () => {
    const result = assessMemoryWrite({
      participantId: "p1",
      scope: "participant_persistent",
      memoryClass: "preference",
      key: "communication_style",
      valueJson: { style: "plain" },
      writtenByModel: false,
      participantConfirmed: true,
    });
    expect(result.verdict).toBe("allowed");
  });

  it("rejects missing key", () => {
    const result = assessMemoryWrite({
      participantId: "p1",
      scope: "session",
      memoryClass: "preference",
      key: "",
      valueJson: { x: 1 },
      writtenByModel: false,
      participantConfirmed: false,
    });
    expect(result.verdict).toBe("denied");
    if (result.verdict === "denied") expect(result.code).toBe("key_missing");
  });
});
