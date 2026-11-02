import { describe, expect, it } from "vitest";

import {
  applyAction,
  seedWorkspace,
  seedWorkspaceWithRecognition,
} from "@mapable/adtunis-core";

describe("adtunis workspace safeguards", () => {
  it("never overwrites immutable raw recognition on confirm or correction", () => {
    const state = seedWorkspaceWithRecognition();
    const recognition = state.recognitions[0]!;
    const originalRaw = recognition.raw;

    applyAction(state, {
      type: "confirmExpression",
      id: recognition.id,
      text: "The words I meant",
    });
    applyAction(state, {
      type: "addCorrection",
      id: recognition.id,
      text: "The corrected example",
    });

    expect(recognition.raw).toBe(originalRaw);
    expect(recognition.confirmed).toBe("The words I meant");
    expect(state.corrections[0]?.original).toBe(originalRaw);
    expect(state.corrections[0]?.expression).toBe("The corrected example");
    expect(state.corrections).toHaveLength(1);
  });

  it("allows typed or AAC confirmation without capture or microphone", () => {
    const state = seedWorkspace();
    const countBefore = state.recognitions.length;

    applyAction(state, {
      type: "confirmExpression",
      text: "Typed AAC expression",
    });

    expect(state.captureState).toBe("idle");
    expect(state.recognitions).toHaveLength(countBefore + 1);
    expect(state.recognitions[0]?.raw).toBe("");
    expect(state.recognitions[0]?.confirmed).toBe("Typed AAC expression");
    expect(state.message.toLowerCase()).toContain("microphone");
  });

  it("keeps consent choices independent through JSON reload", () => {
    const state = seedWorkspace();
    applyAction(state, {
      type: "saveConsent",
      consent: {
        transcription: false,
        personalisation: true,
        research: false,
      },
    });

    const reloaded = JSON.parse(JSON.stringify(state));
    expect(reloaded.consent).toEqual({
      transcription: false,
      personalisation: true,
      research: false,
    });
    expect(reloaded.captureState).toBe("idle");
  });

  it("saves a correction without starting training", () => {
    const state = seedWorkspaceWithRecognition();
    applyAction(state, {
      type: "addCorrection",
      id: state.recognitions[0]!.id,
      text: "A saved correction",
    });
    expect(state.corrections[0]?.trainingStatus).toBe("available");
    expect(state.recognitions[0]?.raw).toBe("Can we meet in the garden");
  });

  it("blocks capture without transcription consent", () => {
    const state = seedWorkspace();
    expect(() => applyAction(state, { type: "startCapture" })).toThrow(
      /transcription consent/i,
    );
  });

  it("resets consent on deleteData while retaining accessibility", () => {
    const state = seedWorkspace();
    state.accessibility = {
      fontScale: 1.5,
      highContrast: true,
      reducedMotion: true,
      switchNavigation: true,
    };
    state.consent = {
      transcription: true,
      personalisation: true,
      research: true,
    };
    const clean = applyAction(state, { type: "deleteData" });
    expect(clean.recognitions).toHaveLength(0);
    expect(clean.consent).toEqual({
      transcription: false,
      personalisation: false,
      research: false,
    });
    expect(clean.accessibility).toEqual(state.accessibility);
  });
});
