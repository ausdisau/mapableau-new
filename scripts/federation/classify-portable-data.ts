import { dryRunStubReport, parseArgs, ts, writeArtifact } from "./_shared";

/**
 * classify-portable-data
 *
 * Emits classification counts for `ParticipantDataPackage` rows. Wave 9
 * uses a small classification vocabulary; anything outside the vocabulary
 * is flagged for human review.
 */
const KNOWN_CLASSIFICATIONS = new Set([
  "participant_confidential",
  "participant_public",
  "provider_shared",
  "operational",
  "system_internal",
]);

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  if (dryRun) {
    const report = dryRunStubReport({
      name: "federation:classify-portable-data",
      summary:
        "dry-run: would summarise participant data packages by classification and flag unknowns",
      extras: { knownClassifications: Array.from(KNOWN_CLASSIFICATIONS) },
    });
    const file = writeArtifact(
      "federation",
      `classify-portable-data-${ts()}.json`,
      report
    );
    console.log(JSON.stringify(report, null, 2));
    console.log(`report: ${file}`);
    return;
  }
  const { prisma } = await import("@/lib/prisma");
  const grouped = await prisma.participantDataPackage.groupBy({
    by: ["classification"],
    _count: { _all: true },
  });
  const flagged = grouped.filter(
    (g) => !KNOWN_CLASSIFICATIONS.has(g.classification)
  );
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: false,
    grouped,
    flagged,
  };
  const file = writeArtifact(
    "federation",
    `classify-portable-data-${ts()}.json`,
    report
  );
  console.log(JSON.stringify(report, null, 2));
  console.log(`report: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
