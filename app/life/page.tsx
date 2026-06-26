import type { Metadata } from "next";

import { EcosystemLinks } from "@/components/marketing/EcosystemLinks";
import { MapAbleInterestForm } from "@/components/marketing/MapAbleInterestForm";
import { VerticalLandingPage } from "@/components/marketing/VerticalLandingPage";
import { getVerticalById } from "@/lib/mapable/verticals";
import { mapablePublicCardClass, mapablePublicPageContainerClass } from "@/lib/marketing/public-page-styles";

const vertical = getVerticalById("life")!;

const categories = [
  "Sport and recreation",
  "Arts and culture",
  "Learning and classes",
  "Volunteering",
  "Social groups",
  "Faith and community",
  "Local council activities",
  "Accessible tourism and day trips",
];

export const metadata: Metadata = {
  title: "MapAble Life | Accessible community activities and events",
  description:
    "MapAble Life helps people discover community activities with clear access information and optional care and transport coordination.",
  alternates: { canonical: "/life" },
};

export default function LifePage() {
  return (
    <VerticalLandingPage
      eyebrow={vertical.name}
      title="Find accessible things to do, not just places to go"
      description="MapAble Life helps people discover community activities with clear access information and optional care and transport coordination."
      primaryCta={vertical.primaryCta}
      secondaryCta={vertical.secondaryCta}
      problem={{
        items: [
          "Social isolation affects many adults with disability.",
          "Event access information is often unclear or incomplete.",
          "Transport and support planning create barriers to participation.",
          "Adults need more than children's activity directories.",
          "Many people rely on word-of-mouth to find inclusive activities.",
        ],
      }}
      solution={{
        items: [
          "Accessible events directory with structured access fields.",
          "Activity filters by access need — mobility, sensory, communication.",
          "Support worker booking prompts and transport planning.",
          "Peer reviews and quiet/sensory-friendly options.",
          "Companion and carer information where relevant.",
          "Recurring group discovery for ongoing participation.",
        ],
      }}
      extraSections={
        <section className="border-t border-slate-200 bg-slate-50">
          <div className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
            <h2 className="text-2xl font-black text-[#0C1833]">Activity categories</h2>
            <ul className="mt-6 flex flex-wrap gap-2">
              {categories.map((cat) => (
                <li
                  key={cat}
                  className={`${mapablePublicCardClass} text-sm font-semibold text-slate-700`}
                >
                  {cat}
                </li>
              ))}
            </ul>
          </div>
        </section>
      }
      journey={{
        body: "Find a pottery class, check the bathroom and parking details, book transport, invite a support worker, and add it to the shared calendar — all with clear access information before you go.",
      }}
      trustSection={
        <div className="space-y-4">
          <h2 className="text-xl font-black text-[#0C1833]">Safety and community standards</h2>
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>Event moderation and reporting tools.</li>
            <li>Privacy controls for participants.</li>
            <li>Accessibility details verified where possible.</li>
            <li>
              MapAble helps make access information clearer — it is not responsible for every
              third-party event.
            </li>
          </ul>
        </div>
      }
      interestForm={<MapAbleInterestForm defaultVerticalIds={["life"]} />}
      ecosystemLinks={
        <EcosystemLinks currentVerticalId="life" linkedVerticalIds={vertical.ecosystemLinks} />
      }
    />
  );
}
