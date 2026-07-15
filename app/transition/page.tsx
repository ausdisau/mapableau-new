import type { Metadata } from "next";

import { EcosystemLinks } from "@/components/marketing/EcosystemLinks";
import { MapAbleInterestForm } from "@/components/marketing/MapAbleInterestForm";
import { SupportBoundaryNotice } from "@/components/marketing/SupportBoundaryNotice";
import { VerticalLandingPage } from "@/components/marketing/VerticalLandingPage";
import { getVerticalById } from "@/lib/mapable/verticals";
import { mapablePublicCardClass, mapablePublicPageContainerClass } from "@/lib/marketing/public-page-styles";

const vertical = getVerticalById("transition")!;

const packages = [
  "Hospital to home",
  "Starting a job",
  "Moving into accessible housing",
  "Starting study or TAFE",
  "Returning to community activities",
  "Carer change or family support change",
];

export const metadata: Metadata = {
  title: "MapAble Transition | Coordinate support through life changes",
  description:
    "MapAble Transition helps coordinate practical steps around discharge, home setup, transport, support workers, meals, equipment, and follow-up appointments.",
  alternates: { canonical: "/transition" },
};

export default function TransitionPage() {
  return (
    <VerticalLandingPage
      eyebrow={vertical.name}
      title="When life changes, support should move with you"
      description="MapAble Transition helps coordinate the practical steps around discharge, home setup, transport, support workers, meals, equipment, and follow-up appointments."
      primaryCta={vertical.primaryCta}
      secondaryCta={vertical.secondaryCta}
      boundaryNotices={
        <div className="space-y-4">
          <SupportBoundaryNotice variant="clinical" />
          <SupportBoundaryNotice variant="emergency" />
        </div>
      }
      problem={{
        items: [
          "Discharge and life transitions are high-risk coordination moments.",
          "Families receive scattered tasks across paper, email, and phone calls.",
          "Equipment, transport, meals, care, and appointments are often separate.",
          "Missed steps can cause stress or readmission risk.",
        ],
      }}
      solution={{
        items: [
          "Plain-language transition checklists.",
          "Transport booking and temporary care schedules.",
          "Meal delivery links and equipment readiness checks.",
          "Shared family and coordinator task board.",
          "Appointment calendar and document vault.",
          "Service confirmation and audit trail.",
        ],
      }}
      extraSections={
        <section className="border-t border-slate-200 bg-slate-50">
          <div className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
            <h2 className="text-2xl font-black text-[#0C1833]">Transition packages</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {packages.map((pkg) => (
                <li key={pkg} className={`${mapablePublicCardClass} text-sm font-semibold`}>
                  {pkg}
                </li>
              ))}
            </ul>
          </div>
        </section>
      }
      journey={{
        body: "A participant is leaving hospital. MapAble creates a plain-language checklist, books accessible transport, schedules first-week support, adds meals, flags equipment needs, and shares tasks with approved family and coordinator contacts.",
      }}
      trustSection={
        <div className="space-y-4">
          <h2 className="text-xl font-black text-[#0C1833]">Governance boundaries</h2>
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>Not emergency care or clinical advice.</li>
            <li>Not discharge approval — coordination and visibility only.</li>
            <li>Human review for high-risk workflows.</li>
          </ul>
        </div>
      }
      interestForm={<MapAbleInterestForm defaultVerticalIds={["transition"]} />}
      ecosystemLinks={
        <EcosystemLinks
          currentVerticalId="transition"
          linkedVerticalIds={vertical.ecosystemLinks}
        />
      }
    />
  );
}
