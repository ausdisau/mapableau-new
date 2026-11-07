import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";
import { canonicalAlternate } from "@/lib/config/canonical-url";

export const metadata = {
  title: "Accessibility statement | MapAble",
  description:
    "MapAble accessibility statement covering WCAG 2.2 design targets across web interfaces, ATAG for Places authoring, and UAAG-informed display preferences. Not a formal conformance claim.",
  alternates: canonicalAlternate("/accessibility-statement"),
};

const linkClass = "font-medium text-[#0C1833] underline underline-offset-2";

export default function AccessibilityStatementPage() {
  return (
    <PublicInfoPage
      eyebrow="Accessibility"
      title="Accessibility statement"
      description="MapAble is designed toward WCAG 2.2 AA across its web interfaces, with formal testing pending before any compliance claim is made. ATAG guides Places authoring; UAAG informs display preferences as design guidance only — not conformance claims."
      ctaLabel="Send accessibility feedback"
      ctaHref="/contact"
      sections={[
        {
          title: "Current status",
          content: (
            <p>
              The public website uses semantic HTML, keyboard-focus styles,
              responsive layouts and accessible loading/error states. Formal
              WCAG 2.2 AA testing has not yet been completed, so MapAble does
              not claim conformance at this stage. MapAble likewise does not
              claim ATAG 2.0 or UAAG 2.0 conformance, and does not claim to be
              a user agent.
            </p>
          ),
        },
        {
          title: "Design targets",
          content: (
            <ul className="list-disc space-y-2 pl-5">
              <li>Keyboard-accessible navigation and controls.</li>
              <li>Visible focus states and sufficient text contrast.</li>
              <li>Clear headings, labels and status messages.</li>
              <li>Mobile-responsive layouts and touch-friendly controls.</li>
              <li>
                Discoverable display preferences (text size, contrast, motion)
                via Display settings in the site header.
              </li>
            </ul>
          ),
        },
        {
          title: "WAI guidelines (WCAG, ATAG, UAAG)",
          content: (
            <>
              <p>
                The W3C Web Accessibility Initiative describes accessible
                experiences as the combination of{" "}
                <a
                  className={linkClass}
                  href="https://www.w3.org/WAI/fundamentals/components/"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  accessible content, authoring tools, and user agents
                </a>
                . MapAble’s design targets map as follows (design targets only —
                not conformance claims):
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>WCAG 2.2</strong> — design target for MapAble’s web
                  interfaces, including marketing pages, Places UI,
                  authentication, preference panels, dashboards, and CareOS
                  journeys.{" "}
                  <a
                    className={linkClass}
                    href="https://www.w3.org/WAI/standards-guidelines/wcag/"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    WCAG standards and guidelines
                  </a>
                  .
                </li>
                <li>
                  <strong>ATAG 2.0</strong> — Places authoring, editing, and
                  publishing (Part A: accessible authoring tool; Part B:
                  support for accessible content creation).{" "}
                  <a
                    className={linkClass}
                    href="https://www.w3.org/WAI/standards-guidelines/atag/"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    ATAG overview
                  </a>
                  .
                </li>
                <li>
                  <strong>UAAG 2.0</strong> — Working Group Note providing
                  design guidance for display preferences (text size, contrast,
                  motion). MapAble is not a user agent and does not claim UAAG
                  conformance. Spec and reference:{" "}
                  <a
                    className={linkClass}
                    href="https://www.w3.org/TR/UAAG20/"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    UAAG 2.0
                  </a>
                  ,{" "}
                  <a
                    className={linkClass}
                    href="https://w3c.github.io/UAAG/UAAG20-Reference/"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    UAAG 2.0 Reference
                  </a>
                  . Open <strong>Display settings</strong> in the site header
                  to adjust preferences.
                </li>
              </ul>
              <p>
                Internal mapping for contributors:{" "}
                <code className="rounded bg-slate-100 px-1 text-xs">
                  docs/accessibility/WAI-GUIDELINES-MAP.md
                </code>
                .
              </p>
            </>
          ),
        },
        {
          title: "Known work remaining",
          content: (
            <p>
              Map, dashboard and workflow-heavy screens require additional
              assistive technology testing, manual keyboard checks and
              user-centred accessibility review before production launch.
              Places authoring needs continued ATAG Part A/B evaluation
              (including accessible content output). Display preferences need
              continued keyboard, screen reader, zoom, reduced-motion, and
              persistence testing alongside WCAG for the panel UI itself.
            </p>
          ),
        },
        {
          title: "Feedback",
          content: (
            <p>
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
