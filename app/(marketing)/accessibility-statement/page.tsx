import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";

export const metadata = {
  title: "Accessibility statement",
  description:
    "MapAble accessibility statement, display settings, and current WCAG testing status.",
};

export default function AccessibilityStatementPage() {
  return (
    <PublicInfoPage
      eyebrow="Accessibility"
      title="Accessibility statement"
      description="MapAble is designed toward WCAG 2.2 AA accessibility, with formal testing pending before any compliance claim is made."
      ctaLabel="Send accessibility feedback"
      ctaHref="/contact?topic=accessibility"
      sections={[
        {
          title: "Current status",
          content: (
            <p>
              The public website uses semantic HTML, keyboard-focus styles,
              responsive layouts and accessible loading/error states. Formal
              WCAG 2.2 AA testing has not yet been completed, so MapAble does
              not claim conformance at this stage.
            </p>
          ),
        },
        {
          title: "Accessibility settings panel",
          content: (
            <div className="space-y-3">
              <p>
                MapAble provides a first-party Accessibility settings panel in
                the site header and footer. These controls personalise how pages
                look and behave on your device (for example text size, contrast,
                motion and reading aids).
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  Core accessibility — keyboard navigation, focus management,
                  semantic structure, labels, captions and contrast — remains
                  active whether or not you change panel settings.
                </li>
                <li>
                  Enabling a preset or individual setting does not create or
                  certify WCAG conformance.
                </li>
                <li>
                  Browser and operating-system preferences such as reduced
                  motion and forced colours continue to be respected.
                </li>
                <li>
                  Settings are stored on this device by default
                  (`mapable:accessibility-ui:v1`). No cookie is required for
                  local personalisation.
                </li>
                <li>
                  If you sign in, you may optionally save display settings to
                  your MapAble account so they can follow you across devices.
                  Sync is voluntary, private by default, and does not share
                  settings with providers, workers or transport operators.
                </li>
                <li>
                  Use Reset display settings in the panel to return to the
                  default presentation and clear stored preferences on this
                  device.
                </li>
              </ul>
            </div>
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
                List alternatives for interactive maps where map geometry is
                not the only way to reach the same information.
              </li>
            </ul>
          ),
        },
        {
          title: "Known work remaining",
          content: (
            <p>
              Map, dashboard and workflow-heavy screens require additional
              assistive technology testing, manual keyboard checks and
              user-centred accessibility review before production launch.
              Remaining manual testing is tracked in{" "}
              <code>docs/qa/public-ui-accessibility-remediation.md</code>.
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
              recorded and prioritised. Use the Accessibility settings panel or
              the contact form with topic “accessibility”.
            </p>
          ),
        },
      ]}
    />
  );
}
