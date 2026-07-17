import { dryRunStubReport, parseArgs, ts, writeArtifact } from "./_shared";
import { isProhibitedRawSubject } from "@/lib/identity-federation/privacy";

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  if (dryRun) {
    const report = dryRunStubReport({
      name: "federation:audit-identifiers",
      summary:
        "dry-run: would scan federation subject IDs to ensure no raw user IDs, emails, or NDIS numbers are leaked as pairwise identifiers",
      extras: {
        checks: [
          "no_raw_user_id_leakage",
          "no_email_as_subject",
          "no_ndis_number_as_subject",
          "pairwise_scope_specific",
        ],
        samples: [
          { subject: "user_abc123", flagged: isProhibitedRawSubject("user_abc123") },
          { subject: "alice@example.com", flagged: isProhibitedRawSubject("alice@example.com") },
          { subject: "43012345", flagged: isProhibitedRawSubject("43012345") },
          { subject: "abcd-ef12-3456", flagged: isProhibitedRawSubject("abcd-ef12-3456") },
        ],
      },
    });
    const file = writeArtifact(
      "federation",
      `audit-identifiers-${ts()}.json`,
      report
    );
    console.log(JSON.stringify(report, null, 2));
    console.log(`report: ${file}`);
    return;
  }
  const { prisma } = await import("@/lib/prisma");
  const total = await prisma.pairwiseSubjectIdentifier.count();
  const sample = await prisma.pairwiseSubjectIdentifier.findMany({
    take: 100,
    select: { pairwiseSub: true, entityId: true },
  });
  const flagged = sample.filter((s) => isProhibitedRawSubject(s.pairwiseSub));
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: false,
    total,
    sampled: sample.length,
    flagged: flagged.length,
    flaggedExamples: flagged.slice(0, 5),
  };
  const file = writeArtifact(
    "federation",
    `audit-identifiers-${ts()}.json`,
    report
  );
  console.log(JSON.stringify(report, null, 2));
  console.log(`report: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
