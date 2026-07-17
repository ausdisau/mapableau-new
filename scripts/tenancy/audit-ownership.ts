import { prisma } from "@/lib/prisma";

import { parseArgs, writeArtifact, ts } from "./_shared";

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  const orgs = await prisma.organisation.findMany({
    select: {
      id: true,
      tenantKey: true,
      legalName: true,
      tenantStatus: true,
      operatingModel: true,
    },
  });
  const missingKey = orgs.filter((o) => !o.tenantKey).length;
  const missingLegal = orgs.filter((o) => !o.legalName).length;
  const report = {
    generatedAt: new Date().toISOString(),
    totalOrganisations: orgs.length,
    missingTenantKey: missingKey,
    missingLegalName: missingLegal,
    dryRun,
  };
  const file = writeArtifact("tenancy", `audit-ownership-${ts()}.json`, report);
  console.log(JSON.stringify(report, null, 2));
  console.log(`report: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
