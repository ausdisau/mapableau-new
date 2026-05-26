/**
 * @vitest-environment jsdom
 */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HomeSearch } from "@/components/home/HomeSearch";
import { SearchTrustRow } from "@/components/search/SearchTrustRow";

const mockPush = vi.fn();
const jqueryAutocompleteMock = vi.hoisted(() => {
  type Entry = {
    element: HTMLInputElement;
    options?: JQueryUI.AutocompleteOptions;
    destroyed: boolean;
    events: string[];
    offEvents: string[];
  };

  const entries: Entry[] = [];

  function getEntry(element: HTMLInputElement) {
    let entry = entries.find((item) => item.element === element);
    if (!entry) {
      entry = {
        element,
        destroyed: false,
        events: [],
        offEvents: [],
      };
      entries.push(entry);
    }
    return entry;
  }

  const jquery = vi.fn((target: unknown) => {
    const entry = getEntry(target as HTMLInputElement);
    const api: Record<string, unknown> = {};

    api.autocomplete = vi.fn((arg?: unknown) => {
      if (arg === "instance") return {};
      if (arg === "destroy") {
        entry.destroyed = true;
        return api as unknown as JQuery<HTMLInputElement>;
      }
      if (arg === "disable" || arg === "enable") {
        return api as unknown as JQuery<HTMLInputElement>;
      }
      entry.options = arg as JQueryUI.AutocompleteOptions;
      entry.destroyed = false;
      return api as unknown as JQuery<HTMLInputElement>;
    });
    api.on = vi.fn((eventName: string) => {
      entry.events.push(eventName);
      return api as unknown as JQuery<HTMLInputElement>;
    });
    api.off = vi.fn((eventName?: string) => {
      entry.offEvents.push(eventName ?? "");
      return api as unknown as JQuery<HTMLInputElement>;
    });
    api.data = vi.fn((key: string) => {
      if (key === "ui-autocomplete" && entry.options && !entry.destroyed) {
        return {};
      }
      return undefined;
    });

    return api as unknown as JQuery<HTMLInputElement>;
  }) as unknown as JQueryStatic;

  return {
    entries,
    jquery,
    reset: () => {
      entries.splice(0, entries.length);
      vi.mocked(jquery).mockClear();
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/search/jquery-autocomplete-loader", () => ({
  loadJQueryAutocomplete: vi.fn(async () => jqueryAutocompleteMock.jquery),
}));

afterEach(() => {
  cleanup();
  mockPush.mockClear();
  vi.unstubAllGlobals();
  jqueryAutocompleteMock.reset();
});

describe("HomeSearch", () => {
  beforeEach(() => {
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
  });

  async function autocompleteEntryFor(label: string) {
    const input = screen.getByLabelText(label) as HTMLInputElement;

    await waitFor(() => {
      const entry = jqueryAutocompleteMock.entries.find(
        (item) => item.element === input,
      );
      expect(entry?.options).toBeTruthy();
    });

    return jqueryAutocompleteMock.entries.find(
      (item) => item.element === input,
    )!;
  }

  async function requestSuggestions(
    entry: {
      options?: JQueryUI.AutocompleteOptions;
    },
    term: string,
  ) {
    const source = entry.options?.source;
    expect(typeof source).toBe("function");

    return await new Promise<unknown[]>((resolve) => {
      (
        source as (
          request: { term: string },
          response: (items: unknown[]) => void,
        ) => void
      )({ term }, resolve);
    });
  }

  it("renders simplified search hierarchy", () => {
    render(<HomeSearch />);
    expect(screen.getByLabelText("Search for support")).toBeTruthy();
    expect(screen.getByLabelText("Postcode or suburb")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /find providers/i }),
    ).toBeTruthy();
  });

  it("populates primary search when a chip is selected", () => {
    render(<HomeSearch />);
    fireEvent.click(
      screen.getByRole("button", {
        name: /use suggested search: support worker near st ives/i,
      }),
    );
    const primary = screen.getByLabelText(
      "Search for support",
    ) as HTMLInputElement;
    expect(primary.value).toContain("Support worker near St Ives");
  });

  it("submits expected query parameters to provider finder", () => {
    render(<HomeSearch />);
    fireEvent.change(screen.getByLabelText("Search for support"), {
      target: { value: "occupational therapy" },
    });
    fireEvent.change(screen.getByLabelText("Postcode or suburb"), {
      target: { value: "Parramatta" },
    });
    fireEvent.click(screen.getByRole("button", { name: /find providers/i }));
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("/provider-finder?"),
    );
    const url = mockPush.mock.calls[0][0] as string;
    expect(url).toMatch(/q=occupational/);
    expect(url).toMatch(/location=Parramatta/);
  });

  it("requests homepage autocomplete suggestions through the shared route", async () => {
    render(<HomeSearch />);
    const entry = await autocompleteEntryFor("Search for support");
    await requestSuggestions(entry, "physio");

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "/api/search/autocomplete?q=physio&context=homepage&field=all",
        ),
        expect.objectContaining({ signal: expect.any(Object) }),
      );
    });
  });

  it("requests postcode autocomplete for the postcode field", async () => {
    render(<HomeSearch />);
    const entry = await autocompleteEntryFor("Postcode or suburb");
    await requestSuggestions(entry, "2150");

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "/api/search/autocomplete?q=2150&context=homepage&field=postcode",
        ),
        expect.objectContaining({ signal: expect.any(Object) }),
      );
    });
  });

  it("applies a jQuery UI location selection to the controlled postcode value", async () => {
    render(<HomeSearch />);
    const input = screen.getByLabelText(
      "Postcode or suburb",
    ) as HTMLInputElement;
    const entry = await autocompleteEntryFor("Postcode or suburb");
    const suggestion = {
      id: "loc-2150",
      type: "location",
      typeLabel: "Location",
      label: "Parramatta NSW 2150",
      value: "Parramatta NSW 2150",
      metadata: {
        suburb: "Parramatta",
        state: "NSW",
        postcode: "2150",
      },
    };

    entry.options?.select?.(
      { preventDefault: vi.fn() } as unknown as JQueryEventObject,
      {
        item: {
          label: suggestion.label,
          value: suggestion.value,
          typeLabel: suggestion.typeLabel,
          suggestion,
        },
      } as unknown as JQueryUI.AutocompleteUIParams,
    );

    await waitFor(() => {
      expect(input.value).toBe("Parramatta NSW 2150");
    });
  });

  it("destroys the jQuery UI autocomplete instance on unmount", async () => {
    const { unmount } = render(<HomeSearch />);
    const entry = await autocompleteEntryFor("Postcode or suburb");

    unmount();

    expect(entry.destroyed).toBe(true);
    expect(entry.offEvents).toContain(".mapableJqAutocomplete");
  });
});

describe("SearchTrustRow", () => {
  it("lists trust items with text labels", () => {
    render(<SearchTrustRow />);
    const list = screen.getByRole("list", {
      name: /how mapable search works/i,
    });
    expect(within(list).getByText(/accessibility-first search/i)).toBeTruthy();
    expect(within(list).getByText(/ndis-aware filters/i)).toBeTruthy();
  });
});
