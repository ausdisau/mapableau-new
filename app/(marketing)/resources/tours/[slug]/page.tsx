import Link from "next/link";
import { notFound } from "next/navigation";
import React, { type ReactNode } from "react";

import { PrintChecklistButton } from "@/components/resources/PrintChecklistButton";
import { ReportUpdateCTA } from "@/components/tours/ReportUpdateCTA";
import { TourMapAndList } from "@/components/tours/TourMapAndList";
import { TourQuickFacts } from "@/components/tours/TourQuickFacts";
import { TourStopCard } from "@/components/tours/TourStopCard";
import { VerificationBadge } from "@/components/tours/VerificationBadge";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  mapablePublicCardClass,
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicMutedCardClass,
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";
import {
  getTourBySlug,
  tours,
} from "@/lib/resources/tours-data";

type TourDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return tours.map((tour) => ({ slug: tour.slug }));
}

export async function generateMetadata({ params }: TourDetailPageProps) {
  const { slug } = await params;
  const tour = getTourBySlug(slug);
  if (!tour) {
    return { title: "Tour | MapAble" };
  }
  return {
    title: `${tour.title} | MapAble Tours`,
    description: tour.summary,
  };
}

function SectionCard({
  id,
  title,
  children,
  tone = "default",
}: {
  id: string;
  title: string;
  children: ReactNode;
  tone?: "default" | "soft" | "warning";
}) {
  const toneClass =
    tone === "warning"
      ? "border-amber-200 bg-amber-50"
      : tone === "soft"
        ? mapablePublicMutedCardClass
        : mapablePublicCardClass;

  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`${toneClass} scroll-mt-24`}
    >
      <h2
        id={`${id}-heading`}
        className="text-lg font-black text-[#0C1833] sm:text-xl"
      >
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
        {children}
      </div>
    </section>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-7 text-slate-700">
          <span
            className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-[#005B7F]/40 bg-white text-[0.65rem] font-black text-[#005B7F]"
            aria-hidden="true"
          >
            ☐
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function TourDetailPage({ params }: TourDetailPageProps) {
  const { slug } = await params;
  const tour = getTourBySlug(slug);
  if (!tour) {
    notFound();
  }

  return (
    <div className="bg-white text-[#0C1833] print:bg-white">
      <header className="relative overflow-hidden border-b border-slate-200 bg-[#F6FBFC] print:border-b print:bg-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-64 w-64 rounded-full bg-[#F8C51C]/25 blur-3xl motion-reduce:hidden print:hidden"
        />
        <div
          className={`${mapablePublicPageContainerClass} relative py-14 sm:py-20`}
        >
          <p className={mapablePublicEyebrowClass}>
            MapAble Tours · {tour.city}, {tour.state}
          </p>
          <h1 className={`${mapablePublicTitleClass} mt-3`}>{tour.title}</h1>
          <p className={mapablePublicLeadClass}>{tour.summary}</p>
          <div className="mt-8 flex flex-wrap gap-3 print:hidden">
            <a
              href="#accessible-itinerary"
              className={`${mapablePublicPrimaryButtonClass} ${mapableCareFocusRing}`}
            >
              Jump to list-view itinerary
            </a>
            {tour.checklistDownloadHref ? (
              <a
                href={tour.checklistDownloadHref}
                download
                className={`inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#005B7F] transition hover:bg-slate-50 ${mapableCareFocusRing}`}
              >
                Download printable checklist
              </a>
            ) : null}
            <PrintChecklistButton label="Print itinerary" />
            <Link
              href="/resources/tours"
              className={`inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#005B7F] transition hover:bg-slate-50 ${mapableCareFocusRing}`}
            >
              All tours
            </Link>
          </div>
        </div>
      </header>

      <div
        className={`${mapablePublicPageContainerClass} space-y-6 py-12 sm:py-16`}
      >
        <TourQuickFacts tour={tour} />

        <TourMapAndList tour={tour} />

        <section id="stops" aria-labelledby="stops-heading" className="space-y-4">
          <h2
            id="stops-heading"
            className="text-lg font-black text-[#0C1833] sm:text-xl"
          >
            Stops
          </h2>
          <div className="grid gap-4">
            {tour.stops.map((stop) => (
              <TourStopCard key={stop.id} stop={stop} />
            ))}
          </div>
        </section>

        <SectionCard id="route-notes" title="Route notes">
          <ul className="list-disc space-y-2 pl-5">
            {tour.routeNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          id="facilities"
          title="Toilets, parking, drop-off and quiet spaces"
        >
          {tour.stops.map((stop) => (
            <div key={stop.id} className="rounded-2xl border border-slate-200 p-4">
              <h3 className="text-base font-black text-[#0C1833]">
                {stop.name}
              </h3>
              <h4 className="mt-3 text-sm font-black text-[#0C1833]">Toilets</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {stop.facilities.toilets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <h4 className="mt-3 text-sm font-black text-[#0C1833]">Parking</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {stop.facilities.parking.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <h4 className="mt-3 text-sm font-black text-[#0C1833]">
                Drop-off
              </h4>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {stop.facilities.dropOff.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <h4 className="mt-3 text-sm font-black text-[#0C1833]">
                Quiet spaces
              </h4>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {stop.facilities.quietSpaces.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </SectionCard>

        <SectionCard
          id="sensory-checklist"
          title="Sensory preparation checklist"
        >
          <p>
            Pack for your senses first. A calm bag can make transitions easier
            than any perfect timetable.
          </p>
          <Checklist items={tour.sensoryChecklist} />
          <div className="mt-6 flex flex-wrap gap-3 print:hidden">
            {tour.checklistDownloadHref ? (
              <a
                href={tour.checklistDownloadHref}
                download
                className={`${mapablePublicPrimaryButtonClass} ${mapableCareFocusRing}`}
              >
                Download printable checklist
              </a>
            ) : null}
            <PrintChecklistButton label="Print full itinerary" />
          </div>
        </SectionCard>

        <SectionCard id="transport-notes" title="Transport notes">
          <ul className="list-disc space-y-2 pl-5">
            {tour.transportNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          <p>
            <Link
              href="/transport"
              className={`font-medium text-primary underline-offset-2 hover:underline ${mapableCareFocusRing}`}
            >
              Explore MapAble Transport
            </Link>
          </p>
        </SectionCard>

        <SectionCard
          id="fallback-plan"
          title="Low-transition alternative"
          tone="soft"
        >
          <p>{tour.fallbackPlan}</p>
          <ul className="list-disc space-y-2 pl-5">
            {tour.safetyNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          id="carer-notes"
          title="Support worker / carer notes"
        >
          <Checklist items={tour.supportWorkerNotes} />
        </SectionCard>

        <section
          id="verification"
          aria-labelledby="verification-heading"
          className="space-y-4"
        >
          <h2
            id="verification-heading"
            className="text-lg font-black text-[#0C1833] sm:text-xl"
          >
            Verification status and last checked date
          </h2>
          <VerificationBadge verification={tour.verification} />
        </section>

        <ReportUpdateCTA tourSlug={tour.slug} />

        <SectionCard id="disclaimer" title="Disclaimer" tone="warning">
          <p>{tour.disclaimer}</p>
          <p>
            MapAble does not replace emergency services, legal advice, clinical
            advice, safeguarding authorities, or NDIS funding decisions. If
            someone is in immediate danger, call 000.
          </p>
        </SectionCard>

        <section
          className={`${mapablePublicMutedCardClass} print:hidden`}
          aria-labelledby="related-heading"
        >
          <h2 id="related-heading" className="text-lg font-black text-[#0C1833]">
            Related MapAble resources
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>
              <Link
                href="/resources/tours"
                className={`font-medium text-primary underline-offset-2 hover:underline ${mapableCareFocusRing}`}
              >
                All accessible tours
              </Link>
            </li>
            {tour.relatedGuideHref ? (
              <li>
                <Link
                  href={tour.relatedGuideHref}
                  className={`font-medium text-primary underline-offset-2 hover:underline ${mapableCareFocusRing}`}
                >
                  Canberra Accessibility Guide
                </Link>
              </li>
            ) : null}
            {tour.relatedArticleHref ? (
              <li>
                <Link
                  href={tour.relatedArticleHref}
                  className={`font-medium text-primary underline-offset-2 hover:underline ${mapableCareFocusRing}`}
                >
                  Sensory-Friendly Canberra itinerary article
                </Link>
              </li>
            ) : null}
            <li>
              <Link
                href="/access"
                className={`font-medium text-primary underline-offset-2 hover:underline ${mapableCareFocusRing}`}
              >
                MapAble Access
              </Link>
            </li>
            <li>
              <Link
                href="/resources"
                className={`font-medium text-primary underline-offset-2 hover:underline ${mapableCareFocusRing}`}
              >
                Resource hub
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
