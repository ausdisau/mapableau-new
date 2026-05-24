import { MapAbleMarketingFooter } from "@/components/brand/MapAbleMarketingFooter";
import { MapAbleMarketingHeader } from "@/components/brand/MapAbleMarketingHeader";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MapAble Provider Finder | Find accessible disability support",
  description:
    "Search disability support providers by support type, location, funding options and access needs. Compare care, transport, therapy, employment and home help in one place.",
  openGraph: {
    title: "MapAble Provider Finder | Find accessible disability support",
    description:
      "Search disability support providers by support type, location, funding options and access needs.",
    type: "website",
  },
};

export default function ProviderFinderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MapAbleMarketingHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <MapAbleMarketingFooter />
    </div>
  );
}
