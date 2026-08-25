/** @vitest-environment jsdom */

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { HomeExperiment } from "@/components/labs/HomeExperiment";

afterEach(() => cleanup());

describe("Home Lab experiment accessibility", () => {
  it("exposes response modes as a radiogroup with accessible names", () => {
    render(<HomeExperiment />);
    const group = screen.getByRole("radiogroup", { name: "Home response mode" });
    expect(within(group).getAllByRole("radio").length).toBe(4);
    expect(screen.getByRole("radio", { name: /Report only/i })).toBeTruthy();
  });

  it("supports starting the simulated leave-home check", async () => {
    const user = userEvent.setup();
    render(<HomeExperiment />);
    await user.click(screen.getByRole("radio", { name: /Recommend/i }));
    await user.click(
      screen.getByRole("button", { name: /Start simulated leave-home check/i }),
    );
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("exposes simplified and reduced-motion preferences", async () => {
    const user = userEvent.setup();
    render(<HomeExperiment />);
    await user.click(screen.getByLabelText(/Simplified mode/i));
    await user.click(screen.getByLabelText(/Prefer reduced motion/i));
    expect(
      (screen.getByLabelText(/Simplified mode/i) as HTMLInputElement).checked,
    ).toBe(true);
    expect(
      (screen.getByLabelText(/Prefer reduced motion/i) as HTMLInputElement)
        .checked,
    ).toBe(true);
  });

  it("shows claim labels for simulation boundaries", () => {
    render(<HomeExperiment />);
    const claims = screen.getByLabelText("Claim labels");
    expect(claims.textContent).toMatch(/SIMULATION/i);
  });
});
