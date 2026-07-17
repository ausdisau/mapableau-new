import { prisma } from "@/lib/prisma";

import { parseArgs, writeArtifact, ts } from "../tenancy/_shared";

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  if (dryRun) {
    const file = writeArtifact(
      "platform",
      `audit-capacity-${ts()}.json`,
      {
        generatedAt: new Date().toISOString(),
        dryRun: true,
        would: ["evaluate_without_db_writes"],
        note: "Dry-run only — no database connection required.",
      }
    );
    console.log(JSON.stringify({ dryRun: true, report: file }, null, 2));
    return;
  }
  const quotas = await prisma.tenantQuotaProfile.findMany({
    where: { active: true },
    take: 500,
  });
  const health = await prisma.tenantOperationalHealth.findMany({
    orderBy: { windowEnd: "desc" },
    take: 500,
  });
  const file = writeArtifact("platform", `capacity-${ts()}.json`, {
    generatedAt: new Date().toISOString(),
    dryRun,
    quotas: quotas.length,
    healthWindows: health.length,
  });
  console.log(`quotas=${quotas.length} health_windows=${health.length}`);
  console.log(`report: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
