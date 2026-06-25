import { PublicModulePage } from "@/components/marketing/PublicModulePage";

export const metadata = {
  title: "MapAble Access | Accessibility map",
  description:
    "Learn how MapAble Access will separate community accessibility reviews from formal accreditation claims.",
};

export default function AccessPage() {
  return (
    <PublicModulePage
      eyebrow="MapAble Access"
      title="Accessibility information for places, reviewed with care."
      description="MapAble Access is planned as a public accessibility map with structured community reviews, venue claim flows and separate formal accreditation workflows."
      whoFor={[
        "Participants and families planning accessible outings.",
        "Venue owners improving and explaining access features.",
        "Community reviewers sharing structured, moderated observations.",
      ]}
      availableNow={[
        "Public accessibility map with community reports.",
        "Access alerts and place profiles.",
        "Plan accessible transport from place pages.",
      ]}
      comingSoon={[
        "Can I go here? personalised access matching.",
        "Full journey confidence scoring with route hazards.",
        "Automated accreditation evidence review.",
      ]}
      safetyNote="Community reports describe observed access conditions, not legal compliance. Formal MapAble Accreditation is separate from community reports."
      primaryCta={{ label: "Browse access map", href: "/access/map" }}
      secondaryCta={{ label: "Community feed", href: "/access/feed" }}
    />
  );
}
