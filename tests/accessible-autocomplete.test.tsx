/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { AccessibleAutocomplete } from "@/components/search/AccessibleAutocomplete";
import { buildLiveRegionMessage } from "@/lib/search/autocomplete-service";

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
});

describe("buildLiveRegionMessage integration", () => {
  it("matches component messaging", () => {
    expect(buildLiveRegionMessage(false, 2, "wheel")).toBe(
      "2 suggestions available.",
    );
  });
});
