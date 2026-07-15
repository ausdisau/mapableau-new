import type { Metadata } from "next";

import { ConsentNotice } from "@/components/marketing/ConsentNotice";
import { DataSharingCard } from "@/components/marketing/DataSharingCard";
import { EcosystemLinks } from "@/components/marketing/EcosystemLinks";
import { MapAbleInterestForm } from "@/components/marketing/MapAbleInterestForm";
import { PrivacyBadgeRow } from "@/components/marketing/PrivacyBadge";
import { VerticalLandingPage } from "@/components/marketing/VerticalLandingPage";
import { getVerticalById } from "@/lib/mapable/verticals";
import { mapablePublicPageContainerClass } from "@/lib/marketing/public-page-styles";

const vertical = getVerticalById("access-pass")!;

const scenarios = [
  "With a support worker before first shift",
  "With a transport driver before pickup",
  "With an employer before interview",
  "With a venue before an event",
  "With a hospital discharge planner",
  "With a family member or support coordinator",
];

export const metadata: Metadata = {
  title: "MapAble Access Pass | Share access needs on your terms",
  description:
    "MapAble Access Pass helps people store and share access needs, communication preferences, and support notes with consent-controlled sharing.",
  alternates: { canonical: "/access-pass" },
};

export default function AccessPassPage() {
  return (
    <VerticalLandingPage
      eyebrow={vertical.name}
      title="Share your access needs once, on your terms"
      description="MapAble Access Pass helps people explain access, communication, transport, and support preferences with the right people, only when they choose."
      primaryCta={vertical.primaryCta}
      secondaryCta={vertical.secondaryCta}
      problem={{
        items: [
          "People repeatedly explain the same access needs to every new provider.",
          "Information gets lost between providers, venues, employers, and transport.",
          "Privacy and consent are essential — access needs are personal.",
          "Access needs change over time and should be easy to update.",
        ],
      }}
      solution={{
        items: [
          "Personal access profile you control.",
          "Communication preferences and mobility aid details.",
          "Transport pickup notes and workplace adjustment preferences.",
          "Share links with expiry dates.",
          "Role-based access and consent log.",
        ],
      }}
      extraSections={
        <>
          <section className="border-t border-slate-200 bg-slate-50">
            <div className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
              <h2 className="text-2xl font-black text-[#0C1833]">Example sharing scenarios</h2>
              <ul className="mt-6 space-y-2 text-sm text-slate-700">
                {scenarios.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </section>
          <section className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
            <h2 className="text-2xl font-black text-[#0C1833]">Privacy model</h2>
            <div className="mt-6 space-y-4">
              <PrivacyBadgeRow
                variants={["private-by-default", "consent-controlled", "audit-logged"]}
              />
              <DataSharingCard
                recipientType="Support worker"
                dataCategories={["Communication preferences", "Mobility aids", "Support notes"]}
                expiry="7 days"
                status="active"
              />
              <ConsentNotice
                title="Sharing your Access Pass"
                plainLanguageSummary="You choose who sees your profile, for how long, and what categories they can view."
                dataUsed={["Access needs", "Communication preferences", "Emergency contacts"]}
                whoCanSeeIt={["People you explicitly approve"]}
                howToWithdraw="Revoke access anytime from your profile settings."
              />
            </div>
          </section>
        </>
      }
      interestForm={<MapAbleInterestForm defaultVerticalIds={["access-pass"]} />}
      ecosystemLinks={
        <EcosystemLinks
          currentVerticalId="access-pass"
          linkedVerticalIds={vertical.ecosystemLinks}
        />
      }
    />
  );
}
