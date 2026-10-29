import Link from "next/link";

import { ModuleCanvasSection } from "@/components/canvas/ModuleCanvasSection";
import { PublicModulePage } from "@/components/marketing/PublicModulePage";
import { canonicalAlternate } from "@/lib/config/canonical-url";

export const metadata = {
  title: "MapAble Care — NDIS providers & disability support",
  description:
    "Find NDIS providers and disability support coordination with MapAble Care. Discover accessible places and inclusive community services with consent at the centre.",
  alternates: canonicalAlternate("/care"),
};

export default function CareHubPage() {
  return (
    <>
      <PublicModulePage
        eyebrow="MapAble Care"
        title="Find and manage disability support with consent at the centre."
        description="MapAble Care is the care-support module for participants, nominees, providers and support coordinators. It is being shaped around verified providers, clear consent, service evidence and human-controlled decisions."
        whoFor={[
          "NDIS participants and families comparing support options.",
          "Support coordinators helping participants organise services.",
          "Providers preparing for safer intake, rostering and service logs.",
        ]}
        availableNow={[
          "Public provider finder and access-needs search entry points.",
          "Pilot-oriented explanation of the Care module and safety model.",
          "Participant app links for signed-in users when invited to the pilot.",
        ]}
        comingSoon={[
          "Consent-controlled support requests and provider responses.",
          "Worker eligibility gates before assignment to high-risk supports.",
          "Service logs, participant confirmation and dispute workflows.",
        ]}
        safetyNote="NDIS plan documents will be optional and shared only with consent. MapAble does not auto-approve supports, funding or invoices; high-risk decisions stay subject to human review."
        primaryCta={{ label: "Explore provider finder", href: "/providers" }}
        secondaryCta={{ label: "Join pilot", href: "/contact" }}
      />
      <section className="mx-auto max-w-7xl px-5 py-5 lg:px-8" aria-label="Care provider map">
        <Link href="/care/provider-map" className="inline-flex min-h-11 items-center rounded-xl border border-[#005B7F] px-5 font-bold text-[#005B7F] underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
          Explore the Care provider map
        </Link>
      </section>
      <ModuleCanvasSection module="care" />
    </>
  );
}
