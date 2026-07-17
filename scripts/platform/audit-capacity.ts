import { prisma } from "@/lib/prisma";

import { parseArgs, writeArtifact, ts } from "../tenancy/_shared";

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
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
