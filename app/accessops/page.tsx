import type { Metadata } from "next";

import { AccessTrustBadge } from "@/components/marketing/AccessTrustBadge";
import { EcosystemLinks } from "@/components/marketing/EcosystemLinks";
import { MapAbleInterestForm } from "@/components/marketing/MapAbleInterestForm";
import { SupportBoundaryNotice } from "@/components/marketing/SupportBoundaryNotice";
import { VerticalLandingPage } from "@/components/marketing/VerticalLandingPage";
import { getVerticalById } from "@/lib/mapable/verticals";
import { mapablePublicCardClass, mapablePublicPageContainerClass } from "@/lib/marketing/public-page-styles";

const vertical = getVerticalById("accessops")!;

const assessmentDomains = [
  { title: "External path of travel", description: "Parking, kerb ramps, paths, and lighting." },
  { title: "Entry and exit", description: "Doors, thresholds, reception, and wayfinding." },
  { title: "Interior movement", description: "Corridors, lifts, seating, and circulation space." },
  { title: "Toilets and amenities", description: "Accessible toilets, baby change, and facilities." },
  { title: "Information and sensory access", description: "Signage, hearing loops, lighting, and quiet options." },
  { title: "Staff and service readiness", description: "Training, assistance, and communication practices." },
];

export const metadata: Metadata = {
  title: "MapAble AccessOps | Accessibility operations for venues and councils",
  description:
    "MapAble AccessOps helps councils, venues, and organisations assess, publish, improve, and maintain accessibility information people can trust.",
  alternates: { canonical: "/accessops" },
};

export default function AccessOpsPage() {
  return (
    <VerticalLandingPage
      eyebrow={vertical.name}
      title="Make accessibility visible, measurable, and maintainable"
      description="MapAble AccessOps helps organisations assess, publish, improve, and maintain accessibility information people can trust."
      primaryCta={vertical.primaryCta}
      secondaryCta={vertical.secondaryCta}
      boundaryNotices={<SupportBoundaryNotice variant="informational" />}
      problem={{
        items: [
          'Accessibility information is often vague — "wheelchair accessible" without detail.',
          "People need exact details to plan visits with confidence.",
          "Organisations need improvement pathways, not just criticism.",
          "Accessibility must be maintained and reassessed over time.",
        ],
      }}
      solution={{
        items: [
          "Structured accessibility assessments across key domains.",
          "Bronze, Silver, and Gold tiers with clear criteria.",
          "Venue dashboard with improvement recommendations.",
          "Public accessibility guide pages.",
          "Staff training log and reassessment reminders.",
          "API-ready badges and embeddable widgets.",
        ],
      }}
      extraSections={
        <>
          <section className="border-t border-slate-200 bg-slate-50">
            <div className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
              <h2 className="text-2xl font-black text-[#0C1833]">Assessment domains</h2>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {assessmentDomains.map((domain) => (
                  <li key={domain.title} className={mapablePublicCardClass}>
                    <h3 className="font-black text-[#0C1833]">{domain.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{domain.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
          <section className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
            <h2 className="text-2xl font-black text-[#0C1833]">Public trust badge concept</h2>
            <div className="mt-8 max-w-lg">
              <AccessTrustBadge
                venueName="Example Community Centre"
                tier="Silver"
                score={78}
                assessmentDate="15 March 2026"
                nextReviewDate="15 March 2027"
                detailsHref="/access"
              />
            </div>
          </section>
          <section className="border-t border-slate-200 bg-slate-50">
            <div className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
              <h2 className="text-2xl font-black text-[#0C1833]">Partners and revenue</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                AccessOps is designed for councils, venues, universities, event organisers,
                tourism operators, transport hubs, hospitals, and clinics.
              </p>
            </div>
          </section>
        </>
      }
      interestForm={<MapAbleInterestForm defaultVerticalIds={["accessops"]} />}
      ecosystemLinks={
        <EcosystemLinks
          currentVerticalId="accessops"
          linkedVerticalIds={vertical.ecosystemLinks}
        />
      }
    />
  );
}
