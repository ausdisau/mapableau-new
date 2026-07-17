import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "continuity:audit-recovery-idempotency",
    "Pack wrapper: audit recovery execution idempotency keys.",
    { dryRunOnly: true }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
