/**
 * Audit committed reservations vs exposure ledger totals.
 *
 * Artifact sample (artifacts/pilot-reconciliation-audit.json):
 * { "dryRun": true, "mismatches": [{ "pilotId": "...", "deltaCents": 100 }] }
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { prisma } from "@/lib/prisma";

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      pilotId: { type: "string" },
      "dry-run": { type: "boolean", default: true },
    },
  });
  const dryRun = values["dry-run"] !== false;
  const where = values.pilotId ? { id: values.pilotId } : {};
  const pilots = await prisma.controlledPilot.findMany({ where });

  const mismatches: Array<{ pilotId: string; deltaCents: number }> = [];
  for (const p of pilots) {
    const committed = await prisma.pilotLimitReservation.aggregate({
      where: { pilotId: p.id, status: "committed" },
      _sum: { amountCents: true },
    });
    const latest = await prisma.pilotExposureLedger.findFirst({
      where: { pilotId: p.id },
      orderBy: { occurredAt: "desc" },
    });
    const committedCents = committed._sum.amountCents ?? 0;
    const ledgerBalance = latest?.balanceAfterCents ?? 0;
    // Ledger balance includes reserved+committed; compare committed only loosely.
    if (latest && ledgerBalance < committedCents) {
      mismatches.push({
        pilotId: p.id,
        deltaCents: committedCents - ledgerBalance,
      });
    }
  }

  const artifact = { dryRun, mismatches, scanned: pilots.length };
  const dir = path.join(process.cwd(), "artifacts");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, "pilot-reconciliation-audit.json");
  await writeFile(file, JSON.stringify(artifact, null, 2) + "\n");
  console.log(JSON.stringify({ wrote: file, mismatches: mismatches.length }));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
