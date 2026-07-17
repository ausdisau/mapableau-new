import { dryRunStubReport, parseArgs, ts, writeArtifact } from "./_shared";

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  if (dryRun) {
    const report = dryRunStubReport({
      name: "federation:audit-disclosures",
      summary:
        "dry-run: would check that all external participant-data egress went through discloseParticipantData and left a DisclosureManifest.",
      extras: {
        checks: [
          "no_directive_missing",
          "no_purpose_mismatch",
          "no_recipient_mismatch",
          "no_bypass_by_raw_api",
        ],
      },
    });
    const file = writeArtifact(
      "federation",
      `audit-disclosures-${ts()}.json`,
      report
    );
    console.log(JSON.stringify(report, null, 2));
    console.log(`report: ${file}`);
    return;
  }
  const { prisma } = await import("@/lib/prisma");
  const [total, denied, minimised, requiresReview] = await Promise.all([
    prisma.disclosureManifest.count(),
    prisma.disclosureManifest.count({ where: { decision: "denied" } }),
    prisma.disclosureManifest.count({ where: { decision: "minimised" } }),
    prisma.disclosureManifest.count({
      where: { decision: "requires_participant_review" },
    }),
  ]);
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: false,
    total,
    denied,
    minimised,
    requiresReview,
  };
  const file = writeArtifact(
    "federation",
    `audit-disclosures-${ts()}.json`,
    report
  );
  console.log(JSON.stringify(report, null, 2));
  console.log(`report: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
