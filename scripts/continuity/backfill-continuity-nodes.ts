import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "continuity:backfill-continuity-nodes",
    "Pack wrapper: backfill continuity node references from operational rows.",
    { dryRunOnly: true }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
