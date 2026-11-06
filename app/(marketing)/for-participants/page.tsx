import Link from "next/link";

import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";
import { MAPABLE_SUPPORT_EMAIL } from "@/lib/brand/constants";
import { canonicalAlternate } from "@/lib/config/canonical-url";
import { MAPABLE_CARE_COMBINED_PHONE } from "@/lib/marketing/mapable-care-combined-data";

export const metadata = {
  title: "For people with disability | MapAble",
  description:
    "How MapAble supports participant choice, privacy, accessible communication and a route to human help.",
  alternates: canonicalAlternate("/for-participants"),
};

export default function ForParticipantsPage() {
  return (
    <PublicInfoPage
      eyebrow="For people with disability"
      title="Your choices stay with you."
      description="MapAble is being built so people with disability can find information and services without handing over control of personal decisions."
      ctaLabel="Contact MapAble"
      ctaHref="/contact"
      sections={[
        {
          title: "Participant choice",
          content: (
            <p>
              You decide what to share, who can see it, and when to ask for
              help. Public pages explain options. They do not enrol you in a
              service or submit a claim on your behalf.
            </p>
          ),
        },
        {
          title: "Privacy",
          content: (
            <p>
              Do not paste NDIS plan numbers or clinical records into public
              forms. Read the{" "}
              <Link href="/privacy" className="font-black text-[#005B7F] underline">
                privacy notice
              </Link>{" "}
              and use the contact form privacy topic for access or deletion
              requests.
            </p>
          ),
        },
        {
          title: "Accessible communication",
          content: (
            <p>
              Pages use plain language, visible labels, and keyboard access.
              MapAble is designed toward WCAG 2.2 AA. Formal testing is still
              required before any conformance claim.
            </p>
          ),
        },
        {
          title: "Human assistance",
          content: (
            <p>
              If a page is hard to use, or you want to talk to a person, email{" "}
              <a
                href={`mailto:${MAPABLE_SUPPORT_EMAIL}`}
                className="font-black text-[#005B7F] underline"
              >
                {MAPABLE_SUPPORT_EMAIL}
              </a>{" "}
              or call{" "}
              <a
                href="tel:0434083624"
                className="font-black text-[#005B7F] underline"
              >
                {MAPABLE_CARE_COMBINED_PHONE}
              </a>
              . You can also use the{" "}
              <Link href="/contact" className="font-black text-[#005B7F] underline">
                contact form
              </Link>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
