"use client";

import { AdSenseSkyscraperLayout } from "@/components/ads/AdSenseSkyscraperLayout";

export function AdSenseRootWrapper({ children }: { children: React.ReactNode }) {
  return <AdSenseSkyscraperLayout>{children}</AdSenseSkyscraperLayout>;
}
