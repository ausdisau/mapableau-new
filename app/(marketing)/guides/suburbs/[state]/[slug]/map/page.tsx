import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";

import { SuburbGuideMap } from "@/components/guides/suburb/SuburbGuideMap";
import { SuburbGuideSection } from "@/components/guides/suburb/SuburbGuideSection";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";
import {
  getSuburbGuideByStateSlug,
  isSuburbGuideIndexable,
  suburbAccessGuides,
  suburbGuideSectionHref,
  SUBURB_GUIDE_DISCLAIMER,
} from "@/lib/resources/suburb-access-guides-data";

type SuburbGuideMapPageProps = {
  params: Promise<{ state: string; slug: string }>;
};

export function generateStaticParams() {
  return suburbAccessGuides.map((guide) => ({
    state: guide.stateSlug,
    slug: guide.slug,
  }));
}

export async function generateMetadata({
  params,
}: SuburbGuideMapPageProps): Promise<Metadata> {
  const { state, slug } = await params;
  const guide = getSuburbGuideByStateSlug(state, slug);
  if (!guide) {
    return { title: "Suburb guide map | MapAble" };
  }
  return {
    title: `${guide.name} Access Guide map | MapAble`,
    description: `Map view for the ${guide.name} suburb Access Guide.`,
    alternates: { canonical: guide.mapHref },
    robots: isSuburbGuideIndexable(guide)
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

export default async function SuburbGuideMapPage({
  params,
}: SuburbGuideMapPageProps) {
  const { state, slug } = await params;
  const guide = getSuburbGuideByStateSlug(state, slug);
  if (!guide) {
    notFound();
  }

  const sections = [
    "toilets",
    "transport",
    "parking",
    "quiet-spaces",
    "accessible-venues",
    "hazards",
  ] as const;

  return (
    <div className="bg-white text-[#0C1833]">
      <header className="border-b border-slate-200 bg-[#F6FBFC]">
        <div className={`${mapablePublicPageContainerClass} py-14 sm:py-20`}>
          <p className={mapablePublicEyebrowClass}>
            Map view · {guide.name}, {guide.state}
          </p>
          <h1 className={`${mapablePublicTitleClass} mt-3`}>
            {guide.name} Access Guide map
          </h1>
          <p className={mapablePublicLeadClass}>
            Use map markers to jump into access themes. If the map fails, the
            section links below still work.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#map-section-list"
              className={`${mapablePublicPrimaryButtonClass} ${mapableCareFocusRing}`}
            >
              Skip map and browse guide list
            </a>
            <Link
              href={guide.href}
              className={`inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#005B7F] ${mapableCareFocusRing}`}
            >
              Full suburb guide
            </Link>
          </div>
        </div>
      </header>

      <div
        className={`${mapablePublicPageContainerClass} space-y-6 py-12 sm:py-16`}
      >
        <SuburbGuideMap guide={guide} />

        <section id="map-section-list" className="scroll-mt-24">
          <SuburbGuideSection id="map-sections" title="Guide sections">
            <ul className="list-disc space-y-2 pl-5">
              {sections.map((section) => (
                <li key={section}>
                  <Link
                    href={suburbGuideSectionHref(guide, section)}
                    className={`font-medium text-primary underline-offset-2 hover:underline ${mapableCareFocusRing}`}
                  >
                    {section}
                  </Link>
                </li>
              ))}
            </ul>
          </SuburbGuideSection>
        </section>

        <SuburbGuideSection id="disclaimer" title="Disclaimer" tone="warning">
          <p>{SUBURB_GUIDE_DISCLAIMER}</p>
        </SuburbGuideSection>
      </div>
    </div>
  );
}
