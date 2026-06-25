import { InterestForm } from "@/components/marketing/InterestForm";
import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";

export const metadata = {
  title: "Transport partners | MapAble",
  description: "Wheelchair accessible transport partnerships with MapAble.",
};

export default function TransportPartnersPage() {
  return (
    <div>
      <PublicInfoPage
        eyebrow="Transport partners"
        title="Deliver accessible transport with clearer hand-offs."
        description="Partner with MapAble for wheelchair accessible vehicles, pickup notes, driver accessibility checklists, and future live ETA integration."
        ctaLabel="Register transport interest"
        ctaHref="#transport-form"
        sections={[
          {
            title: "Roadmap",
            content: (
              <ul className="list-disc space-y-2 pl-5">
                <li>Wheelchair accessible vehicle profiles.</li>
                <li>Pickup notes and assistance requests (pilot).</li>
                <li>Live ETA and assistance request integration (coming soon).</li>
              </ul>
            ),
          },
        ]}
      />
      <section id="transport-form" className="mx-auto max-w-xl px-5 pb-12">
        <InterestForm formType="transport_partner" />
      </section>
    </div>
  );
}
