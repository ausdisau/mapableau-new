import { runAudit, scanFilesForPattern } from "./_shared";

async function main() {
  await runAudit(
    "continuity:audit-idempotency",
    "Scan continuity / orchestration modules for Date.now() inside idempotency keys.",
    { checks: ["date_now_in_idempotency"] },
    async () => {
      const hits = scanFilesForPattern({
        roots: ["lib/orchestration", "lib/continuity"],
        extensions: [".ts"],
        pattern: /idempotencyKey\s*:\s*[^,\n]*Date\.now\(\)|`[^`]*Date\.now\(\)[^`]*`[^,\n]*(?:idempotency|dedupe)/i,
      });
      return { findings: hits, pass: hits.length === 0 };
    }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
