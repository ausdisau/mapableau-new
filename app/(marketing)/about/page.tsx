import { MetricsSection } from "@/components/canvas/MetricsSection";
import { RoadmapPhases } from "@/components/canvas/RoadmapPhases";
import { StrategicContrast } from "@/components/canvas/StrategicContrast";
import { TrustLayer } from "@/components/canvas/TrustLayer";
import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";
import { MAPABLE_LOGO_ALT, MAPABLE_LOGO_LOCKUP_SRC } from "@/lib/brand/constants";
import {
  metricGroups,
  roadmapPhases,
  trustPrinciples,
} from "@/lib/canvas/canvas-data";
import { canonicalAlternate } from "@/lib/config/canonical-url";

export const metadata = {
  title: "About us | MapAble",
  description:
    "Australian Disability Ltd develops MapAble with a commitment to disability representation, accessibility and human rights.",
  alternates: canonicalAlternate("/about"),
};

export default function AboutPage() {
  return (
    <>
      <PublicInfoPage
        eyebrow="About us"
        title="Developed by Australian Disability Ltd."
        description="MapAble is a disability-led digital platform. Australian Disability Ltd builds it to support access, choice and connection — with authentic disability representation, accessibility and human rights at the centre."
        ctaLabel="Explore MapAble"
        ctaHref="/explore"
        media={
          <img
            src={MAPABLE_LOGO_LOCKUP_SRC}
            alt={MAPABLE_LOGO_ALT}
            width={1254}
            height={1254}
            className="mx-auto h-auto w-full max-w-[14rem] bg-white object-contain"
          />
        }
        sections={[
          {
            title: "Who we are",
            content: (
              <p>
                Australian Disability Ltd develops MapAble. The work is shaped
                with people with disability, not only for them. The public site
                is an information layer. Signed-in tools stay in the MapAble
                application.
              </p>
            ),
          },
          {
            title: "What MapAble is",
            content: (
              <p>
                MapAble is not being built as a simple marketplace or a
                traditional charity brochure. It is a technology platform for
                information, services and communities, with participant control
                and safeguarding designed in.
              </p>
            ),
          },
          {
            title: "Current status",
            content: (
              <p>
                Public module pages and provider discovery are available for
                exploration and pilot feedback. Operational claims such as NDIS
                registration, WCAG conformance and Australian data sovereignty
                require evidence before being stated as confirmed. MapAble is
                designed toward WCAG 2.2 AA. Formal testing is still required.
              </p>
            ),
          },
          {
            title: "Design principles",
            content: (
              <ul className="list-disc space-y-2 pl-5">
                <li>Consent before sensitive sharing.</li>
                <li>Deny access by default and audit sensitive access.</li>
                <li>Human confirmation for high-risk actions.</li>
                <li>
                  Accessibility-first design with formal testing before
                  compliance claims.
                </li>
              </ul>
            ),
          },
        ]}
      />
      <StrategicContrast />
      <MetricsSection groups={metricGroups} />
      <RoadmapPhases phases={roadmapPhases} />
      <TrustLayer principles={trustPrinciples} />
    </>
  );
}
