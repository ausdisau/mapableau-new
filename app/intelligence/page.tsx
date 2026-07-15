import type { Metadata } from "next";

import { ConsentNotice } from "@/components/marketing/ConsentNotice";
import { EcosystemLinks } from "@/components/marketing/EcosystemLinks";
import { MapAbleInterestForm } from "@/components/marketing/MapAbleInterestForm";
import { PrivacyBadgeRow } from "@/components/marketing/PrivacyBadge";
import { VerticalLandingPage } from "@/components/marketing/VerticalLandingPage";
import { getVerticalById } from "@/lib/mapable/verticals";
import { mapablePublicCardClass, mapablePublicPageContainerClass } from "@/lib/marketing/public-page-styles";

const vertical = getVerticalById("intelligence")!;

const exampleReports = [
  "Council accessibility scorecard",
  "Thin-market care and transport map",
  "Accessible tourism readiness report",
  "Inclusive employment barrier report",
  "Venue and event access improvement dashboard",
  "Regional disability service gap briefing",
];

export const metadata: Metadata = {
  title: "MapAble Intelligence | Privacy-safe accessibility insights",
  description:
    "MapAble Intelligence helps organisations understand accessibility, transport, service, and community participation gaps using aggregated, privacy-safe insights.",
  alternates: { canonical: "/intelligence" },
};

export default function IntelligencePage() {
  return (
    <VerticalLandingPage
      eyebrow={vertical.name}
      title="Turn access gaps into action"
      description="MapAble Intelligence helps organisations understand accessibility, transport, service, and community participation gaps using privacy-safe, aggregated insights."
      primaryCta={vertical.primaryCta}
      secondaryCta={vertical.secondaryCta}
      problem={{
        items: [
          "Decision-makers often lack real access data.",
          "Accessibility gaps stay hidden until people complain.",
          "Transport barriers and service gaps are fragmented across systems.",
          "Thin markets need better visibility for investment and planning.",
        ],
      }}
      solution={{
        items: [
          "Accessibility heatmaps from aggregated data.",
          "Service gap dashboards and transport barrier reports.",
          "Venue accessibility scorecards.",
          "Community participation insights.",
          "Provider supply-demand signals.",
          "Policy brief exports and improvement tracking.",
        ],
      }}
      extraSections={
        <>
          <section className="border-t border-slate-200 bg-slate-50">
            <div className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
              <h2 className="text-2xl font-black text-[#0C1833]">Example reports</h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {exampleReports.map((report) => (
                  <li key={report} className={`${mapablePublicCardClass} text-sm`}>
                    {report}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-slate-500">
                Concept reports — pilot partnerships required. Not live analytics yet.
              </p>
            </div>
          </section>
          <section className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
            <h2 className="text-2xl font-black text-[#0C1833]">Data ethics</h2>
            <div className="mt-6">
              <PrivacyBadgeRow variants={["aggregated-only", "private-by-default", "audit-logged"]} />
            </div>
            <ConsentNotice
              title="How MapAble Intelligence uses data"
              plainLanguageSummary="Intelligence products use anonymised, aggregated data only — never individual tracking reports."
              dataUsed={["Aggregated access scores", "Service density metrics", "Transport gap patterns"]}
              whoCanSeeIt={["Authorised organisation users with reporting access"]}
              howToWithdraw="Individual contributors can opt out of aggregated analytics where applicable."
              required={false}
            />
            <ul className="mt-6 space-y-2 text-sm text-slate-700">
              <li>Privacy by design with aggregation thresholds.</li>
              <li>No individual tracking reports.</li>
              <li>Consent-first data contribution where relevant.</li>
              <li>Transparent methodology and lived-experience review.</li>
              <li>No sale of personal health or disability data.</li>
            </ul>
          </section>
        </>
      }
      interestForm={<MapAbleInterestForm defaultVerticalIds={["intelligence"]} />}
      ecosystemLinks={
        <EcosystemLinks
          currentVerticalId="intelligence"
          linkedVerticalIds={vertical.ecosystemLinks}
        />
      }
    />
  );
}
