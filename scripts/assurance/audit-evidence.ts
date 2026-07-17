import { evaluateEvidenceFreshness } from "@/lib/assurance/testing/evidence-freshness";
import { prisma } from "@/lib/prisma";

import { parseAssuranceArgv } from "./argv";

async function main() {
  const args = parseAssuranceArgv();
  if (args.dryRun) {
    console.log(JSON.stringify({ dryRun: true, would: ["audit_current_evidence_freshness"] }, null, 2));
    return;
  }

  const evidence = await prisma.assuranceEvidence.findMany({
    where: { isCurrent: true },
    include: { control: { select: { controlCode: true, evidenceFreshnessDays: true } } },
  });

  const report = evidence.map((e) => ({
    id: e.id,
    controlCode: e.control.controlCode,
    ...evaluateEvidenceFreshness({
      collectedAt: e.collectedAt,
      expiresAt: e.expiresAt,
      freshnessDays: e.control.evidenceFreshnessDays,
    }),
  }));

  console.log(JSON.stringify({ count: report.length, report }, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
