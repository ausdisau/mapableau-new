import { prisma } from "@/lib/prisma";

import { parseAssuranceArgv } from "./argv";

/**
 * Ensures legacy SecurityEvidence thin pointers exist for AssuranceEvidence records.
 */
async function main() {
  const args = parseAssuranceArgv();
  if (args.dryRun) {
    console.log(
      JSON.stringify(
        { dryRun: true, would: ["link_security_evidence_pointers_for_assurance_evidence"] },
        null,
        2
      )
    );
    return;
  }

  const evidence = await prisma.assuranceEvidence.findMany({
    where: { isCurrent: true },
    select: { id: true, controlId: true, title: true, summary: true, documentId: true },
  });

  let created = 0;
  let skipped = 0;

  for (const row of evidence) {
    const existing = await prisma.securityEvidence.findFirst({
      where: { assuranceEvidenceId: row.id },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.securityEvidence.create({
      data: {
        controlId: row.controlId,
        documentId: row.documentId,
        notes: row.summary ?? row.title,
        assuranceEvidenceId: row.id,
      },
    });
    created += 1;
  }

  console.log(JSON.stringify({ total: evidence.length, created, skipped }, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
