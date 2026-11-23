/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SkipToContent } from "@/components/core/SkipToContent";
import { SkipToSearchLink } from "@/components/core/SkipToSearchLink";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
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

describe("SkipToSearchLink", () => {
  function mockDisplay(wrapper: HTMLElement, display: string) {
    const real = window.getComputedStyle.bind(window);
    vi.spyOn(window, "getComputedStyle").mockImplementation((el) => {
      if (el === wrapper) {
        return {
          display,
          getPropertyValue: (name: string) => (name === "display" ? display : ""),
        } as CSSStyleDeclaration;
      }
      return real(el);
    });
  }

  it("does not open mobile search when the omnibox wrapper is already visible", () => {
    const wrapper = document.createElement("div");
    // Mimic desktop: Tailwind keeps `hidden` in classList while computed display is block.
    wrapper.className = "hidden min-[1100px]:block";
    const search = document.createElement("div");
    search.id = "mapable-header-search";
    wrapper.appendChild(search);
    document.body.appendChild(wrapper);

    const open = document.createElement("button");
    open.setAttribute("aria-controls", "mapable-header-search");
    open.setAttribute("aria-expanded", "false");
    open.setAttribute("aria-label", "Open search");
    const clickSpy = vi.fn();
    open.addEventListener("click", clickSpy);
    document.body.appendChild(open);

    mockDisplay(wrapper, "block");

    render(<SkipToSearchLink />);
    fireEvent.click(screen.getByRole("link", { name: /Skip to search/i }));
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("opens mobile search when the omnibox wrapper is display none", () => {
    const wrapper = document.createElement("div");
    wrapper.className = "hidden";
    const search = document.createElement("div");
    search.id = "mapable-header-search";
    wrapper.appendChild(search);
    document.body.appendChild(wrapper);

    const open = document.createElement("button");
    open.setAttribute("aria-controls", "mapable-header-search");
    open.setAttribute("aria-expanded", "false");
    open.setAttribute("aria-label", "Open search");
    const clickSpy = vi.fn();
    open.addEventListener("click", clickSpy);
    document.body.appendChild(open);

    mockDisplay(wrapper, "none");

    render(<SkipToSearchLink />);
    fireEvent.click(screen.getByRole("link", { name: /Skip to search/i }));
    expect(clickSpy).toHaveBeenCalled();
  });
});
