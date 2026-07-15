import type { Metadata } from "next";

import { EcosystemLinks } from "@/components/marketing/EcosystemLinks";
import { MapAbleInterestForm } from "@/components/marketing/MapAbleInterestForm";
import { VerticalLandingPage } from "@/components/marketing/VerticalLandingPage";
import { getVerticalById } from "@/lib/mapable/verticals";
import { mapablePublicCardClass, mapablePublicPageContainerClass } from "@/lib/marketing/public-page-styles";

const vertical = getVerticalById("academy")!;

const pathways = [
  "Support worker essentials",
  "Accessible transport driver readiness",
  "Venue accessibility service",
  "Inclusive employer onboarding",
  "Volunteer mapper training",
  "Safeguarding and complaints awareness",
  "Plain-language communication",
  "Working with access preferences and consent",
];

export const metadata: Metadata = {
  title: "MapAble Academy | Practical disability access training",
  description:
    "MapAble Academy helps workers, venues, employers, transport partners, and volunteers learn practical disability access and inclusive service skills.",
  alternates: { canonical: "/academy" },
};

export default function AcademyMarketingPage() {
  return (
    <VerticalLandingPage
      eyebrow={vertical.name}
      title="Build the skills behind accessible service"
      description="MapAble Academy helps workers, venues, employers, transport partners, and volunteers learn practical disability access and inclusive service skills."
      primaryCta={vertical.primaryCta}
      secondaryCta={vertical.secondaryCta}
      problem={{
        items: [
          "Accessibility is not only infrastructure — staff confidence matters.",
          "Inconsistent training creates poor participant experiences.",
          "Providers need records, refreshers, and audit-ready evidence.",
        ],
      }}
      solution={{
        items: [
          "Micro-courses in plain language.",
          "Scenario-based modules with practical examples.",
          "Completion badges and organisation dashboards.",
          "Renewal reminders and accessibility service checklists.",
          "Optional role-based learning pathways.",
        ],
      }}
      extraSections={
        <section className="border-t border-slate-200 bg-slate-50">
          <div className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
            <h2 className="text-2xl font-black text-[#0C1833]">Course pathways</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {pathways.map((pathway) => (
                <li key={pathway} className={`${mapablePublicCardClass} text-sm`}>
                  {pathway}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-slate-600">
              Already enrolled as a provider?{" "}
              <a href="/provider/academy" className="font-bold text-[#005B7F] underline">
                Go to Provider Academy
              </a>
            </p>
          </div>
        </section>
      }
      trustSection={
        <p className="text-sm leading-7 text-slate-700">
          Training supports awareness and operational readiness. It does not replace legally
          required qualifications, professional supervision, or formal clinical training.
        </p>
      }
      interestForm={<MapAbleInterestForm defaultVerticalIds={["academy"]} />}
      ecosystemLinks={
        <EcosystemLinks
          currentVerticalId="academy"
          linkedVerticalIds={vertical.ecosystemLinks}
        />
      }
    />
  );
}
