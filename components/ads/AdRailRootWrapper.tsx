"use client";

import { AdRailLayout } from "@/components/ads/AdRailLayout";

export function AdRailRootWrapper({ children }: { children: React.ReactNode }) {
  return <AdRailLayout>{children}</AdRailLayout>;
}
