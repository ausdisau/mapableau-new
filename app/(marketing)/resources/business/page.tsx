import type { Metadata } from "next";
import React from "react";

import { BusinessAccessSelfCheckCTA } from "@/components/resources/business/BusinessAccessSelfCheckCTA";
import { BusinessAccessStatementCTA } from "@/components/resources/business/BusinessAccessStatementCTA";
import { BusinessBarrierCategoryGrid } from "@/components/resources/business/BusinessBarrierCategoryGrid";
import { BusinessDisclaimerPanel } from "@/components/resources/business/BusinessDisclaimerPanel";
import { BusinessResourceExternalLinks } from "@/components/resources/business/BusinessResourceExternalLinks";
import { BusinessResourcesExplorer } from "@/components/resources/business/BusinessResourcesExplorer";
import { BusinessResourcesHero } from "@/components/resources/business/BusinessResourcesHero";
import { mapablePublicPageContainerClass } from "@/lib/marketing/public-page-styles";
import { businessResources } from "@/lib/resources/business-resources-data";

export const metadata: Metadata = {
  title: "Business Access Resources | MapAble",
  description:
    "Practical MapAble resources to help businesses, venues, providers and employers reduce access barriers.",
  alternates: { canonical: "/resources/business" },
};

export default function BusinessResourcesHubPage() {
  return (
    <main className="bg-white text-[#0C1833]">
      <BusinessResourcesHero />
      <div
        className={`${mapablePublicPageContainerClass} space-y-12 py-12 sm:py-16`}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <BusinessAccessSelfCheckCTA />
          <BusinessAccessStatementCTA />
        </div>

        <BusinessBarrierCategoryGrid />

        <BusinessResourcesExplorer resources={businessResources} />

        <BusinessResourceExternalLinks />

        <BusinessDisclaimerPanel />
      </div>
    </main>
  );
}
