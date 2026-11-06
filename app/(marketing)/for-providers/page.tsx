import Link from "next/link";

import { CanvasBlockGrid } from "@/components/canvas/CanvasBlockGrid";
import { JourneyTimeline } from "@/components/canvas/JourneyTimeline";
import { TrustLayer } from "@/components/canvas/TrustLayer";
import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";
import { trustPrinciples } from "@/lib/canvas/canvas-data";
import {
  getProviderBlocks,
  getProviderJourneySteps,
} from "@/lib/canvas/canvas-filters";

export const metadata = {
  title: "For providers | MapAble",
  description:
    "MapAble Support Cloud is a proposed white-label workspace for disability service organisations. Register interest in a controlled pilot.",
};

export default function ForProvidersPage() {
  const providerBlocks = getProviderBlocks();
  const providerJourney = getProviderJourneySteps();
  const providerTrustPrinciples = trustPrinciples.slice(0, 6);

  return (
    <>
      <PublicInfoPage
        eyebrow="For providers"
        title="MapAble Support Cloud for your organisation."
        description="Support Cloud is a proposed white-label platform for branded provider portals, organisational dashboards, support coordination and service discovery. It is not live hosting."
        ctaLabel="Register provider interest"
        ctaHref="/register-interest"
        sections={[
          {
            title: "What providers can do now",
            content: (
              <ul className="list-disc space-y-2 pl-5">
                <li>Register interest in a controlled provider pilot.</li>
                <li>
                  Explore the public provider finder and public module pages.
                </li>
                <li>
                  Read how{" "}
                  <Link href="/white-label" className="font-medium text-primary hover:underline">
                    white-label workspaces
                  </Link>{" "}
                  and{" "}
                  <Link href="/technology" className="font-medium text-primary hover:underline">
                    planned integrations
                  </Link>{" "}
                  are proposed. Prefer a conversation first?{" "}
                  <Link href="/contact" className="font-medium text-primary hover:underline">
                    Contact MapAble
                  </Link>
                  .
                </li>
              </ul>
            ),
          },
          {
            title: "Proposed Support Cloud tools",
            content: (
              <ul className="list-disc space-y-2 pl-5">
                <li>Branded provider portals and organisational dashboards.</li>
                <li>Support coordination and service discovery workflows.</li>
                <li>
                  Accounting connections, including Xero, are planned and are
                  not a live sync.
                </li>
                <li>
                  A draft preview, if offered later, does not configure DNS.
                </li>
              </ul>
            ),
          },
          {
            title: "Verification note",
            content: (
              <p>
                Provider, worker, driver and admin access will start as pending.
                Matching, booking, rostering and dispatch will depend on role,
                consent and eligibility checks.
              </p>
            ),
          },
          {
            title: "Useful links",
            content: (
              <p>
                Explore{" "}
                <Link
                  href="/providers"
                  className="font-medium text-primary hover:underline"
                >
                  providers
                </Link>
                , read the{" "}
                <Link
                  href="/privacy"
                  className="font-medium text-primary hover:underline"
                >
                  privacy notice
                </Link>
                , or{" "}
                <Link
                  href="/contact"
                  className="font-medium text-primary hover:underline"
                >
                  contact MapAble
                </Link>
                .
              </p>
            ),
          },
        ]}
      />
      <CanvasBlockGrid
        blocks={providerBlocks}
        title="Provider ecosystem capabilities"
        id="provider-canvas-blocks"
        description="Capabilities most relevant to organisations delivering support through MapAble."
        showLinks={false}
      />
      <JourneyTimeline
        steps={providerJourney}
        compact
        id="provider-journey"
        title="Provider delivery journey"
      />
      <TrustLayer
        principles={providerTrustPrinciples}
        id="provider-trust-layer"
        showAutomationQuote={false}
      />
    </>
  );
}
