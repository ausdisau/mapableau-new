/**
 * @vitest-environment jsdom
 */
import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";

import { AccessibleAutocomplete } from "@/components/search/AccessibleAutocomplete";
import { buildLiveRegionMessage } from "@/lib/search/autocomplete-service";

afterEach(() => {
  cleanup();
});

describe("AccessibleAutocomplete", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          groups: {
            providers: [],
            services: [
              {
                id: "s1",
                type: "service",
                typeLabel: "Service",
                label: "Physiotherapy",
                value: "Physiotherapy",
              },
            ],
            locations: [],
            accessibilityFeatures: [],
            languages: [],
            popularSearches: [],
          },
        }),
      })) as unknown as typeof fetch,
    );
  });

  it("renders combobox with label", () => {
    render(
      <AccessibleAutocomplete
        label="Search services"
        context="homepage"
        value=""
        onChange={() => {}}
        debounceMs={0}
      />,
    );
    expect(screen.getByLabelText("Search services")).toBeTruthy();
  });

  it("announces minimum length in live region", () => {
    render(
      <AccessibleAutocomplete
        label="Search"
        context="homepage"
        value="p"
        onChange={() => {}}
        debounceMs={0}
      />,
    );
    const input = screen.getByLabelText("Search");
    const describedBy = input.getAttribute("aria-describedby") ?? "";
    const liveId = describedBy.split(" ").find((id) => id.endsWith("-live"));
    expect(document.getElementById(liveId ?? "")?.textContent).toMatch(
      /at least 2 characters/i,
    );
  });

  it("exposes combobox ARIA semantics on the input", () => {
    render(
      <AccessibleAutocomplete
        label="ARIA search"
        context="homepage"
        value=""
        onChange={() => {}}
        debounceMs={0}
      />,
    );
    const input = screen.getByLabelText("ARIA search");
    expect(input.getAttribute("role")).toBe("combobox");
    expect(input.getAttribute("aria-autocomplete")).toBe("list");
    expect(input.getAttribute("aria-expanded")).not.toBe("true");
  });

  it("fetches suggestions after minimum query length", async () => {
    const onChange = vi.fn();
    render(
      <AccessibleAutocomplete
        label="Fetch test"
        context="homepage"
        value="phys"
        onChange={onChange}
        debounceMs={0}
      />,
    );
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it("ArrowDown and Enter select active option", async () => {
    const onChange = vi.fn();
    const onSelect = vi.fn();
    render(
      <AccessibleAutocomplete
        label="Keyboard test"
        context="homepage"
        value="phys"
        onChange={onChange}
        onSelect={onSelect}
        debounceMs={0}
      />,
    );
    const input = screen.getByLabelText("Keyboard test");
    fireEvent.focus(input);
    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeTruthy();
    });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(onSelect).toHaveBeenCalled();
    });
  });

  it("Escape closes the suggestion list", async () => {
    render(
      <AccessibleAutocomplete
        label="Escape test"
        context="homepage"
        value="phys"
        onChange={() => {}}
        debounceMs={0}
      />,
    );
    const input = screen.getByLabelText("Escape test");
    fireEvent.focus(input);
    await waitFor(() => {
      expect(input.getAttribute("aria-expanded")).toBe("true");
    });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input.getAttribute("aria-expanded")).toBe("false");
  });

  it("shows no-results message when list is empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          groups: {
            providers: [],
            services: [],
            locations: [],
            accessibilityFeatures: [],
            languages: [],
            popularSearches: [],
          },
        }),
      })) as unknown as typeof fetch,
    );
    render(
      <AccessibleAutocomplete
        label="Empty test"
        context="homepage"
        value="zzzz"
        onChange={() => {}}
        debounceMs={0}
      />,
    );
    fireEvent.focus(screen.getByLabelText("Empty test"));
    await waitFor(() => {
      expect(screen.getByText(/no matches/i)).toBeTruthy();
    });
  });
});

describe("buildLiveRegionMessage integration", () => {
  it("matches component messaging", () => {
    expect(buildLiveRegionMessage(false, 2, "wheel")).toBe(
      "2 suggestions available.",
    );
  });
});
