"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import {
  isEligibleAdRoute,
  pageContextFromPath,
} from "@/lib/ads/ad-page-eligibility";

export function useAdEligibility() {
  const pathname = usePathname() ?? "/";

  return useMemo(
    () => ({
      eligible: isEligibleAdRoute(pathname),
      pageContext: pageContextFromPath(pathname),
      pathname,
    }),
    [pathname],
  );
}
