import { prisma } from "@/lib/prisma";

import { parseAssuranceArgv } from "./argv";

/**
 * Backfills organisationId on NdiaClaimEvidenceBundle from linked invoices.
 */
async function main() {
  const args = parseAssuranceArgv();
  if (args.dryRun) {
    console.log(
      JSON.stringify(
        { dryRun: true, would: ["backfill_ndia_bundle_organisation_ids"] },
        null,
        2
      )
    );
    return;
  }

  const bundles = await prisma.ndiaClaimEvidenceBundle.findMany({
    where: { organisationId: null },
    select: { id: true, invoiceId: true },
    take: 500,
  });

  let updated = 0;
  let unresolved = 0;

  for (const bundle of bundles) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: bundle.invoiceId },
      select: { organisationId: true },
    });

    if (!invoice?.organisationId) {
      unresolved += 1;
      continue;
    }

    if (args.organisationId && invoice.organisationId !== args.organisationId) {
      continue;
    }

    await prisma.ndiaClaimEvidenceBundle.update({
      where: { id: bundle.id },
      data: { organisationId: invoice.organisationId },
    });
    updated += 1;
  }

  console.log(
    JSON.stringify({ scanned: bundles.length, updated, unresolved }, null, 2)
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
