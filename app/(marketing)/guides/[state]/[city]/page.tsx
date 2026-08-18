import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";

import { getLocalAccessHrefForCity } from "@/lib/demo/local-access-pages";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  mapablePublicCardClass,
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSecondaryButtonClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";
import {
  accessGuideDownloads,
  accessGuideStatusLabel,
  accessGuides,
  getAccessGuideBySlug,
} from "@/lib/resources/access-guides-data";

type GuidePageProps = {
  params: Promise<{ state: string; city: string }>;
};

export function generateStaticParams() {
  return accessGuides.map((guide) => ({
    state: guide.stateSlug,
    city: guide.citySlug,
  }));
}

export async function generateMetadata({ params }: GuidePageProps) {
  const { state, city } = await params;
  const guide = getAccessGuideBySlug(state, city);
  if (!guide) {
    return { title: "Access Guide | MapAble" };
  }
  return {
    title: `${guide.city} Accessibility Guide | MapAble`,
    description: guide.launchAngle,
  };
}

export default async function AccessGuidePage({ params }: GuidePageProps) {
  const { state, city } = await params;
  const guide = getAccessGuideBySlug(state, city);
  if (!guide) {
    notFound();
  }

  const localHref = getLocalAccessHrefForCity(guide.city);

  return (
    <div className="bg-white text-[#0C1833]">
      <section className="relative overflow-hidden border-b border-slate-200 bg-[#F6FBFC]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-64 w-64 rounded-full bg-[#F8C51C]/25 blur-3xl"
        />
        <div
          className={`${mapablePublicPageContainerClass} relative py-14 sm:py-20`}
        >
          <p className={mapablePublicEyebrowClass}>
            Local Access Guides · {guide.state} · {guide.guideType}
          </p>
          <h1 className={`${mapablePublicTitleClass} mt-3`}>
            {guide.city} Accessibility Guide
          </h1>
          <p className={mapablePublicLeadClass}>{guide.launchAngle}</p>
          <p className="mt-4 text-sm font-semibold text-slate-600">
            Status: {accessGuideStatusLabel(guide)}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={accessGuideDownloads.pdf}
              download
              className={mapablePublicPrimaryButtonClass}
            >
              Download Australia guides pack (PDF)
            </a>
            {localHref ? (
              <Link href={localHref} className={mapablePublicSecondaryButtonClass}>
                Local access page
              </Link>
            ) : null}
            <Link href="/guides" className={mapablePublicSecondaryButtonClass}>
              All Local Access Guides
            </Link>
            <Link
              href="/accessibility-map"
              className={mapablePublicSecondaryButtonClass}
            >
              Open accessibility map
            </Link>
          </div>
        </div>
      </section>

      <section className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
        <article className={mapablePublicCardClass}>
          <h2 className="text-lg font-black text-[#0C1833]">
            First mapping missions
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            {guide.mappingMissions.map((mission) => (
              <li key={mission}>{mission}</li>
            ))}
          </ul>
        </article>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className={mapablePublicCardClass}>
            <h2 className="text-lg font-black text-[#0C1833]">Guide pack</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Capital starter content and national accessibility references live
              in the MapAble Accessibility Guides Australia pack. Download PDF
              or Word from the resource hub.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={accessGuideDownloads.pdf}
                download
                className={`font-medium text-[#005B7F] underline ${mapableCareFocusRing}`}
              >
                PDF
              </a>
              <a
                href={accessGuideDownloads.docx}
                download
                className={`font-medium text-[#005B7F] underline ${mapableCareFocusRing}`}
              >
                Word
              </a>
            </div>
          </article>
          <article className={mapablePublicCardClass}>
            <h2 className="text-lg font-black text-[#0C1833]">Related</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              {localHref ? (
                <li>
                  <Link
                    href={localHref}
                    className="font-medium text-primary hover:underline"
                  >
                    {guide.city} local access page
                  </Link>
                </li>
              ) : null}
              <li>
                <Link
                  href="/accessibility-map"
                  className="font-medium text-primary hover:underline"
                >
                  Accessibility map
                </Link>
              </li>
              <li>
                <Link
                  href="/accessibility-statement"
                  className="font-medium text-primary hover:underline"
                >
                  Accessibility statement
                </Link>
              </li>
              <li>
                <Link
                  href="/resources"
                  className="font-medium text-primary hover:underline"
                >
                  Resource hub
                </Link>
              </li>
            </ul>
          </article>
        </div>

        <p className="mt-8 text-sm text-slate-600" role="note">
          Access information changes and should be confirmed before travelling.
        </p>
      </section>
    </div>
  );
}
