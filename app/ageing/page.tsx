import type { Metadata } from "next";

import { EcosystemLinks } from "@/components/marketing/EcosystemLinks";
import { MapAbleInterestForm } from "@/components/marketing/MapAbleInterestForm";
import { VerticalLandingPage } from "@/components/marketing/VerticalLandingPage";
import { getVerticalById } from "@/lib/mapable/verticals";
import { mapablePublicCardClass, mapablePublicPageContainerClass } from "@/lib/marketing/public-page-styles";

const vertical = getVerticalById("ageing")!;

const audiences = [
  "Older disabled people",
  "Ageing carers",
  "Adult children supporting parents",
  "Support coordinators",
  "Aged care providers",
  "Councils and community organisations",
];

export const metadata: Metadata = {
  title: "MapAble Ageing | Accessible support for older people and families",
  description:
    "MapAble Ageing helps older people and families coordinate accessible daily supports, transport, meals, home readiness, and community participation.",
  alternates: { canonical: "/ageing" },
};

export default function AgeingPage() {
  return (
    <VerticalLandingPage
      eyebrow={vertical.name}
      title="Ageing with access, dignity, and practical support"
      description="MapAble Ageing helps older people and families coordinate accessible daily supports, transport, meals, home readiness, and community participation."
      primaryCta={vertical.primaryCta}
      secondaryCta={vertical.secondaryCta}
      problem={{
        items: [
          "Ageing carers need support too — not only the person they care for.",
          "Transport, home access, meals, and social isolation barriers increase with age.",
          "Systems are fragmented across disability, aged care, health, and community supports.",
        ],
      }}
      solution={{
        items: [
          "Family dashboard with consent-controlled sharing.",
          "Accessible transport options and meal support integration.",
          "Home access checklist and social participation suggestions.",
          "Service reminders and shared calendar.",
          "Provider contact list with role-based access.",
        ],
      }}
      extraSections={
        <section className="border-t border-slate-200 bg-slate-50">
          <div className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
            <h2 className="text-2xl font-black text-[#0C1833]">Who it is for</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {audiences.map((audience) => (
                <li key={audience} className={`${mapablePublicCardClass} text-sm`}>
                  {audience}
                </li>
              ))}
            </ul>
          </div>
        </section>
      }
      trustSection={
        <div className="space-y-4">
          <h2 className="text-xl font-black text-[#0C1833]">Trust and dignity</h2>
          <p className="text-sm leading-7 text-slate-700">
            MapAble Ageing emphasises autonomy, plain language, privacy, and consent. General
            information only — not aged care funding eligibility advice. Avoiding paternalistic
            language is a design requirement, not an afterthought.
          </p>
        </div>
      }
      interestForm={<MapAbleInterestForm defaultVerticalIds={["ageing"]} />}
      ecosystemLinks={
        <EcosystemLinks
          currentVerticalId="ageing"
          linkedVerticalIds={vertical.ecosystemLinks}
        />
      }
    />
  );
}
