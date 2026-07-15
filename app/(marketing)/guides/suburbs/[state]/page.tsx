import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";

import { SuburbGuidesExplorer } from "@/components/guides/suburb/SuburbGuidesExplorer";
import { stateLabelFromSlug } from "@/lib/guides/suburb-guide-utils";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicMutedCardClass,
  mapablePublicPageContainerClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";
import {
  getSuburbGuideStates,
  getSuburbGuidesByState,
  SUBURB_GUIDE_DISCLAIMER,
} from "@/lib/resources/suburb-access-guides-data";

type StateSuburbGuidesPageProps = {
  params: Promise<{ state: string }>;
};

export function generateStaticParams() {
  return getSuburbGuideStates().map((state) => ({ state }));
}

export async function generateMetadata({
  params,
}: StateSuburbGuidesPageProps): Promise<Metadata> {
  const { state } = await params;
  const guides = getSuburbGuidesByState(state);
  if (guides.length === 0) {
    return { title: "Suburb Access Guides | MapAble" };
  }
  const label = stateLabelFromSlug(state);
  return {
    title: `${label} Suburb Access Guides | MapAble`,
    description: `MapAble suburb and locality Access Guides for ${label}.`,
    alternates: { canonical: `/guides/suburbs/${state}` },
  };
}

export default async function StateSuburbGuidesPage({
  params,
}: StateSuburbGuidesPageProps) {
  const { state } = await params;
  const guides = getSuburbGuidesByState(state);
  if (guides.length === 0) {
    notFound();
  }

  const label = stateLabelFromSlug(state);

  return (
    <main className="bg-white text-[#0C1833]">
      <header className="border-b border-slate-200 bg-[#F6FBFC]">
        <div className={`${mapablePublicPageContainerClass} py-14 sm:py-20`}>
          <p className={mapablePublicEyebrowClass}>Suburb Access Guides</p>
          <h1 className={`${mapablePublicTitleClass} mt-3`}>
            {label} Suburb Access Guides
          </h1>
          <p className={mapablePublicLeadClass}>
            Locality-level access planning notes for {label}, organised by ABS
            Suburbs and Localities (SAL). Draft pages stay clearly labelled.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/guides/suburbs"
              className={`inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#005B7F] ${mapableCareFocusRing}`}
            >
              All states
            </Link>
            <Link
              href="/guides"
              className={`inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#005B7F] ${mapableCareFocusRing}`}
            >
              Capital and regional guides
            </Link>
          </div>
        </div>
      </header>

      <div
        className={`${mapablePublicPageContainerClass} space-y-10 py-12 sm:py-16`}
      >
        <SuburbGuidesExplorer
          guides={guides}
          initialStateSlug={state}
          showStateLinks={false}
        />

        <aside
          className={`${mapablePublicMutedCardClass} border-amber-200 bg-amber-50`}
          role="note"
        >
          <h2 className="text-lg font-black text-amber-950">Disclaimer</h2>
          <p className="mt-3 text-sm leading-7 text-amber-950">
            {SUBURB_GUIDE_DISCLAIMER}
          </p>
        </aside>
      </div>
    </main>
  );
}
