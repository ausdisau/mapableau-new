import type { Metadata } from "next";

import { EcosystemLinks } from "@/components/marketing/EcosystemLinks";
import { MapAbleInterestForm } from "@/components/marketing/MapAbleInterestForm";
import { PrivacyBadgeRow } from "@/components/marketing/PrivacyBadge";
import { SupportBoundaryNotice } from "@/components/marketing/SupportBoundaryNotice";
import { VerticalLandingPage } from "@/components/marketing/VerticalLandingPage";
import { getVerticalById } from "@/lib/mapable/verticals";

const vertical = getVerticalById("planops")!;

export const metadata: Metadata = {
  title: "MapAble PlanOps | Support coordination and plan visibility",
  description:
    "MapAble PlanOps helps participants, families, coordinators, and providers see bookings, budgets, invoices, and service gaps in one accessible dashboard.",
  alternates: { canonical: "/planops" },
};

export default function PlanOpsPage() {
  return (
    <VerticalLandingPage
      eyebrow={vertical.name}
      title="Turn support plans into clear daily action"
      description="MapAble PlanOps helps participants, families, coordinators, and providers see bookings, budgets, invoices, goals, transport, and service gaps in one accessible dashboard."
      primaryCta={vertical.primaryCta}
      secondaryCta={vertical.secondaryCta}
      boundaryNotices={<SupportBoundaryNotice variant="ndis" />}
      problem={{
        items: [
          "Bookings live in one place, invoices in another, and transport is separate.",
          "Goals and service notes are hard to track across providers.",
          "Families and coordinators lose time reconciling scattered information.",
          "Budget visibility is often unclear until it is too late.",
        ],
      }}
      solution={{
        items: [
          "Unified dashboard for participants, families, and coordinators.",
          "NDIS line item tagging and invoice status tracking.",
          "Utilisation forecasting and service gap alerts.",
          "Care + transport + jobs bundling in one view.",
          "Export to CSV and Xero-style workflows where appropriate.",
        ],
      }}
      features={{
        items: [
          { title: "Participant dashboard", description: "See your supports, bookings, and remaining estimates." },
          { title: "Family/carer view", description: "Delegated visibility with consent controls." },
          { title: "Coordinator workspace", description: "Track plans, gaps, and provider responses." },
          { title: "Provider operations", description: "Invoice status, rostering context, and service logs." },
          { title: "Plan manager exports", description: "Structured data for reconciliation workflows." },
          { title: "Governance log", description: "Consent and sharing decisions recorded." },
        ],
      }}
      journey={{
        body: "A participant books a support shift, adds accessible transport, receives a service confirmation, and PlanOps shows the invoice, support category, remaining estimate, and next action — all in plain language.",
      }}
      trustSection={
        <div className="space-y-4">
          <h2 className="text-xl font-black text-[#0C1833]">Trust and boundaries</h2>
          <PrivacyBadgeRow variants={["consent-controlled", "role-based", "audit-logged"]} />
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>Informational coordination only — not financial or legal advice.</li>
            <li>Participant controls sharing; role-based access for family and providers.</li>
            <li>Plain-language explanations; human support for complex cases.</li>
          </ul>
        </div>
      }
      interestForm={<MapAbleInterestForm defaultVerticalIds={["planops"]} />}
      ecosystemLinks={
        <EcosystemLinks
          currentVerticalId="planops"
          linkedVerticalIds={vertical.ecosystemLinks}
        />
      }
    />
  );
}
