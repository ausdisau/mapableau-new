import type { Metadata } from "next";

import { ConsentNotice } from "@/components/marketing/ConsentNotice";
import { EcosystemLinks } from "@/components/marketing/EcosystemLinks";
import { MapAbleInterestForm } from "@/components/marketing/MapAbleInterestForm";
import { SupportBoundaryNotice } from "@/components/marketing/SupportBoundaryNotice";
import { VerticalLandingPage } from "@/components/marketing/VerticalLandingPage";
import { getVerticalById } from "@/lib/mapable/verticals";
import { mapablePublicCardClass, mapablePublicPageContainerClass } from "@/lib/marketing/public-page-styles";

const vertical = getVerticalById("rights-navigator")!;

const useCases = [
  "Inaccessible venue issue",
  "Provider no-show pattern",
  "Confusing invoice",
  "Communication preference ignored",
  "Transport failure",
  "Workplace adjustment issue",
  "Safeguarding concern",
];

export const metadata: Metadata = {
  title: "MapAble Rights Navigator | Organise concerns and next steps",
  description:
    "MapAble Rights Navigator helps people record service concerns, access barriers, and evidence in plain language, then share with trusted support if they choose.",
  alternates: { canonical: "/rights-navigator" },
};

export default function RightsNavigatorPage() {
  return (
    <VerticalLandingPage
      eyebrow={vertical.name}
      title="Organise concerns and find safer next steps"
      description="MapAble Rights Navigator helps people record service concerns, access barriers, complaints, and evidence in plain language, then share it with trusted support if they choose."
      primaryCta={vertical.primaryCta}
      secondaryCta={vertical.secondaryCta}
      boundaryNotices={
        <div className="space-y-4">
          <SupportBoundaryNotice variant="legal" />
          <SupportBoundaryNotice variant="safeguarding" />
          <SupportBoundaryNotice variant="emergency" />
        </div>
      }
      problem={{
        items: [
          "Complaints can be overwhelming — where do you even start?",
          "Evidence is scattered across email, messages, and notes.",
          "People may fear retaliation or losing support.",
          "Accessible communication matters when raising concerns.",
          "People need control over who sees their information.",
        ],
      }}
      solution={{
        items: [
          "Issue log with plain-language entries.",
          "Evidence timeline you build over time.",
          "Plain-language complaint draft assistance.",
          "Consent-controlled sharing with advocates and family.",
          "Service provider response tracker.",
          "Escalation pathway information and safety signposting.",
        ],
      }}
      extraSections={
        <section className="border-t border-slate-200 bg-slate-50">
          <div className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
            <h2 className="text-2xl font-black text-[#0C1833]">Use cases</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {useCases.map((uc) => (
                <li key={uc} className={`${mapablePublicCardClass} text-sm`}>
                  {uc}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <ConsentNotice
                title="Your information, your control"
                plainLanguageSummary="Rights Navigator helps you organise — it does not submit complaints on your behalf without your explicit action."
                dataUsed={["Issue descriptions", "Dates and evidence", "Provider names"]}
                whoCanSeeIt={["You", "People you choose to share with"]}
                howToWithdraw="Remove shares or delete entries from your log at any time."
              />
            </div>
          </div>
        </section>
      }
      interestForm={<MapAbleInterestForm defaultVerticalIds={["rights-navigator"]} />}
      ecosystemLinks={
        <EcosystemLinks
          currentVerticalId="rights-navigator"
          linkedVerticalIds={vertical.ecosystemLinks}
        />
      }
    />
  );
}
