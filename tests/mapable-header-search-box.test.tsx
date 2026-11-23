/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MapAbleHeaderSearchBox } from "@/components/search/MapAbleHeaderSearchBox";
import {
  buildMapAbleSearchUrl,
  createDefaultSearchSelection,
} from "@/lib/search/mapable-search-ui";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn() }),
}));

afterEach(() => {
  cleanup();
  push.mockReset();
});

describe("MapAbleHeaderSearchBox", () => {
  it("blocks empty submit and keeps focus on the field", () => {
    render(<MapAbleHeaderSearchBox />);
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(screen.getByRole("alert").textContent).toMatch(/Enter a search/i);
    expect(push).not.toHaveBeenCalled();
  });

  it("navigates to /search Web Quick for a valid query", () => {
    render(<MapAbleHeaderSearchBox />);
    const input = screen.getByRole("searchbox", { name: /Search MapAble/i });
    fireEvent.change(input, { target: { value: "accessible transport" } });
    fireEvent.submit(input.closest("form")!);
    expect(push).toHaveBeenCalledWith(
      buildMapAbleSearchUrl(
        createDefaultSearchSelection({
          query: "accessible transport",
          presentation: "web",
          tier: "quick",
        }),
      ),
    );
  });

  it("builds the expected search URL helper for web quick", () => {
    expect(
      buildMapAbleSearchUrl(
        createDefaultSearchSelection({
          query: "physio",
          presentation: "web",
          tier: "quick",
        }),
      ),
    ).toBe("/search?q=physio");
  });

  it("Escape clears a nonempty draft", () => {
    render(<MapAbleHeaderSearchBox />);
    const input = screen.getByRole("searchbox", { name: /Search MapAble/i });
    fireEvent.change(input, { target: { value: "physio" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect((input as HTMLInputElement).value).toBe("");
  });
});
