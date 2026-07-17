import { dryRunStubReport, parseArgs, ts, writeArtifact } from "./_shared";

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  if (dryRun) {
    const report = dryRunStubReport({
      name: "federation:audit-delegation",
      summary:
        "dry-run: would inspect DelegateAuthority rows for verification-invariant violations and relationship-treated-as-authority patterns",
      extras: {
        checks: [
          "legal_representation_requires_legal_instrument",
          "emergency_action_requires_platform_verified",
          "billing_manage_requires_platform_verified",
          "no_authority_over_own_identity",
        ],
      },
    });
    const file = writeArtifact(
      "federation",
      `audit-delegation-${ts()}.json`,
      report
    );
    console.log(JSON.stringify(report, null, 2));
    console.log(`report: ${file}`);
    return;
  }
  const { prisma } = await import("@/lib/prisma");
  const totals = await prisma.delegateAuthority.count();
  const flagged = await prisma.delegateAuthority.count({
    where: {
      authorityCategories: { has: "legal_representation" },
      verification: { not: "legal_instrument_verified" },
    },
  });
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: false,
    totals,
    findings: { legalRepWithoutInstrument: flagged },
  };
  const file = writeArtifact(
    "federation",
    `audit-delegation-${ts()}.json`,
    report
  );
  console.log(JSON.stringify(report, null, 2));
  console.log(`report: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
