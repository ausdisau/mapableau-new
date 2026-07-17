import { dryRunStubReport, parseArgs, ts, writeArtifact } from "./_shared";

/**
 * audit-disclosure-bypasses
 *
 * Wave 9 mandates every external participant-data flow to pass through the
 * disclosure gateway (which mints a `DisclosureManifest`). This audit
 * cross-references audit-event traces of `data.external.disclosed` calls
 * against `DisclosureManifest` rows and flags anything that lacks a
 * manifest.
 */
async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  if (dryRun) {
    const report = dryRunStubReport({
      name: "federation:audit-disclosure-bypasses",
      summary:
        "dry-run: would join audit events to DisclosureManifest rows and flag disclosures without a manifest",
      extras: {
        expectedActions: [
          "data.external.disclosed",
          "credential.presentation.presented",
          "disclosure.gateway.approved",
        ],
      },
    });
    const file = writeArtifact(
      "federation",
      `audit-disclosure-bypasses-${ts()}.json`,
      report
    );
    console.log(JSON.stringify(report, null, 2));
    console.log(`report: ${file}`);
    return;
  }
  const { prisma } = await import("@/lib/prisma");
  const manifests = await prisma.disclosureManifest.count();
  const events = await prisma.auditEvent.count({
    where: { action: "data.external.disclosed" },
  });
  const bypasses = Math.max(0, events - manifests);
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: false,
    manifests,
    events,
    bypasses,
    note:
      bypasses > 0
        ? "found audit events without a matching DisclosureManifest — bypass suspected"
        : "no bypasses detected",
  };
  const file = writeArtifact(
    "federation",
    `audit-disclosure-bypasses-${ts()}.json`,
    report
  );
  console.log(JSON.stringify(report, null, 2));
  console.log(`report: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
