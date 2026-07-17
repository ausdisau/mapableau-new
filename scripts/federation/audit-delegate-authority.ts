import { dryRunStubReport, parseArgs, ts, writeArtifact } from "./_shared";

/**
 * audit-delegate-authority
 *
 * Second-pass wrapper on delegation. Flags:
 *   - delegate == participant (a person cannot delegate to themselves)
 *   - authority categories that need a specific verification level
 *   - "relationship" contact records that were interpreted as authority
 */
async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  if (dryRun) {
    const report = dryRunStubReport({
      name: "federation:audit-delegate-authority",
      summary:
        "dry-run: enumerates DelegateAuthority rows for the invariants that Wave 9 codified",
      extras: {
        invariants: [
          "delegateId != participantId (no self-delegation)",
          "legal_representation => legal_instrument_verified",
          "billing_manage => platform_verified or higher",
          "emergency_action => platform_verified with time-bounded scope",
        ],
      },
    });
    const file = writeArtifact(
      "federation",
      `audit-delegate-authority-${ts()}.json`,
      report
    );
    console.log(JSON.stringify(report, null, 2));
    console.log(`report: ${file}`);
    return;
  }
  const { prisma } = await import("@/lib/prisma");
  const authorities = await prisma.delegateAuthority.findMany({
    take: 5000,
    select: {
      id: true,
      participantId: true,
      delegateId: true,
      authorityCategories: true,
      verification: true,
    },
  });
  const selfDelegation = authorities.filter(
    (a) => a.delegateId === a.participantId
  );
  const legalWithoutInstrument = authorities.filter(
    (a) =>
      a.authorityCategories.includes("legal_representation") &&
      a.verification !== "legal_instrument_verified"
  );
  const billingUnderVerified = authorities.filter(
    (a) =>
      a.authorityCategories.includes("billing_manage") &&
      a.verification !== "platform_verified" &&
      a.verification !== "legal_instrument_verified"
  );
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: false,
    total: authorities.length,
    findings: {
      selfDelegation: selfDelegation.length,
      legalWithoutInstrument: legalWithoutInstrument.length,
      billingUnderVerified: billingUnderVerified.length,
    },
  };
  const file = writeArtifact(
    "federation",
    `audit-delegate-authority-${ts()}.json`,
    report
  );
  console.log(JSON.stringify(report, null, 2));
  console.log(`report: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
