import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "continuity:audit-placeholder-operational-data",
    "Pack wrapper: audit executable operational paths against placeholder addresses / missing dates.",
    { dryRunOnly: true }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
