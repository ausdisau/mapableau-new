/**
 * Queue audit — enumerates ExternalIntegrationOutbox entries by organisation to
 * spot-check that jobs are enqueued with a clear owning organisation.
 */
import { prisma } from "@/lib/prisma";

import { parseArgs, writeArtifact, ts } from "./_shared";

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  const byOrg = await prisma.externalIntegrationOutbox
    .groupBy({
      by: ["organisationId"],
      _count: { organisationId: true },
    })
    .catch(() => [] as { organisationId: string | null; _count: { organisationId: number } }[]);
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun,
    byOrg,
    note: "Any row with organisationId=null is a queue-fairness concern.",
  };
  const file = writeArtifact("tenancy", `audit-queues-${ts()}.json`, report);
  console.log(JSON.stringify(byOrg, null, 2));
  console.log(`report: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
