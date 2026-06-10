import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";
import { MAPABLE_SUPPORT_EMAIL } from "@/lib/brand/constants";

export const metadata = {
  title: "Contact | MapAble",
  description:
    "Contact MapAble about participant pilots, provider registration, access reviews or privacy requests.",
};

export default function ContactPage() {
  return (
    <PublicInfoPage
      eyebrow="Contact"
      title="Contact MapAble"
      description="Use this page for pilot interest, provider enquiries, accessibility feedback and privacy requests."
      ctaLabel="Email MapAble"
      ctaHref={`mailto:${MAPABLE_SUPPORT_EMAIL}`}
      sections={[
        {
          title: "Email",
          content: (
            <p>
              Email{" "}
              <a
                href={`mailto:${MAPABLE_SUPPORT_EMAIL}`}
                className="font-medium text-primary hover:underline"
              >
                {MAPABLE_SUPPORT_EMAIL}
              </a>
              . Do not send NDIS plan documents, clinical records or sensitive
              support information by email unless MapAble has asked for them
              through an agreed secure process.
            </p>
          ),
        },
        {
          title: "Pilot enquiries",
          content: (
            <p>
              Tell us whether you are a participant, provider, support
              coordinator, plan manager, employer, venue or community partner.
              We will confirm what is available now and what is still in pilot.
            </p>
          ),
        },
        {
          title: "Accessibility feedback",
          content: (
            <p>
              If any page is hard to use with keyboard, screen reader, zoom,
              captions, contrast preferences or alternative input, contact us so
              it can be recorded and prioritised.
            </p>
          ),
        },
      ]}
    />
  );
}
