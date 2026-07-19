"use client";

import { useEffect } from "react";

/**
 * After hydration, scroll hash targets into view with sticky-header offset.
 * Does not steal focus on ordinary loads (scroll only).
 */
export function HashScrollOffset() {
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;

    const scrollToTarget = () => {
      const el = document.getElementById(hash);
      if (!el) return false;
      el.scrollIntoView({ block: "start", behavior: "auto" });
      return true;
    };

    if (scrollToTarget()) return;

    const timeout = window.setTimeout(() => {
      scrollToTarget();
    }, 120);

    return () => window.clearTimeout(timeout);
  }, []);

  return null;
}
