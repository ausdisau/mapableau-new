"use client";

import React from "react";

const skipLinkClass =
  "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-16 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground";

/**
 * Skip link for marketing shells that mount `#mapable-header-search`.
 * On narrow viewports the omnibox may be collapsed; activation opens it first.
 */
export function SkipToSearchLink() {
  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    const target = document.getElementById("mapable-header-search");
    if (!target) {
      event.preventDefault();
      return;
    }

    const wrapper = target.parentElement;
    const isCollapsed =
      wrapper != null &&
      (wrapper.classList.contains("hidden") ||
        getComputedStyle(wrapper).display === "none");

    if (isCollapsed) {
      event.preventDefault();
      const openControl = document.querySelector<HTMLButtonElement>(
        'button[aria-controls="mapable-header-search"][aria-expanded="false"]',
      );
      openControl?.click();
      window.requestAnimationFrame(() => {
        document.getElementById("mapable-header-search-input")?.focus();
      });
      return;
    }

    // Allow native hash focus for the tabIndex=-1 search landmark.
  }

  return (
    <a
      href="#mapable-header-search"
      className={skipLinkClass}
      onClick={handleClick}
    >
      Skip to search
    </a>
  );
}
