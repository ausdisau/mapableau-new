import type { Metadata } from "next";

import { EcosystemLinks } from "@/components/marketing/EcosystemLinks";
import { MapAbleInterestForm } from "@/components/marketing/MapAbleInterestForm";
import { PrivacyBadgeRow } from "@/components/marketing/PrivacyBadge";
import { SupportBoundaryNotice } from "@/components/marketing/SupportBoundaryNotice";
import { VerticalLandingPage } from "@/components/marketing/VerticalLandingPage";
import { getVerticalById } from "@/lib/mapable/verticals";
import { mapablePublicCardClass, mapablePublicPageContainerClass } from "@/lib/marketing/public-page-styles";

const vertical = getVerticalById("home")!;

export const metadata: Metadata = {
  title: "MapAble Home | Accessible housing and home readiness",
  description:
    "MapAble Home helps people with disability explore accessible housing, home modifications, supports, transport, and local accessibility information.",
  alternates: { canonical: "/home" },
};

export default function HomeVerticalPage() {
  return (
    <VerticalLandingPage
      eyebrow={vertical.name}
      title="Find, adapt, and understand accessible homes"
      description="MapAble Home brings housing access, home modifications, support services, transport, equipment, and local accessibility information into one coordinated journey."
      primaryCta={vertical.primaryCta}
      secondaryCta={vertical.secondaryCta}
      boundaryNotices={
        <div className="space-y-4">
          <SupportBoundaryNotice variant="legal" />
          <SupportBoundaryNotice variant="clinical" />
        </div>
      }
      problem={{
        items: [
          "Housing searches rarely include real access detail.",
          "Home modifications involve many people — OTs, builders, providers, and family.",
          "Support, transport, equipment, and local services are disconnected.",
          "Families often rely on scattered advice without a single pathway.",
        ],
      }}
      solution={{
        items: [
          "Accessible home profile with modification history.",
          "Home modification pathway with clear next steps.",
          "OT and assessor coordination concept.",
          "Contractor and provider marketplace links.",
          "Local transport and service density checks.",
          "Participant-controlled document vault.",
        ],
      }}
      extraSections={
        <section className="border-t border-slate-200 bg-[#F6FBFC]">
          <div className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
            <h2 className="text-2xl font-black text-[#0C1833]">
              Can I live here?
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
              Enter an address to explore access considerations — entrance and path risks,
              bathroom and kitchen access, nearby accessible transport, support providers,
              venues, and suggested questions for assessors.
            </p>
            <ul className={`${mapablePublicCardClass} mt-6 grid gap-3 sm:grid-cols-2`}>
              {[
                "Entrance and path of travel risks",
                "Bathroom and kitchen access considerations",
                "Nearby accessible transport",
                "Nearby support providers and health services",
                "Accessible venues in the neighbourhood",
                "Suggested next questions for assessors",
              ].map((item) => (
                <li key={item} className="text-sm text-slate-700">
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-500">
              Concept module — pilot feature. Private addresses are never shown publicly without
              explicit consent.
            </p>
          </div>
        </section>
      }
      trustSection={
        <div className="space-y-4">
          <h2 className="text-xl font-black text-[#0C1833]">Trust and privacy</h2>
          <PrivacyBadgeRow variants={["private-by-default", "consent-controlled", "role-based"]} />
          <p className="text-sm leading-7 text-slate-700">
            Housing information is sensitive. MapAble Home uses consent-first sharing with
            role-based access for family, coordinators, and providers. No public display of
            private addresses without explicit consent.
          </p>
        </div>
      }
      interestForm={<MapAbleInterestForm defaultVerticalIds={["home"]} />}
      ecosystemLinks={
        <EcosystemLinks currentVerticalId="home" linkedVerticalIds={vertical.ecosystemLinks} />
      }
    />
  );
}
