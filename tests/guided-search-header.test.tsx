/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";

import { GuidedSearch } from "@/components/marketing/mapable-care-shared";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/components/guided-search/GuidedSearchDialogue", () => ({
  GuidedSearchDialogue: ({ initialMessage }: { initialMessage?: string }) => (
    <div data-testid="guided-search-dialogue">
      {initialMessage ? `chat:${initialMessage}` : "chat"}
    </div>
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("GuidedSearch header launch", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("opens chat panel on submit instead of redirecting", () => {
    render(<GuidedSearch idSuffix="header" />);

    const input = screen.getByLabelText("Search MapAble");
    fireEvent.change(input, { target: { value: "support worker" } });
    fireEvent.submit(input.closest("form")!);

    expect(screen.getByTestId("guided-search-dialogue")).toBeTruthy();
    expect(screen.getByText("chat:support worker")).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });

  it("still redirects when query is too short", () => {
    render(<GuidedSearch idSuffix="header" />);

    const input = screen.getByLabelText("Search MapAble");
    fireEvent.change(input, { target: { value: "ot" } });
    fireEvent.submit(input.closest("form")!);

    expect(push).toHaveBeenCalled();
    expect(screen.queryByTestId("guided-search-dialogue")).toBeNull();
  });

  it("launches chat from popular search chip", () => {
    render(<GuidedSearch idSuffix="header" />);

    const input = screen.getByLabelText("Search MapAble");
    fireEvent.focus(input);

    const chip = screen.getByRole("button", {
      name: /Find a support worker who understands wheelchair access/i,
    });
    fireEvent.click(chip);

    expect(screen.getByTestId("guided-search-dialogue")).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });
});
