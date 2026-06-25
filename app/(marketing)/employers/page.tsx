import { InterestForm } from "@/components/marketing/InterestForm";
import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";

export const metadata = {
  title: "Employers | MapAble",
  description: "Inclusive hiring and adjustment-ready job posts on MapAble.",
};

export default function EmployersPage() {
  return (
    <div>
      <PublicInfoPage
        eyebrow="Employers"
        title="Hire inclusively with support planning built in."
        description="MapAble helps employers publish accessible job posts, prepare for adjustments, and collaborate with DES/IEA partners — with candidate support visibility by consent only."
        ctaLabel="Register employer interest"
        ctaHref="#employer-form"
        sections={[
          {
            title: "What MapAble offers",
            content: (
              <ul className="list-disc space-y-2 pl-5">
                <li>Accessible job postings and adjustment readiness guidance.</li>
                <li>Candidate support planning shared only with consent.</li>
                <li>DES/IEA partnership readiness (pilot).</li>
              </ul>
            ),
          },
          {
            title: "Trust and safety",
            content:
              "MapAble does not support automated rejection based on access needs. Sensitive information stays off by default.",
          },
        ]}
      />
      <section id="employer-form" className="mx-auto max-w-xl px-5 pb-12">
        <InterestForm formType="employer" />
      </section>
    </div>
  );
}
