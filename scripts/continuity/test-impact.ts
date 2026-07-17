import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "continuity:test-impact",
    "Impact assessment tests over the continuity graph.",
    { dryRunOnly: true }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
