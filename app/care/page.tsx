import { PublicModulePage } from "@/components/marketing/PublicModulePage";

export const metadata = {
  title: "MapAble Care | Disability support coordination",
  description:
    "Learn how MapAble Care helps participants request support, compare providers and keep consent-controlled records.",
};

const CARE_REQUEST_LOGIN = "/login?callbackUrl=%2Fcare%2Frequest";
const CARE_REQUEST_REGISTER = "/register?callbackUrl=%2Fcare%2Frequest";

export default function CareHubPage() {
  return (
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
        "Public provider finder with care-focused filters.",
        "Pilot care request intake for signed-in participants (no NDIS plan upload required).",
        "Explainable worker matching review when suggestions are ready.",
      ]}
      comingSoon={[
        "Full provider response workflows across all service types.",
        "Automated invoice generation with plan-manager handoff.",
        "Nationwide provider verification badges.",
      ]}
      safetyNote="NDIS plan documents will be optional and shared only with consent. MapAble does not auto-approve supports, funding or invoices; high-risk decisions stay subject to human review."
      primaryCta={{ label: "Request support (pilot)", href: CARE_REQUEST_LOGIN }}
      secondaryCta={{ label: "Create account for pilot", href: CARE_REQUEST_REGISTER }}
    />
  );
}
