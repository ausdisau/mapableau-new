import { Glossary, Abbr } from "@/components/content/Glossary";
import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";
import { canonicalAlternate } from "@/lib/config/canonical-url";

export const metadata = {
  title: "Accessibility statement | MapAble",
  description:
    "Scoped WCAG 2.2 AAA and ATAG 2.0 claims for MapAble marketing and authoring surfaces, with known exceptions.",
  alternates: canonicalAlternate("/accessibility-statement"),
};

export default function AccessibilityStatementPage() {
  return (
    <PublicInfoPage
      eyebrow="Accessibility"
      title="Accessibility statement"
      description="MapAble aims for WCAG 2.2 Level AAA on marketing pages and ATAG 2.0 for authoring tools. AAA is not claimed for every surface — see the scoped claim and exceptions below."
      ctaLabel="Send accessibility feedback"
      ctaHref="/contact"
      sections={[
        {
          title: "Scoped claim (current)",
          content: (
            <div className="space-y-3 max-w-[80ch] leading-[1.5]">
              <p>
                <strong>Marketing / public Next.js surfaces</strong> (homepage,
                Care, Transport, Contact, Ecosystem, this statement): designed
                and gated toward <Abbr term="WCAG" /> 2.2 Level{" "}
                <Abbr term="AAA" /> for automated axe checks (serious/critical),
                44×44&nbsp;px targets on primary chrome, dual focus rings, and
                AAA colour pairs.
              </p>
              <p>
                <strong>Authoring tools</strong> (Geo Admin, Coverage Editor,
                floor-plan studio, ads creatives): progressing toward{" "}
                <Abbr term="ATAG" /> 2.0 with alt-text prompts, error summaries,
                review-before-commit, and live status announcements.
              </p>
              <p>
                <strong>Authenticated Vite client</strong>: Radix dialogs and
                MapView text alternatives ship in remediation PRs; axe AAA CI
                for the Vite twin is explicitly excluded until a stable preview
                server is available.
              </p>
              <p>
                Sessions currently last up to 30 days with sliding renewal and
                no idle timeout. There is no data-losing auto-logout today;
                expiry-warning UX is additive.{" "}
                <Abbr term="WCAG" /> 2.2.1 / 2.2.5 are treated as
                satisfied-by-design until an idle timeout is introduced.
              </p>
            </div>
          ),
        },
        {
          title: "Known exceptions",
          content: (
            <ul className="list-disc space-y-2 pl-5 max-w-[80ch] leading-[1.5]">
              <li>
                Third-party embeds and widgets (payment providers, maps tiles,
                analytics) are outside the AAA claim.
              </li>
              <li>
                Brand PNG wordmark asset remains for crawlers; headers use SVG
                mark + HTML text (see AAA token exceptions doc).
              </li>
              <li>
                No timed media currently ships on marketing routes — caption /
                transcript / audio-description requirements apply when media is
                added (floor-plan assets already require alt text).
              </li>
              <li>
                User testing with people with disability is required before any
                unrestricted AAA / ATAG conformance claim is published.
              </li>
            </ul>
          ),
        },
        {
          title: "Plain-language note for NDIS content",
          content: (
            <p className="max-w-[80ch] leading-[1.5]">
              The <Abbr term="NDIS" /> is Australia’s national disability
              insurance program. MapAble helps people find accessible places and
              supports. We do not decide funding. You stay in control of what is
              booked or shared.
            </p>
          ),
        },
        {
          title: "Glossary",
          content: <Glossary />,
        },
        {
          title: "Feedback",
          content: (
            <p className="max-w-[80ch] leading-[1.5]">
              If a page is difficult to use with a screen reader, keyboard,
              switch control, magnification, captions, colour settings or
              another access technology, contact MapAble so the issue can be
              recorded and prioritised.
            </p>
          ),
        },
      ]}
    />
  );
}
