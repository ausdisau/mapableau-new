/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";

import { SkipToContent } from "@/components/core/SkipToContent";

afterEach(() => {
  cleanup();
});

describe("SkipToContent", () => {
  it("omits Skip to search by default", () => {
    render(<SkipToContent />);
    expect(screen.getByRole("link", { name: /Skip to main content/i })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Skip to search/i })).toBeNull();
  });

  it("includes Skip to search when requested", () => {
    render(<SkipToContent includeSearchSkip />);
    expect(
      screen.getByRole("link", { name: /Skip to search/i }).getAttribute("href"),
    ).toBe("#mapable-header-search");
  });
});
