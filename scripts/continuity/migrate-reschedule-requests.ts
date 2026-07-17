import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "continuity:migrate-reschedule-requests",
    "Pack wrapper: migrate orchestration reschedule requests to include organisation and coordinator scope.",
    { dryRunOnly: true }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
