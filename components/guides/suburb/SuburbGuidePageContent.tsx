import Link from "next/link";
import React from "react";

import { SuburbGuideMap } from "@/components/guides/suburb/SuburbGuideMap";
import { SuburbGuideNearbyLinks } from "@/components/guides/suburb/SuburbGuideNearbyLinks";
import { SuburbGuideQuickFacts } from "@/components/guides/suburb/SuburbGuideQuickFacts";
import { SuburbGuideReportUpdateCTA } from "@/components/guides/suburb/SuburbGuideReportUpdateCTA";
import { SuburbGuideSection } from "@/components/guides/suburb/SuburbGuideSection";
import { SuburbGuideStatusBadge } from "@/components/guides/suburb/SuburbGuideStatusBadge";
import { formatSuburbGuideStatus } from "@/lib/guides/suburb-guide-utils";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";
import { SUBURB_GUIDE_DISCLAIMER } from "@/lib/resources/suburb-access-guides-data";
import type { SuburbAccessGuide } from "@/types/suburb-access-guide";

function NotesList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) {
    return empty ? <p>{empty}</p> : null;
  }
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function SuburbGuidePageContent({
  guide,
  showMap = true,
}: {
  guide: SuburbAccessGuide;
  showMap?: boolean;
}) {
  const incomplete =
    guide.guideStatus === "not-started" ||
    guide.guideStatus === "draft" ||
    guide.guideStatus === "needs-local-verification" ||
    guide.mappingMissions.length > 0;

  return (
    <main className="bg-white text-[#0C1833]">
      <header className="relative overflow-hidden border-b border-slate-200 bg-[#F6FBFC]">
        <div
          className={`${mapablePublicPageContainerClass} relative py-14 sm:py-20`}
        >
          <p className={mapablePublicEyebrowClass}>
            Suburb Access Guide · {guide.state} · SAL {guide.salCode}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <SuburbGuideStatusBadge status={guide.guideStatus} />
          </div>
          <h1 className={`${mapablePublicTitleClass} mt-3`}>
            {guide.name} Access Guide
          </h1>
          <p className={mapablePublicLeadClass}>{guide.accessSummary}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#guide-content"
              className={`${mapablePublicPrimaryButtonClass} ${mapableCareFocusRing}`}
            >
              Skip map and browse guide list
            </a>
            <Link
              href={guide.mapHref}
              className={`inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#005B7F] transition hover:bg-slate-50 ${mapableCareFocusRing}`}
            >
              Open map view
            </Link>
            <Link
              href={guide.reportHref}
              className={`inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#005B7F] transition hover:bg-slate-50 ${mapableCareFocusRing}`}
            >
              Report an update
            </Link>
            <Link
              href={`/guides/suburbs/${guide.stateSlug}`}
              className={`inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#005B7F] transition hover:bg-slate-50 ${mapableCareFocusRing}`}
            >
              More in {guide.state}
            </Link>
            <Link
              href="/guides/suburbs"
              className={`inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#005B7F] transition hover:bg-slate-50 ${mapableCareFocusRing}`}
            >
              All suburb guides
            </Link>
          </div>
        </div>
      </header>

      <div
        className={`${mapablePublicPageContainerClass} space-y-6 py-12 sm:py-16`}
      >
        <SuburbGuideQuickFacts guide={guide} />

        {showMap ? <SuburbGuideMap guide={guide} /> : null}

        <article id="guide-content" className="space-y-6 scroll-mt-24">
          <SuburbGuideSection id="transport" title="Accessible transport">
            <NotesList
              items={guide.transportNotes}
              empty="Transport notes are not drafted yet for this locality."
            />
          </SuburbGuideSection>

          <SuburbGuideSection
            id="toilets"
            title="Toilets and Changing Places"
          >
            <NotesList
              items={guide.toiletNotes}
              empty="Toilet information is not yet verified for this locality. Plan a fallback toilet stop before travelling."
            />
          </SuburbGuideSection>

          <SuburbGuideSection id="parking" title="Parking and drop-off">
            <NotesList
              items={guide.parkingDropoffNotes}
              empty="Parking and drop-off notes are not drafted yet."
            />
          </SuburbGuideSection>

          <SuburbGuideSection id="step-free" title="Step-free movement">
            <NotesList
              items={guide.stepFreeRouteNotes}
              empty="Step-free route notes are not drafted yet."
            />
          </SuburbGuideSection>

          <SuburbGuideSection
            id="quiet-spaces"
            title="Sensory-friendly and quiet places"
          >
            <NotesList
              items={guide.sensoryNotes}
              empty="Sensory notes are not drafted yet."
            />
          </SuburbGuideSection>

          <SuburbGuideSection
            id="accessible-venues"
            title="Accessible venues and local anchors"
          >
            {guide.venueHighlights.length === 0 &&
            guide.healthAndSupportAnchors.length === 0 ? (
              <p>No venue highlights drafted yet for this locality.</p>
            ) : (
              <div className="space-y-4">
                {guide.venueHighlights.length > 0 ? (
                  <ul className="space-y-3">
                    {guide.venueHighlights.map((venue) => (
                      <li key={venue.id}>
                        <p className="font-black text-[#0C1833]">
                          {venue.name}
                        </p>
                        <p className="mt-1">{venue.summary}</p>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {guide.healthAndSupportAnchors.length > 0 ? (
                  <div>
                    <p className="font-black text-[#0C1833]">
                      Health and support anchors
                    </p>
                    <div className="mt-2">
                      <NotesList
                        items={guide.healthAndSupportAnchors}
                        empty=""
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </SuburbGuideSection>

          <SuburbGuideSection
            id="hazards"
            title="Local risks and planning notes"
            tone="warning"
          >
            <NotesList
              items={guide.localRisks}
              empty="Local risks have not been listed yet — still check conditions on the day."
            />
          </SuburbGuideSection>

          {incomplete ? (
            <SuburbGuideSection
              id="mapping-missions"
              title="Mapping mission"
              tone="soft"
            >
              <p>
                This suburb guide is not complete. Mapping missions keep the
                next verification steps clear without overclaiming.
              </p>
              {guide.mappingMissions.length === 0 ? (
                <p className="mt-3">No open mapping missions listed yet.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {guide.mappingMissions.map((mission) => (
                    <li key={mission.id}>
                      <p className="font-black text-[#0C1833]">
                        {mission.title}
                      </p>
                      <p className="mt-1">{mission.detail}</p>
                    </li>
                  ))}
                </ul>
              )}
            </SuburbGuideSection>
          ) : null}

          <SuburbGuideNearbyLinks guide={guide} />

          <SuburbGuideSection id="data-sources" title="Data sources">
            <ul className="list-disc space-y-2 pl-5">
              {guide.dataSources.map((source) => (
                <li key={source.id}>
                  <span className="font-semibold">{source.label}</span>
                  {source.note ? ` — ${source.note}` : ""}
                </li>
              ))}
            </ul>
          </SuburbGuideSection>

          <SuburbGuideReportUpdateCTA
            reportHref={guide.reportHref}
            guideName={guide.name}
          />

          <SuburbGuideSection id="disclaimer" title="Disclaimer" tone="warning">
            <p>{SUBURB_GUIDE_DISCLAIMER}</p>
            <p>
              Verification status: {formatSuburbGuideStatus(guide.guideStatus)}.
              Last updated {guide.lastUpdated}
              {guide.lastVerified
                ? `. Last verified ${guide.lastVerified}`
                : ""}
              .
            </p>
          </SuburbGuideSection>
        </article>
      </div>
    </main>
  );
}
