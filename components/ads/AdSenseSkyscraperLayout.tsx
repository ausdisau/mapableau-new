"use client";

import type { ReactNode } from "react";

import { AdSlotSkyscraperLayout } from "@/components/ads/AdSlot";

type AdSenseSkyscraperLayoutProps = {
  children: ReactNode;
};

/**
 * Desktop skyscraper units on either side of the main body.
 * Uses first-party inventory first, then AdSense fallback.
 */
export function AdSenseSkyscraperLayout({ children }: AdSenseSkyscraperLayoutProps) {
  return <AdSlotSkyscraperLayout>{children}</AdSlotSkyscraperLayout>;
}
