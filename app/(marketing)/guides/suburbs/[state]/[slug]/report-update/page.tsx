import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";

import { SuburbGuideReportForm } from "@/components/guides/suburb/SuburbGuideReportForm";
import { SuburbGuideSection } from "@/components/guides/suburb/SuburbGuideSection";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicPageContainerClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";
import {
  getSuburbGuideByStateSlug,
  suburbAccessGuides,
  SUBURB_GUIDE_DISCLAIMER,
} from "@/lib/resources/suburb-access-guides-data";

type SuburbGuideReportPageProps = {
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
}: SuburbGuideReportPageProps): Promise<Metadata> {
  const { state, slug } = await params;
  const guide = getSuburbGuideByStateSlug(state, slug);
  if (!guide) {
    return { title: "Report suburb guide update | MapAble" };
  }
  return {
    title: `Report update · ${guide.name} | MapAble`,
    description: `Report an access update for the ${guide.name} suburb Access Guide.`,
    alternates: { canonical: guide.reportHref },
    robots: { index: false, follow: true },
  };
}

export default async function SuburbGuideReportPage({
  params,
}: SuburbGuideReportPageProps) {
  const { state, slug } = await params;
  const guide = getSuburbGuideByStateSlug(state, slug);
  if (!guide) {
    notFound();
  }

  return (
    <main className="bg-white text-[#0C1833]">
      <header className="border-b border-slate-200 bg-[#F6FBFC]">
        <div className={`${mapablePublicPageContainerClass} py-14 sm:py-20`}>
          <p className={mapablePublicEyebrowClass}>
            Report an update · {guide.name}
          </p>
          <h1 className={`${mapablePublicTitleClass} mt-3`}>
            Report an access update for {guide.name}
          </h1>
          <p className={mapablePublicLeadClass}>
            Tell MapAble about toilet changes, transport gaps, drop-off points,
            quiet spaces or hazards in this locality. Reports improve planning
            notes — they do not create a guarantee of access.
          </p>
          <div className="mt-8">
            <Link
              href={guide.href}
              className={`inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#005B7F] ${mapableCareFocusRing}`}
            >
              Back to suburb guide
            </Link>
          </div>
        </div>
      </header>

      <div
        className={`${mapablePublicPageContainerClass} space-y-6 py-12 sm:py-16`}
      >
        <SuburbGuideSection id="what-to-include" title="What to include">
          <ul className="list-disc space-y-2 pl-5">
            <li>Suburb / SAL code if you know it ({guide.salCode}).</li>
            <li>
              What changed (toilet, transport, parking, quiet space, hazard).
            </li>
            <li>When you observed it.</li>
            <li>Whether the note is still provisional.</li>
          </ul>
        </SuburbGuideSection>

        <SuburbGuideReportForm guide={guide} />

        <SuburbGuideSection id="disclaimer" title="Disclaimer" tone="warning">
          <p>{SUBURB_GUIDE_DISCLAIMER}</p>
        </SuburbGuideSection>
      </div>
    </main>
  );
}
