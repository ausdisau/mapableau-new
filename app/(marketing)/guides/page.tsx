import Link from "next/link";
import React from "react";

import { GuidesMapExplorer } from "@/components/guides/GuidesMapExplorer";
import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";
import {
  mapablePublicEyebrowClass,
  mapablePublicPageContainerClass,
} from "@/lib/marketing/public-page-styles";
import {
  accessGuides,
  getCapitalAccessGuides,
} from "@/lib/resources/access-guides-data";

export const metadata = {
  title: "Access Guides | MapAble",
  description:
    "MapAble Access Guides for Australian capital cities and regional locations — practical accessibility planning for visitors and locals.",
};

export default function GuidesIndexPage() {
  const capitalGuides = getCapitalAccessGuides();
  const regionalCount = accessGuides.length - capitalGuides.length;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.mapable.com.au";

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "MapAble Access Guides",
    numberOfItems: accessGuides.length,
    itemListElement: accessGuides.map((guide, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: guide.title,
      url: `${baseUrl}${guide.href}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <PublicInfoPage
        eyebrow="Access Guides"
        title="Accessibility guides for cities and towns across Australia."
        description="Capital starter guides are drafted first. Regional Tier 1–3 guides need local verification of beach access, transport, toilets, gradients and quiet routes."
        ctaLabel="Back to resources"
        ctaHref="/resources"
        sections={[
          {
            title: "How to use these guides",
            content: (
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  Start with a capital city guide for visitor-facing day planning.
                </li>
                <li>
                  Browse{" "}
                  <Link
                    href="/guides/suburbs"
                    className="font-semibold text-primary underline-offset-2 hover:underline"
                  >
                    Suburb Access Guides
                  </Link>{" "}
                  for locality-level planning notes organised by ABS Suburbs and
                  Localities (SAL).
                </li>
                <li>
                  Download the full Australia guide pack (PDF or Word) from the
                  downloads beneath the map.
                </li>
                <li>
                  Regional guides flag mapping missions that still need local
                  verification before they are treated as complete.
                </li>
                <li>
                  Use the map for location-first discovery, or skip straight to
                  the full guide list below.
                </li>
              </ul>
            ),
          },
          {
            title: "Guide coverage",
            content: (
              <p>
                {capitalGuides.length} capital starter guides and{" "}
                {regionalCount} regional guides across all states and
                territories, plus a growing national set of suburb and locality
                guides. Status labels show whether a guide is drafted, partner
                supplied, community reported or needs local verification.
              </p>
            ),
          },
          {
            title: "Suburb and locality guides",
            content: (
              <p>
                Looking for a specific suburb? Open the{" "}
                <Link
                  href="/guides/suburbs"
                  className="font-semibold text-primary underline-offset-2 hover:underline"
                >
                  national Suburb Access Guides
                </Link>{" "}
                index. Draft locality pages stay clearly labelled and are not
                indexed until they have enough useful content.
              </p>
            ),
          },
        ]}
      />

      <section
        id="guides-map-explorer"
        className="border-b border-slate-200 bg-[#F6FBFC]"
        aria-labelledby="guides-map-explorer-heading"
      >
        <div className={`${mapablePublicPageContainerClass} py-12 lg:py-16`}>
          <p className={mapablePublicEyebrowClass}>Interactive map</p>
          <h2
            id="guides-map-explorer-heading"
            className="mt-2 text-2xl font-black tracking-tight text-mapable-navy sm:text-3xl"
          >
            Explore Access Guides on the map
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Select a city or town marker to open its MapAble Access Guide.
            Status labels show whether a guide is drafted, partner supplied,
            community reported or needs local verification.
          </p>
          <div className="mt-8">
            <GuidesMapExplorer guides={accessGuides} />
          </div>
        </div>
      </section>
    </>
  );
}
