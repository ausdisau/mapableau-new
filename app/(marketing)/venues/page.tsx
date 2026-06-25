import { InterestForm } from "@/components/marketing/InterestForm";
import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";

export const metadata = {
  title: "Venues | MapAble",
  description: "Claim listings and improve accessibility information on MapAble.",
};

export default function VenuesPage() {
  return (
    <div>
      <PublicInfoPage
        eyebrow="Venues"
        title="Help people plan visits with confidence."
        description="Claim your venue, add accessibility details, request a review, and prepare for the MapAble accreditation pathway."
        ctaLabel="Register venue interest"
        ctaHref="#venue-form"
        sections={[
          {
            title: "What you can do",
            content: (
              <ul className="list-disc space-y-2 pl-5">
                <li>Free basic listing on the accessibility map (pilot).</li>
                <li>Verified accessibility profile updates.</li>
                <li>Future MapAble accreditation badge (voluntary, not legal compliance).</li>
              </ul>
            ),
          },
        ]}
      />
      <section id="venue-form" className="mx-auto max-w-xl px-5 pb-12">
        <InterestForm formType="venue_partner" />
      </section>
    </div>
  );
}
