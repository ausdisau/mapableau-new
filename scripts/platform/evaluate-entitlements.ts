import { prisma } from "@/lib/prisma";
import { evaluateRuntimeGate } from "@/lib/entitlements/runtime-gate";

import { parseArgs, writeArtifact, ts } from "../tenancy/_shared";

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  if (dryRun) {
    const file = writeArtifact(
      "platform",
      `evaluate-entitlements-${ts()}.json`,
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
  const active = await prisma.tenantFeatureEntitlement.findMany({
    where: { status: "active" },
    take: 500,
  });
  const results = [] as Array<{
    featureKey: string;
    organisationId: string;
    environment: string;
    result: unknown;
  }>;
  for (const e of active) {
    const gate = await evaluateRuntimeGate({
      featureKey: e.featureKey,
      organisationId: e.organisationId,
      environment: e.environment,
      envFlag: undefined,
      gaApproved: false,
    });
    results.push({
      featureKey: e.featureKey,
      organisationId: e.organisationId,
      environment: e.environment,
      result: gate,
    });
  }
  const file = writeArtifact("platform", `entitlements-${ts()}.json`, {
    generatedAt: new Date().toISOString(),
    dryRun,
    results,
    note: "Runtime gate requires ALL of: known key, env flag, active entitlement, and (production) GA approval.",
  });
  console.log(`evaluated: ${results.length}`);
  console.log(`report: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
