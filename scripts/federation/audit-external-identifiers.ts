import { dryRunStubReport, parseArgs, ts, writeArtifact } from "./_shared";
import { isProhibitedRawSubject } from "@/lib/identity-federation/privacy";

/**
 * audit-external-identifiers
 *
 * Alias for audit-identifiers, tuned for the compliance packaging path:
 * inspects ExternalFederationEntity records and PairwiseSubjectIdentifier
 * sample rows for accidental raw-ID leakage. Wave 9 mandates opaque
 * pairwise subjects per (participant, entity).
 */
async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  if (dryRun) {
    const report = dryRunStubReport({
      name: "federation:audit-external-identifiers",
      summary:
        "dry-run: would ensure no raw user_id / email / NDIS number is used as a federation subject",
    });
    const file = writeArtifact(
      "federation",
      `audit-external-identifiers-${ts()}.json`,
      report
    );
    console.log(JSON.stringify(report, null, 2));
    console.log(`report: ${file}`);
    return;
  }
  const { prisma } = await import("@/lib/prisma");
  const sample = await prisma.pairwiseSubjectIdentifier.findMany({
    take: 500,
    select: { pairwiseSub: true, entityId: true },
  });
  const flagged = sample.filter((s) => isProhibitedRawSubject(s.pairwiseSub));
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: false,
    sampled: sample.length,
    flagged: flagged.length,
  };
  const file = writeArtifact(
    "federation",
    `audit-external-identifiers-${ts()}.json`,
    report
  );
  console.log(JSON.stringify(report, null, 2));
  console.log(`report: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
