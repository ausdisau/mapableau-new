import { prisma } from "@/lib/prisma";
import { evaluateContinuousAssurance } from "@/lib/continuous-assurance/evaluator";

import { parseArgs, writeArtifact, ts } from "../tenancy/_shared";

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  const orgs = await prisma.organisation.findMany({
    select: { id: true, name: true },
    take: 500,
  });
  const snapshots = await Promise.all(
    orgs.map(async (o) => ({
      ...o,
      snapshot: await evaluateContinuousAssurance(o.id),
    }))
  );
  const file = writeArtifact("platform", `assurance-${ts()}.json`, {
    generatedAt: new Date().toISOString(),
    dryRun,
    snapshots,
  });
  console.log(`snapshots: ${snapshots.length}`);
  console.log(`report: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
