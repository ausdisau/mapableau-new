import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";

import {
  accessGuideDownloads,
  accessGuides,
  getAccessGuideBySlug,
} from "@/lib/resources/access-guides-data";
import { getResourceArticleBySlug } from "@/lib/resources/resource-articles-data";
import {
  mapablePublicCardClass,
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";

const CANBERRA_ITINERARY_SLUG =
  "sensory-friendly-canberra-half-day-itinerary";

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

  const isCanberraGuide = guide.citySlug === "canberra-accessibility-guide";
  const canberraItinerary = isCanberraGuide
    ? getResourceArticleBySlug(CANBERRA_ITINERARY_SLUG)
    : undefined;

  return (
    <div className="bg-white text-[#0C1833]">
      <section className="relative overflow-hidden border-b border-slate-200 bg-[#F6FBFC]">
        <div className={`${mapablePublicPageContainerClass} relative py-14 sm:py-20`}>
          <p className={mapablePublicEyebrowClass}>
            {guide.state} · {guide.guideType} · {guide.priorityTier}
          </p>
          <h1 className={`${mapablePublicTitleClass} mt-3`}>
            {guide.city} Accessibility Guide
          </h1>
          <p className={mapablePublicLeadClass}>{guide.launchAngle}</p>
          <p className="mt-4 text-sm font-semibold text-slate-600">
            Status: {guide.status}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {canberraItinerary ? (
              <Link
                href={canberraItinerary.href}
                className={mapablePublicPrimaryButtonClass}
              >
                Sensory-friendly half-day itinerary
              </Link>
            ) : (
              <a
                href={accessGuideDownloads.pdf}
                download
                className={mapablePublicPrimaryButtonClass}
              >
                Download Australia guides pack (PDF)
              </a>
            )}
            {canberraItinerary ? (
              <a
                href={accessGuideDownloads.pdf}
                download
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#005B7F] transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
              >
                Download Australia guides pack (PDF)
              </a>
            ) : null}
            <Link
              href="/resources#access-guides"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#005B7F] transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
            >
              Resource hub
            </Link>
            <Link
              href="/guides"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#005B7F] transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
            >
              All guides
            </Link>
          </div>
        </div>
      </section>

      <section className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
        {canberraItinerary ? (
          <Link
            href={canberraItinerary.href}
            className={`${mapablePublicCardClass} mb-6 block border-[#005B7F]/20 bg-[#F6FBFC] transition hover:border-[#005B7F]/40 hover:shadow-sm focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#005B7F]">
              Featured resource
            </p>
            <h2 className="mt-2 text-lg font-black text-[#0C1833]">
              {canberraItinerary.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              {canberraItinerary.description}
            </p>
            <p className="mt-4 text-sm font-bold text-[#005B7F]">
              Open itinerary
              <span aria-hidden="true"> →</span>
            </p>
          </Link>
        ) : null}

        <article className={mapablePublicCardClass}>
          <h2 className="text-lg font-black text-[#0C1833]">
            First mapping missions
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            {guide.mappingMissions.map((mission) => {
              const isCanberraItinerary =
                isCanberraGuide &&
                mission
                  .toLowerCase()
                  .includes("sensory-friendly canberra half-day itinerary");
              return (
                <li key={mission}>
                  {isCanberraItinerary && canberraItinerary ? (
                    <>
                      {mission}{" "}
                      <Link
                        href={canberraItinerary.href}
                        className="font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
                      >
                        Open the published itinerary
                      </Link>
                    </>
                  ) : (
                    mission
                  )}
                </li>
              );
            })}
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
                className="font-medium text-primary hover:underline"
              >
                PDF
              </a>
              <a
                href={accessGuideDownloads.docx}
                download
                className="font-medium text-primary hover:underline"
              >
                Word
              </a>
            </div>
          </article>
          <article className={mapablePublicCardClass}>
            <h2 className="text-lg font-black text-[#0C1833]">Related</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              {canberraItinerary ? (
                <li>
                  <Link
                    href={canberraItinerary.href}
                    className="font-medium text-primary hover:underline focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
                  >
                    {canberraItinerary.title}
                  </Link>
                </li>
              ) : null}
              <li>
                <Link
                  href="/access"
                  className="font-medium text-primary hover:underline"
                >
                  MapAble Access
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
      </section>
    </div>
  );
}
