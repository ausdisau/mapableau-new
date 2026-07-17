import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "continuity:audit-unscoped-recovery-queries",
    "Pack wrapper: audit recovery/reschedule/case queries for missing organisation scope.",
    { dryRunOnly: true }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
