"use client";

import React from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

/**
 * First MapAble-owned focusable control. Moves viewport and programmatic focus
 * to `#main-content` (must have tabIndex={-1} on the target main).
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className={`sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[#005B7F] focus:px-4 focus:py-3 focus:text-sm focus:font-black focus:text-white ${mapableCareFocusRing}`}
      onClick={(event) => {
        const main = document.getElementById("main-content");
        if (!main) return;
        event.preventDefault();
        main.focus({ preventScroll: false });
        main.scrollIntoView({ block: "start", behavior: "smooth" });
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", "#main-content");
        }
      }}
    >
      Skip to main content
    </a>
  );
}
