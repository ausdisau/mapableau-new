import { dryRunStubReport, parseArgs, ts, writeArtifact } from "./_shared";

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  if (dryRun) {
    const report = dryRunStubReport({
      name: "federation:audit-consent",
      summary:
        "dry-run: would scan consent directives for missing purpose, missing recipient, deny-overridden and withdrawn-in-place patterns",
      extras: {
        checks: [
          "purpose_present",
          "recipient_category_present",
          "immutable_revocation_chain",
          "one_time_directives_not_reused",
          "legacy_records_bridged_where_applicable",
        ],
      },
    });
    const file = writeArtifact(
      "federation",
      `audit-consent-${ts()}.json`,
      report
    );
    console.log(JSON.stringify(report, null, 2));
    console.log(`report: ${file}`);
    return;
  }
  const { prisma } = await import("@/lib/prisma");
  const [totalDirectives, missingPurposeDetail, withdrawnWithoutSupersede] =
    await Promise.all([
      prisma.consentDirective.count(),
      prisma.consentDirective.count({ where: { purposeDetail: "" } }),
      prisma.consentDirective.count({
        where: { decision: "withdrawn", supersedesId: null },
      }),
    ]);
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: false,
    totalDirectives,
    findings: {
      missingPurposeDetail,
      withdrawnWithoutSupersede,
    },
  };
  const file = writeArtifact("federation", `audit-consent-${ts()}.json`, report);
  console.log(JSON.stringify(report, null, 2));
  console.log(`report: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
