/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { MobilityFuturesExperiment } from "@/components/labs/MobilityFuturesExperiment";
import { ScenarioPlayer } from "@/components/labs/ScenarioPlayer";
import { createInitialScenarioState } from "@/lib/labs/runtime";
import { mobilityFuturesScenario } from "@/lib/labs/experiments/mobility-futures";

afterEach(() => cleanup());

describe("Mobility Futures UI accessibility", () => {
  it("exposes autonomy modes as a radiogroup with accessible names", () => {
    render(<MobilityFuturesExperiment />);
    const group = screen.getByRole("radiogroup", { name: "Autonomy mode" });
    expect(within(group).getAllByRole("radio").length).toBe(4);
    expect(screen.getByRole("radio", { name: /Inform/i })).toBeTruthy();
  });

  it("supports keyboard operation of start and presentation controls", async () => {
    const user = userEvent.setup();
    render(<MobilityFuturesExperiment />);

    await user.click(screen.getByRole("radio", { name: /Suggest/i }));
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("button", { name: /Start simulated journey/i }));

    expect(screen.getByRole("status").textContent).toMatch(/Phase:/i);
    expect(screen.getByRole("heading", { name: "Agency Timeline" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Journey" })).toBeTruthy();
  });

  it("ChoicePanel options are buttons operable without canvas", async () => {
    const user = userEvent.setup();
    render(<MobilityFuturesExperiment />);
    await user.click(screen.getByRole("button", { name: /Start simulated journey/i }));

    // Advance to first decision if needed
    const continueBtn = screen.getByRole("button", { name: /^Continue$/i });
    if (!continueBtn.hasAttribute("disabled")) {
      await user.click(continueBtn);
    }

    const decision = await screen.findByRole("heading", { name: /Decision required/i });
    expect(decision).toBeTruthy();
    const options = screen.getAllByRole("button", { name: /Wait and reassess|Ask for another route|Continue with caution|I decide fully/i });
    expect(options.length).toBeGreaterThanOrEqual(1);
    await user.click(options[0]!);
    expect(screen.getByText(/Chose:/i)).toBeTruthy();
  });

  it("text presentation mode is available without WebGL", async () => {
    const user = userEvent.setup();
    render(<MobilityFuturesExperiment />);
    await user.click(screen.getByRole("radio", { name: "Text" }));
    await user.click(screen.getByRole("button", { name: /Start simulated journey/i }));
    expect(screen.getByText(/Starting point/i)).toBeTruthy();
  });

  it("reduced motion preference is toggleable", async () => {
    const user = userEvent.setup();
    const { container } = render(<MobilityFuturesExperiment />);
    await user.click(screen.getByLabelText(/Prefer reduced motion/i));
    expect(container.querySelector('[data-reduced-motion="true"]')).toBeTruthy();
  });

  it("320px-friendly layout uses fluid max width classes", () => {
    const { container } = render(<MobilityFuturesExperiment />);
    expect(container.querySelector(".max-w-7xl")).toBeTruthy();
    expect(container.querySelector(".min-w-0")).toBeTruthy();
  });
});

describe("ScenarioPlayer screen reader labels", () => {
  it("marks current step for assistive tech", () => {
    let state = createInitialScenarioState(mobilityFuturesScenario, "INFORM");
    state = {
      ...state,
      phase: "RUNNING",
      pathIndex: 1,
      currentNodeId: "path",
      runId: "r1",
    };
    render(<ScenarioPlayer scenario={mobilityFuturesScenario} state={state} />);
    expect(screen.getByRole("list", { name: "Journey nodes" })).toBeTruthy();
    const current = screen.getByText("Path").closest("li");
    expect(current?.getAttribute("aria-current")).toBe("step");
  });
});

describe("axe-oriented structure checks", () => {
  it("primary landmarks and headings exist for axe scoping", () => {
    render(<MobilityFuturesExperiment />);
    expect(screen.getByRole("heading", { level: 1, name: /Mobility Futures/i })).toBeTruthy();
    expect(screen.getByLabelText("Safety boundary")).toBeTruthy();
    expect(screen.getByLabelText("Experiment status")).toBeTruthy();
    // No canvas / WebGL requirement
    expect(document.querySelector("canvas")).toBeNull();
  });

  it("decision options include accessible descriptions", async () => {
    const user = userEvent.setup();
    render(<MobilityFuturesExperiment />);
    await user.click(screen.getByRole("button", { name: /Start simulated journey/i }));
    const continueBtn = screen.getByRole("button", { name: /^Continue$/i });
    if (!continueBtn.hasAttribute("disabled")) {
      fireEvent.click(continueBtn);
    }
    await screen.findByRole("heading", { name: /Decision required/i });
    const described = document.querySelectorAll("[aria-describedby]");
    expect(described.length).toBeGreaterThan(0);
  });

  it("landing state exposes labelled controls for axe scoping", () => {
    render(<MobilityFuturesExperiment />);
    expect(screen.getByRole("radiogroup", { name: "Autonomy mode" })).toBeTruthy();
    expect(screen.getByRole("radiogroup", { name: /Presentation/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Start simulated journey/i })).toBeTruthy();
    expect(document.querySelector("canvas")).toBeNull();
  });
});
