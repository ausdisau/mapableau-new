import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "continuity:backfill-continuity-dependencies",
    "Pack wrapper: backfill continuity dependencies from known relations (care->transport, care->worker, etc).",
    { dryRunOnly: true }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
