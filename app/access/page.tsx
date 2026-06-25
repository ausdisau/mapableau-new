import Link from "next/link";

import { AccessMapSearchPreview } from "@/components/access/AccessMapSearchPreview";
import { AccreditationDisclaimer } from "@/components/access-accreditation/AccreditationDisclaimer";
import { LinkButton } from "@/components/ui/link-button";
import { SectionHeader } from "@/components/ui/section-header";

export const metadata = {
  title: "MapAble Access | Evidence-based accessibility map",
  description:
    "Find accessible places confidently with community reports, owner updates, and assessor-verified information.",
};

const recordedFeatures = [
  "Step-free entry",
  "Door width and thresholds",
  "Accessible toilets",
  "Parking and drop-off",
  "Lift and ramp details",
  "Sensory environment",
  "Hearing support",
  "Staff assistance",
  "Online accessibility information",
];

export default function AccessLandingPage() {
  return (
    <main id="main-content" className="bg-white text-[#0C1833]">
      <section className="border-b border-slate-200 bg-[#F6FBFC] px-5 py-12">
        <div className="mx-auto max-w-4xl">
          <SectionHeader
            as="h1"
            eyebrow="MapAble Accessibility Map"
            title="Find accessible places confidently."
            description="A free, community-powered accessibility layer for venues, services, transport nodes, and community spaces."
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton href="/access/map">Open live map</LinkButton>
            <LinkButton href="/early-access" variant="outline">
              Join early access
            </LinkButton>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-12 px-5 py-12">
        <section aria-labelledby="records-heading">
          <SectionHeader as="h2" id="records-heading" title="What MapAble records" />
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {recordedFeatures.map((feature) => (
              <li key={feature} className="rounded-lg border border-border px-4 py-3 text-sm">
                {feature}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="trust-heading">
          <SectionHeader
            as="h2"
            id="trust-heading"
            title="How data is trusted"
            description="Community reports, venue owner updates, assessor-verified information, and timestamped changes."
          />
        </section>

        <AccessMapSearchPreview />

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border p-5">
            <h2 className="text-lg font-bold">Contribute</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
              <li>
                <Link href="/access/map" className="text-primary underline">
                  Add a venue
                </Link>
              </li>
              <li>
                <Link href="/access/feed" className="text-primary underline">
                  Report an access issue
                </Link>
              </li>
              <li>Join a mapping day (pilot)</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border p-5">
            <h2 className="text-lg font-bold">For venue owners</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Claim your listing, improve accessibility details, or request a MapAble accessibility review.
            </p>
            <LinkButton href="/venues" className="mt-4" variant="outline">
              Venue partner info
            </LinkButton>
          </div>
        </section>

        <AccreditationDisclaimer />
      </div>
    </main>
  );
}
