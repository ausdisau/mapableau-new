// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ParticipantSupportPlanCard } from "@/components/crisis/ParticipantSupportPlanCard";

afterEach(cleanup);

describe("ParticipantSupportPlanCard", () => {
  it("states that the plan is local, optional and not a clinical assessment", () => {
    render(<ParticipantSupportPlanCard />);

    expect(screen.getByText(/stays on this device/i)).toBeTruthy();
    expect(screen.getByText(/not a risk score or clinical assessment/i)).toBeTruthy();
    expect(screen.getByText(/you can leave any section blank/i)).toBeTruthy();
  });

  it("creates a preview from selected sections only", () => {
    render(<ParticipantSupportPlanCard />);

    fireEvent.change(screen.getByLabelText(/^things i can try$/i), {
      target: { value: "Move somewhere quieter." },
    });
    fireEvent.change(screen.getByLabelText(/^people i choose to ask for support$/i), {
      target: { value: "Alex" },
    });

    fireEvent.click(screen.getByLabelText(/include things i can try/i));
    fireEvent.click(screen.getByRole("button", { name: /make private preview/i }));

    const preview = screen.getByTestId("support-plan-preview");
    expect(within(preview).getByText("Move somewhere quieter.")).toBeTruthy();
    expect(within(preview).queryByText("Alex")).toBeNull();
    expect(within(preview).getByText(/preview has not been sent/i)).toBeTruthy();
  });
});
