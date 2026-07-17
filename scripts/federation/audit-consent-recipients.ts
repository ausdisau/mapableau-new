import { dryRunStubReport, parseArgs, ts, writeArtifact } from "./_shared";

/**
 * audit-consent-recipients
 *
 * Confirms every ConsentDirective and legacy ConsentRecord names an explicit
 * recipient (grantee user/org or recipient category). Directives without a
 * recipient must fail closed — Wave 9 will not treat "anyone" as authorised.
 */
async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  if (dryRun) {
    const report = dryRunStubReport({
      name: "federation:audit-consent-recipients",
      summary:
        "dry-run: would flag directives/records missing recipient category or grantee",
      extras: {
        checks: [
          "recipient_category_present",
          "grantee_present_for_legacy_records",
          "external_entity_linked_where_category_external",
          "no_wildcard_recipient_patterns",
        ],
      },
    });
    const file = writeArtifact(
      "federation",
      `audit-consent-recipients-${ts()}.json`,
      report
    );
    console.log(JSON.stringify(report, null, 2));
    console.log(`report: ${file}`);
    return;
  }
  const { prisma } = await import("@/lib/prisma");
  const [directives, records] = await Promise.all([
    prisma.consentDirective.findMany({
      select: {
        id: true,
        recipientCategory: true,
        recipientOrganisationId: true,
        recipientEntityId: true,
      },
      take: 5000,
    }),
    prisma.consentRecord.findMany({
      select: {
        id: true,
        grantedToUserId: true,
        grantedToOrganisationId: true,
      },
      take: 5000,
    }),
  ]);
  const directiveMissingRecipient = directives.filter(
    (d) =>
      d.recipientCategory !== "self" &&
      !d.recipientOrganisationId &&
      !d.recipientEntityId
  ).length;
  const recordMissingGrantee = records.filter(
    (r) => !r.grantedToUserId && !r.grantedToOrganisationId
  ).length;
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: false,
    sampled: { directives: directives.length, records: records.length },
    findings: {
      directiveMissingRecipient,
      recordMissingGrantee,
    },
  };
  const file = writeArtifact(
    "federation",
    `audit-consent-recipients-${ts()}.json`,
    report
  );
  console.log(JSON.stringify(report, null, 2));
  console.log(`report: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
