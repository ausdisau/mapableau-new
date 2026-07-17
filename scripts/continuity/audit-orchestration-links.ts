import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "continuity:audit-orchestration-links",
    "Pack wrapper: audit orchestration link creation flows for placeholder / date guards.",
    { dryRunOnly: true }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
