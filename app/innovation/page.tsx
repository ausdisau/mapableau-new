import type { Metadata } from "next";
import Link from "next/link";

import { MapAbleInterestForm } from "@/components/marketing/MapAbleInterestForm";
import { PrivacyBadgeRow } from "@/components/marketing/PrivacyBadge";
import { VerticalGrid } from "@/components/marketing/VerticalGrid";
import {
  getUntappedVerticalsInPriorityOrder,
  getVerticalsByIds,
} from "@/lib/mapable/verticals";
import {
  mapablePublicPageContainerClass,
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSecondaryButtonClass,
  mapablePublicSectionTitleClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";

export const metadata: Metadata = {
  title: "Innovation Hub | MapAble next-stage verticals",
  description:
    "Explore MapAble's proposed verticals — PlanOps, Home, AccessOps, Life, and more — extending one accessible ecosystem for people with disability.",
  alternates: { canonical: "/innovation" },
};

const priorityIds = ["planops", "home", "accessops", "life", "transition", "ageing"];
const futureIds = [
  "academy",
  "access-pass",
  "ready",
  "rights-navigator",
  "intelligence",
];

export default function InnovationHubPage() {
  const priorityVerticals = getVerticalsByIds(priorityIds);
  const futureVerticals = getVerticalsByIds(futureIds);

  return (
    <div className="bg-white text-[#0C1833]">
      <section className="relative overflow-hidden border-b border-slate-200 bg-[#F6FBFC]">
        <div className={`${mapablePublicPageContainerClass} relative py-14 sm:py-20`}>
          <p className={mapablePublicEyebrowClass}>MapAble Innovation Hub</p>
          <h1 className={`${mapablePublicTitleClass} mt-3`}>
            Accessibility infrastructure for everyday life
          </h1>
          <p className={mapablePublicLeadClass}>
            MapAble is building connected services that help people with disability coordinate
            support, movement, work, home, community, safety, and rights — reusing MapAble Core
            instead of creating disconnected products.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="#interest" className={mapablePublicPrimaryButtonClass}>
              Join early access
            </Link>
            <Link href="#interest" className={mapablePublicSecondaryButtonClass}>
              Partner with MapAble
            </Link>
          </div>
        </div>
      </section>

      <section className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
        <p className={mapablePublicSectionTitleClass}>Strategic principles</p>
        <h2 className="mapable-display mt-2 text-2xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-3xl">
          How MapAble chooses what to build next
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            "Reuse MapAble Core — identity, consent, messaging, and billing",
            "Strengthen the accessibility map with evidence-based access data",
            "Bundle care, transport, jobs, accreditation, marketplace, and support",
            "Create useful data for participants, providers, councils, and communities",
            "Reduce overdependence on any single funding stream",
          ].map((item) => (
            <li
              key={item}
              className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700"
            >
              <span
                className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#005B7F]"
                aria-hidden="true"
              />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <VerticalGrid
        verticals={priorityVerticals}
        heading="Priority verticals"
        intro="These modules are being shaped first because they extend existing MapAble services and address high-impact coordination gaps."
      />

      <VerticalGrid
        verticals={futureVerticals}
        heading="Future infrastructure"
        intro="Training, identity, readiness, rights support, and privacy-safe intelligence — strengthening the whole ecosystem."
      />

      <section className="border-t border-slate-200 bg-slate-50">
        <div className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
          <p className={mapablePublicSectionTitleClass}>Trust and governance</p>
          <h2 className="mapable-display mt-2 text-2xl font-black tracking-[-0.04em] text-[#0C1833]">
            Built with consent, privacy, and human review
          </h2>
          <div className="mt-6">
            <PrivacyBadgeRow
              variants={[
                "consent-controlled",
                "role-based",
                "private-by-default",
                "audit-logged",
              ]}
            />
          </div>
          <ul className="mt-8 space-y-3 text-sm leading-7 text-slate-700">
            <li>Consent-first design — you control what is shared</li>
            <li>Privacy and role-based access across modules</li>
            <li>Audit-ready workflows for coordinators and providers</li>
            <li>Accessible, plain-language communication</li>
            <li>Human review for sensitive decisions — not automated alone</li>
            <li>
              No replacement for legal, medical, or clinical advice — coordination and
              visibility only
            </li>
          </ul>
        </div>
      </section>

      <section id="interest" className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
        <p className={mapablePublicSectionTitleClass}>Get involved</p>
        <h2 className="mapable-display mt-2 text-2xl font-black tracking-[-0.04em] text-[#0C1833]">
          Help shape MapAble
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
          For participants and families: tell us which modules matter most. For providers,
          councils, employers, and venues: explore partnership opportunities.
        </p>
        <div className="mt-8 max-w-2xl">
          <MapAbleInterestForm
            defaultVerticalIds={getUntappedVerticalsInPriorityOrder()
              .slice(0, 3)
              .map((v) => v.id)}
          />
        </div>
      </section>
    </div>
  );
}
