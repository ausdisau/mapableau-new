/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LearningLabHub } from "@/components/access-intelligence/learning/learning-lab-hub";
import { ScenarioPracticeWorkspace } from "@/components/access-intelligence/learning/scenario-practice-workspace";
import { resetLearningRepositoryForTests } from "@/lib/access-intelligence/learning/repository";
import { getScenarioById } from "@/lib/access-intelligence/learning/scenarios";

const scenario = getScenarioById("interview-level-three")!;

describe("learning lab a11y smoke", () => {
  beforeEach(() => {
    resetLearningRepositoryForTests();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/sessions") && init?.method === "POST") {
          const body = JSON.parse(String(init.body ?? "{}"));
          if (!body.action) {
            return Response.json({
              session: {
                id: "learn-test",
                userId: "demo",
                scenarioId: scenario.id,
                mode: "practice",
                stage: "orientation",
                hintLevel: 0,
                predictionOptionId: null,
                decisionOptionId: null,
                revisionOptionId: null,
                confidencePrediction: null,
                evidenceRevealed: false,
                eventTriggered: false,
                teachBackText: null,
                reflections: [],
                transferComplete: false,
                responses: [],
                rubricEvaluation: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              scenario,
            });
          }
          if (body.action === "advance") {
            return Response.json({
              session: {
                id: "learn-test",
                userId: "demo",
                scenarioId: scenario.id,
                mode: "practice",
                stage: "prediction",
                hintLevel: 0,
                predictionOptionId: null,
                decisionOptionId: null,
                revisionOptionId: null,
                confidencePrediction: null,
                evidenceRevealed: false,
                eventTriggered: false,
                teachBackText: null,
                reflections: [],
                transferComplete: false,
                responses: [],
                rubricEvaluation: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            });
          }
        }
        return Response.json({ error: "unhandled mock" }, { status: 500 });
      }),
    );
  });

  it("exposes Plan mode without requiring a lesson", () => {
    render(<LearningLabHub scenarios={[scenario]} />);
    const plan = screen.getByRole("link", { name: /Plan/i });
    expect(plan.getAttribute("href")).toBe("/access-intelligence");
  });

  it("announces stages to assistive technology via live region", async () => {
    render(<ScenarioPracticeWorkspace scenario={scenario} />);
    expect(await screen.findByRole("status")).toBeTruthy();
    expect(screen.getByLabelText(/Scenario progress/i)).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Accessible text map/i })).toBeTruthy();
  });

  it("supports keyboard-only continue from orientation", async () => {
    const user = userEvent.setup();
    render(<ScenarioPracticeWorkspace scenario={scenario} />);
    const continueBtn = await screen.findByRole("button", {
      name: /Continue to prediction/i,
    });
    continueBtn.focus();
    expect(document.activeElement).toBe(continueBtn);
    await user.keyboard("{Enter}");
    expect(
      await screen.findByRole("group", { name: /Confidence prediction/i }),
    ).toBeTruthy();
  });
});
