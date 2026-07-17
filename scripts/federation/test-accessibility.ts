import { dryRunStubReport, parseArgs, ts, writeArtifact } from "./_shared";
import { checkAccessibilityContract } from "@/lib/federation-conformance/accessibility";

/**
 * federation:test-accessibility
 *
 * Confirms the accessibility contract requires plain-language disclaimer,
 * amber "not government credential" banner, and screen-reader labels.
 * Cross-checks both the compliant and non-compliant inputs.
 */
async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));

  const ok = checkAccessibilityContract({
    hasPlainLanguageDisclaimer: true,
    hasAmberFederationBanner: true,
    supportsScreenReaderLabels: true,
  });

  const bad = checkAccessibilityContract({
    hasPlainLanguageDisclaimer: false,
    hasAmberFederationBanner: false,
    supportsScreenReaderLabels: false,
  });

  const results = [
    {
      name: "compliant_ui_passes",
      ok: ok.every((f) => f.ok),
      detail: ok,
    },
    {
      name: "non_compliant_ui_fails",
      ok: bad.some((f) => !f.ok),
      detail: bad,
    },
  ];

  const passed = results.every((r) => r.ok);
  const report = dryRun
    ? {
        ...dryRunStubReport({
          name: "federation:test-accessibility",
          summary: "dry-run: accessibility conformance",
          extras: { results },
        }),
        passed,
      }
    : {
        generatedAt: new Date().toISOString(),
        dryRun: false,
        results,
        passed,
      };

  const file = writeArtifact(
    "federation",
    `test-accessibility-${ts()}.json`,
    report
  );
  console.log(JSON.stringify(report, null, 2));
  console.log(`report: ${file}`);
  if (!passed) process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
