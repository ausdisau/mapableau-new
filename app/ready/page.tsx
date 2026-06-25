import type { Metadata } from "next";

import { EcosystemLinks } from "@/components/marketing/EcosystemLinks";
import { MapAbleInterestForm } from "@/components/marketing/MapAbleInterestForm";
import { SupportBoundaryNotice } from "@/components/marketing/SupportBoundaryNotice";
import { VerticalLandingPage } from "@/components/marketing/VerticalLandingPage";
import { getVerticalById } from "@/lib/mapable/verticals";
import { mapablePublicCardClass, mapablePublicPageContainerClass } from "@/lib/marketing/public-page-styles";

const vertical = getVerticalById("ready")!;

const audiences = [
  "Participants",
  "Families and carers",
  "Providers",
  "Councils",
  "Emergency management partners",
  "Community organisations",
];

export const metadata: Metadata = {
  title: "MapAble Ready | Accessible emergency and disruption readiness",
  description:
    "MapAble Ready helps people and communities prepare practical access, transport, equipment, support, and communication plans for emergencies and disruptions.",
  alternates: { canonical: "/ready" },
};

export default function ReadyPage() {
  return (
    <VerticalLandingPage
      eyebrow={vertical.name}
      title="Accessible readiness before things go wrong"
      description="MapAble Ready helps people and communities prepare practical access, transport, equipment, support, and communication plans for emergencies and disruptions."
      primaryCta={vertical.primaryCta}
      secondaryCta={vertical.secondaryCta}
      boundaryNotices={<SupportBoundaryNotice variant="emergency" />}
      problem={{
        items: [
          "Emergency plans often miss access needs and equipment dependencies.",
          "Power, equipment, transport, and support continuity matter in crises.",
          "Families and providers need shared information before a disruption.",
          "Councils need better disability-inclusive readiness data.",
        ],
      }}
      solution={{
        items: [
          "Personal readiness checklist.",
          "Power-dependent equipment notes.",
          "Accessible transport backup options.",
          "Support continuity plan and emergency contact sharing.",
          "Accessible shelter directory concept.",
          "Heat, flood, and fire disruption notification concept.",
        ],
      }}
      extraSections={
        <section className="border-t border-slate-200 bg-slate-50">
          <div className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
            <h2 className="text-2xl font-black text-[#0C1833]">Who it is for</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {audiences.map((a) => (
                <li key={a} className={`${mapablePublicCardClass} text-sm`}>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </section>
      }
      interestForm={<MapAbleInterestForm defaultVerticalIds={["ready"]} />}
      ecosystemLinks={
        <EcosystemLinks currentVerticalId="ready" linkedVerticalIds={vertical.ecosystemLinks} />
      }
    />
  );
}
