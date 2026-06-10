import Link from "next/link";

import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";

export const metadata = {
  title: "Providers | MapAble",
  description:
    "Explore MapAble provider discovery and pilot registration pathways.",
};

export default function ProvidersPage() {
  return (
    <PublicInfoPage
      eyebrow="Provider finder"
      title="Find disability support providers with clearer safety and access context."
      description="MapAble provider discovery is being built to help participants compare services while keeping verification status, access needs and consent boundaries clear."
      ctaLabel="Open provider finder"
      ctaHref="/provider-finder"
      sections={[
        {
          title: "What is available now",
          content: (
            <>
              <p>
                The current provider finder lets visitors search and filter
                public provider information. It is suitable for discovery and
                pilot feedback, not for automatic eligibility, funding or safety
                decisions.
              </p>
              <p>
                <Link
                  href="/provider-finder"
                  className="font-medium text-primary hover:underline"
                >
                  Open the provider finder
                </Link>{" "}
                or{" "}
                <Link
                  href="/for-providers"
                  className="font-medium text-primary hover:underline"
                >
                  register provider interest
                </Link>
                .
              </p>
            </>
          ),
        },
        {
          title: "What is coming soon",
          content: (
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Provider profiles with services, regions and accessibility
                features.
              </li>
              <li>
                Verification records for organisations, workers, drivers and
                practitioners.
              </li>
              <li>
                Consent-aware booking, messaging and invoice evidence workflows.
              </li>
            </ul>
          ),
        },
        {
          title: "Privacy and safety note",
          content: (
            <p>
              Provider discovery does not replace participant choice, provider
              due diligence or required worker checks. Paid placement must not
              override safety, verification or relevance.
            </p>
          ),
        },
      ]}
    />
  );
}
