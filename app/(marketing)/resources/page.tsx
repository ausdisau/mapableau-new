import Link from "next/link";

import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";

export const metadata = {
  title: "Resources | MapAble",
  description:
    "MapAble resources for participants, providers and pilot partners.",
};

export default function ResourcesPage() {
  return (
    <PublicInfoPage
      eyebrow="Resources"
      title="Practical resources for the MapAble pilot."
      description="Start with the public modules, provider finder and safety notes while the production operating system is prepared for controlled pilots."
      ctaLabel="Contact MapAble"
      ctaHref="/contact"
      sections={[
        {
          title: "Participant resources",
          content: (
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <Link
                  href="/care"
                  className="font-medium text-primary hover:underline"
                >
                  MapAble Care
                </Link>{" "}
                and consent-first support requests.
              </li>
              <li>
                <Link
                  href="/transport"
                  className="font-medium text-primary hover:underline"
                >
                  MapAble Transport
                </Link>{" "}
                and accessible trip safety principles.
              </li>
              <li>
                <Link
                  href="/providers"
                  className="font-medium text-primary hover:underline"
                >
                  Provider finder
                </Link>{" "}
                for public provider discovery.
              </li>
            </ul>
          ),
        },
        {
          title: "Provider resources",
          content: (
            <p>
              Provider onboarding, verification and workforce controls are being
              prepared for pilot use.{" "}
              <Link
                href="/for-providers"
                className="font-medium text-primary hover:underline"
              >
                Register provider interest
              </Link>
              .
            </p>
          ),
        },
        {
          title: "Policy resources",
          content: (
            <p>
              Read the{" "}
              <Link
                href="/privacy"
                className="font-medium text-primary hover:underline"
              >
                privacy notice
              </Link>
              ,{" "}
              <Link
                href="/terms"
                className="font-medium text-primary hover:underline"
              >
                terms
              </Link>
              ,{" "}
              <Link
                href="/data-deletion"
                className="font-medium text-primary hover:underline"
              >
                data deletion process
              </Link>
              , and{" "}
              <Link
                href="/accessibility-statement"
                className="font-medium text-primary hover:underline"
              >
                accessibility statement
              </Link>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
