"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import {
  isEligibleAdRoute,
  pageContextFromPath,
} from "@/lib/ads/ad-page-eligibility";
import { isAdSenseEnabled } from "@/lib/ads/adsense-config";

export function useAdEligibility() {
  const pathname = usePathname() ?? "/";

  return useMemo(() => {
    const adsConfigured = isAdSenseEnabled();
    const routeEligible = isEligibleAdRoute(pathname);
    return {
      eligible: adsConfigured && routeEligible,
      pageContext: pageContextFromPath(pathname),
      pathname,
    };
  }, [pathname]);
}
