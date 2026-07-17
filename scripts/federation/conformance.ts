import { checkPrivacyEnvironment } from "@/lib/federation-conformance/privacy";
import { checkAccessibilityContract } from "@/lib/federation-conformance/accessibility";

import { dryRunStubReport, parseArgs, ts, writeArtifact } from "./_shared";

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  const privacy = checkPrivacyEnvironment(process.env);
  const accessibility = checkAccessibilityContract({
    hasPlainLanguageDisclaimer: true,
    hasAmberFederationBanner: true,
    supportsScreenReaderLabels: true,
  });
  const report = dryRun
    ? dryRunStubReport({
        name: "federation:conformance",
        summary: "dry-run: privacy + accessibility env checks only",
        extras: { privacy, accessibility },
      })
    : {
        generatedAt: new Date().toISOString(),
        dryRun: false,
        privacy,
        accessibility,
        summary: {
          privacyFailures: privacy.filter((f) => !f.ok).length,
          accessibilityFailures: accessibility.filter((f) => !f.ok).length,
        },
      };
  const file = writeArtifact("federation", `conformance-${ts()}.json`, report);
  console.log(JSON.stringify(report, null, 2));
  console.log(`report: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
