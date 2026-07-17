import { dryRunStubReport, parseArgs, ts, writeArtifact } from "./_shared";

/**
 * backfill-access-vaults
 *
 * Wave 9 rule: a ParticipantAccessVault must exist for every participant
 * before they can review or export their data packages. Vaults are NEVER
 * auto-activated — they start in `provisioning` state and require explicit
 * participant activation via `/participant/vault`.
 */
async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  if (dryRun) {
    const report = dryRunStubReport({
      name: "federation:backfill-access-vaults",
      summary:
        "dry-run: would create a ParticipantAccessVault for every participant user missing one (activationStatus=provisioning, no auto activation)",
      extras: {
        rules: [
          "activationStatus defaults to provisioning",
          "no packages are pre-classified without human review",
          "only participant-role users receive vaults",
        ],
      },
    });
    const file = writeArtifact(
      "federation",
      `backfill-access-vaults-${ts()}.json`,
      report
    );
    console.log(JSON.stringify(report, null, 2));
    console.log(`report: ${file}`);
    return;
  }
  const { prisma } = await import("@/lib/prisma");
  const participants = await prisma.user.findMany({
    where: { primaryRole: "participant" },
    select: { id: true },
  });
  const existing = await prisma.participantAccessVault.findMany({
    where: { participantId: { in: participants.map((p) => p.id) } },
    select: { participantId: true },
  });
  const existingIds = new Set(existing.map((v) => v.participantId));
  const missing = participants.filter((p) => !existingIds.has(p.id));
  let created = 0;
  for (const p of missing) {
    await prisma.participantAccessVault.create({
      data: {
        participantId: p.id,
        status: "draft",
      },
    });
    created += 1;
  }
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: false,
    participants: participants.length,
    createdVaults: created,
  };
  const file = writeArtifact(
    "federation",
    `backfill-access-vaults-${ts()}.json`,
    report
  );
  console.log(JSON.stringify(report, null, 2));
  console.log(`report: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
