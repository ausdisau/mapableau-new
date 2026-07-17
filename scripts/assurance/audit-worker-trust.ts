import { prisma } from "@/lib/prisma";

import { parseAssuranceArgv } from "./argv";

async function main() {
  const args = parseAssuranceArgv();
  if (args.dryRun) {
    console.log(JSON.stringify({ dryRun: true, would: ["audit_worker_eligibility"] }, null, 2));
    return;
  }

  const rows = await prisma.workerPlatformEligibilityAssessment.findMany({
    where: args.organisationId ? { organisationId: args.organisationId } : undefined,
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const summary = {
    total: rows.length,
    pendingClearance: rows.filter((r) => r.status === "pending_clearance").length,
    sourceUnavailable: rows.filter((r) => r.status === "source_unavailable").length,
    eligible: rows.filter((r) => r.status === "eligible").length,
    blocked: rows.filter((r) => r.blocksPlatformWork).length,
  };
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
