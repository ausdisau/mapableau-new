import { findOverdueRotations } from "@/lib/tenancy/encryption/key-rotation";
import { prisma } from "@/lib/prisma";

import { parseArgs, writeArtifact, ts } from "./_shared";

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  if (dryRun) {
    const file = writeArtifact(
      "tenancy",
      `audit-encryption-${ts()}.json`,
      {
        generatedAt: new Date().toISOString(),
        dryRun: true,
        would: ["audit_without_db"],
        note: "Dry-run only — no database connection required.",
      }
    );
    console.log(JSON.stringify({ dryRun: true, report: file, pass: true }, null, 2));
    return;
  }
  const overdue = await findOverdueRotations();
  const total = await prisma.tenantEncryptionProfile.count();
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun,
    totalProfiles: total,
    overdueRotations: overdue.length,
    overdueDetails: overdue.map((p) => ({
      id: p.id,
      organisationId: p.organisationId,
      lastRotatedAt: p.lastRotatedAt,
      nextRotationAt: p.nextRotationAt,
    })),
    disclaimer:
      "Encryption profiles record INTENT. They do not prove KMS custody.",
  };
  const file = writeArtifact("tenancy", `audit-encryption-${ts()}.json`, report);
  console.log(JSON.stringify(report, null, 2));
  console.log(`report: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
