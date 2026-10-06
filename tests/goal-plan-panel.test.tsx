/** @vitest-environment jsdom */
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildGoalPlanDraft,
  nextConversationalCandidate,
} from "@mapable/contracts";

import { GoalPlanPanel } from "@/components/goal-plan/GoalPlanPanel";

afterEach(() => {
  cleanup();
});

describe("GoalPlanPanel", () => {
  it("shows ordinary candidates as Not yet decided and one active C3 question", async () => {
    const user = userEvent.setup();
    const plan = buildGoalPlanDraft(
      "I want a support worker before work, a job at a library and transport there",
    );
    const onChange = vi.fn();

    render(<GoalPlanPanel plan={plan} onChange={onChange} />);

    expect(screen.getAllByText(/not yet decided/i).length).toBeGreaterThan(0);
    const active = nextConversationalCandidate(plan)!;
    expect(screen.getByText(active.question)).toBeTruthy();

    const activeChoices = screen.getByRole("group", {
      name: new RegExp(`choices for ${active.module}`, "i"),
    });
    await user.click(
      within(activeChoices).getByRole("button", { name: /^not sure$/i }),
    );
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("lets the participant decide ordinary candidates directly", async () => {
    const user = userEvent.setup();
    const plan = buildGoalPlanDraft(
      "I want a job and transport to work",
    );
    const onChange = vi.fn();

    render(<GoalPlanPanel plan={plan} onChange={onChange} />);

    const jobsChoices = screen.getByRole("group", {
      name: /choose whether to include jobs/i,
    });
    await user.click(
      within(jobsChoices).getByRole("button", { name: /^yes$/i }),
    );

    expect(jobsChoices).toBeTruthy();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0].serviceCandidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ module: "jobs", decision: "yes" }),
      ]),
    );
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
