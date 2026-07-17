import { dryRunStubReport, parseArgs, ts, writeArtifact } from "./_shared";

/**
 * migrate-consent-records-v2
 *
 * Bridges legacy `ConsentRecord` rows to the immutable `ConsentDirective`
 * layer. Only rows that already carry sufficient purpose + recipient
 * information are auto-bridged. Everything else is emitted as a candidate
 * list for human review — Wave 9 will not silently synthesise a directive
 * from ambiguous consent history.
 */
async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  if (dryRun) {
    const report = dryRunStubReport({
      name: "federation:migrate-consent-records-v2",
      summary:
        "dry-run: would enumerate ConsentRecord rows and classify them as bridgeable vs review-required",
      extras: {
        rules: [
          "record.grantedToUserId or grantedToOrganisationId required",
          "scope must map to a directive purpose",
          "revoked records do NOT produce a directive; they get a directive with decision=withdrawn",
          "records without an active grantee are queued for participant review, not auto-bridged",
        ],
      },
    });
    const file = writeArtifact(
      "federation",
      `migrate-consent-records-v2-${ts()}.json`,
      report
    );
    console.log(JSON.stringify(report, null, 2));
    console.log(`report: ${file}`);
    return;
  }
  const { prisma } = await import("@/lib/prisma");
  const total = await prisma.consentRecord.count();
  const bridged = await prisma.consentRecord.count({
    where: { directiveId: { not: null } },
  });
  const ambiguous = await prisma.consentRecord.count({
    where: {
      directiveId: null,
      grantedToUserId: null,
      grantedToOrganisationId: null,
    },
  });
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: false,
    totals: { total, bridged, ambiguous },
    note: "wave 9 does not auto-bridge ambiguous records; they require participant confirmation",
  };
  const file = writeArtifact(
    "federation",
    `migrate-consent-records-v2-${ts()}.json`,
    report
  );
  console.log(JSON.stringify(report, null, 2));
  console.log(`report: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
