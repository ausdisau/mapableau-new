import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "continuity:audit-direct-cancellation-propagation",
    "Pack wrapper: audit direct cancellation propagation across linked services.",
    { dryRunOnly: true }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
