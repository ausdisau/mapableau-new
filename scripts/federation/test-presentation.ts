import { dryRunStubReport, parseArgs, ts, writeArtifact } from "./_shared";
import { refuseProductionIssuance } from "@/lib/federation-conformance/oid4vci";
import { refuseProductionPresentation } from "@/lib/federation-conformance/oid4vp";
import { isFederationActivated } from "@/lib/credentials/issuance";

/**
 * federation:test-presentation
 *
 * Non-DB smoke test that verifies:
 *   1. OID4VP production endpoints refuse activation without the env flag.
 *   2. Presentation adapter defaults to simulator when activation is off.
 */
async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));

  const results: Array<{ name: string; ok: boolean; detail?: string }> = [];

  let issuanceRefused = false;
  try {
    refuseProductionIssuance("test-presentation");
  } catch {
    issuanceRefused = true;
  }
  results.push({
    name: "oid4vci_production_refused_without_activation",
    ok: process.env.FEDERATION_ACTIVATION === "true" ? true : issuanceRefused,
  });

  let verificationRefused = false;
  try {
    refuseProductionPresentation("test-presentation");
  } catch {
    verificationRefused = true;
  }
  results.push({
    name: "oid4vp_production_refused_without_activation",
    ok:
      process.env.FEDERATION_ACTIVATION === "true"
        ? true
        : verificationRefused,
  });

  results.push({
    name: "simulator_default_when_activation_off",
    ok:
      process.env.FEDERATION_ACTIVATION === "true"
        ? true
        : !isFederationActivated(),
  });

  const passed = results.every((r) => r.ok);
  const report = dryRun
    ? {
        ...dryRunStubReport({
          name: "federation:test-presentation",
          summary: "dry-run smoke test — no DB required",
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
    `test-presentation-${ts()}.json`,
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
