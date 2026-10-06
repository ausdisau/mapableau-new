/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import {
  buildGoalPlanDraft,
  nextConversationalCandidate,
} from "@mapable/contracts";

import { GoalPlanPanel } from "@/components/goal-plan/GoalPlanPanel";

describe("GoalPlanPanel", () => {
  it("shows ordinary candidates as Not yet decided and one active C3 question", async () => {
    const user = userEvent.setup();
    const plan = buildGoalPlanDraft(
      "I want a support worker before work, a job at a library and transport there",
    );
    const onChange = vi.fn();

    render(<GoalPlanPanel plan={plan} onChange={onChange} />);

    expect(screen.getAllByText(/not yet decided/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(nextConversationalCandidate(plan)!.question),
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /^not sure$/i }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("always exposes human help and non-AI browse", () => {
    render(
      <GoalPlanPanel
        plan={buildGoalPlanDraft("I want a job")}
        onChange={() => {}}
      />,
    );

    expect(
      screen.getByRole("link", { name: /talk to a person/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /browse without ai/i }),
    ).toBeTruthy();
  });
});
