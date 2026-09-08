/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AskMapAbleChoiceChips } from "@/components/ask-mapable/AskMapAbleChoiceChips";

afterEach(() => {
  cleanup();
});

describe("AskMapAbleChoiceChips", () => {
  const choices = [
    { id: "plan", label: "Plan my day" },
    { id: "support", label: "Find support" },
    { id: "travel", label: "Get somewhere" },
    { id: "schedule", label: "Check my schedule" },
    { id: "other", label: "Something else" },
  ];

  it("uses progressive disclosure without removing free choice", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <AskMapAbleChoiceChips
        choices={choices}
        onSelect={onSelect}
        maxVisible={3}
        ariaLabel="Suggested ways to start"
      />,
    );

    expect(screen.getByRole("group", { name: /suggested ways to start/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Plan my day" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Check my schedule" })).toBeNull();

    const more = screen.getByRole("button", { name: /more choices \(2\)/i });
    expect(more.getAttribute("aria-expanded")).toBe("false");
    await user.click(more);

    expect(screen.getByRole("button", { name: "Check my schedule" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Something else" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /fewer choices/i }).getAttribute("aria-expanded")).toBe("true");

    await user.click(screen.getByRole("button", { name: "Get somewhere" }));
    expect(onSelect).toHaveBeenCalledWith({ id: "travel", label: "Get somewhere" });
  });
});
