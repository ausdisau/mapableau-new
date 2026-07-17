import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "continuity:evaluate",
    "Roll-up evaluation across audits and dry-run tests.",
    { dryRunOnly: true }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
