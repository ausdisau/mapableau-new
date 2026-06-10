import { PublicModulePage } from "@/components/marketing/PublicModulePage";

export const metadata = {
  title: "MapAble Marketplace | Assistive products and services",
  description:
    "Learn how MapAble Marketplace will separate discovery, safety checks and funding guidance for disability-related products and services.",
};

export default function MarketplaceModulePage() {
  return (
    <PublicModulePage
      eyebrow="MapAble Marketplace"
      title="A safer discovery layer for disability products and services."
      description="MapAble Marketplace is planned as a curated product and service discovery module that keeps safety, relevance and evidence ahead of paid placement."
      whoFor={[
        "Participants comparing disability aids, equipment and daily essentials.",
        "Providers and vendors preparing verified service listings.",
        "Families, nominees and coordinators gathering options before purchase.",
      ]}
      availableNow={[
        "Public module information and pilot enquiry pathway.",
        "Provider finder links for service discovery.",
        "Safety-first marketplace principles documented on the site.",
      ]}
      comingSoon={[
        "Verified listings with evidence and suitability notes.",
        "Consent-aware requests for quotes and support-team review.",
        "Invoice evidence links without claiming automatic NDIS funding.",
      ]}
      safetyNote="Paid placement will not override safety, verification or relevance. Marketplace content will not claim NDIS funding approval unless an applicable rule and human review support that statement."
      primaryCta={{ label: "Join pilot", href: "/contact" }}
      secondaryCta={{ label: "Explore provider finder", href: "/providers" }}
    />
  );
}
