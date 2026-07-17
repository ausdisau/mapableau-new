import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "continuity:test-execution",
    "Recovery execution tests: idempotency, execution_unknown, compensation.",
    { dryRunOnly: true }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
