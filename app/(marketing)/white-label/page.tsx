import Link from "next/link";

import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";
import { canonicalAlternate } from "@/lib/config/canonical-url";

export const metadata = {
  title: "White-label solutions | MapAble",
  description:
    "Proposed branded MapAble experiences on provider subdomains or verified customer-owned domains. Live DNS is not configured.",
  alternates: canonicalAlternate("/white-label"),
};

export default function WhiteLabelPage() {
  return (
    <PublicInfoPage
      eyebrow="White-label solutions"
      title="Your brand. A shared platform. Not live yet."
      description="MapAble Support Cloud is a proposal for organisations that want a branded digital workspace. Hostnames would be branding until human operations activates them."
      ctaLabel="Register provider interest"
      ctaHref="/register-interest"
      sections={[
        {
          title: "Provider subdomains",
          content: (
            <p>
              A future workspace could be addressed as a name such as
              provider.mapable.com.au. That address is a proposal only. Domain
              activation is not configured. MapAble does not attach live DNS
              from this website.
            </p>
          ),
        },
        {
          title: "Customer-owned domains",
          content: (
            <p>
              Organisations may later ask to use a domain they already own,
              after ownership is verified. Verification and certificate setup
              would be a human operations step, not an automatic signup.
            </p>
          ),
        },
        {
          title: "What you can do now",
          content: (
            <p>
              Read{" "}
              <Link
                href="/for-providers"
                className="font-black text-[#005B7F] underline"
              >
                For providers
              </Link>{" "}
              and{" "}
              <Link
                href="/register-interest"
                className="font-black text-[#005B7F] underline"
              >
                register interest
              </Link>{" "}
              in a controlled pilot. A draft preview, if offered, is not a live
              site.
            </p>
          ),
        },
      ]}
    />
  );
}
